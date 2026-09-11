import { NextResponse } from 'next/server';
import { db } from '@/db';
import { books, users } from '@/db/schema';
import * as cheerio from 'cheerio';
import { eq } from 'drizzle-orm';

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

async function scrapeOpenLibrary(query: string, adminId: string, limit: number, hasPdf: boolean): Promise<WorkerResult> {
  const source = 'Open Library';
  try {
    const subjectMap: Record<string, string[]> = {
      default: ['arabic_fiction', 'arabic_literature', 'egyptian_fiction'],
    };
    const subjects = subjectMap.default;
    const allBooks: ScrapedBook[] = [];
    // Open library has limits per request, we'll try to fetch up to limit
    const fetchLimit = Math.min(limit, 100); 

    const subjectResults = await Promise.allSettled(
      subjects.map(async (subject) => {
        const url = `https://openlibrary.org/subjects/${subject}.json?limit=${fetchLimit}`;
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
        if (allBooks.length >= limit) break;
        const pdfUrl = w.key ? `https://openlibrary.org${w.key}` : null;
        if (hasPdf && !pdfUrl) continue; // Not a real PDF, but OL links to page. For this demo we'll assume true if key exists.

        allBooks.push({
          title: w.title,
          author: w.authors?.[0]?.name || 'Unknown Author',
          description: w.subject?.slice(0, 5)?.join(', ') || '',
          coverImage: w.cover_id
            ? `https://covers.openlibrary.org/b/id/${w.cover_id}-L.jpg`
            : null,
          pdfUrl,
          source,
          language: 'ar',
          addedBy: adminId,
        });
      }
    }

    if (allBooks.length < limit) {
      const searchUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=${fetchLimit}`;
      const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(15000) });
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        for (const doc of (searchData.docs || [])) {
          if (allBooks.length >= limit) break;
          if (!doc.title) continue;
          const pdfUrl = doc.key ? `https://openlibrary.org${doc.key}` : null;
          if (hasPdf && !pdfUrl) continue;

          allBooks.push({
            title: doc.title,
            author: doc.author_name?.[0] || 'Unknown Author',
            description: doc.subject?.slice(0, 5)?.join(', ') || '',
            coverImage: doc.cover_i
              ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
              : null,
            pdfUrl,
            source,
            language: 'ar',
            addedBy: adminId,
          });
        }
      }
    }

    return { source, books: allBooks };
  } catch (err: any) {
    return { source, books: [], error: err.message };
  }
}

async function scrapeKtobati(query: string, adminId: string, limit: number, hasPdf: boolean): Promise<WorkerResult> {
  const source = 'Ktobati';
  try {
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
            'User-Agent': 'Mozilla/5.0',
            Accept: 'text/html',
          },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
    );

    for (const result of pageResults) {
      if (result.status !== 'fulfilled') continue;
      const $ = cheerio.load(result.value);
      const selectors = ['article', '.book-card', '.post', '.entry', '.card', '.book-item', '.product', '.item'];

      for (const sel of selectors) {
        $(sel).each((_, el) => {
          if (allBooks.length >= limit) return false; // break loop
          const title = $(el).find('h2, h3, h4, .title, .book-title').first().text().trim();
          const author = $(el).find('.author, .book-author, .meta a').first().text().trim() || 'Unknown Author';
          const description = $(el).find('p, .description, .excerpt, .summary').first().text().trim() || '';
          let coverImage = $(el).find('img').first().attr('src') || null;
          let link = $(el).find('a').first().attr('href') || null;

          if (coverImage && !coverImage.startsWith('http')) coverImage = `https://www.ktobati.com${coverImage}`;
          if (link && !link.startsWith('http')) link = `https://www.ktobati.com${link}`;

          if (hasPdf && !link) return;

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

    return { source, books: allBooks.slice(0, limit) };
  } catch (err: any) {
    return { source, books: [], error: err.message };
  }
}

async function scrapeGutenberg(query: string, adminId: string, limit: number, hasPdf: boolean): Promise<WorkerResult> {
  const source = 'Project Gutenberg';
  try {
    const queries = [query, 'arabic', 'arabian nights', 'egypt'];
    const allBooks: ScrapedBook[] = [];

    const searchResults = await Promise.allSettled(
      queries.map(async (q) => {
        const url = `https://www.gutenberg.org/ebooks/search/?query=${encodeURIComponent(q)}&submit_search=Go%21`;
        const res = await fetch(url, {
          signal: AbortSignal.timeout(15000),
          headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
    );

    for (const result of searchResults) {
      if (result.status !== 'fulfilled') continue;
      const $ = cheerio.load(result.value);

      $('li.booklink').each((_, el) => {
        if (allBooks.length >= limit) return false;
        const title = $(el).find('.title').text().trim();
        const author = $(el).find('.subtitle').text().trim() || 'Unknown Author';
        const link = $(el).find('a').first().attr('href');
        let coverImage = $(el).find('img').first().attr('src') || null;

        const bookId = link?.match(/\/ebooks\/(\d+)/)?.[1];
        const pdfUrl = bookId ? `https://www.gutenberg.org/ebooks/${bookId}` : null;
        
        if (hasPdf && !pdfUrl) return;

        if (coverImage && !coverImage.startsWith('http')) coverImage = `https://www.gutenberg.org${coverImage}`;

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

    return { source, books: allBooks.slice(0, limit) };
  } catch (err: any) {
    return { source, books: [], error: err.message };
  }
}

async function scrapeGoogleBooks(query: string, adminId: string, limit: number, hasPdf: boolean): Promise<WorkerResult> {
  const source = 'Google Books';
  try {
    const queries = [query, 'arabic novels', 'روايات', 'أدب عربي'];
    const allBooks: ScrapedBook[] = [];
    const fetchLimit = Math.min(limit, 40); // Google books max is usually 40

    const searchResults = await Promise.allSettled(
      queries.map(async (q) => {
        const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=${fetchLimit}&printType=books`;
        const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
    );

    for (const result of searchResults) {
      if (result.status !== 'fulfilled') continue;
      const items = result.value.items || [];

      for (const item of items) {
        if (allBooks.length >= limit) break;
        const v = item.volumeInfo;
        if (!v?.title) continue;
        
        const pdfUrl = v.previewLink || v.infoLink || null;
        if (hasPdf && !pdfUrl) continue;

        allBooks.push({
          title: v.title,
          author: v.authors?.[0] || 'Unknown Author',
          description: v.description?.slice(0, 300) || '',
          coverImage: v.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
          pdfUrl,
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

export async function POST(
  request: Request,
  { params }: { params: { source: string } }
) {
  try {
    const body = await request.json();
    const { query = 'روايات عربية', adminId, limit = 50, hasPdf = false } = body;
    const sourceParam = params.source;

    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized: adminId required' }, { status: 401 });
    }

    const adminUser = await db.query.users.findFirst({
      where: eq(users.id, adminId),
    });

    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 403 });
    }

    let workerPromise: Promise<WorkerResult>;
    switch (sourceParam) {
      case 'openlibrary':
        workerPromise = scrapeOpenLibrary(query, adminId, limit, hasPdf);
        break;
      case 'ktobati':
        workerPromise = scrapeKtobati(query, adminId, limit, hasPdf);
        break;
      case 'gutenberg':
        workerPromise = scrapeGutenberg(query, adminId, limit, hasPdf);
        break;
      case 'googlebooks':
        workerPromise = scrapeGoogleBooks(query, adminId, limit, hasPdf);
        break;
      default:
        return NextResponse.json({ error: 'Invalid source' }, { status: 400 });
    }

    const result = await workerPromise;
    if (result.error) throw new Error(result.error);

    const workerBooks = result.books;

    // Deduplicate internally for this source
    const seen = new Set<string>();
    const uniqueBooks = workerBooks.filter((book) => {
      const key = book.title.toLowerCase().trim();
      if (seen.has(key) || key.length < 2) return false;
      seen.add(key);
      return true;
    });

    // Bulk insert (skip conflicts)
    if (uniqueBooks.length > 0) {
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

    return NextResponse.json({
      success: true,
      report: { source: result.source, count: uniqueBooks.length },
      books: uniqueBooks,
    });
  } catch (error: any) {
    console.error(`Scraping error [${params.source}]:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
