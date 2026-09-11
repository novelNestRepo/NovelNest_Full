import { NextResponse } from 'next/server';
import { db } from '@/db';
import { relationships, users } from '@/db/schema';
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

    const following = await db.select({
      id: users.id,
      name: users.name,
      avatarUrl: users.avatarUrl,
    })
    .from(relationships)
    .innerJoin(users, eq(relationships.followingId, users.id))
    .where(eq(relationships.followerId, userId));

    return NextResponse.json(following);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch following' }, { status: 500 });
  }
}
