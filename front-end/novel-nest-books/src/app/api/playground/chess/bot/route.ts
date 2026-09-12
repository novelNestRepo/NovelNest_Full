import { NextResponse } from 'next/server';
import { Chess, Move } from 'chess.js';

// Simple piece values
const pieceValues: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Extremely basic evaluation function based on material
function evaluateBoard(chess: Chess): number {
  let totalEvaluation = 0;
  const board = chess.board();
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece) {
        const val = pieceValues[piece.type] || 0;
        totalEvaluation += piece.color === 'w' ? val : -val;
      }
    }
  }
  return totalEvaluation;
}

// Minimax algorithm with alpha-beta pruning
function minimax(chess: Chess, depth: number, alpha: number, beta: number, isMaximizingPlayer: boolean): number {
  if (depth === 0 || chess.isGameOver()) {
    return evaluateBoard(chess);
  }

  const moves = chess.moves();

  if (isMaximizingPlayer) {
    let bestVal = -Infinity;
    for (let i = 0; i < moves.length; i++) {
      chess.move(moves[i]);
      bestVal = Math.max(bestVal, minimax(chess, depth - 1, alpha, beta, !isMaximizingPlayer));
      chess.undo();
      alpha = Math.max(alpha, bestVal);
      if (beta <= alpha) {
        break;
      }
    }
    return bestVal;
  } else {
    let bestVal = Infinity;
    for (let i = 0; i < moves.length; i++) {
      chess.move(moves[i]);
      bestVal = Math.min(bestVal, minimax(chess, depth - 1, alpha, beta, !isMaximizingPlayer));
      chess.undo();
      beta = Math.min(beta, bestVal);
      if (beta <= alpha) {
        break;
      }
    }
    return bestVal;
  }
}

function getBestMove(chess: Chess, depth: number): string {
  const moves = chess.moves();
  let bestMove = moves[Math.floor(Math.random() * moves.length)];
  let bestValue = chess.turn() === 'w' ? -Infinity : Infinity;

  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];
    chess.move(move);
    // Determine the value of the board after the move
    const boardValue = minimax(chess, depth - 1, -Infinity, Infinity, chess.turn() === 'w');
    chess.undo();

    if (chess.turn() === 'w') {
      if (boardValue > bestValue) {
        bestValue = boardValue;
        bestMove = move;
      }
    } else {
      if (boardValue < bestValue) {
        bestValue = boardValue;
        bestMove = move;
      }
    }
  }
  return bestMove;
}

export async function POST(req: Request) {
  try {
    const { fen, level } = await req.json();
    if (!fen || !level) {
      return NextResponse.json({ error: 'Missing fen or level' }, { status: 400 });
    }

    const chess = new Chess(fen);
    if (chess.isGameOver()) {
      return NextResponse.json({ error: 'Game is already over' }, { status: 400 });
    }

    let chosenMove: string;

    // Level 1: Random Bot
    if (level === 'beginner') {
      const moves = chess.moves();
      chosenMove = moves[Math.floor(Math.random() * moves.length)];
    } 
    // Level 2: Greedy Bot (Depth 1)
    else if (level === 'intermediate') {
      chosenMove = getBestMove(chess, 1);
    } 
    // Level 3: Thinking Bot (Depth 2-3)
    else {
      // Depth 3 can be slow in pure JS without workers, so stick to depth 2 for real-time feel
      chosenMove = getBestMove(chess, 2);
    }

    return NextResponse.json({ move: chosenMove });
  } catch (error) {
    console.error('Failed to calculate bot move:', error);
    return NextResponse.json({ error: 'Bot computation failed' }, { status: 500 });
  }
}
