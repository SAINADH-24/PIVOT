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