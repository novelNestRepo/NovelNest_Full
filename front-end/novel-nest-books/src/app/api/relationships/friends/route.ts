import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { db } from '@/db';
import { friendships, users } from '@/db/schema';
import { eq, or, and } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing token' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const allUserFriendships = await db.query.friendships.findMany({
      where: or(eq(friendships.user1Id, user.id), eq(friendships.user2Id, user.id)),
      with: {
        user1: { columns: { id: true, name: true, avatarUrl: true, email: true } },
        user2: { columns: { id: true, name: true, avatarUrl: true, email: true } },
      }
    });

    return NextResponse.json(allUserFriendships);
  } catch (error) {
    console.error('Failed to get friends', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

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

    if (targetUserId === user.id) return NextResponse.json({ error: 'Cannot add yourself' }, { status: 400 });

    const existing = await db.query.friendships.findFirst({
      where: or(
        and(eq(friendships.user1Id, user.id), eq(friendships.user2Id, targetUserId)),
        and(eq(friendships.user1Id, targetUserId), eq(friendships.user2Id, user.id))
      )
    });

    if (existing) {
      return NextResponse.json({ message: 'Friendship already exists', status: existing.status });
    }

    const inserted = await db.insert(friendships).values({
      user1Id: user.id,
      user2Id: targetUserId,
      status: 'pending'
    }).returning();

    return NextResponse.json(inserted[0]);
  } catch (error) {
    console.error('Failed to send friend request', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing token' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { friendshipId, action } = await req.json(); // action: 'accepted' or 'rejected'
    
    if (!friendshipId || !['accepted', 'rejected'].includes(action)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const existing = await db.query.friendships.findFirst({
      where: eq(friendships.id, friendshipId)
    });

    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (existing.user2Id !== user.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const updated = await db.update(friendships)
      .set({ status: action, updatedAt: new Date() })
      .where(eq(friendships.id, friendshipId))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Failed to update friend request', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
