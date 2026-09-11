import { NextResponse } from 'next/server';
import { db } from '@/db';
import { channels } from '@/db/schema';
import { supabase } from '@/lib/supabase';
import { eq } from 'drizzle-orm';

export async function GET(request: Request, context: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const communityId = (await context.params).id;
    if (!communityId) return NextResponse.json({ error: 'Community ID required' }, { status: 400 });

    const communityChannels = await db.query.channels.findMany({
      where: eq(channels.communityId, communityId),
      orderBy: (channels, { asc }) => [asc(channels.createdAt)]
    });

    return NextResponse.json(communityChannels, { status: 200 });
  } catch (error: any) {
    console.error('Fetch community channels error:', error);
    return NextResponse.json({ error: 'Failed to fetch community channels' }, { status: 500 });
  }
}

export async function POST(request: Request, context: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const communityId = (await context.params).id;
    const { name, description, type } = await request.json(); // type: 'text' | 'voice'
    
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const newChannel = await db.insert(channels).values({
      name,
      description,
      type: type || 'text',
      communityId,
      createdBy: user.id,
    }).returning();

    return NextResponse.json(newChannel[0], { status: 201 });
  } catch (error: any) {
    console.error('Create community channel error:', error);
    return NextResponse.json({ error: 'Failed to create community channel' }, { status: 500 });
  }
}
