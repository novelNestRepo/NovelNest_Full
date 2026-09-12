import { NextResponse } from 'next/server';
import { db } from '@/db';
import { chessMatches } from '@/db/schema';
import { supabase } from '@/lib/supabase';
import { eq, or } from 'drizzle-orm';
import { Chess } from 'chess.js';

export async function POST(req: Request) {
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

    // Initialize an empty chess board
    const chess = new Chess();

    const [newMatch] = await db.insert(chessMatches).values({
      player1Id: user.id,
      player2Id: user.id, // Will be updated when someone joins
      fen: chess.fen(),
      pgn: chess.pgn(),
      status: 'waiting', // We need to update schema to support 'waiting' or just use 'active'
    }).returning();

    return NextResponse.json(newMatch);
  } catch (error) {
    console.error('Failed to create chess match:', error);
    return NextResponse.json({ error: 'Failed to create match' }, { status: 500 });
  }
}

export async function GET(req: Request) {
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

    // Fetch matches where user is player 1 or player 2
    const matches = await db.query.chessMatches.findMany({
      where: or(eq(chessMatches.player1Id, user.id), eq(chessMatches.player2Id, user.id)),
      orderBy: (matches, { desc }) => [desc(matches.createdAt)],
      limit: 10,
    });

    return NextResponse.json(matches);
  } catch (error) {
    console.error('Failed to load matches:', error);
    return NextResponse.json({ error: 'Failed to load matches' }, { status: 500 });
  }
}
