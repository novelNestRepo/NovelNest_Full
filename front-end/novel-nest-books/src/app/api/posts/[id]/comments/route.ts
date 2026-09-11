import { NextResponse } from 'next/server';
import { db } from '@/db';
import { postComments } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request, context: { params: { id: string } }) {
  try {
    const postId = (await context.params).id;

    const comments = await db.query.postComments.findMany({
      where: eq(postComments.postId, postId),
      orderBy: [desc(postComments.createdAt)],
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          }
        }
      }
    });

    return NextResponse.json(comments, { status: 200 });
  } catch (error: any) {
    console.error('Fetch comments error:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(request: Request, context: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const postId = (await context.params).id;
    const { content } = await request.json();

    if (!content || typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const [newComment] = await db.insert(postComments).values({
      postId,
      userId: user.id,
      content: content.trim(),
    }).returning();

    // Fetch the inserted comment with user details to return immediately
    const fullComment = await db.query.postComments.findFirst({
      where: eq(postComments.id, newComment.id),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          }
        }
      }
    });

    return NextResponse.json(fullComment, { status: 201 });
  } catch (error: any) {
    console.error('Create comment error:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
