"use client";

import React, { use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, BookOpen, Clock, Globe, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBook } from "@/lib/hooks/useBooks";
import { toast } from "sonner";

export default function BookDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { data: book, isLoading, error } = useBook(resolvedParams.id);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-muted-foreground">Loading book details...</p>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Info className="w-12 h-12 text-destructive" />
        <h2 className="text-xl font-bold">Book Not Found</h2>
        <Button variant="outline" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  const handleStartReading = () => {
    if (book.pdfUrl) {
      window.open(book.pdfUrl, "_blank", "noopener,noreferrer");
    } else {
      toast.error("Sorry, reading material is not available for this book yet.");
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6">
        <Button
          variant="ghost"
          className="gap-2 -ml-4 text-muted-foreground hover:text-foreground"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Books
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Cover and Actions (Left Col) */}
        <div className="md:col-span-1 space-y-6">
          <div className="aspect-[2/3] relative rounded-xl overflow-hidden shadow-lg border bg-muted">
            {book.coverImage || book.coverUrl ? (
              <Image
                src={book.coverImage || book.coverUrl}
                alt={book.title || "Book Cover"}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-slate-50 dark:bg-slate-900">
                <BookOpen className="w-16 h-16 mb-2 opacity-50" />
                <span className="text-sm">No Cover Available</span>
              </div>
            )}
          </div>

          <Button
            size="lg"
            className="w-full gap-2 font-semibold text-base h-14"
            onClick={handleStartReading}
          >
            <BookOpen className="w-5 h-5" />
            {book.pdfUrl ? "Start Reading" : "Preview Unavailable"}
          </Button>
        </div>

        {/* Details (Right Col) */}
        <div className="md:col-span-2 space-y-8">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="secondary" className="capitalize">
                {book.language === "ar" ? "Arabic" : book.language || "Unknown Language"}
              </Badge>
              {book.source && (
                <Badge variant="outline" className="text-muted-foreground">
                  Source: {book.source}
                </Badge>
              )}
            </div>
            <h1 className="text-3xl md:text-5xl font-playfair font-bold tracking-tight">
              {book.title}
            </h1>
            <p className="text-xl text-muted-foreground">{book.author}</p>
          </div>

          <Card className="bg-primary/5 border-none shadow-none">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2">About this book</h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {book.description || "No description provided for this book."}
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Globe className="w-4 h-4" />
                <span>Language</span>
              </div>
              <p className="font-medium uppercase">{book.language || "N/A"}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Clock className="w-4 h-4" />
                <span>Added</span>
              </div>
              <p className="font-medium" suppressHydrationWarning>
                {book.createdAt ? new Date(book.createdAt).toLocaleDateString() : "Recently"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
