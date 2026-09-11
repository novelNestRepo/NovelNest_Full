import { NextResponse } from 'next/server';
import { db } from '@/db';
import { relationships, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { supabase } from '@/lib/supabase';

// Helper to get authenticated user ID
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

    const { following_id } = await req.json();
    if (!following_id) return NextResponse.json({ error: 'Missing following_id' }, { status: 400 });

    const newFollow = await db.insert(relationships).values({
      followerId: userId,
      followingId: following_id,
    }).returning();

    return NextResponse.json(newFollow[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to follow user' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const userId = await getUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { following_id } = await req.json();
    if (!following_id) return NextResponse.json({ error: 'Missing following_id' }, { status: 400 });

    await db.delete(relationships)
      .where(and(
        eq(relationships.followerId, userId),
        eq(relationships.followingId, following_id)
      ));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to unfollow user' }, { status: 500 });
  }
}
