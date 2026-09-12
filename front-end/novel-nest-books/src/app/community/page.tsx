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
import { MessageSquare, Heart, Share2, UserPlus, Users, Hash, Mic, Plus, MessageCircle, Check, X, Clock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from 'next/navigation';

function PostCard({ post, currentUserId, onUpdate }: { post: any, currentUserId?: string, onUpdate: () => void }) {
  const [isLiked, setIsLiked] = useState(() => post.likes?.some((l: any) => l.userId === currentUserId));
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  const handleLike = async () => {
    try {
      const prevLiked = isLiked;
      const prevCount = likesCount;
      setIsLiked(!prevLiked);
      setLikesCount(prevLiked ? prevCount - 1 : prevCount + 1);
      
      const res = await apiClient.togglePostLike(post.id);
      setIsLiked(res.liked);
    } catch (error) {
      toast.error('Failed to like post');
    }
  };

  const toggleComments = async () => {
    if (!showComments) {
      setShowComments(true);
      if (comments.length === 0) {
        setLoadingComments(true);
        try {
          const res = await apiClient.getPostComments(post.id);
          setComments(res);
        } catch (error) {
          toast.error('Failed to load comments');
        } finally {
          setLoadingComments(false);
        }
      }
    } else {
      setShowComments(false);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await apiClient.createPostComment(post.id, newComment);
      setComments([res, ...comments]);
      setNewComment('');
      onUpdate();
    } catch (error) {
      toast.error('Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/community?post=${post.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  return (
    <Card className="p-5 bg-background/50 backdrop-blur-sm border-white/10 space-y-4 transition-all hover:bg-background/80">
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
      <div className="pl-13 text-sm leading-relaxed">{post.content}</div>
      <div className="pl-13 flex gap-4 pt-2">
        <button 
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-xs transition-colors ${isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-primary'}`}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} /> {likesCount > 0 ? likesCount : 'Like'}
        </button>
        <button 
          onClick={toggleComments}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <MessageSquare className="w-4 h-4" /> {post.commentsCount > 0 ? post.commentsCount : 'Reply'}
        </button>
        <button 
          onClick={handleShare}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <Share2 className="w-4 h-4" /> Share
        </button>
      </div>

      {showComments && (
        <div className="pl-13 pt-4 space-y-4 border-t border-white/10 mt-4">
          <form onSubmit={handleComment} className="flex gap-2">
            <Input 
              placeholder="Write a comment..." 
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              className="bg-transparent h-9 text-sm"
            />
            <Button size="sm" type="submit" disabled={isSubmitting || !newComment.trim()}>
              Post
            </Button>
          </form>
          {loadingComments ? (
            <p className="text-xs text-muted-foreground">Loading comments...</p>
          ) : (
            <div className="space-y-3">
              {comments.map(comment => (
                <div key={comment.id} className="flex gap-2 text-sm bg-background/40 p-2 rounded-lg">
                  <Avatar className="w-6 h-6 border border-primary/20 shrink-0">
                    <AvatarImage src={comment.user?.avatarUrl || `https://avatar.vercel.sh/${comment.user?.email}`} />
                    <AvatarFallback className="text-[10px] uppercase">{comment.user?.name?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-xs">{comment.user?.name || 'Anonymous'}</p>
                    <p className="text-muted-foreground mt-0.5">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export default function CommunityPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [friendships, setFriendships] = useState<any[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [newCommunityName, setNewCommunityName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [fetchedPosts, fetchedUsers, fetchedCommunities, fetchedFriendships] = await Promise.all([
        apiClient.getPosts(),
        apiClient.getUsers(),
        apiClient.getCommunities().catch(() => []),
        apiClient.getFriendships().catch(() => [])
      ]);
      
      setPosts(fetchedPosts || []);
      setUsers(fetchedUsers || []);
      setCommunities(fetchedCommunities || []);
      setFriendships(fetchedFriendships || []);
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
      fetchData();
    } catch (error) {
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
      toast.success('Follow request sent'); 
    }
  };

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommunityName.trim()) return;
    try {
      const comm = await apiClient.createCommunity(newCommunityName, "A custom community");
      await apiClient.createCommunityChannel(comm.id, "general", "General discussion", "text");
      await apiClient.createCommunityChannel(comm.id, "Voice Lounge", "Hangout", "voice");
      toast.success('Community created!');
      setNewCommunityName('');
      fetchData();
    } catch (error) {
      toast.error('Failed to create community');
    }
  };

  const handleSendFriendRequest = async (targetUserId: string) => {
    try {
      await apiClient.sendFriendRequest(targetUserId);
      toast.success('Friend request sent!');
      fetchData();
    } catch (error) {
      toast.error('Failed to send friend request');
    }
  };

  const handleRespondFriendRequest = async (friendshipId: string, action: 'accepted' | 'rejected') => {
    try {
      await apiClient.updateFriendRequest(friendshipId, action);
      toast.success(`Friend request ${action}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update request');
    }
  };

  const handleMessageUser = async (targetUserId: string) => {
    try {
      const channel = await apiClient.startDirectMessage(targetUserId);
      router.push(`/messages?channelId=${channel.id}`);
    } catch (error) {
      toast.error('Failed to start conversation');
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <PageTitle title="Community & Friends" icon={<Users size={24} />} />

      <Tabs defaultValue="feed" className="flex-1 flex flex-col h-[calc(100vh-140px)]">
        <TabsList className="w-full justify-start border-b border-border bg-transparent rounded-none h-auto p-0 mb-6">
          <TabsTrigger value="feed" className="data-[state=active]:bg-primary/10 rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary px-6 py-3">Global Feed</TabsTrigger>
          <TabsTrigger value="members" className="data-[state=active]:bg-primary/10 rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary px-6 py-3">Members</TabsTrigger>
          <TabsTrigger value="communities" className="data-[state=active]:bg-primary/10 rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary px-6 py-3">Custom Communities</TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="flex-1 flex flex-col lg:flex-row gap-8 m-0 p-0 h-full">
          {/* Main Feed */}
          <div className="flex-1 flex flex-col space-y-6 h-full">
            <Card className="p-4 bg-background/50 backdrop-blur-sm border-white/10 shrink-0">
              <form onSubmit={handleCreatePost} className="flex gap-4 items-start">
                <Avatar className="w-10 h-10 border border-primary/20">
                  <AvatarImage src={user?.avatarUrl || `https://avatar.vercel.sh/${user?.email}`} />
                  <AvatarFallback className="uppercase">{user?.name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <Input
                    placeholder="Share your thoughts on a book..."
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

            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4 pb-12">
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading feed...</div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-12 bg-background/30 rounded-xl border border-white/10">
                    <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-serif">No posts yet</h3>
                  </div>
                ) : (
                  posts.map((post) => (
                    <PostCard key={post.id} post={post} currentUserId={user?.id} onUpdate={fetchData} />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Find Friends Sidebar */}
          <div className="w-full lg:w-80 flex flex-col space-y-4 shrink-0 h-full">
            <h3 className="font-serif text-xl">Find Friends</h3>
            <ScrollArea className="h-full pr-4">
              <div className="space-y-3 pb-12">
                {users.filter(u => u.id !== user?.id).map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-white/10 hover:bg-background/80 transition-colors">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Avatar className="w-9 h-9">
                        <AvatarImage src={u.avatarUrl || `https://avatar.vercel.sh/${u.email}`} />
                        <AvatarFallback className="uppercase">{u.name?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="truncate">
                        <p className="font-medium text-sm truncate">{u.name || 'User'}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0 rounded-full hover:bg-primary" onClick={() => handleSendFriendRequest(u.id)}>
                      <UserPlus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="members" className="flex-1 flex flex-col gap-6 m-0 p-0 h-full">
          <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
            <h2 className="text-2xl font-serif font-bold">Community Members</h2>
            <p className="text-muted-foreground">Connect with fellow readers. Send friend requests or drop them a message.</p>
          </div>
          
          <ScrollArea className="h-full pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
              {users.filter(u => u.id !== user?.id).map((u) => {
                const friendship = friendships.find(f => (f.user1Id === u.id && f.user2Id === user?.id) || (f.user2Id === u.id && f.user1Id === user?.id) || (f.senderId === u.id && f.receiverId === user?.id) || (f.receiverId === u.id && f.senderId === user?.id));
                const status = friendship?.status;
                
                // Account for the two different ways the API might return the IDs (nested or flat depending on if it's the raw query or mapped)
                const senderId = friendship?.senderId || friendship?.user1Id;
                
                const isFriend = status === 'accepted';
                const isPendingSent = status === 'pending' && senderId === user?.id;
                const isPendingReceived = status === 'pending' && senderId !== user?.id;

                return (
                  <Card key={u.id} className="p-5 flex flex-col items-center text-center hover:border-primary/50 transition-colors">
                    <Avatar className="w-20 h-20 border-2 border-primary/20 mb-4">
                      <AvatarImage src={u.avatarUrl || `https://avatar.vercel.sh/${u.email}`} />
                      <AvatarFallback className="text-2xl uppercase">{u.name?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    <h3 className="font-bold text-lg mb-1">{u.name}</h3>
                    <p className="text-sm text-muted-foreground mb-6 line-clamp-1">{u.email}</p>
                    
                    <div className="mt-auto w-full flex flex-col gap-2">
                      {isFriend ? (
                        <Button className="w-full gap-2" variant="default" onClick={() => handleMessageUser(u.id)}>
                          <MessageCircle className="w-4 h-4" /> Message
                        </Button>
                      ) : isPendingSent ? (
                        <Button className="w-full gap-2" variant="secondary" disabled>
                          <Clock className="w-4 h-4" /> Request Sent
                        </Button>
                      ) : isPendingReceived ? (
                        <div className="flex gap-2">
                          <Button className="flex-1 gap-1" variant="default" size="sm" onClick={() => handleRespondFriendRequest(friendship.id, 'accepted')}>
                            <Check className="w-4 h-4" /> Accept
                          </Button>
                          <Button className="flex-1 gap-1" variant="destructive" size="sm" onClick={() => handleRespondFriendRequest(friendship.id, 'rejected')}>
                            <X className="w-4 h-4" /> Decline
                          </Button>
                        </div>
                      ) : (
                        <Button className="w-full gap-2" variant="outline" onClick={() => handleSendFriendRequest(u.id)}>
                          <UserPlus className="w-4 h-4" /> Add Friend
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
              {users.length <= 1 && (
                <div className="col-span-full py-20 text-center text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No other members found in the community yet.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="communities" className="flex-1 flex flex-col gap-6 m-0 p-0 h-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-xl border border-border shadow-sm">
            <div>
              <h2 className="text-2xl font-serif font-bold">Custom Communities</h2>
              <p className="text-muted-foreground">Join or create private and public spaces with integrated Voice and Text channels.</p>
            </div>
            <form onSubmit={handleCreateCommunity} className="flex gap-2">
              <Input 
                placeholder="Community Name" 
                value={newCommunityName}
                onChange={e => setNewCommunityName(e.target.value)}
                className="w-full sm:w-64"
              />
              <Button type="submit" disabled={!newCommunityName.trim()} className="gap-2">
                <Plus className="w-4 h-4" /> Create
              </Button>
            </form>
          </div>

          <ScrollArea className="h-full pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
              {communities.map((comm) => (
                <Card key={comm.id} className="overflow-hidden hover:border-primary/50 transition-all group">
                  <div className="h-24 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 w-full"></div>
                  <div className="p-6 relative">
                    <div className="absolute -top-10 left-6 w-16 h-16 rounded-xl bg-background border-2 border-border flex items-center justify-center shadow-sm">
                      <Users className="w-8 h-8 text-primary" />
                    </div>
                    <div className="mt-8">
                      <h3 className="text-xl font-bold">{comm.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{comm.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      <div className="px-3 py-1 bg-secondary rounded-full text-xs flex items-center gap-1.5">
                        <Hash className="w-3 h-3 text-emerald-500" /> general
                      </div>
                      <div className="px-3 py-1 bg-secondary rounded-full text-xs flex items-center gap-1.5">
                        <Mic className="w-3 h-3 text-purple-500" /> Voice Lounge
                      </div>
                    </div>
                    <Button className="w-full mt-6" variant="outline">Join Community</Button>
                  </div>
                </Card>
              ))}
              {communities.length === 0 && (
                <div className="col-span-full py-20 text-center text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No communities found. Be the first to create one!</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
