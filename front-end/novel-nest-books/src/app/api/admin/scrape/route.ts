import { NextResponse } from 'next/server';
import { db } from '@/db';
import { books, users } from '@/db/schema';
import * as cheerio from 'cheerio';
import { eq } from 'drizzle-orm';
import { supabase } from '@/lib/supabase';

const BASE_URL = 'https://www.hindawi.org';
const BOOKS_URL = `${BASE_URL}/books/categories/novels/`;

export async function POST(request: Request) {
  try {
    const { page = 1, adminId } = await request.json();

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

    const url = `${BOOKS_URL}${page}/`;
    console.log(`Scraping ${url}...`);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch Hindawi page: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Hindawi typically uses a list for books
    const bookLinks = $('a')
      .map((_, el) => $(el).attr('href'))
      .get()
      .filter((href) => href && href.startsWith('/books/') && href.length > 10)
      .filter((value, index, self) => self.indexOf(value) === index); // Unique

    if (bookLinks.length === 0) {
      return NextResponse.json({ message: 'No books found on this page.', count: 0 });
    }

    // Process up to 10 books at a time to prevent timeout
    const booksToProcess = bookLinks.slice(0, 10);
    const scrapedBooks = [];

    for (const link of booksToProcess) {
      try {
        const bookUrl = `${BASE_URL}${link}`;
        const bookResponse = await fetch(bookUrl);
        const bookHtml = await bookResponse.text();
        const book$ = cheerio.load(bookHtml);

        const title = book$('h1').first().text().trim() || book$('title').text().trim();
        const author = book$('.author').first().text().trim() || 'Unknown Author';
        const description = book$('.book-description, .abstract, .summary').text().trim() || '';
        
        let coverImage = book$('img.cover').attr('src') || book$('.book-cover img').attr('src');
        if (coverImage && !coverImage.startsWith('http')) {
          coverImage = `${BASE_URL}${coverImage}`;
        }

        let pdfUrl = book$('a[href$=".pdf"]').attr('href') || book$('a:contains("PDF")').attr('href') || book$('a:contains("pdf")').attr('href');
        if (pdfUrl && !pdfUrl.startsWith('http')) {
          pdfUrl = `${BASE_URL}${pdfUrl}`;
        }

        // Only add if we have at least a title and PDF
        if (title && pdfUrl) {
          scrapedBooks.push({
            title,
            author,
            description,
            coverImage,
            pdfUrl,
            source: 'Hindawi',
            language: 'ar',
            addedBy: adminId,
          });
        }
      } catch (err) {
        console.error(`Error scraping book ${link}:`, err);
      }
    }

    if (scrapedBooks.length > 0) {
      await db.insert(books).values(scrapedBooks).onConflictDoNothing();
    }

    return NextResponse.json({ 
      success: true, 
      message: `Scraped and saved ${scrapedBooks.length} books.`,
      books: scrapedBooks 
    });

  } catch (error: any) {
    console.error('Scraping error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
