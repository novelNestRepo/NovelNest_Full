'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageTitle from '@/components/custom/PageTitle';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle, Timer, Gift, BrainCircuit } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

interface TriviaQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export default function TriviaChallengePage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes = 600s
  const [isFinished, setIsFinished] = useState(false);
  
  const [shippingAddress, setShippingAddress] = useState('');
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    if (loading || isFinished) return;
    
    if (timeLeft <= 0) {
      setIsFinished(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, isFinished, timeLeft]);

  const fetchQuestions = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        toast.error('You must be logged in to play.');
        router.push('/login');
        return;
      }

      const res = await fetch('/api/playground/trivia/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${data.session.access_token}`
        }
      });

      if (!res.ok) throw new Error('Failed to fetch questions');
      const json = await res.json();
      setQuestions(json.questions);
    } catch (error) {
      toast.error('Error generating questions. Try again later.');
      router.push('/playground/trivia');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (option: string) => {
    if (selectedAnswer || showExplanation) return;
    setSelectedAnswer(option);
    
    const isCorrect = option === questions[currentIndex].correctAnswer;
    if (isCorrect) {
      setScore(s => s + 1);
    }
    setShowExplanation(true);
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(c => c + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setIsFinished(true);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleClaim = async () => {
    if (!shippingAddress) {
      toast.error('Please enter a shipping address');
      return;
    }
    setClaiming(true);
    try {
      const { data } = await supabase.auth.getSession();
      const res = await fetch('/api/playground/trivia/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.session?.access_token}`
        },
        body: JSON.stringify({ shippingAddress })
      });

      if (!res.ok) throw new Error('Failed to claim');
      toast.success('Prize claimed successfully! We will ship it to you soon.');
      router.push('/playground');
    } catch (error) {
      toast.error('Error claiming prize.');
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <h2 className="text-xl font-medium animate-pulse">Generating custom challenge via Mistral AI...</h2>
      </div>
    );
  }

  if (isFinished) {
    const perfectScore = score === questions.length;
    return (
      <div className="h-full flex flex-col space-y-6">
        <PageTitle title="Challenge Complete" icon={<BrainCircuit size={24} />} />
        <Card className="max-w-2xl mx-auto w-full p-8 text-center space-y-6 bg-background/60 backdrop-blur-sm border-white/5">
          <h2 className="text-4xl font-bold font-serif mb-2">Final Score: {score}/{questions.length}</h2>
          
          {perfectScore ? (
            <div className="space-y-6">
              <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto">
                <Gift className="w-10 h-10" />
              </div>
              <h3 className="text-2xl text-green-400 font-medium">Flawless Victory!</h3>
              <p className="text-muted-foreground">You are a true literature master. Claim your free book below.</p>
              
              <div className="space-y-4 pt-4 text-left">
                <label className="text-sm text-muted-foreground">Shipping Address</label>
                <Input 
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="123 Novel St, BookTown..."
                />
                <Button 
                  onClick={handleClaim} 
                  disabled={claiming} 
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0"
                >
                  {claiming ? 'Processing...' : 'Claim My Book!'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="w-20 h-20 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="w-10 h-10" />
              </div>
              <h3 className="text-2xl text-red-400 font-medium">Not quite there.</h3>
              <p className="text-muted-foreground">You need a perfect score (10/10) to claim the prize. Try again later!</p>
              <Button onClick={() => router.push('/playground/trivia')} variant="outline" className="mt-4">
                Return to Lobby
              </Button>
            </div>
          )}
        </Card>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="h-full flex flex-col space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <PageTitle title={`Question ${currentIndex + 1} of ${questions.length}`} icon={<BrainCircuit size={24} />} />
        <div className="flex items-center space-x-2 text-xl font-mono bg-background/50 px-4 py-2 rounded-lg border border-white/10">
          <Timer className={timeLeft < 60 ? "text-red-500 animate-pulse" : "text-muted-foreground"} />
          <span className={timeLeft < 60 ? "text-red-500" : ""}>{formatTime(timeLeft)}</span>
        </div>
      </div>

      <Card className="p-8 bg-background/60 backdrop-blur-md border-white/10 shadow-2xl relative overflow-hidden">
        <h2 className="text-2xl font-medium mb-8 leading-relaxed">
          {currentQ.question}
        </h2>

        <div className="space-y-4">
          {currentQ.options.map((opt, i) => {
            let btnClass = "w-full justify-start text-left h-auto py-4 px-6 text-lg whitespace-normal";
            let variant: "default" | "outline" | "secondary" = "outline";
            
            if (showExplanation) {
              if (opt === currentQ.correctAnswer) {
                btnClass += " bg-green-500/20 border-green-500/50 text-green-400";
              } else if (opt === selectedAnswer) {
                btnClass += " bg-red-500/20 border-red-500/50 text-red-400";
              }
            } else if (selectedAnswer === opt) {
              variant = "default";
            }

            return (
              <Button 
                key={i} 
                variant={variant}
                className={btnClass}
                onClick={() => handleSelect(opt)}
                disabled={showExplanation && opt !== selectedAnswer && opt !== currentQ.correctAnswer}
              >
                {opt}
                {showExplanation && opt === currentQ.correctAnswer && <CheckCircle2 className="ml-auto w-5 h-5 text-green-500" />}
                {showExplanation && opt === selectedAnswer && opt !== currentQ.correctAnswer && <XCircle className="ml-auto w-5 h-5 text-red-500" />}
              </Button>
            );
          })}
        </div>

        {showExplanation && (
          <div className="mt-8 p-6 bg-primary/10 rounded-xl border border-primary/20 animate-in slide-in-from-bottom-4">
            <h4 className="font-semibold text-primary mb-2">Explanation</h4>
            <p className="text-muted-foreground leading-relaxed">{currentQ.explanation}</p>
            
            <div className="mt-6 flex justify-end">
              <Button size="lg" onClick={nextQuestion}>
                {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Challenge'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
