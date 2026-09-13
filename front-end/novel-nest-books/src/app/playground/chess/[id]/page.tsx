'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { useParams } from 'next/navigation';
import PageTitle from '@/components/custom/PageTitle';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Copy, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/hooks/useAuth';
import { apiClient } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export default function MultiplayerMatchPage() {
  const { id } = useParams() as { id: string };
  const { user } = useAuth();
  
  const [game, setGame] = useState(new Chess());
  const [matchData, setMatchData] = useState<any>(null);
  const [gameStatus, setGameStatus] = useState<string>('active');
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load match
  useEffect(() => {
    async function loadMatch() {
      try {
        const data = await apiClient.getChessMatch(id);
        setMatchData(data);
        if (data.fen) {
          setGame(new Chess(data.fen));
        }
      } catch (error) {
        toast.error('Failed to load match. It might not exist.');
      } finally {
        setIsLoading(false);
      }
    }
    if (id && user) {
      loadMatch();
    }
  }, [id, user]);

  // Realtime subscription
  useEffect(() => {
    if (!id || !user) return;

    const newChannel = supabase.channel(`room:chess:${id}`);
    
    newChannel
      .on('broadcast', { event: 'move' }, ({ payload }) => {
        if (payload.fen) {
          setGame(new Chess(payload.fen));
        }
      })
      .subscribe();

    setChannel(newChannel);

    return () => {
      supabase.removeChannel(newChannel);
    };
  }, [id, user]);

  useEffect(() => {
    if (game.isCheckmate()) setGameStatus('checkmate');
    else if (game.isDraw()) setGameStatus('draw');
    else if (game.isStalemate()) setGameStatus('stalemate');
    else setGameStatus('active');
  }, [game]);

  const makeMove = useCallback((move: any) => {
    try {
      const result = game.move(move);
      setGame(new Chess(game.fen()));
      return result;
    } catch (e) {
      return null;
    }
  }, [game]);

  const isPlayer1 = matchData?.player1Id === user?.id;
  const isPlayer2 = matchData?.player2Id === user?.id;
  const isSpectator = !isPlayer1 && !isPlayer2;
  const isWaitingForOpponent = matchData?.player1Id === matchData?.player2Id;
  const myColor = isPlayer1 ? 'w' : 'b';

  const onDrop = ({ sourceSquare, targetSquare, piece }: any) => {
    if (game.isGameOver() || isSpectator || isWaitingForOpponent) return false;
    
    // Check if it's my turn
    if (game.turn() !== myColor) {
      toast.error("It's not your turn!");
      return false;
    }

    const move = makeMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: typeof piece === 'string' ? piece[1]?.toLowerCase() : 'q',
    });

    if (move === null) return false;

    const newFen = game.fen();
    const newPgn = game.pgn();

    // Broadcast
    channel?.send({
      type: 'broadcast',
      event: 'move',
      payload: { fen: newFen, pgn: newPgn },
    });

    // Persist
    apiClient.updateChessMatch(id, { fen: newFen, pgn: newPgn }).catch(() => {
      toast.error('Failed to save move to server');
    });

    return true;
  };

  const copyInviteLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Invite link copied to clipboard!');
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading match...</div>;
  }

  if (!matchData) {
    return <div className="p-8 text-center text-destructive">Match not found.</div>;
  }

  return (
    <div className="h-full flex flex-col space-y-6 max-w-5xl mx-auto w-full pb-12">
      <PageTitle title="Multiplayer Match" icon={<Users size={24} />} />

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Board Container */}
        <div className="w-full max-w-[600px] aspect-square mx-auto shadow-2xl shadow-primary/10 rounded-lg overflow-hidden border border-white/10 opacity-95 hover:opacity-100 transition-opacity">
          <Chessboard 
            options={{
              position: game.fen(),
              onPieceDrop: onDrop,
              darkSquareStyle: { backgroundColor: '#475569' },
              lightSquareStyle: { backgroundColor: '#94a3b8' },
              animationDurationInMs: 300,
              boardOrientation: isPlayer2 ? 'black' : 'white',
            }}
          />
        </div>

        {/* Info Panel */}
        <div className="flex-1 w-full space-y-6">
          <Card className="p-6 bg-background/50 backdrop-blur-sm border-white/10">
            <h3 className="text-xl font-serif font-bold mb-4 flex items-center gap-2">
              Match Status
            </h3>
            
            {isWaitingForOpponent ? (
              <div className="p-4 mb-4 rounded-lg bg-secondary/50 border border-secondary/20 space-y-3">
                <p className="font-medium text-secondary-foreground">Waiting for an opponent...</p>
                <p className="text-sm text-muted-foreground">Share this link with a friend so they can join.</p>
                <Button onClick={copyInviteLink} variant="outline" className="w-full gap-2">
                  <Copy className="w-4 h-4" /> Copy Invite Link
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`flex justify-between items-center p-3 rounded-md border ${game.turn() === (isPlayer2 ? 'w' : 'b') ? 'bg-primary/20 border-primary/50' : 'bg-muted/50 border-white/5'}`}>
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <span className="font-semibold">Opponent ({isPlayer2 ? 'White' : 'Black'})</span>
                  </div>
                  {game.turn() === (isPlayer2 ? 'w' : 'b') && <span className="text-xs text-primary animate-pulse">Thinking...</span>}
                </div>

                <div className={`flex justify-between items-center p-3 rounded-md border ${game.turn() === myColor ? 'bg-primary/20 border-primary/50' : 'bg-muted/50 border-white/5'}`}>
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    <span className="font-semibold">You ({myColor === 'w' ? 'White' : 'Black'})</span>
                  </div>
                  {game.turn() === myColor && <span className="text-xs text-primary animate-pulse">Your Turn</span>}
                </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              {gameStatus === 'active' ? (
                <p className="text-lg text-muted-foreground">
                  {game.turn() === 'w' ? "White to move" : "Black to move"}
                </p>
              ) : (
                <div className="space-y-4">
                  <p className="text-2xl font-bold text-primary">
                    {gameStatus === 'checkmate' 
                      ? (game.turn() === 'w' ? 'Black Wins by Checkmate!' : 'White Wins by Checkmate!') 
                      : `Game Over: ${gameStatus}`}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
