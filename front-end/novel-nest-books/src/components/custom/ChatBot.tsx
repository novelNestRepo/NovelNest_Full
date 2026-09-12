'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi there! I'm NestBot 🤖. I can help you navigate NovelNest or recommend some great books we have available. How can I help?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isOpen]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      setMessages([...newMessages, { role: 'assistant', content: data.content }]);
    } catch (error) {
      console.error(error);
      setMessages([...newMessages, { role: 'assistant', content: "Sorry, I'm having trouble connecting to my brain right now. Please try again later!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-4"
          >
            <Card className="w-80 sm:w-96 h-[500px] flex flex-col bg-background/80 backdrop-blur-xl border-white/20 shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 bg-primary/10 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden">
                    <Image src="/novelnest.png" alt="NestBot" width={32} height={32} className="object-cover" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">NestBot</h3>
                    <p className="text-[10px] text-emerald-400 font-medium">Online</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setIsOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Chat Area */}
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center overflow-hidden shrink-0 mt-1 ${msg.role === 'user' ? 'bg-secondary' : ''}`}>
                        {msg.role === 'user' ? <User className="w-3 h-3" /> : <Image src="/novelnest.png" alt="NestBot" width={24} height={24} />}
                      </div>
                      <div className={`text-sm p-3 rounded-2xl max-w-[80%] leading-relaxed ${
                        msg.role === 'user' 
                          ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                          : 'bg-muted rounded-tl-sm border border-white/5'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center overflow-hidden shrink-0 mt-1">
                        <Image src="/novelnest.png" alt="NestBot" width={24} height={24} />
                      </div>
                      <div className="text-sm p-3 rounded-2xl bg-muted rounded-tl-sm border border-white/5 flex gap-1 items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input Area */}
              <form onSubmit={sendMessage} className="p-3 bg-background border-t border-white/10 flex gap-2">
                <Input
                  placeholder="Ask for a book recommendation..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="bg-muted/50 border-white/10 rounded-full text-sm"
                  disabled={isLoading}
                />
                <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={!input.trim() || isLoading}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center hover:bg-primary/90 transition-colors border-2 border-white/10"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </motion.button>
    </div>
  );
}
