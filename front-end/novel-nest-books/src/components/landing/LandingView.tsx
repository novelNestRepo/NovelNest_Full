'use client';

import React from 'react';
import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import ConceptSection from './ConceptSection';
import { useScrollAnimations } from '@/lib/hooks/useScrollAnimations';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function LandingView() {
  // Initialize the IntersectionObserver fallback for Safari/Firefox
  useScrollAnimations();

  return (
    <div className="flex flex-col min-h-screen bg-background w-full">
      {/* Simple Header */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <BookOpen className="w-6 h-6" />
            <span className="font-headings font-bold text-xl tracking-tight text-foreground">
              NovelNest
            </span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full mt-16 overflow-x-hidden">
        <HeroSection />
        <ConceptSection />
        <FeaturesSection />
      </main>

      <footer className="border-t py-12 bg-muted/40">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-70">
            <BookOpen className="w-5 h-5" />
            <span className="font-headings font-bold text-lg">NovelNest</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} NovelNest. Build your reading habit.
          </p>
        </div>
      </footer>
    </div>
  );
}
