import { NextResponse } from 'next/server';
import { db } from '@/db';
import { communities, communityMembers } from '@/db/schema';
import { supabase } from '@/lib/supabase';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const allCommunities = await db.query.communities.findMany({
      orderBy: (communities, { desc }) => [desc(communities.createdAt)]
    });

    return NextResponse.json(allCommunities, { status: 200 });
  } catch (error: any) {
    console.error('Fetch communities error:', error);
    return NextResponse.json({ error: 'Failed to fetch communities' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, description } = await request.json();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const newCommunity = await db.insert(communities).values({
      name,
      description,
      ownerId: user.id,
    }).returning();

    // Automatically join the creator to the community
    if (newCommunity.length > 0) {
      await db.insert(communityMembers).values({
        communityId: newCommunity[0].id,
        userId: user.id
      });
    }

    return NextResponse.json(newCommunity[0], { status: 201 });
  } catch (error: any) {
    console.error('Create community error:', error);
    return NextResponse.json({ error: 'Failed to create community' }, { status: 500 });
  }
}
