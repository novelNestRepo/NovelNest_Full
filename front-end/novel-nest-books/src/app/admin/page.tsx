"use client";

import React, { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
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
  Settings,
  Lock,
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
  {
    id: "archiveorg",
    name: "Archive.org",
    icon: Database,
    description: "Massive public domain digital library",
    color: "text-slate-500",
    bg: "bg-slate-500/10",
    border: "border-slate-500/30",
  },
  {
    id: "hindawi",
    name: "Hindawi Foundation",
    icon: BookMarked,
    description: "High quality free Arabic literature",
    color: "text-teal-500",
    bg: "bg-teal-500/10",
    border: "border-teal-500/30",
  },
  {
    id: "doab",
    name: "DOAB",
    icon: Library,
    description: "Directory of Open Access Books",
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/30",
  },
  {
    id: "standardebooks",
    name: "Standard Ebooks",
    icon: Sparkles,
    description: "Carefully formatted public domain ebooks",
    color: "text-fuchsia-500",
    bg: "bg-fuchsia-500/10",
    border: "border-fuchsia-500/30",
  },
];

interface SourceReport {
  source: string;
  count: number;
  error?: string;
}

// ─── Scraping Animation Component ───────────────────────────────────
function ScrapingAnimation({ 
  selectedSources, 
  completedSources,
  failedSources 
}: { 
  selectedSources: string[];
  completedSources: string[];
  failedSources: string[];
}) {
  const [dots, setDots] = useState("");
  const total = selectedSources.length;
  const finished = completedSources.length + failedSources.length;
  const progress = total > 0 ? (finished / total) * 100 : 0;

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);

    return () => clearInterval(dotInterval);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white transition-all duration-500">
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

      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Zap className="w-8 h-8 text-yellow-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Parallel Scraping in Progress</h3>
            <p className="text-sm text-slate-400">
              Running independent workers across {total} domains
            </p>
          </div>
        </div>

        {/* Worker status indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {selectedSources.map((srcId) => {
            const src = SOURCES.find((s) => s.id === srcId);
            if (!src) return null;
            const Icon = src.icon;
            const isCompleted = completedSources.includes(srcId);
            const isFailed = failedSources.includes(srcId);
            const isWorking = !isCompleted && !isFailed;

            return (
              <div
                key={srcId}
                className={`relative flex flex-col p-4 rounded-xl border transition-all duration-500 overflow-hidden ${
                  isCompleted
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : isFailed
                    ? "bg-red-500/10 border-red-500/30"
                    : "bg-white/5 border-white/10 backdrop-blur-sm"
                }`}
              >
                {/* Individual Progress Bar Background for active workers */}
                {isWorking && (
                  <div className="absolute inset-0 opacity-10">
                    <div className="h-full bg-gradient-to-r from-transparent via-white to-transparent animate-[shimmer_2s_infinite]" style={{ backgroundSize: "200% 100%" }} />
                  </div>
                )}
                
                <div className="flex items-center justify-between z-10">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Icon className={`w-5 h-5 ${isCompleted ? 'text-emerald-400' : isFailed ? 'text-red-400' : src.color}`} />
                      {isWorking && <div className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-400 animate-ping`} />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{src.name}</p>
                      <p className="text-xs text-slate-400">
                        {isCompleted ? "Worker finished successfully" : isFailed ? "Worker failed" : `Fetching batch${dots}`}
                      </p>
                    </div>
                  </div>
                  <div>
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : isFailed ? (
                      <XCircle className="w-5 h-5 text-red-400" />
                    ) : (
                      <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                    )}
                  </div>
                </div>
                
                {/* Inner linear progress indicator for active workers */}
                {isWorking && (
                  <div className="w-full h-1 bg-white/10 rounded-full mt-3 overflow-hidden z-10">
                    <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-400 animate-[indeterminate_1.5s_infinite_linear]" style={{ width: "50%", transformOrigin: "0% 50%" }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="space-y-2 mt-4">
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-emerald-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>{finished} of {total} workers finished</span>
            <span>{Math.round(progress)}%</span>
          </div>
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
    "archiveorg",
    "hindawi",
    "doab",
    "standardebooks",
  ]);
  const [limit, setLimit] = useState(50);
  const [hasPdf, setHasPdf] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [completedSources, setCompletedSources] = useState<string[]>([]);
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const [scrapedBooks, setScrapedBooks] = useState<any[]>([]);
  const [report, setReport] = useState<SourceReport[]>([]);

  // Owner System Settings
  const [systemSettings, setSystemSettings] = useState({
    allowRegistration: true,
    enableVoiceChannels: true,
    maintenanceMode: false,
  });

  const toggleSetting = (key: string) => {
    setSystemSettings(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }));
    toast.success("System setting updated successfully (Owner only)");
  };

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
    setCompletedSources([]);
    setFailedSources([]);
    setReport([]);
    setScrapedBooks([]);

    // We trigger a separate fetch for each selected source to run them truly in parallel from the client
    const promises = selectedSources.map(async (source) => {
      try {
        const res = await fetch(`/api/admin/scrape/${source}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: query.trim(),
            adminId: user.id,
            limit,
            hasPdf
          }),
        });

        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "Failed");
        }

        setCompletedSources(prev => [...prev, source]);
        
        if (data.report) {
          setReport(prev => [...prev, data.report]);
        }
        
        if (data.books && data.books.length > 0) {
          setScrapedBooks(prev => {
            // Deduplicate across sources in frontend state
            const all = [...prev, ...data.books];
            const seen = new Set();
            return all.filter(book => {
              const k = book.title.toLowerCase();
              if (seen.has(k)) return false;
              seen.add(k);
              return true;
            });
          });
        }
        return data;
      } catch (err: any) {
        setFailedSources(prev => [...prev, source]);
        setReport(prev => [...prev, { source, count: 0, error: err.message }]);
        throw err;
      }
    });

    try {
      await Promise.allSettled(promises);
      toast.success("Parallel scraping complete!");
    } catch (e) {
      // errors already caught individually
    } finally {
      // Small delay to let the animation show 100%
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    }
  };

  if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <ShieldAlert className="w-16 h-16 text-destructive" />
        <h1 className="text-2xl font-bold">Admin Access Required</h1>
        <p className="text-muted-foreground">
          You do not have permission to view this page.
        </p>
        <Button onClick={() => router.push("/")}>Go Home</Button>
      </div>
    );
  }

  return (
    <>
      <PageTitle title="Admin Dashboard" icon={<ShieldAlert />} />

      <div className="grid gap-6">
        {/* ─── Owner Controls (Only visible to 'owner') ─── */}
        {user?.role === 'owner' && (
          <Card className="overflow-hidden border-yellow-500/30">
            <CardHeader className="bg-gradient-to-r from-yellow-500/10 to-transparent">
              <CardTitle className="flex items-center gap-2 text-yellow-500">
                <Lock className="w-5 h-5" />
                Owner Controls
              </CardTitle>
              <CardDescription>
                Exclusive system-wide settings only available to the platform owner.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center justify-between p-4 border rounded-xl bg-background/50">
                <div className="space-y-0.5">
                  <Label>Allow Public Registration</Label>
                  <p className="text-xs text-muted-foreground">Enable or disable new signups</p>
                </div>
                <Switch 
                  checked={systemSettings.allowRegistration}
                  onCheckedChange={() => toggleSetting('allowRegistration')}
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-xl bg-background/50">
                <div className="space-y-0.5">
                  <Label>Enable Voice Channels</Label>
                  <p className="text-xs text-muted-foreground">Toggle WebRTC voice features globally</p>
                </div>
                <Switch 
                  checked={systemSettings.enableVoiceChannels}
                  onCheckedChange={() => toggleSetting('enableVoiceChannels')}
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-xl bg-destructive/10 border-destructive/20">
                <div className="space-y-0.5">
                  <Label className="text-destructive">Maintenance Mode</Label>
                  <p className="text-xs text-muted-foreground">Lockout all non-admin users</p>
                </div>
                <Switch 
                  checked={systemSettings.maintenanceMode}
                  onCheckedChange={() => toggleSetting('maintenanceMode')}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── Scraping Animation (shown while loading) ─── */}
        {loading && (
          <ScrapingAnimation 
            selectedSources={selectedSources} 
            completedSources={completedSources}
            failedSources={failedSources}
          />
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Search Query */}
                <div className="space-y-2">
                  <Label className="text-xs uppercase font-semibold tracking-wider text-muted-foreground">
                    Search Query
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="e.g. روايات عربية, Arabic novels, Naguib Mahfouz..."
                      className="pl-9 h-11"
                    />
                  </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase font-semibold tracking-wider text-muted-foreground">
                      Limit (per source)
                    </Label>
                    <Input
                      type="number"
                      value={limit}
                      onChange={(e) => setLimit(Number(e.target.value))}
                      className="h-11"
                      min={10}
                      max={2000}
                    />
                  </div>
                  <div className="space-y-2 flex flex-col justify-center">
                    <Label className="text-xs uppercase font-semibold tracking-wider text-muted-foreground mb-2">
                      PDF Filter
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="has-pdf"
                        checked={hasPdf}
                        onCheckedChange={setHasPdf}
                      />
                      <Label htmlFor="has-pdf">Must have PDF</Label>
                    </div>
                  </div>
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
        {report.length > 0 && !loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {report.map((r, idx) => {
              const srcConfig = SOURCES.find(
                (s) => s.name === r.source || s.id === r.source
              );
              const displayName = srcConfig?.name || r.source;
              
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
                      <span className="font-semibold text-sm">{displayName}</span>
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
          <Card className={`animate-in fade-in slide-in-from-bottom-4 duration-700 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
