import { NextResponse } from 'next/server';
import { db } from '@/db';
import { messages } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { supabase } from '@/lib/supabase';

async function getUserId(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  return user?.id || null;
}

export async function GET(req: Request, { params }: { params: Promise<{ channelId: string }> }) {
  try {
    const userId = await getUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { channelId } = await params;
    
    const channelMessages = await db.query.messages.findMany({
      where: eq(messages.channelId, channelId),
      orderBy: (messages, { asc }) => [asc(messages.createdAt)],
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true
          }
        }
      }
    });
    
    return NextResponse.json(channelMessages);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}
