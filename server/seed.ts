import { db } from "./db";
import { users, categories, durationOptions, statusConfig, products, bookings } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcrypt";

async function seed() {
  console.log("🌱 Starting database seeding...");

  try {
    // Create admin user if it doesn't exist
    const adminEmail = "admin@rentalpro.com";
    const existingAdmin = await db.select().from(users).where(eq(users.email, adminEmail));
    
    if (existingAdmin.length === 0) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await db.insert(users).values({
        email: adminEmail,
        password: hashedPassword,
        firstName: "Admin",
        lastName: "User",
        role: "admin",
        isActive: true,
      });
      console.log("✅ Admin user created: admin@rentalpro.com / admin123");
    } else {
      console.log("ℹ️ Admin user already exists");
    }

    // Create sample users if they don't exist
    const sampleUsers = [
      {
        email: "john.doe@example.com",
        password: "password123",
        firstName: "John",
        lastName: "Doe",
        role: "customer" as const,
        isActive: true,
      },
      {
        email: "jane.smith@example.com",
        password: "password123",
        firstName: "Jane",
        lastName: "Smith",
        role: "customer" as const,
        isActive: true,
      },
      {
        email: "mike.johnson@example.com",
        password: "password123",
        firstName: "Mike",
        lastName: "Johnson",
        role: "customer" as const,
        isActive: false, // Banned user
      },
    ];

    for (const userData of sampleUsers) {
      const existingUser = await db.select().from(users).where(eq(users.email, userData.email));
      
      if (existingUser.length === 0) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        await db.insert(users).values({
          email: userData.email,
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          isActive: userData.isActive,
        });
        console.log(`✅ Sample user created: ${userData.email}`);
      } else {
        console.log(`ℹ️ Sample user already exists: ${userData.email}`);
      }
    }

    // Check if categories exist
    const existingCategories = await db.select().from(categories);
    if (existingCategories.length === 0) {
      await db.insert(categories).values([
        { 
          name: "Estate", 
          slug: "estate",
          description: "Real estate and property rentals",
          icon: "🏠"
        },
        { 
          name: "Home Utilities", 
          slug: "home-utilities",
          description: "Home appliances and utilities",
          icon: "🔧"
        },
        { 
          name: "Vehicles", 
          slug: "vehicles",
          description: "Cars, bikes, and transportation",
          icon: "🚗"
        },
        { 
          name: "Entertainment", 
          slug: "entertainment",
          description: "Electronics and entertainment equipment",
          icon: "🎮"
        },
      ]);
      console.log("✅ Categories seeded");
    } else {
      console.log("ℹ️ Categories already exist");
    }

    // Check if duration options exist
    const existingDurations = await db.select().from(durationOptions);
    if (existingDurations.length === 0) {
      await db.insert(durationOptions).values([
        { 
          type: "hourly", 
          label: "Per Hour",
          multiplier: "1.00",
          discountPercentage: "0.00",
          sortOrder: 1
        },
        { 
          type: "daily", 
          label: "Per Day",
          multiplier: "24.00",
          discountPercentage: "10.00",
          sortOrder: 2
        },
        { 
          type: "weekly", 
          label: "Per Week",
          multiplier: "168.00",
          discountPercentage: "20.00",
          sortOrder: 3
        },
        { 
          type: "monthly", 
          label: "Per Month",
          multiplier: "720.00",
          discountPercentage: "30.00",
          sortOrder: 4
        },
      ]);
      console.log("✅ Duration options seeded");
    } else {
      console.log("ℹ️ Duration options already exist");
    }

    // Check if status config exists
    const existingStatus = await db.select().from(statusConfig);
    if (existingStatus.length === 0) {
      await db.insert(statusConfig).values([
        { 
          status: "reserved", 
          label: "Reserved",
          color: "#f59e0b",
          icon: "⏰",
          description: "Booking is reserved but not yet confirmed"
        },
        { 
          status: "confirmed", 
          label: "Confirmed",
          color: "#10b981",
          icon: "✅",
          description: "Booking is confirmed and ready for pickup"
        },
        { 
          status: "pickup", 
          label: "Pickup",
          color: "#3b82f6",
          icon: "📦",
          description: "Item is being picked up"
        },
        { 
          status: "active", 
          label: "Active",
          color: "#8b5cf6",
          icon: "🤝",
          description: "Rental is currently active"
        },
        { 
          status: "returned", 
          label: "Returned",
          color: "#06b6d4",
          icon: "↻",
          description: "Item has been returned"
        },
        { 
          status: "late", 
          label: "Late",
          color: "#ef4444",
          icon: "⚠️",
          description: "Item is overdue for return"
        },
        { 
          status: "cancelled", 
          label: "Cancelled",
          color: "#6b7280",
          icon: "❌",
          description: "Booking has been cancelled"
        },
      ]);
      console.log("✅ Status config seeded");
    } else {
      console.log("ℹ️ Status config already exists");
    }

    // Create sample products if they don't exist
    const sampleProducts = [
      {
        name: "Professional Camera",
        description: "High-quality DSLR camera for photography and videography",
        categoryId: (await db.select().from(categories).where(eq(categories.slug, "entertainment")))[0]?.id,
        ownerId: (await db.select().from(users).where(eq(users.email, "john.doe@example.com")))[0]?.id,
        location: "New York, NY",
        quantity: 1,
        isActive: true,
      },
      {
        name: "SUV Vehicle",
        description: "Comfortable SUV for family trips and transportation",
        categoryId: (await db.select().from(categories).where(eq(categories.slug, "vehicles")))[0]?.id,
        ownerId: (await db.select().from(users).where(eq(users.email, "jane.smith@example.com")))[0]?.id,
        location: "Los Angeles, CA",
        quantity: 1,
        isActive: true,
      },
      {
        name: "DJ Equipment",
        description: "Complete DJ setup with speakers and mixing board",
        categoryId: (await db.select().from(categories).where(eq(categories.slug, "entertainment")))[0]?.id,
        ownerId: (await db.select().from(users).where(eq(users.email, "mike.johnson@example.com")))[0]?.id,
        location: "Chicago, IL",
        quantity: 1,
        isActive: false, // Pending approval
      },
    ];

    for (const productData of sampleProducts) {
      if (productData.ownerId) {
        const existingProduct = await db.select().from(products).where(eq(products.name, productData.name));
        
        if (existingProduct.length === 0) {
          await db.insert(products).values(productData);
          console.log(`✅ Sample product created: ${productData.name}`);
        } else {
          console.log(`ℹ️ Sample product already exists: ${productData.name}`);
        }
      }
    }

    // Create sample bookings if they don't exist
    const sampleBookings = [
      {
        customerId: (await db.select().from(users).where(eq(users.email, "john.doe@example.com")))[0]?.id,
        productId: (await db.select().from(products).where(eq(products.name, "SUV Vehicle")))[0]?.id,
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        quantity: 1,
        totalAmount: "150.00",
        status: "confirmed" as const,
        durationType: "daily" as const,
        basePrice: "50.00",
        serviceFee: "5.00",
      },
      {
        customerId: (await db.select().from(users).where(eq(users.email, "jane.smith@example.com")))[0]?.id,
        productId: (await db.select().from(products).where(eq(products.name, "Professional Camera")))[0]?.id,
        startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        quantity: 1,
        totalAmount: "75.00",
        status: "active" as const,
        durationType: "daily" as const,
        basePrice: "25.00",
        serviceFee: "2.50",
      },
    ];

    for (const bookingData of sampleBookings) {
      if (bookingData.customerId && bookingData.productId) {
        const existingBooking = await db.select().from(bookings).where(
          and(
            eq(bookings.customerId, bookingData.customerId),
            eq(bookings.productId, bookingData.productId),
            eq(bookings.startDate, bookingData.startDate)
          )
        );
        
        if (existingBooking.length === 0) {
          await db.insert(bookings).values(bookingData);
          console.log(`✅ Sample booking created for ${bookingData.customerId}`);
        } else {
          console.log(`ℹ️ Sample booking already exists`);
        }
      }
    }

    console.log("🎉 Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed().then(() => process.exit(0));
}
