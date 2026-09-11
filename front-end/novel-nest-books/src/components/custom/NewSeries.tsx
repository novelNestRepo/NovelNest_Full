'use client';
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";

export default function NewSeries() {
  const [series, setSeries] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSeries() {
      try {
        const data = await apiClient.getBooks();
        // Just grab a random or latest book as the "New Series"
        if (data && data.length > 0) {
          setSeries(data[data.length - 1]);
        }
      } catch (error) {
        console.error('Failed to fetch new series:', error);
      } finally {
        setLoading(false);
      }
    }
    loadSeries();
  }, []);

  return (
    <div className="mb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-playfair">New Series Collection</h2>
        <div className="flex space-x-1">
          <div className="w-6 h-1 bg-black/10 rounded-full"></div>
          <div className="w-6 h-1 bg-black/80 rounded-full"></div>
        </div>
      </div>

      {loading ? (
        <div className="bg-foreground/5 rounded-lg p-4 flex items-center justify-center h-32">
          Loading...
        </div>
      ) : series ? (
        <div className="bg-foreground/5 rounded-lg p-4 flex items-center gap-4">
          <div className="w-24 h-32 flex-shrink-0">
            <Image
              src={series.coverImage || "/placeholder.jpg"}
              alt="Book cover"
              className="w-full h-full object-cover rounded shadow"
              width="200"
              height="300"
            />
          </div>

          <div className="flex-1">
            <h3 className="font-medium mb-1">
              {series.title}
            </h3>
            <div className="flex items-center text-sm text-foreground/70">
              <span className="line-clamp-2">{series.description || 'No description available.'}</span>
            </div>
            <div className="flex items-center text-sm mt-2">
              <span className="text-foreground/70">By {series.author}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-foreground/5 rounded-lg p-4 flex items-center justify-center h-32 text-muted-foreground">
          No series found.
        </div>
      )}
    </div>
  );
}
