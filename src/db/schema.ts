import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

// Users table
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone').notNull(),
  password: text('password').notNull(),
  dataBalance: real('data_balance').notNull().default(15.5),
  pivotPoints: integer('pivot_points').notNull().default(1250),
  twoFactorEnabled: integer('two_factor_enabled', { mode: 'boolean' }).notNull().default(false),
  twoFactorMethod: text('two_factor_method').notNull().default('sms'),
  udi: text('udi').unique(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// UDI Devices table
export const udiDevices = sqliteTable('udi_devices', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  type: text('type').notNull(),
  status: text('status').notNull().default('active'),
  phoneNumber: text('phone_number').notNull(),
  udiId: text('udi_id').notNull().unique(),
  dataUsed: real('data_used').notNull().default(0),
  lastConnected: text('last_connected'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Transactions table
export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  type: text('type').notNull(),
  amount: real('amount').notNull(),
  recipientPhone: text('recipient_phone'),
  recipientUdi: text('recipient_udi'),
  network: text('network'),
  fee: integer('fee').notNull(),
  cost: integer('cost'),
  validity: integer('validity'),
  status: text('status').notNull().default('completed'),
  createdAt: text('created_at').notNull(),
});

// Wallet Transactions table
export const walletTransactions = sqliteTable('wallet_transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  type: text('type').notNull(),
  amount: integer('amount').notNull(),
  description: text('description').notNull(),
  createdAt: text('created_at').notNull(),
});

// Recharge Plans table
export const rechargePlans = sqliteTable('recharge_plans', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  validity: integer('validity').notNull(),
  dataAmount: integer('data_amount').notNull(),
  dataMode: text('data_mode').notNull(),
  voiceCalls: integer('voice_calls', { mode: 'boolean' }).notNull().default(false),
  unlimitedVoice: integer('unlimited_voice', { mode: 'boolean' }).notNull().default(false),
  ottPlatforms: text('ott_platforms', { mode: 'json' }),
  totalCost: integer('total_cost').notNull(),
  pivotPointsEarned: integer('pivot_points_earned').notNull(),
  status: text('status').notNull().default('active'),
  activatedAt: text('activated_at').notNull(),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull(),
});

// Usage History table
export const usageHistory = sqliteTable('usage_history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  date: text('date').notNull(),
  gbUsed: real('gb_used').notNull(),
  primaryCategory: text('primary_category').notNull(),
  createdAt: text('created_at').notNull(),
});

// Notifications table for real-time alerts
export const notifications = sqliteTable('notifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull(), // 'data_received', 'data_sent', 'system'
  read: integer('read', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
});

// Data Transfers table for Better Auth users (string IDs)
export const dataTransfers = sqliteTable('data_transfers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  senderId: text('sender_id').notNull().references(() => user.id),
  receiverId: text('receiver_id').notNull().references(() => user.id),
  amount: real('amount').notNull(),
  fee: integer('fee').notNull().default(0),
  status: text('status').notNull().default('completed'),
  createdAt: text('created_at').notNull(),
});

// User Notifications table for Better Auth users (string IDs)
export const userNotifications = sqliteTable('user_notifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => user.id),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull(),
  read: integer('read', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
});

// User Devices table for Better Auth users (string IDs)
export const userDevices = sqliteTable('user_devices', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => user.id),
  name: text('name').notNull(),
  type: text('type').notNull(),
  status: text('status').notNull().default('active'),
  phoneNumber: text('phone_number').notNull(),
  udiId: text('udi_id').notNull().unique(),
  dataUsed: real('data_used').notNull().default(0),
  lastConnected: text('last_connected'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});


// Auth tables for better-auth
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  role: text("role").notNull().default("user"),
  phoneNumber: text("phoneNumber"),
  udi: text("udi").unique().$defaultFn(() => `UDI-${Math.random().toString(36).substring(2, 9).toUpperCase()}`),
  dataBalance: real("dataBalance").notNull().default(15.5),
  pivotPoints: integer("pivotPoints").notNull().default(1250),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});