import { NextResponse } from 'next/server';
import { db } from '@/db';
import { chessMatches } from '@/db/schema';
import { supabase } from '@/lib/supabase';
import { eq, and } from 'drizzle-orm';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const match = await db.query.chessMatches.findFirst({
      where: eq(chessMatches.id, id),
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Auto-join logic
    // If player2Id is the same as player1Id, it means the match is waiting for someone.
    // If the requester is not player1Id, they become player2.
    if (match.player1Id === match.player2Id && match.player1Id !== user.id) {
      const [updatedMatch] = await db.update(chessMatches)
        .set({ 
          player2Id: user.id,
          status: 'active'
        })
        .where(eq(chessMatches.id, id))
        .returning();
      
      return NextResponse.json(updatedMatch);
    }

    return NextResponse.json(match);
  } catch (error) {
    console.error('Failed to load match:', error);
    return NextResponse.json({ error: 'Failed to load match' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { fen, pgn, status, winnerId } = body;

    const match = await db.query.chessMatches.findFirst({
      where: eq(chessMatches.id, id),
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Ensure only players in the match can update it
    if (match.player1Id !== user.id && match.player2Id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to update this match' }, { status: 403 });
    }

    const [updatedMatch] = await db.update(chessMatches)
      .set({ 
        fen: fen !== undefined ? fen : match.fen,
        pgn: pgn !== undefined ? pgn : match.pgn,
        status: status !== undefined ? status : match.status,
        winnerId: winnerId !== undefined ? winnerId : match.winnerId,
        updatedAt: new Date(),
      })
      .where(eq(chessMatches.id, id))
      .returning();

    return NextResponse.json(updatedMatch);
  } catch (error) {
    console.error('Failed to update match:', error);
    return NextResponse.json({ error: 'Failed to update match' }, { status: 500 });
  }
}
