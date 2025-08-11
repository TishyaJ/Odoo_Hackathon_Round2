import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";
import { insertProductSchema, insertBookingSchema, insertNotificationSchema } from "@shared/schema";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  throw new Error('Missing required Cloudinary secrets: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update user role/type
  app.patch('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { role, customerType } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedUser = await storage.upsertUser({
        ...user,
        role,
        customerType,
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Categories
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Products
  app.get('/api/products', async (req, res) => {
    try {
      const {
        categoryId,
        searchQuery,
        minPrice,
        maxPrice,
        location,
        availability,
        ownerId
      } = req.query;

      const filters: any = {};
      if (categoryId) filters.categoryId = categoryId as string;
      if (searchQuery) filters.searchQuery = searchQuery as string;
      if (minPrice) filters.minPrice = parseFloat(minPrice as string);
      if (maxPrice) filters.maxPrice = parseFloat(maxPrice as string);
      if (location) filters.location = location as string;
      if (availability) filters.availability = availability as string;
      if (ownerId) filters.ownerId = ownerId as string;

      const products = await storage.getProducts(filters);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get('/api/products/:id', async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post('/api/products', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const productData = insertProductSchema.parse({
        ...req.body,
        ownerId: userId,
      });

      const product = await storage.createProduct(productData);
      
      // Create pricing rules if provided
      if (req.body.pricing && Array.isArray(req.body.pricing)) {
        for (const pricing of req.body.pricing) {
          await storage.createProductPricing({
            productId: product.id,
            ...pricing,
          });
        }
      }

      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.patch('/api/products/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const product = await storage.getProduct(req.params.id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      if (product.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this product" });
      }

      const updatedProduct = await storage.updateProduct(req.params.id, req.body);
      res.json(updatedProduct);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete('/api/products/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const product = await storage.getProduct(req.params.id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      if (product.ownerId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this product" });
      }

      await storage.deleteProduct(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Product pricing
  app.get('/api/products/:id/pricing', async (req, res) => {
    try {
      const pricing = await storage.getProductPricing(req.params.id);
      res.json(pricing);
    } catch (error) {
      console.error("Error fetching product pricing:", error);
      res.status(500).json({ message: "Failed to fetch product pricing" });
    }
  });

  // Check availability
  app.post('/api/products/:id/check-availability', async (req, res) => {
    try {
      const { startDate, endDate, excludeBookingId } = req.body;
      const isAvailable = await storage.checkAvailability(
        req.params.id,
        new Date(startDate),
        new Date(endDate),
        excludeBookingId
      );
      res.json({ available: isAvailable });
    } catch (error) {
      console.error("Error checking availability:", error);
      res.status(500).json({ message: "Failed to check availability" });
    }
  });

  // Bookings
  app.get('/api/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const filters: any = {};
      
      // Admin can see all bookings, customers only their own
      if (user?.role !== 'admin') {
        filters.customerId = userId;
      }

      // Apply additional filters from query params
      const { productId, status, startDate, endDate } = req.query;
      if (productId) filters.productId = productId as string;
      if (status) filters.status = status as string;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const bookings = await storage.getBookings(filters);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.post('/api/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bookingData = insertBookingSchema.parse({
        ...req.body,
        customerId: userId,
      });

      // Check availability
      const isAvailable = await storage.checkAvailability(
        bookingData.productId,
        new Date(bookingData.startDate),
        new Date(bookingData.endDate)
      );

      if (!isAvailable) {
        return res.status(400).json({ message: "Product is not available for selected dates" });
      }

      const booking = await storage.createBooking(bookingData);
      res.status(201).json(booking);
    } catch (error) {
      console.error("Error creating booking:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid booking data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.patch('/api/bookings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const booking = await storage.getBooking(req.params.id);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Only admin or booking owner can update
      if (user?.role !== 'admin' && booking.customerId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this booking" });
      }

      const updatedBooking = await storage.updateBooking(req.params.id, req.body);
      res.json(updatedBooking);
    } catch (error) {
      console.error("Error updating booking:", error);
      res.status(500).json({ message: "Failed to update booking" });
    }
  });

  // Calculate late fees
  app.get('/api/bookings/:id/late-fees', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const lateFee = await storage.calculateLateFees(req.params.id);
      res.json({ lateFee });
    } catch (error) {
      console.error("Error calculating late fees:", error);
      res.status(500).json({ message: "Failed to calculate late fees" });
    }
  });

  // Get late bookings (admin only)
  app.get('/api/admin/late-bookings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const lateBookings = await storage.getLateBookings();
      res.json(lateBookings);
    } catch (error) {
      console.error("Error fetching late bookings:", error);
      res.status(500).json({ message: "Failed to fetch late bookings" });
    }
  });

  // Admin stats
  app.get('/api/admin/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  // Notifications
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const notificationData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(notificationData);
      res.status(201).json(notification);
    } catch (error) {
      console.error("Error creating notification:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid notification data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create notification" });
    }
  });

  app.patch('/api/notifications/:id/read', isAuthenticated, async (req, res) => {
    try {
      await storage.markNotificationRead(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Configuration
  app.get('/api/config/durations', async (req, res) => {
    try {
      const durations = await storage.getDurationOptions();
      res.json(durations);
    } catch (error) {
      console.error("Error fetching duration options:", error);
      res.status(500).json({ message: "Failed to fetch duration options" });
    }
  });

  app.get('/api/config/status', async (req, res) => {
    try {
      const statusConfig = await storage.getStatusConfig();
      res.json(statusConfig);
    } catch (error) {
      console.error("Error fetching status config:", error);
      res.status(500).json({ message: "Failed to fetch status config" });
    }
  });

  app.get('/api/config/business', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { key } = req.query;
      const config = await storage.getBusinessConfig(key as string);
      res.json(config);
    } catch (error) {
      console.error("Error fetching business config:", error);
      res.status(500).json({ message: "Failed to fetch business config" });
    }
  });

  app.put('/api/config/business', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { key, value } = req.body;
      const config = await storage.updateBusinessConfig(key, value);
      res.json(config);
    } catch (error) {
      console.error("Error updating business config:", error);
      res.status(500).json({ message: "Failed to update business config" });
    }
  });

  // Stripe payment routes
  app.post("/api/create-payment-intent", isAuthenticated, async (req, res) => {
    try {
      const { amount, bookingId } = req.body;
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          bookingId: bookingId || '',
        },
      });
      
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Cloudinary signature generation
  app.post('/api/cloudinary/signature', isAuthenticated, async (req, res) => {
    try {
      const { timestamp, public_id, folder } = req.body;
      
      const signature = require('crypto')
        .createHash('sha1')
        .update(`folder=${folder}&public_id=${public_id}&timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET}`)
        .digest('hex');

      res.json({
        signature,
        timestamp,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
      });
    } catch (error) {
      console.error("Error generating Cloudinary signature:", error);
      res.status(500).json({ message: "Failed to generate upload signature" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
