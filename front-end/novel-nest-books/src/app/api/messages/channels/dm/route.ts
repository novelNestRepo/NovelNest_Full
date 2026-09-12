import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { db } from '@/db';
import { channels, users } from '@/db/schema';
import { eq, or, and } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing token' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { targetUserId } = await req.json();
    if (!targetUserId) return NextResponse.json({ error: 'targetUserId required' }, { status: 400 });

    if (targetUserId === user.id) return NextResponse.json({ error: 'Cannot DM yourself' }, { status: 400 });

    // Generate a unique, order-independent name for the DM channel
    const sortedIds = [user.id, targetUserId].sort();
    const dmChannelName = `DM-${sortedIds[0]}-${sortedIds[1]}`;

    // Check if DM channel already exists
    const existing = await db.query.channels.findFirst({
      where: eq(channels.name, dmChannelName)
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    // Get target user's name for a nice description
    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, targetUserId)
    });

    // Create the new DM channel
    const inserted = await db.insert(channels).values({
      name: dmChannelName,
      description: `Direct Message`,
      type: 'text',
      isPrivate: true,
      createdBy: user.id
    }).returning();

    return NextResponse.json(inserted[0]);
  } catch (error) {
    console.error('Failed to create/get DM channel', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
