'use client';

import React, { useState, useEffect } from 'react';
import PageTitle from '@/components/custom/PageTitle';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Swords, Plus, Users, Trophy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/lib/hooks/useAuth';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ChessLobby() {
  const router = useRouter();
  const { user } = useAuth();
  const [joinId, setJoinId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [activeMatches, setActiveMatches] = useState<any[]>([]);

  useEffect(() => {
    // Fetch active matches for the user
    const fetchMatches = async () => {
      try {
        const matches = await apiClient.getChessMatches();
        setActiveMatches(matches || []);
      } catch (error) {
        console.error('Failed to load matches', error);
      }
    };
    fetchMatches();
  }, []);

  const handleCreateMatch = async () => {
    setIsCreating(true);
    try {
      const newMatch = await apiClient.createChessMatch();
      toast.success('Match created! Share the ID with a friend.');
      router.push(`/playground/chess/${newMatch.id}`);
    } catch (error) {
      toast.error('Failed to create match');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinId.trim()) return;
    router.push(`/playground/chess/${joinId.trim()}`);
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <PageTitle title="Chess Lobby" icon={<Swords size={24} />} />

      <div className="flex-1 flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto w-full mt-4">
        
        {/* Left Col: Actions */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Multiplayer Card */}
          <Card className="p-8 bg-background/50 backdrop-blur-sm border-white/10 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold mb-2">Multiplayer</h2>
              <p className="text-sm text-muted-foreground">Play with a friend online.</p>
            </div>
            <div className="w-full space-y-3">
              <Button className="w-full" onClick={handleCreateMatch} disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create Match'}
              </Button>
              <div className="relative flex items-center">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink-0 mx-2 text-muted-foreground text-xs uppercase">Or</span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>
              <form onSubmit={handleJoinMatch} className="flex gap-2">
                <Input 
                  placeholder="Match ID..." 
                  value={joinId}
                  onChange={e => setJoinId(e.target.value)}
                  className="bg-transparent h-9 text-sm"
                />
                <Button type="submit" variant="secondary" className="h-9">Join</Button>
              </form>
            </div>
          </Card>

          {/* Bot Card */}
          <Card className="p-8 bg-background/50 backdrop-blur-sm border-white/10 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center">
              <Swords className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold mb-2">Play against Bot</h2>
              <p className="text-sm text-muted-foreground">Train against our local chess AI.</p>
            </div>
            <div className="w-full space-y-3 flex flex-col mt-auto">
              <Button variant="secondary" className="w-full justify-start" onClick={() => router.push('/playground/chess/bot?level=beginner')}>
                Beginner (Random)
              </Button>
              <Button variant="secondary" className="w-full justify-start" onClick={() => router.push('/playground/chess/bot?level=intermediate')}>
                Intermediate (Greedy)
              </Button>
              <Button variant="secondary" className="w-full justify-start" onClick={() => router.push('/playground/chess/bot?level=master')}>
                Master (Thinking)
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Col: Active Matches */}
        <div className="w-full lg:w-96 flex flex-col space-y-4 h-full">
          <h3 className="font-serif text-xl flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" /> Your Active Matches
          </h3>
          <Card className="flex-1 bg-background/50 backdrop-blur-sm border-white/10 overflow-hidden">
            <ScrollArea className="h-[400px] p-4">
              <div className="space-y-3">
                {activeMatches.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8 text-sm">You have no active matches.</p>
                ) : (
                  activeMatches.map(match => (
                    <div key={match.id} className="p-4 rounded-lg border border-white/10 bg-background/40 hover:bg-background/80 transition-colors cursor-pointer" onClick={() => router.push(`/playground/chess/${match.id}`)}>
                      <p className="text-xs text-primary mb-1">Match #{match.id.slice(0, 8)}</p>
                      <p className="font-medium text-sm">Vs {match.player2?.name || match.player1?.name}</p>
                      <p className="text-xs text-muted-foreground mt-2">Status: {match.status}</p>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </Card>
        </div>

      </div>
    </div>
  );
}
