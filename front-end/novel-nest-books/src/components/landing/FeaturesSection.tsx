import React from 'react';
import { ArrowRight, Book, DownloadCloud, Mic } from 'lucide-react';
import Link from 'next/link';

export default function FeaturesSection() {
  return (
    <section className="py-24 bg-background overflow-hidden">
      <div className="container mx-auto px-6 max-w-6xl space-y-32">
        {/* Feature 1 */}
        <div className="flex flex-col md:flex-row items-center gap-12 animate-on-scroll">
          <div className="flex-1 space-y-6">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <DownloadCloud className="w-6 h-6" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold font-headings">
              Why pay for books<br />when you can scrape them?
            </h2>
            <p className="text-lg text-muted-foreground">
              Our built-in scraper connects directly to Hindawi.org, allowing you to instantly 
              find and add thousands of Egyptian and Arabic literature pieces directly to your 
              library. No subscriptions, no hidden fees, just pure reading.
            </p>
          </div>
          <div className="flex-1 w-full bg-muted/30 rounded-2xl p-8 border shadow-sm aspect-video flex items-center justify-center animate-on-scroll-right">
            {/* Abstract UI representation */}
            <div className="w-full max-w-sm space-y-4">
              <div className="h-8 bg-background rounded-md w-3/4 shadow-sm border flex items-center px-4 gap-2">
                <div className="w-4 h-4 rounded-full bg-primary/50"></div>
                <div className="h-2 w-24 bg-muted-foreground/20 rounded-full"></div>
              </div>
              <div className="h-24 bg-background rounded-md w-full shadow-sm border p-4 flex gap-4">
                <div className="w-12 h-16 bg-muted rounded-sm"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-3 w-3/4 bg-primary/30 rounded-full"></div>
                  <div className="h-2 w-1/2 bg-muted-foreground/20 rounded-full"></div>
                  <div className="h-2 w-1/4 bg-muted-foreground/20 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 2 */}
        <div className="flex flex-col md:flex-row-reverse items-center gap-12 animate-on-scroll">
          <div className="flex-1 space-y-6">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Mic className="w-6 h-6" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold font-headings">
              Voice channels for<br />book lovers.
            </h2>
            <p className="text-lg text-muted-foreground">
              Create or join voice channels dedicated to specific books or genres. 
              Read together, discuss chapters, and connect with people who share your 
              literary taste in real-time.
            </p>
          </div>
          <div className="flex-1 w-full bg-muted/30 rounded-2xl p-8 border shadow-sm aspect-video flex items-center justify-center animate-on-scroll-left">
            <div className="w-full max-w-sm space-y-3">
              <div className="flex items-center gap-3 p-3 bg-background rounded-lg border shadow-sm">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary"><Mic className="w-5 h-5"/></div>
                <div>
                  <div className="h-3 w-24 bg-foreground/80 rounded-full mb-1"></div>
                  <div className="h-2 w-16 bg-green-500/50 rounded-full"></div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-background rounded-lg border shadow-sm ml-8 opacity-70">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground"><Mic className="w-5 h-5"/></div>
                <div>
                  <div className="h-3 w-20 bg-muted-foreground/50 rounded-full mb-1"></div>
                  <div className="h-2 w-12 bg-muted-foreground/30 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
