import { supabase } from './supabase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

class ApiClient {
  private baseURL: string;
  private _token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    if (typeof window !== 'undefined') {
      this._token = localStorage.getItem('token');
    }
  }

  get token() {
    if (typeof window !== 'undefined' && !this._token) {
      this._token = localStorage.getItem('token');
    }
    return this._token;
  }

  setToken(token: string) {
    this._token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  clearToken() {
    this._token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Always get the freshest token from Supabase instead of stale localStorage
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token || this.token; // Fallback to legacy token if needed

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    
    // Set token for legacy api compatibility
    if (data.session) {
      this.setToken(data.session.access_token);
    }
    
    return {
      user: data.user,
      token: data.session?.access_token,
    };
  }

  async register(email: string, password: string, name: string, role: string) {
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: { name, role },
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/welcome` : undefined
      }
    });
    if (error) throw new Error(error.message);
    return { user: data.user, session: data.session };
  }

  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return null;
      
      // Fetch extended user profile from DB
      const dbUser = await this.request<any>('/user/me');
      return dbUser;
    } catch {
      return null;
    }
  }

  async logout() {
    this.clearToken();
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
    return { message: 'Logged out successfully' };
  }

  // --- Users ---
  async getUsers() {
    return this.request<any[]>('/users');
  }

  async updateProfile(data: { name?: string; avatarUrl?: string; role?: string }) {
    return this.request<any>('/user/update', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // --- Posts ---
  async getPosts() {
    return this.request<any[]>('/posts');
  }

  async createPost(content: string) {
    return this.request<any>('/posts', {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  // Books endpoints
  async getBooks() {
    return this.request<any[]>('/books');
  }

  async getBook(id: string) {
    return this.request<any>(`/books/${id}`);
  }

  async createBook(book: any) {
    return this.request<any>('/books', {
      method: 'POST',
      body: JSON.stringify(book),
    });
  }

  async updateBook(id: string, book: any) {
    return this.request<any>(`/books/${id}`, {
      method: 'PUT',
      body: JSON.stringify(book),
    });
  }

  async deleteBook(id: string) {
    return this.request<void>(`/books/${id}`, { method: 'DELETE' });
  }

  // Messages endpoints
  async getChannels() {
    return this.request<any[]>('/messages/channels');
  }

  async getChannelMessages(channelId: string) {
    return this.request<any[]>(`/messages/channel/${channelId}`);
  }

  async sendMessage(channelId: string, content: string) {
    return this.request<any>('/messages/send', {
      method: 'POST',
      body: JSON.stringify({ channelId, content }),
    });
  }

  async editMessage(messageId: string, content: string) {
    return this.request<any>(`/messages/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  }

  async deleteMessage(messageId: string) {
    return this.request<void>(`/messages/${messageId}`, { method: 'DELETE' });
  }

  async addReaction(messageId: string, emoji: string) {
    return this.request<any>(`/messages/${messageId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    });
  }

  // Relationships endpoints
  async getFollowers() {
    return this.request<any[]>('/relationships/followers');
  }

  async getFollowing() {
    return this.request<any[]>('/relationships/following');
  }

  async followUser(userId: string) {
    return this.request<any>('/relationships/follow', {
      method: 'POST',
      body: JSON.stringify({ following_id: userId }),
    });
  }

  async unfollowUser(userId: string) {
    return this.request<void>('/relationships/unfollow', {
      method: 'DELETE',
      body: JSON.stringify({ following_id: userId }),
    });
  }

  // User management endpoints
  async requestPasswordReset(email: string) {
    return this.request<{ message: string }>('/user/request-password-reset', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resendEmailVerification(email: string) {
    return this.request<{ message: string }>('/user/resend-email-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // Voice channel endpoints
  async getVoiceChannels() {
    return this.request<any[]>('/channel');
  }

  async getVoiceChannel(channelId: string) {
    return this.request<any>(`/channel/${channelId}`);
  }

  async joinVoiceChannel(channelId: string, userId: string) {
    return this.request<any>(`/channel/${channelId}/join`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    });
  }

  async leaveVoiceChannel(channelId: string, userId: string) {
    return this.request<any>(`/channel/${channelId}/leave`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    });
  }

  async createVoiceChannel(channel: { name: string; description?: string; is_private?: boolean; max_users?: number }) {
    return this.request<any>('/channel', {
      method: 'POST',
      body: JSON.stringify(channel),
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);