import { NextResponse } from 'next/server';
import { db } from '@/db';
import { books, users } from '@/db/schema';
import * as cheerio from 'cheerio';
import { eq } from 'drizzle-orm';
import { supabase } from '@/lib/supabase';

// ─── Types ──────────────────────────────────────────────────────────
interface ScrapedBook {
  title: string;
  author: string;
  description: string;
  coverImage: string | null;
  pdfUrl: string | null;
  source: string;
  language: string;
  addedBy: string;
}

interface WorkerResult {
  source: string;
  books: ScrapedBook[];
  error?: string;
}

// ─── Worker 1: Open Library API ─────────────────────────────────────
async function scrapeOpenLibrary(query: string, adminId: string): Promise<WorkerResult> {
  const source = 'Open Library';
  try {
    const searchUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&language=ara&limit=20`;
    const res = await fetch(searchUrl, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const works = data.docs || [];

    const scrapedBooks: ScrapedBook[] = works
      .filter((w: any) => w.title)
      .slice(0, 15)
      .map((w: any) => ({
        title: w.title,
        author: w.author_name?.[0] || 'Unknown Author',
        description: w.first_sentence?.length ? w.first_sentence[0] : (w.subject?.slice(0, 3)?.join(', ') || ''),
        coverImage: w.cover_i ? `https://covers.openlibrary.org/b/id/${w.cover_i}-L.jpg` : null,
        pdfUrl: w.key ? `https://openlibrary.org${w.key}` : null,
        source,
        language: 'ar',
        addedBy: adminId,
      }));

    return { source, books: scrapedBooks };
  } catch (err: any) {
    return { source, books: [], error: err.message };
  }
}

// ─── Worker 2: Ktobati ──────────────────────────────────────────────
async function scrapeKtobati(query: string, adminId: string): Promise<WorkerResult> {
  const source = 'Ktobati';
  try {
    const url = `https://www.ktobati.com/search?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ar,en;q=0.9',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html = await res.text();
    const $ = cheerio.load(html);
    const scrapedBooks: ScrapedBook[] = [];

    // Ktobati book cards
    $('article, .book-card, .post, .entry, .card').slice(0, 15).each((_, el) => {
      const title = $(el).find('h2, h3, .title, .book-title').first().text().trim();
      const author = $(el).find('.author, .book-author, .meta').first().text().trim() || 'Unknown Author';
      const description = $(el).find('p, .description, .excerpt').first().text().trim() || '';
      let coverImage = $(el).find('img').first().attr('src') || null;
      let link = $(el).find('a').first().attr('href') || null;

      if (coverImage && !coverImage.startsWith('http')) {
        coverImage = `https://www.ktobati.com${coverImage}`;
      }
      if (link && !link.startsWith('http')) {
        link = `https://www.ktobati.com${link}`;
      }

      if (title) {
        scrapedBooks.push({
          title,
          author,
          description,
          coverImage,
          pdfUrl: link,
          source,
          language: 'ar',
          addedBy: adminId,
        });
      }
    });

    return { source, books: scrapedBooks };
  } catch (err: any) {
    return { source, books: [], error: err.message };
  }
}

// ─── Worker 3: Project Gutenberg ────────────────────────────────────
async function scrapeGutenberg(query: string, adminId: string): Promise<WorkerResult> {
  const source = 'Project Gutenberg';
  try {
    const url = `https://www.gutenberg.org/ebooks/search/?query=${encodeURIComponent(query)}&submit_search=Go%21`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html = await res.text();
    const $ = cheerio.load(html);
    const scrapedBooks: ScrapedBook[] = [];

    $('li.booklink').slice(0, 15).each((_, el) => {
      const titleEl = $(el).find('.title');
      const subtitleEl = $(el).find('.subtitle');
      const title = titleEl.text().trim();
      const author = subtitleEl.text().trim() || 'Unknown Author';
      const link = $(el).find('a').first().attr('href');
      let coverImage = $(el).find('img').first().attr('src') || null;

      const bookId = link?.match(/\/ebooks\/(\d+)/)?.[1];
      const pdfUrl = bookId ? `https://www.gutenberg.org/ebooks/${bookId}` : null;
      if (coverImage && !coverImage.startsWith('http')) {
        coverImage = `https://www.gutenberg.org${coverImage}`;
      }

      if (title && pdfUrl) {
        scrapedBooks.push({
          title,
          author,
          description: '',
          coverImage,
          pdfUrl,
          source,
          language: 'en',
          addedBy: adminId,
        });
      }
    });

    return { source, books: scrapedBooks };
  } catch (err: any) {
    return { source, books: [], error: err.message };
  }
}

// ─── Worker 4: Google Books API ─────────────────────────────────────
async function scrapeGoogleBooks(query: string, adminId: string): Promise<WorkerResult> {
  const source = 'Google Books';
  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&langRestrict=ar&maxResults=15&printType=books`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const items = data.items || [];

    const scrapedBooks: ScrapedBook[] = items
      .filter((item: any) => item.volumeInfo?.title)
      .map((item: any) => {
        const v = item.volumeInfo;
        return {
          title: v.title,
          author: v.authors?.[0] || 'Unknown Author',
          description: v.description?.slice(0, 300) || '',
          coverImage: v.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
          pdfUrl: v.previewLink || v.infoLink || null,
          source,
          language: v.language || 'ar',
          addedBy: adminId,
        };
      });

    return { source, books: scrapedBooks };
  } catch (err: any) {
    return { source, books: [], error: err.message };
  }
}

// ─── Main Handler ───────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query = 'روايات عربية', sources = ['openlibrary', 'ktobati', 'gutenberg', 'googlebooks'], adminId } = body;

    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized: adminId required' }, { status: 401 });
    }

    // Verify admin role
    const adminUser = await db.query.users.findFirst({
      where: eq(users.id, adminId),
    });

    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 403 });
    }

    // Build worker list based on selected sources
    const workers: Promise<WorkerResult>[] = [];
    if (sources.includes('openlibrary')) workers.push(scrapeOpenLibrary(query, adminId));
    if (sources.includes('ktobati')) workers.push(scrapeKtobati(query, adminId));
    if (sources.includes('gutenberg')) workers.push(scrapeGutenberg(query, adminId));
    if (sources.includes('googlebooks')) workers.push(scrapeGoogleBooks(query, adminId));

    if (workers.length === 0) {
      return NextResponse.json({ error: 'No sources selected' }, { status: 400 });
    }

    // 🚀 Run all workers concurrently
    const results = await Promise.allSettled(workers);

    // Process results
    const report: { source: string; count: number; error?: string }[] = [];
    const allBooks: ScrapedBook[] = [];

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        const { source, books: workerBooks, error } = result.value;
        report.push({ source, count: workerBooks.length, error });
        allBooks.push(...workerBooks);
      } else {
        report.push({ source: 'Unknown', count: 0, error: result.reason?.message || 'Worker crashed' });
      }
    });

    // Deduplicate by title (case-insensitive)
    const seen = new Set<string>();
    const uniqueBooks = allBooks.filter((book) => {
      const key = book.title.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Bulk insert (skip conflicts)
    if (uniqueBooks.length > 0) {
      await db.insert(books).values(
        uniqueBooks.map((b) => ({
          title: b.title,
          author: b.author,
          description: b.description || null,
          coverImage: b.coverImage || null,
          pdfUrl: b.pdfUrl || null,
          source: b.source,
          language: b.language,
          addedBy: adminId,
        }))
      ).onConflictDoNothing();
    }

    return NextResponse.json({
      success: true,
      message: `Scraped ${uniqueBooks.length} unique books from ${report.length} sources.`,
      report,
      books: uniqueBooks,
    });
  } catch (error: any) {
    console.error('Scraping error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
