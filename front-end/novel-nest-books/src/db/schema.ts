import { pgTable, text, timestamp, uuid, boolean, integer, foreignKey } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  role: text('role').default('user').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const books = pgTable('books', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  author: text('author').notNull(),
  description: text('description'),
  coverImage: text('cover_image'),
  source: text('source'),
  language: text('language'),
  pdfUrl: text('pdf_url'),
  addedBy: uuid('added_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const bookmarks = pgTable('bookmarks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  bookId: uuid('book_id').notNull().references(() => books.id),
  page: integer('page').default(0),
  progress: integer('progress').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const relationships = pgTable('relationships', {
  id: uuid('id').primaryKey().defaultRandom(),
  followerId: uuid('follower_id').notNull().references(() => users.id),
  followingId: uuid('following_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const channels = pgTable('channels', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  type: text('type').default('text'), // 'text' or 'voice'
  bookId: uuid('book_id').references(() => books.id),
  communityId: uuid('community_id'), // Added for Custom Communities
  isPrivate: boolean('is_private').default(false),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  content: text('content').notNull(),
  channelId: uuid('channel_id').notNull().references(() => channels.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  content: text('content').notNull(),
  userId: uuid('user_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const postLikes = pgTable('post_likes', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id').notNull().references(() => posts.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const postComments = pgTable('post_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  content: text('content').notNull(),
  postId: uuid('post_id').notNull().references(() => posts.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

import { relations } from 'drizzle-orm';

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  postLikes: many(postLikes),
  postComments: many(postComments),
  messages: many(messages),
  channels: many(channels),
}));

export const channelsRelations = relations(channels, ({ one, many }) => ({
  creator: one(users, {
    fields: [channels.createdBy],
    references: [users.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  channel: one(channels, {
    fields: [messages.channelId],
    references: [channels.id],
  }),
  user: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  user: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
  likes: many(postLikes),
  comments: many(postComments),
}));

export const postLikesRelations = relations(postLikes, ({ one }) => ({
  post: one(posts, {
    fields: [postLikes.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [postLikes.userId],
    references: [users.id],
  }),
}));

export const postCommentsRelations = relations(postComments, ({ one }) => ({
  post: one(posts, {
    fields: [postComments.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [postComments.userId],
    references: [users.id],
  }),
}));

export const systemSettings = pgTable('system_settings', {
  key: text('key').primaryKey(),
  value: boolean('value').default(true).notNull(),
});

export const communities = pgTable('communities', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  ownerId: uuid('owner_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const communityMembers = pgTable('community_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  communityId: uuid('community_id').notNull().references(() => communities.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

export const tournaments = pgTable('tournaments', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  creatorId: uuid('creator_id').notNull().references(() => users.id),
  status: text('status').default('pending').notNull(), // pending, active, completed
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const tournamentParticipants = pgTable('tournament_participants', {
  id: uuid('id').primaryKey().defaultRandom(),
  tournamentId: uuid('tournament_id').notNull().references(() => tournaments.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

export const chessMatches = pgTable('chess_matches', {
  id: uuid('id').primaryKey().defaultRandom(),
  tournamentId: uuid('tournament_id').references(() => tournaments.id),
  player1Id: uuid('player1_id').notNull().references(() => users.id),
  player2Id: uuid('player2_id').notNull().references(() => users.id),
  pgn: text('pgn'), // standard chess notation
  fen: text('fen'), // current board state
  status: text('status').default('active').notNull(), // active, completed, drawn, abandoned
  winnerId: uuid('winner_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const prizeClaims = pgTable('prize_claims', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  itemDescription: text('item_description').notNull(),
  shippingAddress: text('shipping_address').notNull(),
  status: text('status').default('pending').notNull(), // pending, shipped
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
