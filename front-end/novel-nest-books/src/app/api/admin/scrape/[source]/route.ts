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

// 1. Open Library
async function scrapeOpenLibrary(query: string, adminId: string, limit: number, hasPdf: boolean): Promise<WorkerResult> {
  const source = 'Open Library';
  try {
    const allBooks: ScrapedBook[] = [];
    const fetchLimit = 100;
    let page = 1;

    while (allBooks.length < limit) {
      const searchUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=${fetchLimit}&page=${page}`;
      const searchRes = await fetch(searchUrl, { 
        signal: AbortSignal.timeout(30000), // increased timeout
        headers: { 'User-Agent': 'NovelNest/1.0 (admin@novelnest.local)' } 
      });
      if (!searchRes.ok) break;
      const searchData = await searchRes.json();
      
      const docs = searchData.docs || [];
      if (docs.length === 0) break;

      for (const doc of docs) {
        if (allBooks.length >= limit) break;
        if (!doc.title) continue;
        
        const pdfUrl = doc.key ? `https://openlibrary.org${doc.key}` : null;
        if (hasPdf && !pdfUrl) continue;

        allBooks.push({
          title: doc.title,
          author: doc.author_name?.[0] || 'Unknown Author',
          description: doc.subject?.slice(0, 5)?.join(', ') || '',
          coverImage: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : null,
          pdfUrl,
          source,
          language: 'ar', // Defaulting based on assumed query, or could try to detect
          addedBy: adminId,
        });
      }
      page++;
      if (page > (limit / fetchLimit) + 2) break; // Don't infinite loop
    }
    return { source, books: allBooks };
  } catch (err: any) {
    return { source, books: [], error: err.message };
  }
}

// 2. Google Books
async function scrapeGoogleBooks(query: string, adminId: string, limit: number, hasPdf: boolean): Promise<WorkerResult> {
  const source = 'Google Books';
  try {
    const allBooks: ScrapedBook[] = [];
    const fetchLimit = 40;
    let startIndex = 0;

    while (allBooks.length < limit) {
      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=${fetchLimit}&startIndex=${startIndex}&printType=books`;
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) break;
      
      const data = await res.json();
      const items = data.items || [];
      if (items.length === 0) break;

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
      startIndex += fetchLimit;
      if (startIndex > 1000) break;
    }
    return { source, books: allBooks };
  } catch (err: any) {
    return { source, books: [], error: err.message };
  }
}

// 3. Ktobati (HTML Scrape with Pagination)
async function scrapeKtobati(query: string, adminId: string, limit: number, hasPdf: boolean): Promise<WorkerResult> {
  const source = 'Ktobati';
  try {
    const allBooks: ScrapedBook[] = [];
    let page = 1;
    
    while (allBooks.length < limit) {
      const url = query ? `https://www.ktobati.com/search?q=${encodeURIComponent(query)}&page=${page}` : `https://www.ktobati.com/category/novels?page=${page}`;
      
      const res = await fetch(url, {
        signal: AbortSignal.timeout(15000),
        headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'text/html' },
      });
      
      if (!res.ok) break;
      const html = await res.text();
      const $ = cheerio.load(html);
      const selectors = ['article', '.book-card', '.post', '.entry', '.card', '.book-item', '.product', '.item'];
      
      let foundOnPage = 0;
      for (const sel of selectors) {
        $(sel).each((_, el) => {
          if (allBooks.length >= limit) return false;
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
            foundOnPage++;
          }
        });
      }
      
      if (foundOnPage === 0) break;
      page++;
      if (page > 20) break; // sanity limit
    }
    return { source, books: allBooks };
  } catch (err: any) {
    return { source, books: [], error: err.message };
  }
}

// 4. Project Gutenberg (HTML Scrape with deep pagination)
async function scrapeGutenberg(query: string, adminId: string, limit: number, hasPdf: boolean): Promise<WorkerResult> {
  const source = 'Project Gutenberg';
  try {
    const allBooks: ScrapedBook[] = [];
    let startIndex = 1;
    
    while (allBooks.length < limit) {
      const q = query || 'arabic';
      const url = `https://www.gutenberg.org/ebooks/search/?query=${encodeURIComponent(q)}&start_index=${startIndex}`;
      
      const res = await fetch(url, {
        signal: AbortSignal.timeout(15000),
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      if (!res.ok) break;
      const html = await res.text();
      const $ = cheerio.load(html);
      let foundOnPage = 0;

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
          foundOnPage++;
        }
      });
      
      if (foundOnPage === 0) break;
      startIndex += 25;
      if (startIndex > 500) break; // sanity limit
    }
    return { source, books: allBooks };
  } catch (err: any) {
    return { source, books: [], error: err.message };
  }
}

// 5. Archive.org
async function scrapeArchiveOrg(query: string, adminId: string, limit: number, hasPdf: boolean): Promise<WorkerResult> {
  const source = 'Archive.org';
  try {
    const allBooks: ScrapedBook[] = [];
    const fetchLimit = 100;
    let page = 1;
    
    while (allBooks.length < limit) {
      const q = query ? `${query} AND mediatype:texts` : 'mediatype:texts';
      const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(q)}&output=json&rows=${fetchLimit}&page=${page}`;
      
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) break;
      const data = await res.json();
      
      const docs = data.response?.docs || [];
      if (docs.length === 0) break;

      for (const doc of docs) {
        if (allBooks.length >= limit) break;
        if (!doc.title || !doc.identifier) continue;
        
        const pdfUrl = `https://archive.org/details/${doc.identifier}`;
        if (hasPdf && !pdfUrl) continue;

        allBooks.push({
          title: doc.title,
          author: Array.isArray(doc.creator) ? doc.creator[0] : (doc.creator || 'Unknown Author'),
          description: Array.isArray(doc.description) ? doc.description[0]?.slice(0,300) : (doc.description?.slice(0,300) || ''),
          coverImage: `https://archive.org/services/img/${doc.identifier}`,
          pdfUrl,
          source,
          language: doc.language || 'en',
          addedBy: adminId,
        });
      }
      
      page++;
      if (page > (limit / fetchLimit) + 2) break;
    }
    
    return { source, books: allBooks };
  } catch (err: any) {
    return { source, books: [], error: err.message };
  }
}

// 6. Hindawi
async function scrapeHindawi(query: string, adminId: string, limit: number, hasPdf: boolean): Promise<WorkerResult> {
  const source = 'Hindawi';
  try {
    const allBooks: ScrapedBook[] = [];
    let page = 1;
    
    while (allBooks.length < limit) {
      const url = query 
        ? `https://www.hindawi.org/search/?q=${encodeURIComponent(query)}&page=${page}`
        : `https://www.hindawi.org/books/categories/literature/?page=${page}`; // Default if no query
        
      const res = await fetch(url, {
        signal: AbortSignal.timeout(15000),
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      if (!res.ok) break;
      const html = await res.text();
      const $ = cheerio.load(html);
      let foundOnPage = 0;

      // Selectors based on Hindawi's structure
      $('.bookList li, .search-results li').each((_, el) => {
        if (allBooks.length >= limit) return false;
        const title = $(el).find('h2, h3, .title').text().trim();
        const author = $(el).find('.author, .subTitle').text().trim() || 'Unknown Author';
        let link = $(el).find('a').first().attr('href') || null;
        let coverImage = $(el).find('img').first().attr('src') || null;

        if (link && !link.startsWith('http')) link = `https://www.hindawi.org${link}`;
        if (coverImage && !coverImage.startsWith('http')) coverImage = `https://www.hindawi.org${coverImage}`;
        
        // PDFs are usually on the book details page under #download, but the page link acts as the entry
        if (hasPdf && !link) return;

        if (title && link) {
          allBooks.push({
            title,
            author,
            description: '', // Hard to get from list view
            coverImage,
            pdfUrl: link,
            source,
            language: 'ar',
            addedBy: adminId,
          });
          foundOnPage++;
        }
      });
      
      if (foundOnPage === 0) break;
      page++;
      if (page > 10) break;
    }
    return { source, books: allBooks };
  } catch (err: any) {
    return { source, books: [], error: err.message };
  }
}

// 7. DOAB (Directory of Open Access Books)
async function scrapeDoab(query: string, adminId: string, limit: number, hasPdf: boolean): Promise<WorkerResult> {
  const source = 'DOAB';
  try {
    const allBooks: ScrapedBook[] = [];
    const fetchLimit = 100;
    let offset = 0;
    
    while (allBooks.length < limit) {
      const q = query || 'literature';
      const url = `https://directory.doabooks.org/rest/search?query=${encodeURIComponent(q)}&expand=metadata&limit=${fetchLimit}&offset=${offset}`;
      
      const res = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { 'Accept': 'application/json' } });
      if (!res.ok) break;
      
      const items = await res.json();
      if (!Array.isArray(items) || items.length === 0) break;

      for (const item of items) {
        if (allBooks.length >= limit) break;
        
        const metadata = item.metadata || [];
        const getMeta = (key: string) => metadata.find((m: any) => m.key === key)?.value;
        
        const title = item.name || getMeta('dc.title');
        if (!title) continue;
        
        const author = getMeta('dc.contributor.author') || getMeta('dc.creator') || 'Unknown Author';
        const description = getMeta('dc.description.abstract') || getMeta('dc.description') || '';
        const language = getMeta('dc.language.iso') || 'en';
        
        const pdfUrl = item.handle ? `https://directory.doabooks.org/handle/${item.handle}` : null;
        if (hasPdf && !pdfUrl) continue;

        allBooks.push({
          title,
          author,
          description: description.slice(0, 300),
          coverImage: null, // DOAB REST API doesn't cleanly provide covers usually
          pdfUrl,
          source,
          language,
          addedBy: adminId,
        });
      }
      
      offset += fetchLimit;
      if (offset > 1000) break;
    }
    return { source, books: allBooks };
  } catch (err: any) {
    return { source, books: [], error: err.message };
  }
}

// 8. Standard Ebooks (HTML Search)
async function scrapeStandardEbooks(query: string, adminId: string, limit: number, hasPdf: boolean): Promise<WorkerResult> {
  const source = 'Standard Ebooks';
  try {
    const allBooks: ScrapedBook[] = [];
    let page = 1;

    while (allBooks.length < limit) {
      const url = `https://standardebooks.org/ebooks?query=${encodeURIComponent(query)}&page=${page}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) break;
      
      const html = await res.text();
      const $ = cheerio.load(html);
      let foundOnPage = 0;
      
      $('li > article').each((_, el) => {
        if (allBooks.length >= limit) return false;
        
        const titleEl = $(el).find('p > a[property="schema:url"]').first();
        const title = titleEl.find('span[property="schema:name"]').text().trim();
        
        const authorEl = $(el).find('p.author > a[property="schema:url"]').first();
        const author = authorEl.find('span[property="schema:name"]').text().trim() || 'Unknown Author';
        
        const bookPath = titleEl.attr('href');
        if (!bookPath) return;

        // In standard ebooks, epub is universally available, and we link to the book's specific URL
        const pdfUrl = `https://standardebooks.org${bookPath}`;
        if (hasPdf && !pdfUrl) return;

        if (title && bookPath) {
          allBooks.push({
            title,
            author,
            description: '',
            coverImage: null, // Covers are loaded via background images, harder to parse in simple listing
            pdfUrl,
            source,
            language: 'en',
            addedBy: adminId,
          });
          foundOnPage++;
        }
      });

      if (foundOnPage === 0) break;
      page++;
      if (page > 50) break;
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
    const { query = '', adminId, limit = 50, hasPdf = false } = body;
    const sourceParam = params.source;

    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized: adminId required' }, { status: 401 });
    }

    const adminUser = await db.query.users.findFirst({
      where: eq(users.id, adminId),
    });

    if (!adminUser || adminUser.role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized: Owner role required for scraping' }, { status: 403 });
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
      case 'archiveorg':
        workerPromise = scrapeArchiveOrg(query, adminId, limit, hasPdf);
        break;
      case 'hindawi':
        workerPromise = scrapeHindawi(query, adminId, limit, hasPdf);
        break;
      case 'doab':
        workerPromise = scrapeDoab(query, adminId, limit, hasPdf);
        break;
      case 'standardebooks':
        workerPromise = scrapeStandardEbooks(query, adminId, limit, hasPdf);
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
