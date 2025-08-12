import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authenticateToken, requireAdmin, generateToken, hashPassword, comparePassword, type AuthRequest } from "./auth";
import { loginSchema, registerSchema } from "@shared/schema";
import Stripe from "stripe";
import crypto from "crypto";
import sgMail from "@sendgrid/mail";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
});

// Configure SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Email utility functions
const sendEmail = async (to: string, subject: string, html: string) => {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('📧 Email would be sent (SendGrid not configured):', { to, subject });
    return;
  }

  try {
    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@rentalpro.com',
      subject,
      html,
    };
    await sgMail.send(msg);
    console.log('📧 Email sent successfully to:', to);
  } catch (error) {
    console.error('📧 Email sending failed:', error);
  }
};

const generateInvoiceEmail = (booking: any, product: any, user: any) => {
  const totalAmount = parseFloat(booking.totalAmount).toFixed(2);
  const startDate = new Date(booking.startDate).toLocaleDateString();
  const endDate = new Date(booking.endDate).toLocaleDateString();
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">RentalPro - Booking Invoice</h2>
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Booking Details</h3>
        <p><strong>Booking ID:</strong> ${booking.id}</p>
        <p><strong>Product:</strong> ${product.name}</p>
        <p><strong>Rental Period:</strong> ${startDate} - ${endDate}</p>
        <p><strong>Quantity:</strong> ${booking.quantity}</p>
        <p><strong>Duration Type:</strong> ${booking.durationType}</p>
        <p><strong>Base Price:</strong> $${parseFloat(booking.basePrice).toFixed(2)}</p>
        <p><strong>Discount:</strong> $${parseFloat(booking.discount || 0).toFixed(2)}</p>
        <p><strong>Service Fee:</strong> $${parseFloat(booking.serviceFee || 0).toFixed(2)}</p>
        <p><strong>Total Amount:</strong> $${totalAmount}</p>
      </div>
      <p>Thank you for using RentalPro!</p>
    </div>
  `;
};

// Store OTPs temporarily (in production, use Redis or database)
const otpStore = new Map();

export async function registerRoutes(app: Express): Promise<Server> {
  // OTP-based Authentication Routes
  
  // Generate OTP for registration
  app.post('/user/generate-otp', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists with this email" });
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store OTP with expiration (5 minutes)
      otpStore.set(email, {
        otp,
        expiresAt: Date.now() + 5 * 60 * 1000
      });

      // Log OTP to console for testing (instead of sending email)
      console.log(`\n🔐 OTP for ${email}: ${otp}\n🔐 Use this code to complete registration\n`);
      
      res.status(200).json({ message: "OTP sent successfully" });
    } catch (error) {
      console.error("Generate OTP error:", error);
      res.status(500).json({ error: "Failed to send OTP" });
    }
  });

  // Generate OTP for login
  app.post('/user/generate-otp-login', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store OTP with expiration (5 minutes)
      otpStore.set(email, {
        otp,
        expiresAt: Date.now() + 5 * 60 * 1000
      });

      // Log OTP to console for testing (instead of sending email)
      console.log(`\n🔐 OTP for ${email}: ${otp}\n🔐 Use this code to complete login\n`);
      
      res.status(200).json({ message: "OTP sent successfully" });
    } catch (error) {
      console.error("Generate OTP login error:", error);
      res.status(500).json({ error: "Failed to send OTP" });
    }
  });

  // Verify OTP and create user (registration)
  app.post('/user/verify-otp', async (req, res) => {
    try {
      const { name, email, password, otp } = req.body;
      
      if (!email || !otp || !password || !name) {
        return res.status(400).json({ error: "All fields are required" });
      }

      // Verify OTP
      const storedOTP = otpStore.get(email);
      if (!storedOTP || storedOTP.otp !== otp || Date.now() > storedOTP.expiresAt) {
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }

      // Clear OTP after successful verification
      otpStore.delete(email);

      // Hash password and create user
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName: name.firstname,
        lastName: name.lastname,
        customerType: 'lister', // Default to lister
      });

      // Generate token
      const token = generateToken(user.id);
      
      res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          customerType: user.customerType
        }
      });
    } catch (error) {
      console.error("Verify OTP error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // Verify OTP and login
  app.post('/user/verify-otp-login', async (req, res) => {
    try {
      const { email, otp } = req.body;
      
      if (!email || !otp) {
        return res.status(400).json({ error: "Email and OTP are required" });
      }

      // Verify OTP
      const storedOTP = otpStore.get(email);
      if (!storedOTP || storedOTP.otp !== otp || Date.now() > storedOTP.expiresAt) {
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }

      // Clear OTP after successful verification
      otpStore.delete(email);

      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user || !user.isActive) {
        return res.status(401).json({ error: "User not found or inactive" });
      }

      // Generate token
      const token = generateToken(user.id);
      
      res.status(200).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          customerType: user.customerType
        }
      });
    } catch (error) {
      console.error("Verify OTP login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Traditional login (fallback)
  app.post('/user/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user || !user.isActive) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Check password
      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Generate token
      const token = generateToken(user.id);
      
      res.status(200).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          customerType: user.customerType
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Google OAuth callback
  app.post('/auth/google', async (req, res) => {
    try {
      const { code } = req.body as { code?: string };
      if (!code) return res.status(400).json({ error: 'Authorization code is required' });
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return res.status(500).json({ error: 'Google OAuth not configured' });
      }

      // Exchange code for tokens
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          grant_type: 'authorization_code',
          redirect_uri: 'postmessage',
        }),
      });

      if (!tokenRes.ok) {
        const text = await tokenRes.text();
        return res.status(400).json({ error: 'Failed to exchange code', details: text });
      }

      const tokenJson = await tokenRes.json() as { access_token: string };

      // Fetch user info
      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenJson.access_token}` },
      });
      if (!userInfoRes.ok) {
        const text = await userInfoRes.text();
        return res.status(400).json({ error: 'Failed to fetch user info', details: text });
      }
      const userInfo = await userInfoRes.json() as { email: string; given_name?: string; family_name?: string; sub: string; picture?: string };

      if (!userInfo.email) {
        return res.status(400).json({ error: 'Google did not provide an email' });
      }

      // Find or create user
      let user = await storage.getUserByEmail(userInfo.email);
      if (!user) {
        user = await storage.createUser({
          email: userInfo.email,
          password: await hashPassword(crypto.randomUUID()),
          firstName: userInfo.given_name || 'Google',
          lastName: userInfo.family_name || 'User',
          customerType: 'renter',
          profileImageUrl: userInfo.picture,
        });
      }

      const token = generateToken(user.id);
      return res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          customerType: user.customerType,
          profileImageUrl: user.profileImageUrl,
        },
      });
    } catch (error) {
      console.error('Google auth error:', error);
      res.status(500).json({ error: 'Google authentication failed' });
    }
  });

  // Get current user
  app.get('/user', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        customerType: user.customerType
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Logout
  app.get('/user/logout', (req, res) => {
    // In a real app, you might want to blacklist the token
    res.json({ message: "Logged out successfully" });
  });

  // User feedback routes
  app.post('/api/user/feedback', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { category, subject, message, priority } = req.body;
      
      if (!category || !subject || !message) {
        return res.status(400).json({ error: "Category, subject, and message are required" });
      }

      const feedbackData = {
        type: category,
        subject,
        message,
        priority: priority || 'medium'
      };

      const feedback = await storage.createUserFeedback(req.user!.id, feedbackData);
      res.json(feedback);
    } catch (error) {
      console.error("Create user feedback error:", error);
      res.status(500).json({ message: "Failed to submit feedback" });
    }
  });

  app.get('/api/user/feedback', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const feedback = await storage.getUserFeedback(req.user!.id);
      res.json(feedback);
    } catch (error) {
      console.error("Get user feedback error:", error);
      res.status(500).json({ message: "Failed to fetch feedback" });
    }
  });

  // User stats route
  app.get('/api/user/stats', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const stats = await storage.getUserStats(userId);
      
      res.json({
        activeRentals: stats.activeRentals,
        totalSpent: stats.totalSpent.toFixed(2),
        itemsListed: stats.itemsListed,
        totalEarned: stats.totalEarned.toFixed(2)
      });
    } catch (error) {
      console.error("Get user stats error:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // Owner analytics route
  app.get('/api/owner/analytics', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const analytics = await storage.getOwnerAnalytics(userId);
      
      res.json(analytics);
    } catch (error) {
      console.error("Get owner analytics error:", error);
      res.status(500).json({ message: "Failed to fetch owner analytics" });
    }
  });

  // Categories routes
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Get categories error:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Admin: Create category
  app.post('/api/admin/categories', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { name, slug, description, icon } = req.body;
      const category = await storage.createCategory({ name, slug, description, icon });
      res.json(category);
    } catch (error) {
      console.error("Create category error:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // Products routes
  app.get('/api/products', async (req, res) => {
    try {
      const filters = {
        categoryId: req.query.categoryId as string,
        searchQuery: req.query.searchQuery as string,
        minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
        location: req.query.location as string,
        availability: req.query.availability as string,
        ownerId: req.query.ownerId as string,
      };

      const products = await storage.getProducts(filters);
      
      // Get pricing for each product
      const productsWithPricing = await Promise.all(
        products.map(async (product) => {
          const pricing = await storage.getProductPricing(product.id);
          return {
            ...product,
            pricing,
          };
        })
      );
      
      res.json(productsWithPricing);
    } catch (error) {
      console.error("Get products error:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get('/api/products/:id', async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Get pricing information
      const pricing = await storage.getProductPricing(product.id);
      
      // Get late fees information
      const lateFeesConfig = await storage.getBusinessConfig(`product_${product.id}_late_fees`);
      const lateFees = lateFeesConfig.length > 0 ? JSON.parse(lateFeesConfig[0].value) : null;
      
      res.json({
        ...product,
        pricing,
        lateFees,
      });
    } catch (error) {
      console.error("Get product error:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post('/api/products', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { pricing, lateFees, ...productData } = req.body;
      
      console.log('📦 Creating product with data:', JSON.stringify(productData, null, 2));
      
      // Convert date strings to Date objects if they exist
      const processedProductData: any = {
        ...productData,
        ownerId: req.user!.id,
      };
      
      // Only include date fields if they exist and convert them to Date objects
      if (productData.availableFrom && productData.availableFrom.trim() !== '') {
        console.log('📅 Converting availableFrom:', productData.availableFrom);
        processedProductData.availableFrom = new Date(productData.availableFrom);
      }
      if (productData.availableUntil && productData.availableUntil.trim() !== '') {
        console.log('📅 Converting availableUntil:', productData.availableUntil);
        processedProductData.availableUntil = new Date(productData.availableUntil);
      }
      
      // Remove any undefined, null, or empty string values to let Drizzle use defaults
      Object.keys(processedProductData).forEach(key => {
        if (processedProductData[key] === undefined || 
            processedProductData[key] === null || 
            (typeof processedProductData[key] === 'string' && processedProductData[key].trim() === '')) {
          console.log('🗑️ Removing empty field:', key, processedProductData[key]);
          delete processedProductData[key];
        }
      });
      
      console.log('📦 Processed product data:', JSON.stringify(processedProductData, null, 2));
      
      const product = await storage.createProduct(processedProductData);
      
      // Create pricing records
      if (pricing && Array.isArray(pricing)) {
        for (const priceOption of pricing) {
          await storage.createProductPricing({
            productId: product.id,
            durationType: priceOption.durationType,
            basePrice: priceOption.basePrice,
            discountPercentage: priceOption.discountPercentage || 0,
            isActive: true,
          });
        }
      }
      
      // Store late fees information in business config
      if (lateFees && lateFees.dailyRate) {
        await storage.updateBusinessConfig(`product_${product.id}_late_fees`, JSON.stringify(lateFees));
      }
      
      // Create notification for the user
      try {
        console.log('🔔 Creating notification for user:', req.user!.id);
        const notification = await storage.createNotification({
          userId: req.user!.id,
          type: 'product_created',
          title: 'Item Listed Successfully! 🎉',
          message: `Your item "${product.name}" has been successfully listed and is now available for rent.`,
          relatedId: product.id,
        });
        console.log('🔔 Notification created successfully:', notification.id);
      } catch (notificationError) {
        console.error('🔔 Error creating notification:', notificationError);
        // Don't fail product creation if notification fails
      }
      
      res.json(product);
    } catch (error) {
      console.error("Create product error:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.get('/api/products/:id/pricing', async (req, res) => {
    try {
      const pricing = await storage.getProductPricing(req.params.id);
      res.json(pricing);
    } catch (error) {
      console.error("Get product pricing error:", error);
      res.status(500).json({ message: "Failed to fetch product pricing" });
    }
  });

  app.delete('/api/products/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const productId = req.params.id;
      
      // Get the product to check ownership
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Check if the user owns this product
      if (product.ownerId !== req.user!.id) {
        return res.status(403).json({ message: "You can only delete your own products" });
      }
      
      // Check if there are any bookings referencing this product
      const hasAnyBookings = (await storage.getBookings({ productId })).length > 0;
      if (hasAnyBookings) {
        // If any booking exists, use soft-delete (hide from catalog, keep history)
        await storage.softDeleteProduct(productId);
      } else {
        // No bookings at all -> hard delete
        await storage.deleteProduct(productId);
      }
      
      console.log(`🗑️ Product ${productId} deleted by user ${req.user!.id}`);
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Delete product error:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Bookings routes
  app.get('/api/bookings', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const filters = {
        customerId: req.user!.id,
        productId: req.query.productId as string,
        status: req.query.status as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };

      const bookings = await storage.getBookings(filters);
      res.json(bookings);
    } catch (error) {
      console.error("Get bookings error:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.post('/api/bookings', authenticateToken, async (req: AuthRequest, res) => {
    try {
      console.log('📅 Creating booking with data:', JSON.stringify(req.body, null, 2));
      
      // Convert date strings to Date objects
      const processedBookingData: any = {
        ...req.body,
        customerId: req.user!.id,
      };
      
      // Convert date fields to Date objects
      if (req.body.startDate) {
        console.log('📅 Converting startDate:', req.body.startDate);
        processedBookingData.startDate = new Date(req.body.startDate);
      }
      if (req.body.endDate) {
        console.log('📅 Converting endDate:', req.body.endDate);
        processedBookingData.endDate = new Date(req.body.endDate);
      }
      if (req.body.actualReturnDate) {
        console.log('📅 Converting actualReturnDate:', req.body.actualReturnDate);
        processedBookingData.actualReturnDate = new Date(req.body.actualReturnDate);
      }
      
      // Remove any undefined or null values
      Object.keys(processedBookingData).forEach(key => {
        if (processedBookingData[key] === undefined || processedBookingData[key] === null) {
          console.log('🗑️ Removing empty booking field:', key, processedBookingData[key]);
          delete processedBookingData[key];
        }
      });
      
      console.log('📅 Processed booking data:', JSON.stringify(processedBookingData, null, 2));
      
      const booking = await storage.createBooking(processedBookingData);
      // Decrement product quantity by booked quantity
      try {
        const product = await storage.getProduct(booking.productId);
        if (product) {
          const newQty = Math.max(0, (product.quantity || 0) - (booking.quantity || 1));
          await storage.updateProduct(product.id, { quantity: newQty as any });
        }
      } catch (qtyError) {
        console.error('Quantity update error:', qtyError);
      }
      
                     // Send email notifications
               try {
                 const product = await storage.getProduct(booking.productId);
                 const customer = await storage.getUser(booking.customerId);
                 const owner = product ? await storage.getUser(product.ownerId) : null;
                 
                 if (customer && product) {
                   // Send invoice to customer
                   const customerEmail = generateInvoiceEmail(booking, product, customer);
                   await sendEmail(
                     customer.email,
                     `RentalPro - Booking Confirmation #${booking.id.slice(-8)}`,
                     customerEmail
                   );
                   
                   // Send notification to product owner
                   if (owner && owner.email !== customer.email) {
                     const ownerEmail = `
                       <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                         <h2 style="color: #2563eb;">RentalPro - New Booking</h2>
                         <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                           <h3>New Booking for ${product.name}</h3>
                           <p><strong>Booking ID:</strong> ${booking.id}</p>
                           <p><strong>Customer:</strong> ${customer.firstName} ${customer.lastName}</p>
                           <p><strong>Rental Period:</strong> ${new Date(booking.startDate).toLocaleDateString()} - ${new Date(booking.endDate).toLocaleDateString()}</p>
                           <p><strong>Total Amount:</strong> $${parseFloat(booking.totalAmount).toFixed(2)}</p>
                         </div>
                         <p>Please review and confirm this booking.</p>
                       </div>
                     `;
                     await sendEmail(
                       owner.email,
                       `RentalPro - New Booking for ${product.name}`,
                       ownerEmail
                     );
                   }
                   
                                       // Create notification for customer
                    try {
                      console.log('🔔 Creating booking notification for customer:', booking.customerId);
                      const customerNotification = await storage.createNotification({
                        userId: booking.customerId,
                        type: 'booking_confirmed',
                        title: 'Booking Confirmed! 🎉',
                        message: `Your booking for "${product.name}" has been confirmed. Rental period: ${new Date(booking.startDate).toLocaleDateString()} - ${new Date(booking.endDate).toLocaleDateString()}`,
                        relatedId: booking.id,
                      });
                      console.log('🔔 Customer notification created:', customerNotification.id);
                    } catch (notificationError) {
                      console.error('🔔 Error creating customer notification:', notificationError);
                    }
                    
                    // Create notification for product owner
                    if (owner && owner.id !== customer.id) {
                      try {
                        console.log('🔔 Creating booking notification for owner:', owner.id);
                        const ownerNotification = await storage.createNotification({
                          userId: owner.id,
                          type: 'booking_confirmed',
                          title: 'New Booking Received! 📦',
                          message: `${customer.firstName} ${customer.lastName} has booked your item "${product.name}" for ${new Date(booking.startDate).toLocaleDateString()} - ${new Date(booking.endDate).toLocaleDateString()}`,
                          relatedId: booking.id,
                        });
                        console.log('🔔 Owner notification created:', ownerNotification.id);
                      } catch (notificationError) {
                        console.error('🔔 Error creating owner notification:', notificationError);
                      }
                    }
                 }
               } catch (emailError) {
                 console.error("Email notification error:", emailError);
                 // Don't fail the booking creation if email fails
               }
      
      res.json(booking);
    } catch (error) {
      console.error("Create booking error:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.patch('/api/bookings/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const bookingBefore = await storage.getBooking(req.params.id);
      const booking = await storage.updateBooking(req.params.id, req.body);
      // If cancelling and at least 1 day before start, restore quantity
      try {
        if (req.body.status === 'cancelled' && bookingBefore && bookingBefore.status !== 'cancelled') {
          const now = new Date();
          const start = new Date(bookingBefore.startDate);
          const oneDayBefore = new Date(start.getTime() - 24 * 60 * 60 * 1000);
          if (now <= oneDayBefore) {
            const product = await storage.getProduct(bookingBefore.productId);
            if (product) {
              const restoredQty = (product.quantity || 0) + (bookingBefore.quantity || 1);
              await storage.updateProduct(product.id, { quantity: restoredQty as any });
            }
          }
        }
      } catch (qtyRestoreErr) {
        console.error('Quantity restore error:', qtyRestoreErr);
      }
      res.json(booking);
    } catch (error) {
      console.error("Update booking error:", error);
      res.status(500).json({ message: "Failed to update booking" });
    }
  });

  // Availability check
  app.post('/api/products/:id/check-availability', async (req, res) => {
    try {
      const { startDate, endDate } = req.body;
      const isAvailable = await storage.checkAvailability(
        req.params.id,
        new Date(startDate),
        new Date(endDate)
      );
      res.json({ available: isAvailable });
    } catch (error) {
      console.error("Check availability error:", error);
      res.status(500).json({ message: "Failed to check availability" });
    }
  });

  // Admin routes
  app.get('/api/admin/analytics', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const analytics = await storage.getAdminAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Get admin analytics error:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Get admin stats error:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });



  app.get('/api/admin/users', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Get admin users error:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/admin/products', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      console.error("Get admin products error:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get('/api/admin/bookings', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const bookings = await storage.getAllBookings();
      res.json(bookings);
    } catch (error) {
      console.error("Get admin bookings error:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get('/api/admin/feedback', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const feedback = await storage.getAllFeedback();
      res.json(feedback);
    } catch (error) {
      console.error("Get admin feedback error:", error);
      res.status(500).json({ message: "Failed to fetch feedback" });
    }
  });

  // Admin user management
  app.patch('/api/admin/users/:userId/ban', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const userId = req.params.userId;
      await storage.banUser(userId);
      res.json({ message: "User banned successfully" });
    } catch (error) {
      console.error("Ban user error:", error);
      res.status(500).json({ message: "Failed to ban user" });
    }
  });

  app.patch('/api/admin/users/:userId/unban', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const userId = req.params.userId;
      await storage.unbanUser(userId);
      res.json({ message: "User unbanned successfully" });
    } catch (error) {
      console.error("Unban user error:", error);
      res.status(500).json({ message: "Failed to unban user" });
    }
  });

  app.delete('/api/admin/users/:userId', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const userId = req.params.userId;
      
      // Prevent admin from deleting themselves
      if (userId === req.user!.id) {
        return res.status(400).json({ message: "You cannot delete your own account" });
      }
      
      await storage.deleteUser(userId);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Admin product management
  app.patch('/api/admin/products/:productId/approve', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const productId = req.params.productId;
      await storage.approveProduct(productId);
      res.json({ message: "Product approved successfully" });
    } catch (error) {
      console.error("Approve product error:", error);
      res.status(500).json({ message: "Failed to approve product" });
    }
  });

  app.patch('/api/admin/products/:productId/reject', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const productId = req.params.productId;
      const { reason } = req.body;
      await storage.rejectProduct(productId, reason);
      res.json({ message: "Product rejected successfully" });
    } catch (error) {
      console.error("Reject product error:", error);
      res.status(500).json({ message: "Failed to reject product" });
    }
  });

  app.delete('/api/admin/products/:productId', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const productId = req.params.productId;
      await storage.deleteProduct(productId);
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Delete product error:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Admin feedback management
  app.post('/api/admin/feedback/:feedbackId/reply', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const feedbackId = req.params.feedbackId;
      const { reply } = req.body;
      await storage.replyToFeedback(feedbackId, reply);
      res.json({ message: "Reply sent successfully" });
    } catch (error) {
      console.error("Reply to feedback error:", error);
      res.status(500).json({ message: "Failed to send reply" });
    }
  });

  app.patch('/api/admin/feedback/:feedbackId/archive', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const feedbackId = req.params.feedbackId;
      await storage.archiveFeedback(feedbackId);
      res.json({ message: "Feedback archived successfully" });
    } catch (error) {
      console.error("Archive feedback error:", error);
      res.status(500).json({ message: "Failed to archive feedback" });
    }
  });

  // Make user admin
  app.patch('/api/admin/users/:userId/make-admin', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const userId = req.params.userId;
      await storage.makeUserAdmin(userId);
      res.json({ message: "User made admin successfully" });
    } catch (error) {
      console.error("Make user admin error:", error);
      res.status(500).json({ message: "Failed to make user admin" });
    }
  });

  // Configuration routes
  app.get('/api/config/durations', async (req, res) => {
    try {
      const durations = await storage.getDurationOptions();
      res.json(durations);
    } catch (error) {
      console.error("Get duration options error:", error);
      res.status(500).json({ message: "Failed to fetch duration options" });
    }
  });

  // Notifications
  app.get('/api/notifications', authenticateToken, async (req: AuthRequest, res) => {
    try {
      console.log('🔔 Fetching notifications for user:', req.user!.id);
      const notifications = await storage.getNotifications(req.user!.id);
      console.log('🔔 Found notifications:', notifications.length);
      console.log('🔔 Notifications data:', JSON.stringify(notifications, null, 2));
      res.json(notifications);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch('/api/notifications/:id/read', authenticateToken, async (req: AuthRequest, res) => {
    try {
      await storage.markNotificationRead(req.params.id);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Mark notification read error:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.delete('/api/notifications/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      // For now, we'll just mark it as read since we don't have a delete method
      // In a real app, you'd want to implement actual deletion
      await storage.markNotificationRead(req.params.id);
      res.json({ message: "Notification deleted" });
    } catch (error) {
      console.error("Delete notification error:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // Cloudinary signature
  app.post('/api/cloudinary/signature', authenticateToken, async (req, res) => {
    try {
      const { timestamp, public_id, folder } = req.body;
      
      const signature = crypto
        .createHash('sha256')
        .update(`folder=${folder}&public_id=${public_id}&timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET}`)
        .digest('hex');

      res.json({
        signature,
        timestamp,
        apiKey: process.env.CLOUDINARY_API_KEY,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      });
    } catch (error) {
      console.error("Cloudinary signature error:", error);
      res.status(500).json({ message: "Failed to generate signature" });
    }
  });

  // Stripe payment routes
  app.post("/api/create-payment-intent", authenticateToken, async (req, res) => {
    try {
      const { amount } = req.body;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Compatibility routes for existing client
  // Register with email/password (no OTP)
  app.post('/api/auth/register', async (req, res) => {
    try {
      const validated = registerSchema.parse(req.body);

      const existingUser = await storage.getUserByEmail(validated.email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const hashedPassword = await hashPassword(validated.password);
      const user = await storage.createUser({
        email: validated.email,
        password: hashedPassword,
        firstName: validated.firstName,
        lastName: validated.lastName,
        customerType: validated.customerType,
      });

      const token = generateToken(user.id);
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          customerType: user.customerType,
        },
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      // Zod validation error
      if (error?.issues?.length) {
        return res.status(400).json({ message: error.issues[0]?.message || 'Invalid input' });
      }
      // Unique violation (duplicate email)
      if (error?.code === '23505') {
        return res.status(400).json({ message: 'User already exists' });
      }
      return res.status(400).json({ message: 'Registration failed' });
    }
  });

  // Login with email/password
  app.post('/api/auth/login', async (req, res) => {
    try {
      const validated = loginSchema.parse(req.body);

      const user = await storage.getUserByEmail(validated.email);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isValid = await comparePassword(validated.password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = generateToken(user.id);
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          customerType: user.customerType,
        },
      });
    } catch (error: any) {
      console.error('Login error:', error);
      if (error?.issues?.length) {
        return res.status(400).json({ message: error.issues[0]?.message || 'Invalid input' });
      }
      return res.status(400).json({ message: 'Login failed' });
    }
  });

  // Current user
  app.get('/api/auth/user', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        customerType: user.customerType,
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  });

  // Update user profile
  app.put('/api/auth/user', authenticateToken, async (req: AuthRequest, res) => {
    try {
      console.log('👤 Updating user profile:', req.user!.id, req.body);
      const updatedUser = await storage.updateUser(req.user!.id, req.body);
      console.log('👤 User profile updated successfully');
      res.json({
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        customerType: updatedUser.customerType,
      });
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Wishlist routes
  app.get('/api/wishlist', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const wishlistItems = await storage.getWishlist(req.user!.id);
      res.json(wishlistItems);
    } catch (error) {
      console.error("Get wishlist error:", error);
      res.status(500).json({ message: "Failed to fetch wishlist" });
    }
  });

  app.post('/api/wishlist/:productId', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const productId = req.params.productId;
      
      // Check if product exists
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Check if already in wishlist
      const isInWishlist = await storage.isInWishlist(req.user!.id, productId);
      if (isInWishlist) {
        return res.status(400).json({ message: "Product already in wishlist" });
      }
      
      const wishlistItem = await storage.addToWishlist(req.user!.id, productId);
      res.json(wishlistItem);
    } catch (error) {
      console.error("Add to wishlist error:", error);
      res.status(500).json({ message: "Failed to add to wishlist" });
    }
  });

  app.delete('/api/wishlist/:productId', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const productId = req.params.productId;
      await storage.removeFromWishlist(req.user!.id, productId);
      res.status(204).send();
    } catch (error) {
      console.error("Remove from wishlist error:", error);
      res.status(500).json({ message: "Failed to remove from wishlist" });
    }
  });

  app.get('/api/wishlist/:productId/check', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const productId = req.params.productId;
      const isInWishlist = await storage.isInWishlist(req.user!.id, productId);
      res.json({ isInWishlist });
    } catch (error) {
      console.error("Check wishlist error:", error);
      res.status(500).json({ message: "Failed to check wishlist" });
    }
  });

  // Reviews routes
  app.get('/api/products/:productId/reviews', async (req, res) => {
    try {
      const productId = req.params.productId;
      const reviews = await storage.getProductReviews(productId);
      res.json(reviews);
    } catch (error) {
      console.error("Get reviews error:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.get('/api/products/:productId/rating', async (req, res) => {
    try {
      const productId = req.params.productId;
      const rating = await storage.getProductRating(productId);
      res.json(rating);
    } catch (error) {
      console.error("Get rating error:", error);
      res.status(500).json({ message: "Failed to fetch rating" });
    }
  });

  app.post('/api/products/:productId/reviews', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const productId = req.params.productId;
      const { rating, title, comment } = req.body;

      // Check if user can review this product
      const canReview = await storage.canUserReview(req.user!.id, productId);
      if (!canReview) {
        return res.status(403).json({ message: "You can only review products you have rented and returned" });
      }

      const review = await storage.createReview({
        userId: req.user!.id,
        productId,
        rating,
        title,
        comment,
        isVerified: true, // Since they completed a booking
      });

      res.json(review);
    } catch (error) {
      console.error("Create review error:", error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  app.put('/api/reviews/:reviewId', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const reviewId = req.params.reviewId;
      const { rating, title, comment } = req.body;

      const review = await storage.updateReview(reviewId, {
        rating,
        title,
        comment,
      });

      res.json(review);
    } catch (error) {
      console.error("Update review error:", error);
      res.status(500).json({ message: "Failed to update review" });
    }
  });

  app.delete('/api/reviews/:reviewId', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const reviewId = req.params.reviewId;
      await storage.deleteReview(reviewId);
      res.json({ message: "Review deleted successfully" });
    } catch (error) {
      console.error("Delete review error:", error);
      res.status(500).json({ message: "Failed to delete review" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}