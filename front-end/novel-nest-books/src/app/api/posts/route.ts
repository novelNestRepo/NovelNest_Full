import { NextResponse } from 'next/server';
import { db } from '@/db';
import { posts, users } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { supabase } from '@/lib/supabase';

// Get all posts for the community feed
export async function GET() {
  try {
    const feedPostsRaw = await db.query.posts.findMany({
      orderBy: (posts, { desc }) => [desc(posts.createdAt)],
      limit: 50,
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          }
        },
        likes: {
          columns: {
            userId: true
          }
        },
        comments: {
          columns: {
            id: true
          }
        }
      }
    });

    const feedPosts = feedPostsRaw.map(post => ({
      ...post,
      likesCount: post.likes.length,
      commentsCount: post.comments.length,
    }));

    return NextResponse.json(feedPosts, { status: 200 });
  } catch (error: any) {
    console.error('Fetch posts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

// Create a new post
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content } = await request.json();

    if (!content || typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const [newPost] = await db
      .insert(posts)
      .values({
        content: content.trim(),
        userId: user.id,
      })
      .returning();

    return NextResponse.json(newPost, { status: 201 });
  } catch (error: any) {
    console.error('Create post error:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}
