'use client';

import React from 'react';
import PageTitle from '@/components/custom/PageTitle';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BrainCircuit, Trophy, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TriviaLobby() {
  const router = useRouter();

  return (
    <div className="h-full flex flex-col space-y-6">
      <PageTitle title="Literature Trivia" icon={<BrainCircuit size={24} />} />

      <div className="flex-1 flex items-center justify-center">
        <Card className="max-w-2xl w-full p-10 bg-background/50 backdrop-blur-sm border-white/10 flex flex-col items-center text-center space-y-8 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 text-primary/5 w-64 h-64 rotate-12 pointer-events-none">
            <BookOpen className="w-full h-full" />
          </div>

          <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/20 relative z-10">
            <Trophy className="w-12 h-12 text-white" />
          </div>

          <div className="relative z-10 space-y-4">
            <h1 className="text-4xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              The Grand Novel Puzzle
            </h1>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto">
              Test your knowledge of classic and modern literature. Answer correctly, score a perfect 100%, and win a completely free physical book delivered to your doorstep!
            </p>
          </div>

          <div className="relative z-10 w-full pt-4">
            <Button
              size="lg"
              onClick={() => router.push('/playground/trivia/challenge')}
              className="w-full text-xl py-8 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 border-0 shadow-xl shadow-indigo-500/20 transition-all hover:scale-105"
            >
              Start Challenge
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              Requires 10 minutes to complete. No pausing allowed.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
