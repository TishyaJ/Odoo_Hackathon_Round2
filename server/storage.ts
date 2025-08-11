import {
  users,
  products,
  categories,
  bookings,
  productPricing,
  notifications,
  lateFees,
  durationOptions,
  statusConfig,
  businessConfig,
  type User,
  type UpsertUser,
  type Product,
  type Category,
  type Booking,
  type ProductPricing,
  type Notification,
  type DurationOption,
  type StatusConfig,
  type BusinessConfig,
  type InsertProduct,
  type InsertBooking,
  type InsertProductPricing,
  type InsertNotification,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, asc, sql, ilike, or } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Category operations
  getCategories(): Promise<Category[]>;
  
  // Product operations
  getProducts(filters?: {
    categoryId?: string;
    searchQuery?: string;
    minPrice?: number;
    maxPrice?: number;
    location?: string;
    availability?: string;
    ownerId?: string;
  }): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  
  // Product pricing operations
  getProductPricing(productId: string): Promise<ProductPricing[]>;
  createProductPricing(pricing: InsertProductPricing): Promise<ProductPricing>;
  updateProductPricing(id: string, pricing: Partial<InsertProductPricing>): Promise<ProductPricing>;
  
  // Booking operations
  getBookings(filters?: {
    customerId?: string;
    productId?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Booking[]>;
  getBooking(id: string): Promise<Booking | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: string, booking: Partial<InsertBooking>): Promise<Booking>;
  checkAvailability(productId: string, startDate: Date, endDate: Date, excludeBookingId?: string): Promise<boolean>;
  
  // Late fees operations
  calculateLateFees(bookingId: string): Promise<number>;
  getLateBookings(): Promise<Booking[]>;
  
  // Notification operations
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<void>;
  
  // Configuration operations
  getDurationOptions(): Promise<DurationOption[]>;
  getStatusConfig(): Promise<StatusConfig[]>;
  getBusinessConfig(key?: string): Promise<BusinessConfig[]>;
  updateBusinessConfig(key: string, value: string): Promise<BusinessConfig>;
  
  // Analytics operations
  getAdminStats(): Promise<{
    activeRentals: number;
    lateReturns: number;
    monthlyRevenue: number;
    pendingPickups: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db
      .select()
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(asc(categories.name));
  }

  // Product operations
  async getProducts(filters?: {
    categoryId?: string;
    searchQuery?: string;
    minPrice?: number;
    maxPrice?: number;
    location?: string;
    availability?: string;
    ownerId?: string;
  }): Promise<Product[]> {
    const conditions = [eq(products.isActive, true)];
    
    if (filters) {
      if (filters.categoryId) {
        conditions.push(eq(products.categoryId, filters.categoryId));
      }
      
      if (filters.searchQuery) {
        conditions.push(
          or(
            ilike(products.name, `%${filters.searchQuery}%`),
            ilike(products.description, `%${filters.searchQuery}%`)
          )!
        );
      }
      
      if (filters.location) {
        conditions.push(ilike(products.location, `%${filters.location}%`));
      }
      
      if (filters.ownerId) {
        conditions.push(eq(products.ownerId, filters.ownerId));
      }
    }
    
    return await db.select()
      .from(products)
      .where(and(...conditions))
      .orderBy(desc(products.createdAt));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.update(products).set({ isActive: false }).where(eq(products.id, id));
  }

  // Product pricing operations
  async getProductPricing(productId: string): Promise<ProductPricing[]> {
    return await db
      .select()
      .from(productPricing)
      .where(and(eq(productPricing.productId, productId), eq(productPricing.isActive, true)));
  }

  async createProductPricing(pricing: InsertProductPricing): Promise<ProductPricing> {
    const [newPricing] = await db.insert(productPricing).values(pricing).returning();
    return newPricing;
  }

  async updateProductPricing(id: string, pricing: Partial<InsertProductPricing>): Promise<ProductPricing> {
    const [updatedPricing] = await db
      .update(productPricing)
      .set(pricing)
      .where(eq(productPricing.id, id))
      .returning();
    return updatedPricing;
  }

  // Booking operations
  async getBookings(filters?: {
    customerId?: string;
    productId?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Booking[]> {
    const conditions = [];
    
    if (filters) {
      if (filters.customerId) {
        conditions.push(eq(bookings.customerId, filters.customerId));
      }
      
      if (filters.productId) {
        conditions.push(eq(bookings.productId, filters.productId));
      }
      
      if (filters.status) {
        conditions.push(eq(bookings.status, filters.status as any));
      }
      
      if (filters.startDate) {
        conditions.push(gte(bookings.startDate, filters.startDate));
      }
      
      if (filters.endDate) {
        conditions.push(lte(bookings.endDate, filters.endDate));
      }
    }
    
    if (conditions.length > 0) {
      return await db.select()
        .from(bookings)
        .where(and(...conditions))
        .orderBy(desc(bookings.createdAt));
    } else {
      return await db.select()
        .from(bookings)
        .orderBy(desc(bookings.createdAt));
    }
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const [newBooking] = await db.insert(bookings).values(booking).returning();
    return newBooking;
  }

  async updateBooking(id: string, booking: Partial<InsertBooking>): Promise<Booking> {
    const [updatedBooking] = await db
      .update(bookings)
      .set({ ...booking, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
    return updatedBooking;
  }

  async checkAvailability(productId: string, startDate: Date, endDate: Date, excludeBookingId?: string): Promise<boolean> {
    const conditions = [
      eq(bookings.productId, productId),
      or(
        and(gte(bookings.startDate, startDate), lte(bookings.startDate, endDate)),
        and(gte(bookings.endDate, startDate), lte(bookings.endDate, endDate)),
        and(lte(bookings.startDate, startDate), gte(bookings.endDate, endDate))
      )
    ];
    
    if (excludeBookingId) {
      conditions.push(sql`${bookings.id} != ${excludeBookingId}`);
    }
    
    const conflictingBookings = await db
      .select()
      .from(bookings)
      .where(and(...conditions));
    
    return conflictingBookings.length === 0;
  }

  // Late fees operations
  async calculateLateFees(bookingId: string): Promise<number> {
    const booking = await this.getBooking(bookingId);
    if (!booking || booking.status !== 'late') return 0;
    
    const today = new Date();
    const endDate = new Date(booking.endDate);
    const daysLate = Math.floor((today.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLate <= 0) return 0;
    
    // Get late fee rate from business config (default 5%)
    const [config] = await this.getBusinessConfig('late_fee_rate');
    const lateFeeRate = config ? parseFloat(config.value) : 5;
    
    const dailyFee = (parseFloat(booking.basePrice) * lateFeeRate) / 100;
    return dailyFee * daysLate;
  }

  async getLateBookings(): Promise<Booking[]> {
    const today = new Date();
    return await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.status, 'active' as any),
          lte(bookings.endDate, today)
        )
      );
  }

  // Notification operations
  async getNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationRead(id: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  }

  // Configuration operations
  async getDurationOptions(): Promise<DurationOption[]> {
    return await db
      .select()
      .from(durationOptions)
      .where(eq(durationOptions.isActive, true))
      .orderBy(asc(durationOptions.sortOrder));
  }

  async getStatusConfig(): Promise<StatusConfig[]> {
    return await db
      .select()
      .from(statusConfig)
      .where(eq(statusConfig.isActive, true));
  }

  async getBusinessConfig(key?: string): Promise<BusinessConfig[]> {
    if (key) {
      return await db.select().from(businessConfig).where(eq(businessConfig.key, key));
    }
    return await db.select().from(businessConfig);
  }

  async updateBusinessConfig(key: string, value: string): Promise<BusinessConfig> {
    const [config] = await db
      .insert(businessConfig)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: businessConfig.key,
        set: { value, updatedAt: new Date() },
      })
      .returning();
    return config;
  }

  // Analytics operations
  async getAdminStats(): Promise<{
    activeRentals: number;
    lateReturns: number;
    monthlyRevenue: number;
    pendingPickups: number;
  }> {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Active rentals
    const [{ count: activeRentals }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookings)
      .where(eq(bookings.status, 'active' as any));
    
    // Late returns
    const [{ count: lateReturns }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookings)
      .where(
        and(
          eq(bookings.status, 'active' as any),
          lte(bookings.endDate, today)
        )
      );
    
    // Monthly revenue
    const [{ revenue }] = await db
      .select({ revenue: sql<number>`COALESCE(SUM(${bookings.totalAmount}), 0)` })
      .from(bookings)
      .where(
        and(
          gte(bookings.createdAt, monthStart),
          lte(bookings.createdAt, today)
        )
      );
    
    // Pending pickups (next 24 hours)
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const [{ count: pendingPickups }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookings)
      .where(
        and(
          eq(bookings.status, 'confirmed' as any),
          gte(bookings.startDate, today),
          lte(bookings.startDate, tomorrow)
        )
      );
    
    return {
      activeRentals: Number(activeRentals),
      lateReturns: Number(lateReturns),
      monthlyRevenue: Number(revenue),
      pendingPickups: Number(pendingPickups),
    };
  }
}

export const storage = new DatabaseStorage();
