import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Mistral API URL and Key
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

export async function POST(req: Request) {
  try {
    // Basic Auth Check
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing token' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!MISTRAL_API_KEY) {
      return NextResponse.json({ error: 'Mistral API key not configured' }, { status: 500 });
    }

    const prompt = `You are a literature trivia master. Generate exactly 10 difficult multiple-choice questions about classic and modern literature, famous authors, and literary devices.
Output the result in pure JSON format (an array of objects) with NO markdown wrappers or backticks.
Each object must have the following keys:
- "question": string
- "options": an array of 4 string options
- "correctAnswer": string (must exactly match one of the options)
- "explanation": string (a brief fun fact or explanation of the answer)

Output ONLY the JSON array. Do not include any other text.`;

    const response = await fetch(MISTRAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: 'mistral-small-latest', // Fast and capable for this task
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        response_format: { type: 'json_object' } // Although mistral doesn't officially support json_object in all models, we'll ask for pure JSON and parse it
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Mistral API error:', errText);
      return NextResponse.json({ error: 'Failed to generate trivia questions.' }, { status: 500 });
    }

    const data = await response.json();
    let content = data.choices[0].message.content.trim();

    // Clean up potential markdown blocks if mistral still outputs them
    if (content.startsWith('```json')) {
      content = content.substring(7);
    } else if (content.startsWith('```')) {
      content = content.substring(3);
    }
    if (content.endsWith('```')) {
      content = content.substring(0, content.length - 3);
    }

    let questions;
    try {
      questions = JSON.parse(content.trim());
      // Handle if it returned an object with a 'questions' array inside
      if (!Array.isArray(questions) && questions.questions && Array.isArray(questions.questions)) {
        questions = questions.questions;
      }
    } catch (parseError) {
      console.error('Failed to parse Mistral output:', content);
      return NextResponse.json({ error: 'Invalid generation format from AI.' }, { status: 500 });
    }

    return NextResponse.json({ questions });

  } catch (error) {
    console.error('Error generating trivia:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
