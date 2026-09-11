import { NextResponse } from 'next/server';
import { db } from '@/db';
import { books } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const book = await db.select().from(books).where(eq(books.id, id));
    if (!book.length) return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    return NextResponse.json(book[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch book' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updatedBook = await db.update(books).set(body).where(eq(books.id, id)).returning();
    if (!updatedBook.length) return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    return NextResponse.json(updatedBook[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update book' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.delete(books).where(eq(books.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete book' }, { status: 500 });
  }
}
