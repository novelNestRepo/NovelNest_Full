import { NextResponse } from 'next/server';
import { db } from '@/db';
import { messages } from '@/db/schema';
import { supabase } from '@/lib/supabase';

async function getUserId(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  return user?.id || null;
}

export async function POST(req: Request) {
  try {
    const userId = await getUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { channelId, content } = body;
    if (!channelId || !content) return NextResponse.json({ error: 'Missing channelId or content' }, { status: 400 });

    const newMessage = await db.insert(messages).values({
      channelId,
      content,
      userId,
    }).returning();

    return NextResponse.json(newMessage[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
