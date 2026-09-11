import { NextResponse } from 'next/server';
import { db } from '@/db';
import { books, users } from '@/db/schema';
import * as cheerio from 'cheerio';
import { eq } from 'drizzle-orm';

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

// ─── Worker 1: Open Library Subjects API ────────────────────────────
// Uses the /subjects/ endpoint which is far richer than /search.json
// Supports subjects: arabic_fiction, arabic_literature, arabic_poetry, egyptian_fiction
async function scrapeOpenLibrary(query: string, adminId: string): Promise<WorkerResult> {
  const source = 'Open Library';
  try {
    // Map user queries to known Open Library subjects for best results
    const subjectMap: Record<string, string[]> = {
      default: ['arabic_fiction', 'arabic_literature', 'egyptian_fiction'],
    };

    // Use subject-based browsing (much richer than search)
    const subjects = subjectMap.default;
    const allBooks: ScrapedBook[] = [];

    // Fetch multiple subjects concurrently for more books
    const subjectResults = await Promise.allSettled(
      subjects.map(async (subject) => {
        const url = `https://openlibrary.org/subjects/${subject}.json?limit=20`;
        const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
    );

    for (const result of subjectResults) {
      if (result.status !== 'fulfilled') continue;
      const data = result.value;
      const works = data.works || [];

      for (const w of works) {
        allBooks.push({
          title: w.title,
          author: w.authors?.[0]?.name || 'Unknown Author',
          description: w.subject?.slice(0, 5)?.join(', ') || '',
          coverImage: w.cover_id
            ? `https://covers.openlibrary.org/b/id/${w.cover_id}-L.jpg`
            : null,
          pdfUrl: w.key ? `https://openlibrary.org${w.key}` : null,
          source,
          language: 'ar',
          addedBy: adminId,
        });
      }
    }

    // Also do a search-based query (without the restrictive language=ara filter)
    const searchUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20`;
    const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(15000) });
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      for (const doc of (searchData.docs || []).slice(0, 20)) {
        if (!doc.title) continue;
        allBooks.push({
          title: doc.title,
          author: doc.author_name?.[0] || 'Unknown Author',
          description: doc.subject?.slice(0, 5)?.join(', ') || '',
          coverImage: doc.cover_i
            ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
            : null,
          pdfUrl: doc.key ? `https://openlibrary.org${doc.key}` : null,
          source,
          language: 'ar',
          addedBy: adminId,
        });
      }
    }

    return { source, books: allBooks };
  } catch (err: any) {
    return { source, books: [], error: err.message };
  }
}

// ─── Worker 2: Ktobati Scraper ──────────────────────────────────────
async function scrapeKtobati(query: string, adminId: string): Promise<WorkerResult> {
  const source = 'Ktobati';
  try {
    // Try both search and category pages for more results
    const urls = [
      `https://www.ktobati.com/search?q=${encodeURIComponent(query)}`,
      `https://www.ktobati.com/category/novels`,
      `https://www.ktobati.com/category/arabic-literature`,
    ];

    const allBooks: ScrapedBook[] = [];

    const pageResults = await Promise.allSettled(
      urls.map(async (url) => {
        const res = await fetch(url, {
          signal: AbortSignal.timeout(15000),
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9',
            'Accept-Language': 'ar,en;q=0.9',
          },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
    );

    for (const result of pageResults) {
      if (result.status !== 'fulfilled') continue;
      const $ = cheerio.load(result.value);

      // Try multiple selectors to find book cards
      const selectors = [
        'article',
        '.book-card',
        '.post',
        '.entry',
        '.card',
        '.book-item',
        '.product',
        '.item',
      ];

      for (const sel of selectors) {
        $(sel).each((_, el) => {
          const title =
            $(el).find('h2, h3, h4, .title, .book-title').first().text().trim();
          const author =
            $(el).find('.author, .book-author, .meta a').first().text().trim() ||
            'Unknown Author';
          const description =
            $(el).find('p, .description, .excerpt, .summary').first().text().trim() || '';
          let coverImage = $(el).find('img').first().attr('src') || null;
          let link = $(el).find('a').first().attr('href') || null;

          if (coverImage && !coverImage.startsWith('http')) {
            coverImage = `https://www.ktobati.com${coverImage}`;
          }
          if (link && !link.startsWith('http')) {
            link = `https://www.ktobati.com${link}`;
          }

          if (title && title.length > 2) {
            allBooks.push({
              title,
              author,
              description: description.slice(0, 300),
              coverImage,
              pdfUrl: link,
              source,
              language: 'ar',
              addedBy: adminId,
            });
          }
        });
      }
    }

    return { source, books: allBooks };
  } catch (err: any) {
    return { source, books: [], error: err.message };
  }
}

// ─── Worker 3: Project Gutenberg ────────────────────────────────────
async function scrapeGutenberg(query: string, adminId: string): Promise<WorkerResult> {
  const source = 'Project Gutenberg';
  try {
    // Search multiple queries for more results
    const queries = [query, 'arabic', 'arabian nights', 'egypt'];
    const allBooks: ScrapedBook[] = [];

    const searchResults = await Promise.allSettled(
      queries.map(async (q) => {
        const url = `https://www.gutenberg.org/ebooks/search/?query=${encodeURIComponent(q)}&submit_search=Go%21`;
        const res = await fetch(url, {
          signal: AbortSignal.timeout(15000),
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
    );

    for (const result of searchResults) {
      if (result.status !== 'fulfilled') continue;
      const $ = cheerio.load(result.value);

      $('li.booklink').each((_, el) => {
        const title = $(el).find('.title').text().trim();
        const author = $(el).find('.subtitle').text().trim() || 'Unknown Author';
        const link = $(el).find('a').first().attr('href');
        let coverImage = $(el).find('img').first().attr('src') || null;

        const bookId = link?.match(/\/ebooks\/(\d+)/)?.[1];
        const pdfUrl = bookId ? `https://www.gutenberg.org/ebooks/${bookId}` : null;
        if (coverImage && !coverImage.startsWith('http')) {
          coverImage = `https://www.gutenberg.org${coverImage}`;
        }

        if (title && pdfUrl) {
          allBooks.push({
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
    }

    return { source, books: allBooks };
  } catch (err: any) {
    return { source, books: [], error: err.message };
  }
}

// ─── Worker 4: Google Books API ─────────────────────────────────────
async function scrapeGoogleBooks(query: string, adminId: string): Promise<WorkerResult> {
  const source = 'Google Books';
  try {
    // Multiple queries for more variety
    const queries = [
      query,
      'arabic novels',
      'روايات',
      'أدب عربي',
    ];

    const allBooks: ScrapedBook[] = [];

    const searchResults = await Promise.allSettled(
      queries.map(async (q) => {
        const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=20&printType=books`;
        const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
    );

    for (const result of searchResults) {
      if (result.status !== 'fulfilled') continue;
      const items = result.value.items || [];

      for (const item of items) {
        const v = item.volumeInfo;
        if (!v?.title) continue;

        allBooks.push({
          title: v.title,
          author: v.authors?.[0] || 'Unknown Author',
          description: v.description?.slice(0, 300) || '',
          coverImage:
            v.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
          pdfUrl: v.previewLink || v.infoLink || null,
          source,
          language: v.language || 'ar',
          addedBy: adminId,
        });
      }
    }

    return { source, books: allBooks };
  } catch (err: any) {
    return { source, books: [], error: err.message };
  }
}

// ─── Main Handler ───────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      query = 'روايات عربية',
      sources = ['openlibrary', 'ktobati', 'gutenberg', 'googlebooks'],
      adminId,
    } = body;

    if (!adminId) {
      return NextResponse.json(
        { error: 'Unauthorized: adminId required' },
        { status: 401 }
      );
    }

    // Verify admin role
    const adminUser = await db.query.users.findFirst({
      where: eq(users.id, adminId),
    });

    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin role required' },
        { status: 403 }
      );
    }

    // Build worker list
    const workers: Promise<WorkerResult>[] = [];
    if (sources.includes('openlibrary'))
      workers.push(scrapeOpenLibrary(query, adminId));
    if (sources.includes('ktobati'))
      workers.push(scrapeKtobati(query, adminId));
    if (sources.includes('gutenberg'))
      workers.push(scrapeGutenberg(query, adminId));
    if (sources.includes('googlebooks'))
      workers.push(scrapeGoogleBooks(query, adminId));

    if (workers.length === 0) {
      return NextResponse.json({ error: 'No sources selected' }, { status: 400 });
    }

    // 🚀 Run ALL workers concurrently
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
        report.push({
          source: 'Unknown',
          count: 0,
          error: result.reason?.message || 'Worker crashed',
        });
      }
    });

    // Deduplicate by title (case-insensitive, trimmed)
    const seen = new Set<string>();
    const uniqueBooks = allBooks.filter((book) => {
      const key = book.title.toLowerCase().trim();
      if (seen.has(key) || key.length < 2) return false;
      seen.add(key);
      return true;
    });

    // Bulk insert (skip conflicts)
    if (uniqueBooks.length > 0) {
      // Insert in batches of 50 to avoid query size limits
      for (let i = 0; i < uniqueBooks.length; i += 50) {
        const batch = uniqueBooks.slice(i, i + 50);
        await db
          .insert(books)
          .values(
            batch.map((b) => ({
              title: b.title,
              author: b.author,
              description: b.description || null,
              coverImage: b.coverImage || null,
              pdfUrl: b.pdfUrl || null,
              source: b.source,
              language: b.language,
              addedBy: adminId,
            }))
          )
          .onConflictDoNothing();
      }
    }

    const totalFromSources = report.reduce((sum, r) => sum + r.count, 0);

    return NextResponse.json({
      success: true,
      message: `Scraped ${totalFromSources} books → ${uniqueBooks.length} unique saved from ${report.length} sources.`,
      report,
      books: uniqueBooks,
    });
  } catch (error: any) {
    console.error('Scraping error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
