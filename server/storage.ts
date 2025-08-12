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
  wishlist,
  reviews,
  feedback,
  type User,
  type InsertUser,
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
  type Wishlist,
  type Review,
  type InsertReview,
  type Feedback,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, asc, sql, ilike, or } from "drizzle-orm";

export interface IStorage {
  // User operations (JWT Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  
  // Category operations
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  
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
  
  // Wishlist operations
  getWishlist(userId: string): Promise<Wishlist[]>;
  addToWishlist(userId: string, productId: string): Promise<Wishlist>;
  removeFromWishlist(userId: string, productId: string): Promise<void>;
  isInWishlist(userId: string, productId: string): Promise<boolean>;
  
  // Review operations
  getProductReviews(productId: string): Promise<Review[]>;
  getProductRating(productId: string): Promise<{ averageRating: number; totalReviews: number }>;
  createReview(review: InsertReview): Promise<Review>;
  updateReview(id: string, review: Partial<InsertReview>): Promise<Review>;
  deleteReview(id: string): Promise<void>;
  canUserReview(userId: string, productId: string): Promise<boolean>;
  
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
  getUserStats(userId: string): Promise<{
    activeRentals: number;
    lateReturns: number;
    totalSpent: number;
    totalEarned: number;
    itemsListed: number;
    joinDate: Date;
  }>;

  // Admin operations
  getAdminAnalytics(): Promise<any>;
  getAllUsers(): Promise<User[]>;
  getAllProducts(): Promise<any[]>;
  getAllBookings(): Promise<any[]>;
  getAllFeedback(): Promise<any[]>;
  banUser(userId: string): Promise<void>;
  unbanUser(userId: string): Promise<void>;
  deleteUser(userId: string): Promise<void>;
  approveProduct(productId: string): Promise<void>;
  rejectProduct(productId: string, reason: string): Promise<void>;
  deleteProduct(id: string): Promise<void>;
  replyToFeedback(feedbackId: string, reply: string): Promise<void>;
  archiveFeedback(feedbackId: string): Promise<void>;
  makeUserAdmin(userId: string): Promise<void>;
  getUserFeedback(userId: string): Promise<Feedback[]>;
  createUserFeedback(userId: string, feedbackData: any): Promise<Feedback>;
  
  // Owner analytics operations
  getOwnerAnalytics(ownerId: string): Promise<{
    totalRevenue: number;
    totalBookings: number;
    activeBookings: number;
    uniqueRenters: number;
    bookingsByLocation: Array<{ location: string; count: number; revenue: number }>;
    bookingsByCategory: Array<{ category: string; count: number; revenue: number }>;
    monthlyRevenue: Array<{ month: string; revenue: number }>;
    topProducts: Array<{ name: string; bookings: number; revenue: number }>;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
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

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
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
    console.log('🗄️ Storage: Creating product with data:', JSON.stringify(product, null, 2));
    try {
      const [newProduct] = await db.insert(products).values(product).returning();
      console.log('🗄️ Storage: Product created successfully:', newProduct.id);
      return newProduct;
    } catch (error) {
      console.error('🗄️ Storage: Error creating product:', error);
      throw error;
    }
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
    // Delete related data first (due to foreign key constraints)
    await db.delete(productPricing).where(eq(productPricing.productId, id));
    
    // Delete business config entries for this product
    await db.delete(businessConfig).where(sql`${businessConfig.key} LIKE ${`product_${id}_%`}`);
    
    // Finally delete the product
    await db.delete(products).where(eq(products.id, id));
  }

  async softDeleteProduct(id: string): Promise<void> {
    // Soft delete product and related pricing so it's hidden everywhere but retains history
    await db.update(products).set({ isActive: false, updatedAt: new Date() }).where(eq(products.id, id));
    await db.update(productPricing).set({ isActive: false }).where(eq(productPricing.productId, id));
  }

  // Product pricing operations
  async getProductPricing(productId: string): Promise<ProductPricing[]> {
    return await db
      .select()
      .from(productPricing)
      .where(and(eq(productPricing.productId, productId), eq(productPricing.isActive, true)));
  }

  async createProductPricing(pricing: InsertProductPricing): Promise<ProductPricing> {
    console.log('💰 Storage: Creating pricing with data:', JSON.stringify(pricing, null, 2));
    try {
      const [newPricing] = await db.insert(productPricing).values(pricing).returning();
      console.log('💰 Storage: Pricing created successfully:', newPricing.id);
      return newPricing;
    } catch (error) {
      console.error('💰 Storage: Error creating pricing:', error);
      throw error;
    }
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
    console.log('📅 Storage: Creating booking with data:', JSON.stringify(booking, null, 2));
    try {
      const [newBooking] = await db.insert(bookings).values(booking).returning();
      console.log('📅 Storage: Booking created successfully:', newBooking.id);
      return newBooking;
    } catch (error) {
      console.error('📅 Storage: Error creating booking:', error);
      throw error;
    }
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

  // Wishlist operations
  async getWishlist(userId: string): Promise<Wishlist[]> {
    return await db
      .select()
      .from(wishlist)
      .where(eq(wishlist.userId, userId))
      .orderBy(desc(wishlist.createdAt));
  }

  async addToWishlist(userId: string, productId: string): Promise<Wishlist> {
    const [wishlistItem] = await db.insert(wishlist).values({ userId, productId }).returning();
    return wishlistItem;
  }

  async removeFromWishlist(userId: string, productId: string): Promise<void> {
    await db.delete(wishlist).where(and(eq(wishlist.userId, userId), eq(wishlist.productId, productId)));
  }

  async isInWishlist(userId: string, productId: string): Promise<boolean> {
    const [wishlistItem] = await db.select().from(wishlist).where(and(eq(wishlist.userId, userId), eq(wishlist.productId, productId)));
    return !!wishlistItem;
  }

  // Review operations
  async getProductReviews(productId: string): Promise<Review[]> {
    return await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.productId, productId), eq(reviews.isActive, true)))
      .orderBy(desc(reviews.createdAt));
  }

  async getProductRating(productId: string): Promise<{ averageRating: number; totalReviews: number }> {
    const result = await db
      .select({
        averageRating: sql<number>`COALESCE(AVG(${reviews.rating}), 0)`,
        totalReviews: sql<number>`COUNT(*)`,
      })
      .from(reviews)
      .where(and(eq(reviews.productId, productId), eq(reviews.isActive, true)));

    return {
      averageRating: Math.round(parseFloat(result[0]?.averageRating || '0') * 10) / 10,
      totalReviews: parseInt(result[0]?.totalReviews || '0'),
    };
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    return newReview;
  }

  async updateReview(id: string, review: Partial<InsertReview>): Promise<Review> {
    const [updatedReview] = await db
      .update(reviews)
      .set({ ...review, updatedAt: new Date() })
      .where(eq(reviews.id, id))
      .returning();
    return updatedReview;
  }

  async deleteReview(id: string): Promise<void> {
    await db.update(reviews).set({ isActive: false, updatedAt: new Date() }).where(eq(reviews.id, id));
  }

  async canUserReview(userId: string, productId: string): Promise<boolean> {
    // Check if user has completed a booking for this product
    const completedBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.customerId, userId),
          eq(bookings.productId, productId),
          eq(bookings.status, 'returned')
        )
      );
    
    // Check if user already reviewed this product
    const existingReview = await db
      .select()
      .from(reviews)
      .where(
        and(
          eq(reviews.userId, userId),
          eq(reviews.productId, productId),
          eq(reviews.isActive, true)
        )
      );

    return completedBookings.length > 0 && existingReview.length === 0;
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

  // Owner analytics operations
  async getOwnerAnalytics(ownerId: string): Promise<{
    totalRevenue: number;
    totalBookings: number;
    activeBookings: number;
    uniqueRenters: number;
    bookingsByLocation: Array<{ location: string; count: number; revenue: number }>;
    bookingsByCategory: Array<{ category: string; count: number; revenue: number }>;
    monthlyRevenue: Array<{ month: string; revenue: number }>;
    topProducts: Array<{ name: string; bookings: number; revenue: number }>;
  }> {
    try {
      console.log('📊 Calculating owner analytics for:', ownerId);
      
      // Get owner's products
      const ownerProducts = await db.select().from(products).where(eq(products.ownerId, ownerId));
      const productIds = ownerProducts.map(p => p.id);
      
      if (productIds.length === 0) {
        return {
          totalRevenue: 0,
          totalBookings: 0,
          activeBookings: 0,
          uniqueRenters: 0,
          bookingsByLocation: [],
          bookingsByCategory: [],
          monthlyRevenue: [],
          topProducts: [],
        };
      }
      
      // Get all bookings for owner's products
      const ownerBookings = await db.select().from(bookings)
        .where(sql`${bookings.productId} IN (${sql.join(productIds.map(id => sql`${id}`), sql`, `)})`);
      
      // Get categories for analytics
      const categories = await db.select().from(categories);
      const categoryMap = new Map(categories.map(c => [c.id, c.name]));
      
      // Calculate basic stats
      const totalRevenue = ownerBookings.reduce((sum, b) => sum + parseFloat(b.totalAmount || '0'), 0);
      const totalBookings = ownerBookings.length;
      const activeBookings = ownerBookings.filter(b => b.status === 'active').length;
      const uniqueRenters = new Set(ownerBookings.map(b => b.customerId)).size;
      
      // Bookings by location
      const locationMap = new Map<string, { count: number; revenue: number }>();
      ownerBookings.forEach(booking => {
        const product = ownerProducts.find(p => p.id === booking.productId);
        if (product) {
          const location = product.location;
          const current = locationMap.get(location) || { count: 0, revenue: 0 };
          locationMap.set(location, {
            count: current.count + 1,
            revenue: current.revenue + parseFloat(booking.totalAmount || '0')
          });
        }
      });
      
      const bookingsByLocation = Array.from(locationMap.entries()).map(([location, data]) => ({
        location,
        count: data.count,
        revenue: data.revenue
      }));
      
      // Bookings by category
      const categoryMap2 = new Map<string, { count: number; revenue: number }>();
      ownerBookings.forEach(booking => {
        const product = ownerProducts.find(p => p.id === booking.productId);
        if (product) {
          const categoryName = categoryMap.get(product.categoryId) || 'Unknown';
          const current = categoryMap2.get(categoryName) || { count: 0, revenue: 0 };
          categoryMap2.set(categoryName, {
            count: current.count + 1,
            revenue: current.revenue + parseFloat(booking.totalAmount || '0')
          });
        }
      });
      
      const bookingsByCategory = Array.from(categoryMap2.entries()).map(([category, data]) => ({
        category,
        count: data.count,
        revenue: data.revenue
      }));
      
      // Monthly revenue (last 6 months)
      const monthlyRevenue = [];
      const today = new Date();
      for (let i = 5; i >= 0; i--) {
        const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
        const monthName = month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        
        const monthBookings = ownerBookings.filter(b => {
          const bookingDate = new Date(b.createdAt);
          return bookingDate >= month && bookingDate <= monthEnd;
        });
        
        const monthRevenue = monthBookings.reduce((sum, b) => sum + parseFloat(b.totalAmount || '0'), 0);
        monthlyRevenue.push({ month: monthName, revenue: monthRevenue });
      }
      
      // Top products by revenue
      const productMap = new Map<string, { name: string; bookings: number; revenue: number }>();
      ownerBookings.forEach(booking => {
        const product = ownerProducts.find(p => p.id === booking.productId);
        if (product) {
          const current = productMap.get(product.id) || { name: product.name, bookings: 0, revenue: 0 };
          productMap.set(product.id, {
            name: product.name,
            bookings: current.bookings + 1,
            revenue: current.revenue + parseFloat(booking.totalAmount || '0')
          });
        }
      });
      
      const topProducts = Array.from(productMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
      
      const analytics = {
        totalRevenue,
        totalBookings,
        activeBookings,
        uniqueRenters,
        bookingsByLocation,
        bookingsByCategory,
        monthlyRevenue,
        topProducts,
      };
      
      console.log('📊 Calculated owner analytics:', analytics);
      return analytics;
    } catch (error) {
      console.error('📊 Error calculating owner analytics:', error);
      return {
        totalRevenue: 0,
        totalBookings: 0,
        activeBookings: 0,
        uniqueRenters: 0,
        bookingsByLocation: [],
        bookingsByCategory: [],
        monthlyRevenue: [],
        topProducts: [],
      };
    }
  }

  async getUserStats(userId: string): Promise<{
    activeRentals: number;
    lateReturns: number;
    totalSpent: number;
    totalEarned: number;
    itemsListed: number;
    joinDate: Date;
  }> {
    try {
      console.log('📊 Calculating user stats for:', userId);
      
      // Get user's bookings as customer
      const customerBookings = await db.select().from(bookings).where(eq(bookings.customerId, userId));
      
      // Get user's products as owner
      const userProducts = await db.select().from(products).where(eq(products.ownerId, userId));
      
      // Get bookings for user's products (as owner)
      const ownerBookings = await db.select().from(bookings)
        .where(sql`${bookings.productId} IN (${sql.join(userProducts.map(p => sql`${p.id}`), sql`, `)})`);
      
      // Get user info for join date
      const user = await this.getUser(userId);
      
      // Calculate stats
      const now = new Date();
      const activeRentals = customerBookings.filter(b => 
        b.status === 'active' && new Date(b.endDate) >= now
      ).length;
      
      const lateReturns = customerBookings.filter(b => 
        b.status === 'active' && new Date(b.endDate) < now
      ).length;
      
      const totalSpent = customerBookings.reduce((sum, b) => sum + (parseFloat(b.totalAmount) || 0), 0);
      const totalEarned = ownerBookings.reduce((sum, b) => sum + (parseFloat(b.totalAmount) || 0), 0);
      const itemsListed = userProducts.length;
      
      const stats = {
        activeRentals,
        lateReturns,
        totalSpent,
        totalEarned,
        itemsListed,
        joinDate: user?.createdAt || new Date(),
      };
      
      console.log('📊 Calculated user stats:', stats);
      return stats;
    } catch (error) {
      console.error('📊 Error calculating user stats:', error);
      // Return default stats on error
      return {
        activeRentals: 0,
        lateReturns: 0,
        totalSpent: 0,
        totalEarned: 0,
        itemsListed: 0,
        joinDate: new Date(),
      };
    }
  }

  // Admin operations
  async getAdminAnalytics(): Promise<any> {
    // Placeholder for admin analytics logic
    return { message: 'Admin analytics not yet implemented' };
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getAllProducts(): Promise<any[]> {
    return await db.select().from(products);
  }

  async getAllBookings(): Promise<any[]> {
    return await db.select().from(bookings);
  }

  async getAllFeedback(): Promise<any[]> {
    return await db.select().from(feedback);
  }

  async banUser(userId: string): Promise<void> {
    await db.update(users).set({ isActive: false, updatedAt: new Date() }).where(eq(users.id, userId));
  }

  async unbanUser(userId: string): Promise<void> {
    await db.update(users).set({ isActive: true, updatedAt: new Date() }).where(eq(users.id, userId));
  }

  async deleteUser(userId: string): Promise<void> {
    // First, delete all related data for the user
    // Delete user's bookings
    await db.delete(bookings).where(eq(bookings.customerId, userId));
    
    // Delete user's products and their pricing
    const userProducts = await db.select().from(products).where(eq(products.ownerId, userId));
    for (const product of userProducts) {
      await db.delete(productPricing).where(eq(productPricing.productId, product.id));
      await db.delete(businessConfig).where(sql`${businessConfig.key} LIKE ${`product_${product.id}_%`}`);
    }
    await db.delete(products).where(eq(products.ownerId, userId));
    
    // Delete user's wishlist items
    await db.delete(wishlist).where(eq(wishlist.userId, userId));
    
    // Delete user's notifications
    await db.delete(notifications).where(eq(notifications.userId, userId));
    
    // Delete user's feedback
    await db.delete(feedback).where(eq(feedback.userId, userId));
    
    // Finally, delete the user
    await db.delete(users).where(eq(users.id, userId));
  }

  async approveProduct(productId: string): Promise<void> {
    await db.update(products).set({ isActive: true, updatedAt: new Date() }).where(eq(products.id, productId));
  }

  async rejectProduct(productId: string, reason: string): Promise<void> {
    await db.update(products).set({ isActive: false, updatedAt: new Date() }).where(eq(products.id, productId));
  }

  async replyToFeedback(feedbackId: string, reply: string): Promise<void> {
    await db.update(feedback).set({ adminReply: reply, updatedAt: new Date() }).where(eq(feedback.id, feedbackId));
  }

  async archiveFeedback(feedbackId: string): Promise<void> {
    await db.update(feedback).set({ isArchived: true, updatedAt: new Date() }).where(eq(feedback.id, feedbackId));
  }

  async makeUserAdmin(userId: string): Promise<void> {
    await db.update(users).set({ role: 'admin', updatedAt: new Date() }).where(eq(users.id, userId));
  }

  async getUserFeedback(userId: string): Promise<Feedback[]> {
    return await db.select().from(feedback).where(eq(feedback.userId, userId)).orderBy(desc(feedback.createdAt));
  }

  async createUserFeedback(userId: string, feedbackData: any): Promise<Feedback> {
    const result = await db.insert(feedback).values({
      userId,
      type: feedbackData.type,
      subject: feedbackData.subject,
      message: feedbackData.message,
      sentiment: 'neutral',
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return result[0];
  }
}

export const storage = new DatabaseStorage();
