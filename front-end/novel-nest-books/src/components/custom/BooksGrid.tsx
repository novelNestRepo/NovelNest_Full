import React from "react";
import { Book } from "@/lib/types";
import BookCard from "./BookCard";

const BooksGrid = ({ content }: { content: Book[] }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {content.map((book) => (
        <BookCard key={book.id} {...book} />
      ))}
    </div>
  );
};

export default BooksGrid;
