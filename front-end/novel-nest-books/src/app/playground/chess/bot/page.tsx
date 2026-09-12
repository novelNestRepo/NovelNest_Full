'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Chess, Move } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { useSearchParams } from 'next/navigation';
import PageTitle from '@/components/custom/PageTitle';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, User, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

function BotMatchPage() {
  const searchParams = useSearchParams();
  const level = searchParams.get('level') || 'beginner';
  
  const [game, setGame] = useState(new Chess());
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [gameStatus, setGameStatus] = useState<string>('active');

  const makeMove = useCallback((move: any) => {
    try {
      const result = game.move(move);
      setGame(new Chess(game.fen()));
      return result;
    } catch (e) {
      return null;
    }
  }, [game]);

  const onDrop = ({ sourceSquare, targetSquare, piece }: any) => {
    if (game.isGameOver() || game.turn() !== 'w' || isBotThinking || !targetSquare) return false;

    const move = makeMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: typeof piece === 'string' ? piece[1]?.toLowerCase() : 'q',
    });

    if (move === null) return false;

    // Trigger Bot Move
    setTimeout(makeBotMove, 200);
    return true;
  };

  const makeBotMove = async () => {
    if (game.isGameOver()) return;

    setIsBotThinking(true);
    try {
      const response = await fetch('/api/playground/chess/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fen: game.fen(), level }),
      });

      const data = await response.json();
      if (data.error) {
        toast.error(data.error);
      } else if (data.move) {
        game.move(data.move);
        setGame(new Chess(game.fen()));
      }
    } catch (error) {
      toast.error('Bot failed to connect');
    } finally {
      setIsBotThinking(false);
    }
  };

  useEffect(() => {
    if (game.isCheckmate()) setGameStatus('checkmate');
    else if (game.isDraw()) setGameStatus('draw');
    else if (game.isStalemate()) setGameStatus('stalemate');
    else setGameStatus('active');
  }, [game]);

  const resetGame = () => {
    setGame(new Chess());
    setGameStatus('active');
  };

  return (
    <div className="h-full flex flex-col space-y-6 max-w-5xl mx-auto w-full pb-12">
      <PageTitle title={`Vs Bot (${level})`} icon={<Bot size={24} />} />

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Board Container */}
        <div className="w-full max-w-[600px] aspect-square mx-auto shadow-2xl shadow-primary/10 rounded-lg overflow-hidden border border-white/10">
          <Chessboard 
            options={{
              position: game.fen(),
              onPieceDrop: onDrop,
              darkSquareStyle: { backgroundColor: '#475569' },
              lightSquareStyle: { backgroundColor: '#94a3b8' },
              animationDurationInMs: 300,
              boardOrientation: 'white'
            }}
          />
        </div>

        {/* Info Panel */}
        <div className="flex-1 w-full space-y-6">
          <Card className="p-6 bg-background/50 backdrop-blur-sm border-white/10">
            <h3 className="text-xl font-serif font-bold mb-4 flex items-center gap-2">
              Match Status
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-md bg-muted/50 border border-white/5">
                <div className="flex items-center gap-2">
                  <Bot className={`w-5 h-5 ${game.turn() === 'b' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="font-semibold">NovelBot ({level})</span>
                </div>
                {isBotThinking && <span className="text-xs text-primary animate-pulse">Thinking...</span>}
              </div>

              <div className="flex justify-between items-center p-3 rounded-md bg-muted/50 border border-white/5">
                <div className="flex items-center gap-2">
                  <User className={`w-5 h-5 ${game.turn() === 'w' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="font-semibold">You (White)</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              {gameStatus === 'active' ? (
                <p className="text-lg text-muted-foreground">
                  {game.turn() === 'w' ? "Your turn" : "Bot's turn"}
                </p>
              ) : (
                <div className="space-y-4">
                  <p className="text-2xl font-bold text-primary">
                    {gameStatus === 'checkmate' 
                      ? (game.turn() === 'w' ? 'Bot Wins by Checkmate!' : 'You Win by Checkmate!') 
                      : `Game Over: ${gameStatus}`}
                  </p>
                  <Button onClick={resetGame} className="gap-2">
                    <RefreshCw className="w-4 h-4" /> Play Again
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function BotMatchPageWrapper() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center">Loading match...</div>}>
      <BotMatchPage />
    </React.Suspense>
  );
}
