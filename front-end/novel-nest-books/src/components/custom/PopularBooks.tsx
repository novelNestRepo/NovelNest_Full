'use client';
import { useEffect, useState } from 'react';
import BookCard from "@/components/custom/BookCard";
import { apiClient } from '@/lib/api';

export default function PopularBooks() {
  const [popularBooks, setPopularBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBooks() {
      try {
        const data = await apiClient.getBooks();
        setPopularBooks(data.slice(0, 4)); // Get first 4 books as popular
      } catch (error) {
        console.error('Failed to fetch popular books:', error);
      } finally {
        setLoading(false);
      }
    }
    loadBooks();
  }, []);

  return (
    <div className="mb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-playfair">Popular Now</h2>
        <div className="flex space-x-1">
          <div className="w-6 h-1 bg-black/10 rounded-full"></div>
          <div className="w-6 h-1 bg-black/80 rounded-full"></div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {loading ? (
          <div className="col-span-4 text-center py-10">Loading books...</div>
        ) : popularBooks.length > 0 ? (
          popularBooks.map((book) => (
            <BookCard
              key={book.id}
              title={book.title}
              coverUrl={book.coverImage || '/placeholder.jpg'}
              series={book.author}
            />
          ))
        ) : (
          <div className="col-span-4 text-center py-10 text-muted-foreground">No books found in database.</div>
        )}
      </div>
    </div>
  );
}
