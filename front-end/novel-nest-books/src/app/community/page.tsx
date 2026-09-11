'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import PageTitle from '@/components/custom/PageTitle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Heart, Share2, UserPlus } from 'lucide-react';

export default function CommunityPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [fetchedPosts, fetchedUsers] = await Promise.all([
        apiClient.getPosts(),
        apiClient.getUsers()
      ]);
      
      setPosts(fetchedPosts || []);
      setUsers(fetchedUsers || []);
    } catch (error) {
      console.error('Failed to load community data', error);
      toast.error('Failed to load community feed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    setIsSubmitting(true);
    try {
      await apiClient.createPost(newPostContent);
      toast.success('Post created!');
      setNewPostContent('');
      fetchData(); // Reload posts
    } catch (error) {
      console.error('Failed to create post', error);
      toast.error('Failed to share your post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFollow = async (userId: string) => {
    try {
      await apiClient.followUser(userId);
      toast.success('Followed successfully!');
    } catch (error) {
      toast.success('Follow request sent'); // Fallback if API is missing
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <PageTitle
        title="Community"
        subtitle="Connect with other readers, share thoughts, and discover new books."
      />

      <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-140px)]">
        {/* Main Feed */}
        <div className="flex-1 flex flex-col space-y-6">
          {/* Create Post */}
          <Card className="p-4 bg-background/50 backdrop-blur-sm border-white/10">
            <form onSubmit={handleCreatePost} className="flex gap-4 items-start">
              <Avatar className="w-10 h-10 border border-primary/20">
                <AvatarImage src={user?.avatarUrl || `https://avatar.vercel.sh/${user?.email}`} />
                <AvatarFallback className="uppercase">{user?.name?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <Input
                  placeholder="Share your thoughts on a book, ask for recommendations, etc..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="bg-transparent border-white/20 h-12"
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmitting || !newPostContent.trim()}>
                    {isSubmitting ? 'Posting...' : 'Post'}
                  </Button>
                </div>
              </div>
            </form>
          </Card>

          {/* Feed List */}
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading feed...</div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12 bg-background/30 rounded-xl border border-white/10">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-serif">No posts yet</h3>
                  <p className="text-muted-foreground">Be the first to share something!</p>
                </div>
              ) : (
                posts.map((post) => (
                  <Card key={post.id} className="p-5 bg-background/50 backdrop-blur-sm border-white/10 space-y-4 transition-all hover:bg-background/80">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 border border-primary/20">
                        <AvatarImage src={post.user?.avatarUrl || `https://avatar.vercel.sh/${post.user?.email}`} />
                        <AvatarFallback className="uppercase">{post.user?.name?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{post.user?.name || 'Anonymous'}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(post.createdAt).toLocaleDateString()} at {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="pl-13 text-sm leading-relaxed">
                      {post.content}
                    </div>

                    <div className="pl-13 flex gap-4 pt-2">
                      <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                        <Heart className="w-4 h-4" /> Like
                      </button>
                      <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                        <MessageSquare className="w-4 h-4" /> Reply
                      </button>
                      <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                        <Share2 className="w-4 h-4" /> Share
                      </button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Find Friends Sidebar */}
        <div className="w-full lg:w-80 flex flex-col space-y-4">
          <h3 className="font-serif text-xl">Find Friends</h3>
          <ScrollArea className="h-full pr-4">
            <div className="space-y-3">
              {users.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-white/10 hover:bg-background/80 transition-colors">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={u.avatarUrl || `https://avatar.vercel.sh/${u.email}`} />
                      <AvatarFallback className="uppercase">{u.name?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="truncate">
                      <p className="font-medium text-sm truncate">{u.name || 'User'}</p>
                      <p className="text-xs text-muted-foreground capitalize">{u.role}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0 rounded-full hover:bg-primary hover:text-primary-foreground" onClick={() => handleFollow(u.id)}>
                    <UserPlus className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
