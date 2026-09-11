'use client';
import React, { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";

export default function FeaturedBook() {
  const [featured, setFeatured] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeatured() {
      try {
        const data = await apiClient.getBooks();
        if (data && data.length > 0) {
          // Just pick the first book for the featured slot
          setFeatured(data[0]);
        }
      } catch (error) {
        console.error('Failed to fetch featured book:', error);
      } finally {
        setLoading(false);
      }
    }
    loadFeatured();
  }, []);

  if (loading) {
    return <div className="mb-8">Loading featured book...</div>;
  }

  if (!featured) {
    return <div className="mb-8 text-muted-foreground">No featured book available.</div>;
  }

  return (
    <div className="mb-8">
      <div className="flex flex-col mb-4">
        <h2 className="text-2xl font-playfair">Featured Book</h2>
        <h2 className="text-lg font-playfair">{featured.title}</h2>
      </div>

      <div className="flex items-start gap-4">
        <div className="flex-3 text-sm">
          <div className="flex items-center mb-4">
            <span className="text-accent font-medium">0</span>
            <span className="mx-1 text-foreground/50">/</span>
            <span className="text-foreground/50">??? pages</span>
          </div>

          <p className="text-foreground/80 leading-relaxed mb-4 line-clamp-3">
            {featured.description || "No description provided."}
          </p>

          <p className="text-right text-foreground/70 italic">- {featured.author}</p>
        </div>

        <div className="flex-2 relative">
          <img
            src={featured.coverImage || "/placeholder.jpg"}
            alt="Open book"
            className="w-full h-full object-cover rounded-md shadow-lg"
          />
        </div>
      </div>
    </div>
  );
}
