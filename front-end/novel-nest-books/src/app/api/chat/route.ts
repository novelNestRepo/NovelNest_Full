import { NextResponse } from 'next/server';
import { db } from '@/db';
import { books } from '@/db/schema';

// The API key is loaded from the environment variables for security
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages array" }, { status: 400 });
    }

    // Fetch all books from the database
    const allBooks = await db.select({
      title: books.title,
      author: books.author,
      description: books.description,
      language: books.language
    }).from(books);

    // Format the books into a readable string for the LLM
    const bookList = allBooks.map(b => `- "${b.title}" by ${b.author} (Language: ${b.language || 'Unknown'})\n  Description: ${b.description || 'No description available.'}`).join('\n\n');

    // System prompt defining the persona and injecting the book data
    const systemPrompt = `You are NestBot, the friendly, helpful, and concise AI onboarding assistant and librarian for NovelNest.
Your goal is to welcome users, help them understand how to use the platform (e.g., joining communities, reading books, tracking bookmarks), and most importantly, recommend books that are currently available in the NovelNest database.

Here is the complete list of books currently available on NovelNest:
${bookList}

Guidelines:
1. Be extremely friendly and enthusiastic, but keep your responses relatively concise so they fit well in a small chat widget.
2. If a user asks for book recommendations, ONLY recommend books from the list above. If you don't see a relevant book in the list, politely tell them that it might not be scraped/available yet.
3. If they ask how to do something, guide them briefly (e.g. "To join a community, head to the Community tab and find one you like!").
`;

    // Construct the payload for Mistral
    const payload = {
      model: "mistral-small-latest",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 500,
    };

    // Call Mistral API
    const response = await fetch(MISTRAL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${MISTRAL_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Mistral API Error:", response.status, errorData);
      return NextResponse.json({ error: "Failed to communicate with AI provider." }, { status: response.status });
    }

    const data = await response.json();
    
    // Return the assistant's reply
    return NextResponse.json({
      role: "assistant",
      content: data.choices[0].message.content
    });

  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
