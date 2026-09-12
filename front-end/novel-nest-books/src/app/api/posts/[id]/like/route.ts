import { NextResponse } from 'next/server';
import { db } from '@/db';
import { postLikes } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const postId = (await context.params).id;

    // Check if like exists
    const existingLike = await db.query.postLikes.findFirst({
      where: and(eq(postLikes.postId, postId), eq(postLikes.userId, user.id)),
    });

    if (existingLike) {
      // Unlike
      await db.delete(postLikes).where(eq(postLikes.id, existingLike.id));
      return NextResponse.json({ liked: false }, { status: 200 });
    } else {
      // Like
      await db.insert(postLikes).values({
        postId,
        userId: user.id,
      });
      return NextResponse.json({ liked: true }, { status: 201 });
    }
  } catch (error: any) {
    console.error('Toggle like error:', error);
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 });
  }
}
