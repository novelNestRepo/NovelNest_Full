"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, BookMarked, Users, Pen } from "lucide-react";
import { Book } from "@/lib/types";
import ProfileBooksGrid from "@/components/custom/ProfileBooksGrid";

import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";

// Stats are hardcoded for now until backend is fully integrated
const userStats = {
  booksRead: 12,
  booksGoal: 50,
  following: 5,
};

const books: Book[] = [
  {
    id: "1",
    title: "The Adventures of Sherlock Holmes",
    author: "Arthur Conan Doyle",
    coverUrl: "https://m.media-amazon.com/images/I/71tvs98+5vL.jpg",
    description:
      "A collection of twelve detective stories featuring the brilliant Sherlock Holmes and his loyal friend Dr. Watson as they solve baffling mysteries in Victorian London.",
  },
  {
    id: "2",
    title: "Fire & Blood",
    author: "George R.R. Martin",
    coverUrl:
      "https://upload.wikimedia.org/wikipedia/en/c/c2/Fire_%26_Blood_%282018%29_hardcover.jpg",
    description:
      "A comprehensive history of House Targaryen, chronicling the dynasty's rise to power in Westeros, their reign, and the civil war that nearly destroyed them, set 300 years before the events of A Song of Ice and Fire.",
  },
  {
    id: "3",
    title: "The Midnight Library",
    author: "Matt Haig",
    coverUrl:
      "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1602190253i/52578297.jpg",
    description:
      "Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived.",
  },
  {
    id: "4",
    title: "The Philosopher's Stone",
    author: "J.K. Rowling",
    coverUrl:
      "https://m.media-amazon.com/images/I/81iqZ2HHD-L._AC_UF1000,1000_QL80_.jpg",
    description:
      "Harry Potter discovers he's a famous wizard, enrolls in Hogwarts School of Witchcraft and Wizardry, and faces the dark wizard who killed his parents in this magical coming-of-age adventure.",
  },
  {
    id: "5",
    title: "A Game of Thrones",
    author: "George R.R. Martin",
    coverUrl:
      "https://m.media-amazon.com/images/I/91dSMhdIzTL._AC_UF1000,1000_QL80_.jpg",
    description:
      "The first book in the epic fantasy series A Song of Ice and Fire, where noble families fight for control of the Iron Throne in a land where summers span decades and winters can last a lifetime.",
  },
  {
    id: "6",
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    coverUrl:
      "https://m.media-amazon.com/images/I/710+HcoP38L._AC_UF1000,1000_QL80_.jpg",
    description:
      "Bilbo Baggins, a respectable hobbit, embarks on an unexpected adventure with a group of dwarves to reclaim their mountain home from the dragon Smaug in this beloved fantasy classic.",
  },
];

const activity = {
  data: [
    { type: "startedReading", item: "The Midnight Library", time: "Yesterday" },
    {
      type: "finishedReading",
      item: "The Philosopher's Stone",
      time: "2 days ago",
    },
    { type: "readFor", item: "45 minutes", time: "5 days ago" },
  ],
};

const Profile = () => {
  const [activeTab, setActiveTab] = useState("currently-reading");
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return <div className="p-8 text-center">Loading profile...</div>;
  }

  if (!isAuthenticated || !user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="space-y-4 animate-in fade-in zoom-in duration-500">
      <div className="flex items-center">
        <div className="flex-2/3 xl:flex-3/4 flex gap-2">
          <Avatar
            className={`w-28 h-28 ${
              user.email ? "" : "border-2 border-primary"
            }`}
          >
            <AvatarImage
              className=""
              src={`https://avatar.vercel.sh/${user.email}`}
            />
            <AvatarFallback className="bg-primary/10 text-primary text-4xl uppercase">
              {user.name?.[0] || user.email?.[0]}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 px-4">
            <h1 className="text-3xl font-serif font-medium">
              {user.name || 'Anonymous User'}
            </h1>
            <p className="text-muted-foreground capitalize mb-1">
              {user.role === 'admin' ? 'Librarian (Admin)' : 'Reader'} •{" "}
              {userStats.booksRead} books read this year
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Joined {new Date(user.createdAt || Date.now()).toLocaleDateString()} • {user.email}
            </p>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="gap-2">
                <Pen size={16} />
                <span>Edit Profile</span>
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Users size={16} />
                <span>Friends</span>
              </Button>
            </div>
          </div>
        </div>
        <div className="flex-1/3 xl:flex-1/4">
          <div className="bg-white rounded-lg p-4 shadow-sm w-full md:w-auto">
            <div className="grid grid-cols-3 gap-8">
              <div className="text-center">
                <p className="text-2xl font-medium">
                  {userStats.booksRead}
                </p>
                <p className="text-muted-foreground text-sm">Books Read</p>
              </div>
              <div className="text-center border-x border-muted/30 px-4">
                <p className="text-2xl font-medium">
                  {userStats.following}
                </p>
                <p className="text-muted-foreground text-sm">Following</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-medium">18K</p>
                <p className="text-muted-foreground text-sm">Minutes</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-2/3 xl:flex-3/4">
          {/* Book Tabs */}
          <Tabs
            defaultValue="currently-reading"
            className="w-full"
            onValueChange={setActiveTab}
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-serif font-medium">My Books</h2>
              <TabsList>
                <TabsTrigger value="currently-reading">Reading</TabsTrigger>
                <TabsTrigger value="want-to-read">Want to Read</TabsTrigger>
                <TabsTrigger value="read">Finished</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="currently-reading">
              <ProfileBooksGrid content={books} />
            </TabsContent>
          </Tabs>
        </div>
        <div className="flex-1/3 xl:flex-1/4 space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-sm space-y-2">
            <h2 className="text-lg font-medium">
              {new Date().getFullYear()} Reading Challenge
            </h2>

            <div className="space-y-2">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>
                    {userStats.booksRead} of{" "}
                    {userStats.booksGoal} books
                  </span>
                  <span className="text-primary">
                    {(
                      (userStats.booksRead /
                        userStats.booksGoal) *
                      100
                    ).toFixed()}
                    %
                  </span>
                </div>
                <Progress value={69} className="h-2" />
                <p className="text-muted-foreground text-sm">
                  {userStats.booksGoal -
                    userStats.booksRead}{" "}
                  books left to reach your goal
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>18,456 of 25,000 minutes</span>
                  <span className="text-primary">74%</span>
                </div>
                <Progress value={74} className="h-2" />
                <p className="text-muted-foreground text-sm">
                  6,544 minutes left to reach your goal
                </p>
              </div>
            </div>
          </div>
          <section className="mb-4">
            <h2 className="text-xl font-serif font-medium mb-2">
              Recent Activity
            </h2>

            <div className="space-y-2">
              {activity.data.map((a, index) => (
                <Card key={index}>
                  <CardContent className="flex gap-4 items-center">
                    <div className="bg-primary/10 rounded-full p-2 h-min">
                      <BookOpen size={20} className="text-primary" />
                    </div>
                    <div>
                      <p>
                        {a.type === "startedReading"
                          ? "Started Reading "
                          : a.type === "finishedReading"
                          ? "Finished Reading "
                          : "Read for "}
                        <span className="font-medium">{a.item}</span>
                      </p>
                      <p className="text-muted-foreground text-sm">
                        2 days ago
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Profile;
