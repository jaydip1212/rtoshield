/**
 * Drizzle schema (typed mirror of supabase/migrations/0001_init.sql).
 * Use `npm run db:push` to sync, or run the SQL migration directly in Supabase.
 */
import {
	pgTable,
	uuid,
	text,
	integer,
	numeric,
	boolean,
	timestamp,
	jsonb,
} from "drizzle-orm/pg-core"

export const organizations = pgTable("organizations", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	salt: text("salt").notNull(),
	retentionDays: integer("retention_days").notNull().default(365),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const users = pgTable("users", {
	id: uuid("id").primaryKey().defaultRandom(),
	orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
	authUserId: uuid("auth_user_id").unique(),
	email: text("email").notNull(),
	role: text("role").notNull().default("member"),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const stores = pgTable("stores", {
	id: uuid("id").primaryKey().defaultRandom(),
	orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
	platform: text("platform").notNull(),
	name: text("name"),
	domain: text("domain"),
	encryptedToken: text("encrypted_token"),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const apiKeys = pgTable("api_keys", {
	id: uuid("id").primaryKey().defaultRandom(),
	orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
	name: text("name"),
	hashedKey: text("hashed_key").notNull(),
	publicKey: text("public_key").notNull().unique(),
	scopes: text("scopes").array().notNull().default([]),
	lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const customers = pgTable("customers", {
	id: uuid("id").primaryKey().defaultRandom(),
	orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
	phoneHash: text("phone_hash"),
	emailHash: text("email_hash"),
	addressHash: text("address_hash"),
	successfulDeliveries: integer("successful_deliveries").notNull().default(0),
	rtoCount: integer("rto_count").notNull().default(0),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const orders = pgTable("orders", {
	id: uuid("id").primaryKey().defaultRandom(),
	orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
	storeId: uuid("store_id").references(() => stores.id, { onDelete: "set null" }),
	customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
	externalId: text("external_id"),
	paymentMethod: text("payment_method").notNull(),
	total: numeric("total").notNull().default("0"),
	currency: text("currency").notNull().default("INR"),
	pincode: text("pincode"),
	city: text("city"),
	addressComplete: boolean("address_complete").notNull().default(true),
	status: text("status").notNull().default("received"),
	verified: boolean("verified").notNull().default(false),
	utm: jsonb("utm"),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const riskDecisions = pgTable("risk_decisions", {
	id: uuid("id").primaryKey().defaultRandom(),
	orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
	orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
	score: integer("score").notNull(),
	level: text("level").notNull(),
	reasons: jsonb("reasons").notNull().default([]),
	recommendedAction: text("recommended_action").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

// NOTE: order_events, device_signals, risk_rules, rto_cases, documents,
// document_chunks, embeddings, agent_actions, verification_messages and
// audit_logs are defined in the SQL migration. Add Drizzle definitions here as
// you start querying them via the ORM.
