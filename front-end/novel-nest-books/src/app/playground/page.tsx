'use client';

import React from 'react';
import PageTitle from '@/components/custom/PageTitle';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gamepad2, Swords, BrainCircuit, Trophy } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PlaygroundHub() {
  const router = useRouter();

  return (
    <div className="h-full flex flex-col space-y-6">
      <PageTitle title="Playground" icon={<Gamepad2 size={24} />} />

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mt-8 pb-12">
          
          {/* Chess Card */}
          <Card className="overflow-hidden bg-background/50 backdrop-blur-sm border-white/10 hover:border-primary/50 transition-all group flex flex-col">
            <div className="h-48 bg-gradient-to-br from-slate-800 to-slate-900 w-full relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1529699211952-734e80c4d42b?q=80&w=2071&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay"></div>
              <Swords className="w-24 h-24 text-white/50 group-hover:scale-110 group-hover:text-white transition-all duration-500 relative z-10" />
            </div>
            <div className="p-8 flex-1 flex flex-col">
              <h2 className="text-3xl font-serif font-bold mb-2">Grandmaster Chess</h2>
              <p className="text-muted-foreground flex-1 mb-6 text-lg">
                Challenge your friends or community members to a real-time chess match. Analyze your games, join custom tournaments, and climb the ranks.
              </p>
              <Button size="lg" className="w-full text-lg gap-2" onClick={() => router.push('/playground/chess')}>
                <Swords className="w-5 h-5" /> Play Chess
              </Button>
            </div>
          </Card>

          {/* Trivia Card */}
          <Card className="overflow-hidden bg-background/50 backdrop-blur-sm border-white/10 hover:border-primary/50 transition-all group flex flex-col relative">
            <div className="absolute top-4 right-4 bg-yellow-500/20 text-yellow-500 border border-yellow-500/50 px-4 py-1.5 rounded-xl font-bold shadow-lg shadow-yellow-500/10 rotate-12 z-20 flex items-center gap-2 text-sm backdrop-blur-md">
              <Trophy className="w-4 h-4" /> Win Free Books!
            </div>
            <div className="h-48 bg-gradient-to-br from-indigo-900 to-purple-900 w-full relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 opacity-30 bg-[url('https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=1974&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay"></div>
              <BrainCircuit className="w-24 h-24 text-white/50 group-hover:scale-110 group-hover:text-white transition-all duration-500 relative z-10" />
            </div>
            <div className="p-8 flex-1 flex flex-col">
              <h2 className="text-3xl font-serif font-bold mb-2">Literature Trivia</h2>
              <p className="text-muted-foreground flex-1 mb-6 text-lg">
                Solve hard puzzles and AI-generated literature trivia. Score 100% and win a free physical book delivered straight to your door!
              </p>
              <Button size="lg" className="w-full text-lg gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 border-0" onClick={() => router.push('/playground/trivia')}>
                <BrainCircuit className="w-5 h-5" /> Start Trivia
              </Button>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}
