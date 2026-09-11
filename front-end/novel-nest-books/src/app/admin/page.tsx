"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Zap,
} from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const SOURCES = [
  {
    id: "openlibrary",
    name: "Open Library",
    icon: Library,
    description: "Subjects API — 12K+ Arabic works with covers",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
  },
  {
    id: "ktobati",
    name: "Ktobati",
    icon: BookMarked,
    description: "Arabic books portal with PDF downloads",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
  },
  {
    id: "gutenberg",
    name: "Project Gutenberg",
    icon: BookOpen,
    description: "Public domain classics, highly reliable",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
  },
  {
    id: "googlebooks",
    name: "Google Books",
    icon: Globe,
    description: "Massive catalog with preview links",
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
  },
];

const SCRAPING_MESSAGES = [
  "Connecting to Open Library API...",
  "Browsing arabic_fiction subject catalog...",
  "Found 12,640 works — downloading metadata...",
  "Fetching cover images from Open Library...",
  "Spinning up Ktobati worker...",
  "Crawling Ktobati novel categories...",
  "Parsing book cards with Cheerio...",
  "Launching Gutenberg spider...",
  "Searching Project Gutenberg archives...",
  "Extracting PDF download links...",
  "Querying Google Books API...",
  "Downloading thumbnail covers...",
  "Deduplicating results across sources...",
  "Inserting unique books into database...",
  "Almost there — finalizing batch insert...",
];

interface SourceReport {
  source: string;
  count: number;
  error?: string;
}

// ─── Scraping Animation Component ───────────────────────────────────
function ScrapingAnimation({ selectedSources }: { selectedSources: string[] }) {
  const [messageIdx, setMessageIdx] = useState(0);
  const [dots, setDots] = useState("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMessageIdx((prev) => (prev + 1) % SCRAPING_MESSAGES.length);
    }, 2000);

    const dotInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);

    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + Math.random() * 8, 92));
    }, 800);

    return () => {
      clearInterval(msgInterval);
      clearInterval(dotInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white">
      {/* Background animated grid */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Floating orbs */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-10 right-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl animate-pulse delay-700" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Zap className="w-8 h-8 text-yellow-400 animate-pulse" />
            <div className="absolute inset-0 w-8 h-8 bg-yellow-400/30 rounded-full blur-md animate-ping" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Scraping in Progress</h3>
            <p className="text-sm text-slate-400">
              {selectedSources.length} worker{selectedSources.length > 1 ? "s" : ""} running concurrently
            </p>
          </div>
        </div>

        {/* Worker status indicators */}
        <div className="flex flex-wrap gap-3">
          {selectedSources.map((srcId) => {
            const src = SOURCES.find((s) => s.id === srcId);
            if (!src) return null;
            const Icon = src.icon;
            return (
              <div
                key={srcId}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm`}
              >
                <div className="relative">
                  <Icon className={`w-4 h-4 ${src.color}`} />
                  <div className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-400 animate-ping`} />
                </div>
                <span className="text-xs font-medium">{src.name}</span>
                <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-emerald-500 to-purple-500 rounded-full transition-all duration-700 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
            </div>
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>{Math.round(progress)}%</span>
            <span>Concurrent execution</span>
          </div>
        </div>

        {/* Live log message */}
        <div className="flex items-center gap-2 text-sm text-slate-300 font-mono bg-white/5 rounded-lg px-4 py-3 border border-white/10">
          <span className="text-emerald-400">$</span>
          <span className="animate-pulse">
            {SCRAPING_MESSAGES[messageIdx]}{dots}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────────────
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
        {/* ─── Scraping Animation (shown while loading) ─── */}
        {loading && (
          <ScrapingAnimation selectedSources={selectedSources} />
        )}

        {/* ─── Scraper Controls ─── */}
        {!loading && (
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
                <Sparkles className="w-4 h-4" />
                Scrape {selectedSources.length} Source
                {selectedSources.length > 1 ? "s" : ""} Concurrently
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ─── Per-Source Report ─── */}
        {report.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {report.map((r, idx) => {
              const srcConfig = SOURCES.find(
                (s) => s.name === r.source
              );
              return (
                <Card
                  key={idx}
                  className={`transition-all duration-300 ${
                    r.error && r.count === 0
                      ? "border-destructive/30 bg-destructive/5"
                      : "border-emerald-500/20 bg-emerald-500/5"
                  }`}
                  style={{ animationDelay: `${idx * 100}ms` }}
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
                      {r.error && r.count === 0
                        ? `Error: ${r.error}`
                        : `${r.count} books scraped`}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* ─── Scraped Books Grid ─── */}
        {scrapedBooks.length > 0 && (
          <Card className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Scraped Books ({scrapedBooks.length})
              </CardTitle>
              <CardDescription>
                These books have been saved to your database and are now available in the library.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {scrapedBooks.map((book: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex gap-3 border rounded-xl p-4 bg-card hover:shadow-md transition-all duration-200 hover:scale-[1.01] animate-in fade-in zoom-in-95"
                    style={{ animationDelay: `${Math.min(idx * 30, 500)}ms` }}
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
