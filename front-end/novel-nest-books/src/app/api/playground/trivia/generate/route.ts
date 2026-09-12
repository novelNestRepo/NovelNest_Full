import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Local database of literature trivia questions
const TRIVIA_DATABASE = [
  {
    question: "Who is the author of '1984'?",
    options: ["George Orwell", "Aldous Huxley", "Ray Bradbury", "Isaac Asimov"],
    correctAnswer: "George Orwell",
    explanation: "George Orwell published the dystopian novel '1984' in 1949."
  },
  {
    question: "In what novel does the character 'Holden Caulfield' appear?",
    options: ["The Catcher in the Rye", "To Kill a Mockingbird", "The Great Gatsby", "Lord of the Flies"],
    correctAnswer: "The Catcher in the Rye",
    explanation: "Holden Caulfield is the iconic teenage protagonist of J.D. Salinger's 'The Catcher in the Rye'."
  },
  {
    question: "Which of the following books is NOT written by Jane Austen?",
    options: ["Jane Eyre", "Pride and Prejudice", "Emma", "Sense and Sensibility"],
    correctAnswer: "Jane Eyre",
    explanation: "'Jane Eyre' was written by Charlotte Brontë, not Jane Austen."
  },
  {
    question: "What is the name of the whale in Herman Melville's famous novel?",
    options: ["Moby-Dick", "Willy", "Shamu", "Monstro"],
    correctAnswer: "Moby-Dick",
    explanation: "Moby-Dick is the giant white sperm whale pursued by Captain Ahab."
  },
  {
    question: "Which author wrote the 'A Song of Ice and Fire' fantasy series?",
    options: ["George R.R. Martin", "J.R.R. Tolkien", "Brandon Sanderson", "Patrick Rothfuss"],
    correctAnswer: "George R.R. Martin",
    explanation: "George R.R. Martin wrote the series, which was adapted into the hit TV show 'Game of Thrones'."
  },
  {
    question: "Who wrote 'The Odyssey' and 'The Iliad'?",
    options: ["Homer", "Virgil", "Sophocles", "Euripides"],
    correctAnswer: "Homer",
    explanation: "These epic ancient Greek poems are traditionally attributed to Homer."
  },
  {
    question: "In 'The Great Gatsby', what color is the light at the end of Daisy's dock?",
    options: ["Green", "Blue", "Red", "Yellow"],
    correctAnswer: "Green",
    explanation: "The green light represents Gatsby's hopes and dreams for the future."
  },
  {
    question: "Which novel begins with the line: 'Call me Ishmael.'?",
    options: ["Moby-Dick", "The Old Man and the Sea", "Treasure Island", "Robinson Crusoe"],
    correctAnswer: "Moby-Dick",
    explanation: "This is one of the most famous opening lines in literature, from Melville's 'Moby-Dick'."
  },
  {
    question: "Who is the antagonist in J.K. Rowling's 'Harry Potter' series?",
    options: ["Lord Voldemort", "Severus Snape", "Draco Malfoy", "Bellatrix Lestrange"],
    correctAnswer: "Lord Voldemort",
    explanation: "Lord Voldemort, also known as Tom Riddle, is the main antagonist of the series."
  },
  {
    question: "What literary device involves giving human characteristics to non-human things?",
    options: ["Personification", "Simile", "Metaphor", "Hyperbole"],
    correctAnswer: "Personification",
    explanation: "Personification is when human qualities are given to animals, objects, or ideas."
  },
  {
    question: "Which playwright wrote 'Hamlet', 'Macbeth', and 'Romeo and Juliet'?",
    options: ["William Shakespeare", "Christopher Marlowe", "Arthur Miller", "Oscar Wilde"],
    correctAnswer: "William Shakespeare",
    explanation: "Shakespeare is widely regarded as the greatest writer in the English language."
  },
  {
    question: "In 'To Kill a Mockingbird', what is the name of the protagonist's father?",
    options: ["Atticus Finch", "Tom Robinson", "Boo Radley", "Bob Ewell"],
    correctAnswer: "Atticus Finch",
    explanation: "Atticus Finch is a lawyer and the moral compass of the novel, written by Harper Lee."
  },
  {
    question: "What dystopic novel features a rigid class system divided into Alphas, Betas, Gammas, Deltas, and Epsilons?",
    options: ["Brave New World", "1984", "Fahrenheit 451", "The Handmaid's Tale"],
    correctAnswer: "Brave New World",
    explanation: "Aldous Huxley's 'Brave New World' explores a futuristic society driven by technological conditioning."
  },
  {
    question: "Who wrote the classic gothic novel 'Frankenstein'?",
    options: ["Mary Shelley", "Bram Stoker", "Edgar Allan Poe", "H.P. Lovecraft"],
    correctAnswer: "Mary Shelley",
    explanation: "Mary Shelley wrote 'Frankenstein' when she was just 18 years old."
  },
  {
    question: "Which Russian author wrote 'Crime and Punishment'?",
    options: ["Fyodor Dostoevsky", "Leo Tolstoy", "Anton Chekhov", "Vladimir Nabokov"],
    correctAnswer: "Fyodor Dostoevsky",
    explanation: "Dostoevsky published 'Crime and Punishment' in 1866, exploring the psychological anguish of its protagonist, Raskolnikov."
  },
  {
    question: "What is the pen name of Samuel Langhorne Clemens?",
    options: ["Mark Twain", "O. Henry", "Dr. Seuss", "George Orwell"],
    correctAnswer: "Mark Twain",
    explanation: "Mark Twain is the famous author of 'The Adventures of Tom Sawyer' and 'Adventures of Huckleberry Finn'."
  },
  {
    question: "In which novel do children play a deadly game on a deserted island after a plane crash?",
    options: ["Lord of the Flies", "The Hunger Games", "Battle Royale", "The Maze Runner"],
    correctAnswer: "Lord of the Flies",
    explanation: "William Golding's 'Lord of the Flies' explores the dark side of human nature and the loss of innocence."
  },
  {
    question: "Who is the author of the 'The Chronicles of Narnia'?",
    options: ["C.S. Lewis", "J.R.R. Tolkien", "Roald Dahl", "Philip Pullman"],
    correctAnswer: "C.S. Lewis",
    explanation: "Clive Staples Lewis was a British writer and lay theologian who wrote the fantasy series."
  },
  {
    question: "Which famous novel features a protagonist named Elizabeth Bennet?",
    options: ["Pride and Prejudice", "Wuthering Heights", "Little Women", "Jane Eyre"],
    correctAnswer: "Pride and Prejudice",
    explanation: "Elizabeth Bennet is the intelligent and spirited protagonist of Jane Austen's 'Pride and Prejudice'."
  },
  {
    question: "What is the title of the first book in 'The Lord of the Rings' trilogy?",
    options: ["The Fellowship of the Ring", "The Two Towers", "The Return of the King", "The Hobbit"],
    correctAnswer: "The Fellowship of the Ring",
    explanation: "'The Fellowship of the Ring' is the first volume of J.R.R. Tolkien's epic high fantasy novel."
  }
];

// Helper to shuffle an array (Fisher-Yates algorithm)
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export async function POST(req: Request) {
  try {
    // Basic Auth Check
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing token' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Shuffle the entire database
    const shuffledDb = shuffleArray(TRIVIA_DATABASE);
    
    // 2. Pick the first 10 questions
    const selectedQuestions = shuffledDb.slice(0, 10);
    
    // 3. Shuffle the options within each question so the correct answer isn't always in the same place
    const finalizedQuestions = selectedQuestions.map(q => ({
      question: q.question,
      options: shuffleArray(q.options),
      correctAnswer: q.correctAnswer,
      explanation: q.explanation
    }));

    // Return exactly 10 algorithmic questions matching the expected schema
    return NextResponse.json({ questions: finalizedQuestions });

  } catch (error) {
    console.error('Error generating trivia:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

