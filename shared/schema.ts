import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Enums
export const userRoleEnum = pgEnum('user_role', ['customer', 'admin']);
export const bookingStatusEnum = pgEnum('booking_status', ['reserved', 'confirmed', 'pickup', 'active', 'returned', 'late', 'cancelled']);
export const durationTypeEnum = pgEnum('duration_type', ['hourly', 'daily', 'weekly', 'monthly']);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default('customer'),
  customerType: varchar("customer_type"), // 'lister' or 'renter'
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Categories
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  icon: varchar("icon", { length: 50 }),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Duration configuration
export const durationOptions = pgTable("duration_options", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: durationTypeEnum("type").notNull(),
  label: varchar("label", { length: 50 }).notNull(),
  multiplier: decimal("multiplier", { precision: 10, scale: 2 }).notNull(), // Hours multiplier
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }).default('0'),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
});

// Status configuration with colors
export const statusConfig = pgTable("status_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  status: bookingStatusEnum("status").unique().notNull(),
  label: varchar("label", { length: 50 }).notNull(),
  color: varchar("color", { length: 7 }).notNull(), // Hex color
  icon: varchar("icon", { length: 50 }),
  description: text("description"),
  isActive: boolean("is_active").default(true),
});

// Business configuration
export const businessConfig = pgTable("business_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key", { length: 100 }).unique().notNull(),
  value: text("value").notNull(),
  dataType: varchar("data_type", { length: 20 }).default('string'), // string, number, boolean, json
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Products
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  categoryId: varchar("category_id").references(() => categories.id),
  ownerId: varchar("owner_id").references(() => users.id).notNull(),
  images: jsonb("images"), // Array of Cloudinary URLs
  location: varchar("location", { length: 200 }),
  isActive: boolean("is_active").default(true),
  quantity: integer("quantity").default(1),
  availableFrom: timestamp("available_from"),
  availableUntil: timestamp("available_until"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Product pricing rules
export const productPricing = pgTable("product_pricing", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").references(() => products.id).notNull(),
  durationType: durationTypeEnum("duration_type").notNull(),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }).default('0'),
  minDuration: integer("min_duration").default(1),
  maxDuration: integer("max_duration"),
  isActive: boolean("is_active").default(true),
});

// Bookings
export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => users.id).notNull(),
  productId: varchar("product_id").references(() => products.id).notNull(),
  status: bookingStatusEnum("status").default('reserved'),
  quantity: integer("quantity").default(1),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  actualReturnDate: timestamp("actual_return_date"),
  durationType: durationTypeEnum("duration_type").notNull(),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 }).default('0'),
  serviceFee: decimal("service_fee", { precision: 10, scale: 2 }).default('0'),
  lateFee: decimal("late_fee", { precision: 10, scale: 2 }).default('0'),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  stripePaymentIntentId: varchar("stripe_payment_intent_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Late fees tracking
export const lateFees = pgTable("late_fees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").references(() => bookings.id).notNull(),
  daysLate: integer("days_late").notNull(),
  dailyRate: decimal("daily_rate", { precision: 5, scale: 2 }).notNull(), // Percentage
  feeAmount: decimal("fee_amount", { precision: 10, scale: 2 }).notNull(),
  isPaid: boolean("is_paid").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  relatedId: varchar("related_id"), // booking_id, product_id, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  products: many(products),
  bookings: many(bookings),
  notifications: many(notifications),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  owner: one(users, {
    fields: [products.ownerId],
    references: [users.id],
  }),
  pricing: many(productPricing),
  bookings: many(bookings),
}));

export const productPricingRelations = relations(productPricing, ({ one }) => ({
  product: one(products, {
    fields: [productPricing.productId],
    references: [products.id],
  }),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  customer: one(users, {
    fields: [bookings.customerId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [bookings.productId],
    references: [products.id],
  }),
  lateFees: many(lateFees),
}));

export const lateFeesRelations = relations(lateFees, ({ one }) => ({
  booking: one(bookings, {
    fields: [lateFees.bookingId],
    references: [bookings.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductPricingSchema = createInsertSchema(productPricing).omit({
  id: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type ProductPricing = typeof productPricing.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type LateFee = typeof lateFees.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type DurationOption = typeof durationOptions.$inferSelect;
export type StatusConfig = typeof statusConfig.$inferSelect;
export type BusinessConfig = typeof businessConfig.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertProductPricing = z.infer<typeof insertProductPricingSchema>;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
