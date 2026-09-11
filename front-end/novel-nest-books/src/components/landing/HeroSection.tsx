import React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, BookOpenText } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] pt-12 pb-12 md:pt-16 flex flex-col items-center text-center px-6 overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background"></div>
      
      {/* Animated Floating Elements in Background */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse -z-10"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-72 h-72 bg-secondary/30 rounded-full blur-3xl animate-pulse delay-1000 -z-10"></div>

      <div className="max-w-4xl mx-auto flex flex-col items-center gap-8 animate-on-scroll">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-sm font-medium border border-border/50 backdrop-blur-sm animate-on-scroll-scale">
          <BookOpenText className="w-4 h-4 text-primary" />
          <span>Your cozy reading corner on the web</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold font-headings tracking-tight text-foreground leading-[1.1]">
          Read together, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-teal-400">
            grow together.
          </span>
        </h1>

        {/* Video Presentation moved directly under the title */}
        <div className="mt-4 md:mt-8 w-full max-w-6xl animate-on-scroll-scale" style={{ animationDelay: '200ms' }}>
          <div className="rounded-2xl md:rounded-[2rem] border border-border/50 bg-background/30 p-2 md:p-4 backdrop-blur-xl shadow-2xl relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-teal-400/10 rounded-2xl md:rounded-[2rem] -z-10"></div>
            <div className="rounded-xl md:rounded-2xl overflow-hidden border border-border/50 shadow-inner bg-black/5 aspect-video relative">
              <video 
                autoPlay 
                loop 
                muted 
                playsInline 
                className="w-full h-full object-cover"
              >
                <source src="/novel_nest.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>

        <p className="text-xl text-muted-foreground max-w-2xl animate-on-scroll mt-8" style={{ animationDelay: '400ms' }}>
          Discover thousands of free Egyptian books, track your reading progress, 
          join voice channels to discuss your favorite chapters, and build a lasting reading habit.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-2 animate-on-scroll" style={{ animationDelay: '600ms' }}>
          <Link href="/register">
            <Button size="lg" className="h-12 px-8 text-base group">
              Start Reading Now
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="h-12 px-8 text-base">
              I already have an account
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
