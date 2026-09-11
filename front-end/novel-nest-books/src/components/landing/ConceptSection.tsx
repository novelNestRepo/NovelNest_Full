import React from 'react';
import { Feather, Users, Library } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function ConceptSection() {
  return (
    <section className="py-24 bg-muted/30 border-y overflow-hidden">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-16 animate-on-scroll">
          <h2 className="text-4xl md:text-5xl font-bold font-headings mb-4">
            Welcome to the Nest
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Reading shouldn&apos;t be a solitary activity. NovelNest brings the warmth of a book club 
            directly to your screen, combining free literature with community.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-background/60 backdrop-blur-sm border-primary/20 animate-on-scroll-scale" style={{ animationDelay: '0ms' }}>
            <CardContent className="p-8 flex flex-col items-center text-center gap-4">
              <div className="p-4 bg-primary/10 rounded-full text-primary">
                <Library className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold font-headings">Open Library</h3>
              <p className="text-muted-foreground">
                Instantly access and scrape thousands of open-source Egyptian books from Hindawi. 
                Your next favorite novel is just a click away.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-background/60 backdrop-blur-sm border-primary/20 animate-on-scroll-scale" style={{ animationDelay: '200ms' }}>
            <CardContent className="p-8 flex flex-col items-center text-center gap-4">
              <div className="p-4 bg-primary/10 rounded-full text-primary">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold font-headings">Read Together</h3>
              <p className="text-muted-foreground">
                Join live voice channels to read aloud, discuss plot twists, and share the 
                experience of reading with friends in real-time.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-background/60 backdrop-blur-sm border-primary/20 animate-on-scroll-scale" style={{ animationDelay: '400ms' }}>
            <CardContent className="p-8 flex flex-col items-center text-center gap-4">
              <div className="p-4 bg-primary/10 rounded-full text-primary">
                <Feather className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold font-headings">Track Progress</h3>
              <p className="text-muted-foreground">
                Set reading schedules, mark your current page, and watch your reading habit 
                flourish as you complete books and series.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
