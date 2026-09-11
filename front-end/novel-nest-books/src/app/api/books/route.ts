import { NextResponse } from 'next/server';
import { db } from '@/db';
import { books } from '@/db/schema';

export async function GET() {
  try {
    const allBooks = await db.select().from(books);
    return NextResponse.json(allBooks);
  } catch (error) {
    console.error('Error fetching books:', error);
    return NextResponse.json({ error: 'Failed to fetch books' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newBook = await db.insert(books).values({
      title: body.title,
      author: body.author,
      description: body.description,
      coverImage: body.coverImage,
      source: body.source,
      language: body.language,
    }).returning();

    return NextResponse.json(newBook[0], { status: 201 });
  } catch (error) {
    console.error('Error creating book:', error);
    return NextResponse.json({ error: 'Failed to create book' }, { status: 500 });
  }
}
