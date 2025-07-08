import { pgTable, serial, text, timestamp, integer, boolean, decimal } from 'drizzle-orm/pg-core';

export const bankAccountsTable = pgTable('bank_accounts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  entityId: integer('entity_id'),
  accessToken: text('access_token').notNull(),
  itemId: text('item_id').notNull(),
  accountId: text('account_id').notNull(),
  accountName: text('account_name').notNull(),
  accountType: text('account_type').notNull(),
  accountSubtype: text('account_subtype'),
  institutionName: text('institution_name').notNull(),
  institutionId: text('institution_id').notNull(),
  mask: text('mask'),
  currentBalance: decimal('current_balance', { precision: 15, scale: 2 }),
  availableBalance: decimal('available_balance', { precision: 15, scale: 2 }),
  isActive: boolean('is_active').default(true),
  lastUpdated: timestamp('last_updated').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const transactionsTable = pgTable('transactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  bankAccountId: integer('bank_account_id').notNull(),
  entityId: integer('entity_id'),
  propertyId: integer('property_id'),
  plaidTransactionId: text('plaid_transaction_id').notNull().unique(),
  accountId: text('account_id').notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  date: text('date').notNull(),
  name: text('name').notNull(),
  merchantName: text('merchant_name'),
  category: text('category').array(),
  subcategory: text('subcategory'),
  transactionType: text('transaction_type'),
  pending: boolean('pending').default(false),
  accountOwner: text('account_owner'),
  location: text('location'),
  paymentMeta: text('payment_meta'),
  isPropertyRelated: boolean('is_property_related').default(false),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type BankAccount = typeof bankAccountsTable.$inferSelect;
export type Transaction = typeof transactionsTable.$inferSelect;
export type NewBankAccount = typeof bankAccountsTable.$inferInsert;
export type NewTransaction = typeof transactionsTable.$inferInsert;