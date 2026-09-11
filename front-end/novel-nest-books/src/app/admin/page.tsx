"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import PageTitle from "@/components/custom/PageTitle";
import { Database, ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [scrapedBooks, setScrapedBooks] = useState<any[]>([]);

  // Simple client-side protection (real protection happens at the API level)
  // If the user hasn't loaded yet or isn't admin, we can show a warning or redirect
  // For now, since user roles aren't stored in local auth context without fetching from DB,
  // we will rely on the API to validate admin status and allow them to try.
  // Wait, if we want to check admin role we need to fetch user profile. 
  // Let's assume the user is authorized to view this page, but the API will reject if not admin.

  const handleScrape = async () => {
    if (!user) {
      toast.error("You must be logged in as an admin to do this.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ page, adminId: user.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to scrape books.");
      }

      toast.success(data.message);
      if (data.books) {
        setScrapedBooks(data.books);
      }
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
        <p className="text-muted-foreground">Please log in to access the Admin Dashboard.</p>
        <Button onClick={() => router.push("/login")}>Go to Login</Button>
      </div>
    );
  }

  return (
    <>
      <PageTitle title="Admin Dashboard" icon={<ShieldAlert />} />

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Bulk Book Scraper
            </CardTitle>
            <CardDescription>
              Scrape open-source Egyptian books from Hindawi.org directly into the NovelNest database. 
              The scraper targets the novels section and fetches Cover Images, Authors, and PDF download links!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 max-w-xs">
                <label className="text-sm font-medium mb-1 block">Page Number to Scrape</label>
                <Input 
                  type="number" 
                  min={1} 
                  value={page} 
                  onChange={(e) => setPage(parseInt(e.target.value))}
                />
              </div>
              <div className="flex-1 pt-6">
                <Button onClick={handleScrape} disabled={loading} className="w-full sm:w-auto">
                  {loading ? "Scraping..." : `Scrape Page ${page}`}
                </Button>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground mt-2">
              * Note: Scraping takes a few seconds as it individually visits each book&apos;s page to extract the PDF URL.
            </p>
          </CardContent>
        </Card>

        {scrapedBooks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recently Scraped Books ({scrapedBooks.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {scrapedBooks.map((book, idx) => (
                  <div key={idx} className="flex gap-3 border rounded-lg p-3 bg-card">
                    {book.coverImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={book.coverImage} alt={book.title} className="w-16 h-24 object-cover rounded-md shadow-sm" />
                    )}
                    <div className="flex flex-col flex-1 overflow-hidden">
                      <h4 className="font-semibold text-sm truncate" title={book.title}>{book.title}</h4>
                      <p className="text-xs text-muted-foreground truncate">{book.author}</p>
                      <div className="mt-auto">
                        <a 
                          href={book.pdfUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-xs text-primary hover:underline font-medium"
                        >
                          View PDF
                        </a>
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
