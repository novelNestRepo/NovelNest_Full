"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import PageTitle from "@/components/custom/PageTitle";
import {
  Database,
  ShieldAlert,
  Search,
  BookOpen,
  CheckCircle2,
  XCircle,
  Loader2,
  Globe,
  Library,
  BookMarked,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const SOURCES = [
  {
    id: "openlibrary",
    name: "Open Library",
    icon: Library,
    description: "Free API — ~10K Arabic fiction works with covers",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    id: "ktobati",
    name: "Ktobati",
    icon: BookMarked,
    description: "Arabic books portal with PDF downloads",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    id: "gutenberg",
    name: "Project Gutenberg",
    icon: BookOpen,
    description: "Public domain classics, highly reliable",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    id: "googlebooks",
    name: "Google Books",
    icon: Globe,
    description: "Massive catalog with preview links",
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
];

interface SourceReport {
  source: string;
  count: number;
  error?: string;
}

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [query, setQuery] = useState("روايات عربية");
  const [selectedSources, setSelectedSources] = useState<string[]>([
    "openlibrary",
    "ktobati",
    "gutenberg",
    "googlebooks",
  ]);
  const [loading, setLoading] = useState(false);
  const [scrapedBooks, setScrapedBooks] = useState<any[]>([]);
  const [report, setReport] = useState<SourceReport[]>([]);

  const toggleSource = (id: string) => {
    setSelectedSources((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleScrape = async () => {
    if (!user) {
      toast.error("You must be logged in as an admin.");
      return;
    }

    if (selectedSources.length === 0) {
      toast.error("Please select at least one source.");
      return;
    }

    if (!query.trim()) {
      toast.error("Please enter a search query.");
      return;
    }

    setLoading(true);
    setReport([]);
    setScrapedBooks([]);

    try {
      const res = await fetch("/api/admin/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          sources: selectedSources,
          adminId: user.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to scrape books.");
      }

      toast.success(data.message);
      setReport(data.report || []);
      setScrapedBooks(data.books || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <ShieldAlert className="w-16 h-16 text-destructive" />
        <h1 className="text-2xl font-bold">Admin Access Required</h1>
        <p className="text-muted-foreground">
          Please log in to access the Admin Dashboard.
        </p>
        <Button onClick={() => router.push("/login")}>Go to Login</Button>
      </div>
    );
  }

  return (
    <>
      <PageTitle title="Admin Dashboard" icon={<ShieldAlert />} />

      <div className="grid gap-6">
        {/* ─── Scraper Controls ─── */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Multi-Source Book Scraper
            </CardTitle>
            <CardDescription>
              Scrape books from multiple sources concurrently. Each source runs
              as an independent worker — if one fails, the others still deliver.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Search Query */}
            <div className="space-y-2">
              <Label className="text-xs uppercase font-semibold tracking-wider text-muted-foreground">
                Search Query
              </Label>
              <div className="relative max-w-lg">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. روايات عربية, Arabic novels, Naguib Mahfouz..."
                  className="pl-9 h-11"
                />
              </div>
            </div>

            {/* Source Selector */}
            <div className="space-y-2">
              <Label className="text-xs uppercase font-semibold tracking-wider text-muted-foreground">
                Select Sources
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {SOURCES.map((src) => {
                  const isSelected = selectedSources.includes(src.id);
                  const Icon = src.icon;
                  return (
                    <button
                      key={src.id}
                      onClick={() => toggleSource(src.id)}
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-muted-foreground/30 bg-background"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${src.bg}`}
                      >
                        <Icon className={`w-5 h-5 ${src.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{src.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {src.description}
                        </p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                          isSelected
                            ? "border-primary bg-primary"
                            : "border-muted-foreground/30"
                        }`}
                      >
                        {isSelected && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Button */}
            <Button
              onClick={handleScrape}
              disabled={loading || selectedSources.length === 0}
              size="lg"
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Scraping {selectedSources.length} source
                  {selectedSources.length > 1 ? "s" : ""}...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Scrape {selectedSources.length} Source
                  {selectedSources.length > 1 ? "s" : ""} Concurrently
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* ─── Per-Source Report ─── */}
        {report.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {report.map((r, idx) => (
              <Card
                key={idx}
                className={
                  r.error && r.count === 0 ? "border-destructive/30" : ""
                }
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm">{r.source}</span>
                    {r.error && r.count === 0 ? (
                      <XCircle className="w-5 h-5 text-destructive" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    )}
                  </div>
                  <p className="text-3xl font-bold">{r.count}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {r.error
                      ? `Error: ${r.error}`
                      : `${r.count} books scraped`}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ─── Scraped Books Grid ─── */}
        {scrapedBooks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Scraped Books ({scrapedBooks.length})
              </CardTitle>
              <CardDescription>
                These books have been saved to your database.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {scrapedBooks.map((book: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex gap-3 border rounded-xl p-4 bg-card hover:shadow-md transition-shadow"
                  >
                    {book.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={book.coverImage}
                        alt={book.title}
                        className="w-16 h-24 object-cover rounded-lg shadow-sm shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-24 bg-muted rounded-lg flex items-center justify-center shrink-0">
                        <BookOpen className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex flex-col flex-1 overflow-hidden">
                      <h4
                        className="font-semibold text-sm line-clamp-2"
                        title={book.title}
                      >
                        {book.title}
                      </h4>
                      <p className="text-xs text-muted-foreground truncate">
                        {book.author}
                      </p>
                      <div className="mt-auto flex items-center gap-2 pt-2">
                        <Badge variant="secondary" className="text-[10px]">
                          {book.source}
                        </Badge>
                        {book.pdfUrl && (
                          <a
                            href={book.pdfUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-primary hover:underline font-medium ml-auto"
                          >
                            View →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
