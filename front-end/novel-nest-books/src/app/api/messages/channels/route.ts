import { NextResponse } from 'next/server';
import { db } from '@/db';
import { channels } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { supabase } from '@/lib/supabase';

async function getUserId(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  return user?.id || null;
}

export async function GET(req: Request) {
  try {
    const userId = await getUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const allChannels = await db.select().from(channels);
    return NextResponse.json(allChannels);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const newChannel = await db.insert(channels).values({
      name: body.name,
      description: body.description,
      type: body.type || 'text',
      isPrivate: body.isPrivate || false,
      createdBy: userId,
    }).returning();

    return NextResponse.json(newChannel[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create channel' }, { status: 500 });
  }
}
