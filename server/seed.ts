import { db } from './db';
import { categories, durationOptions, statusConfig } from '../shared/schema';
import { sql } from 'drizzle-orm';

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // Seed Categories
    console.log('📂 Seeding categories...');
    const categoryData = [
      {
        name: 'Estate',
        icon: '🏠',
        slug: 'estate',
        description: 'Real estate properties for rent including houses, apartments, and commercial spaces'
      },
      {
        name: 'Home Utilities',
        icon: '🔧',
        slug: 'home-utilities',
        description: 'Home appliances, tools, and utility items for daily use'
      },
      {
        name: 'Vehicles',
        icon: '🚗',
        slug: 'vehicles',
        description: 'Cars, motorcycles, bicycles, and other transportation vehicles'
      },
      {
        name: 'Entertainment',
        icon: '🎮',
        slug: 'entertainment',
        description: 'Gaming consoles, audio equipment, and entertainment devices'
      }
    ];

    for (const category of categoryData) {
      await db.insert(categories).values(category).onConflictDoNothing();
    }

    // Seed Duration Options
    console.log('⏰ Seeding duration options...');
    const durationData = [
      {
        type: 'hourly',
        label: 'Per Hour',
        multiplier: '1.00',
        discountPercentage: '0.00',
        sortOrder: 1
      },
      {
        type: 'daily',
        label: 'Per Day',
        multiplier: '24.00',
        discountPercentage: '10.00',
        sortOrder: 2
      },
      {
        type: 'weekly',
        label: 'Per Week',
        multiplier: '168.00',
        discountPercentage: '20.00',
        sortOrder: 3
      },
      {
        type: 'monthly',
        label: 'Per Month',
        multiplier: '720.00',
        discountPercentage: '30.00',
        sortOrder: 4
      }
    ];

    for (const duration of durationData) {
      await db.insert(durationOptions).values(duration).onConflictDoNothing();
    }

    // Seed Status Configuration
    console.log('📊 Seeding status configuration...');
    const statusData = [
      {
        status: 'reserved',
        label: 'Reserved',
        color: '#f59e0b',
        icon: '⏰',
        description: 'Booking is reserved but not yet confirmed'
      },
      {
        status: 'confirmed',
        label: 'Confirmed',
        color: '#10b981',
        icon: '✅',
        description: 'Booking is confirmed and ready for pickup'
      },
      {
        status: 'pickup',
        label: 'Pickup',
        color: '#3b82f6',
        icon: '📦',
        description: 'Item is being picked up'
      },
      {
        status: 'active',
        label: 'Active',
        color: '#8b5cf6',
        icon: '🤝',
        description: 'Rental is currently active'
      },
      {
        status: 'returned',
        label: 'Returned',
        color: '#06b6d4',
        icon: '↻',
        description: 'Item has been returned'
      },
      {
        status: 'late',
        label: 'Late',
        color: '#ef4444',
        icon: '⚠️',
        description: 'Item is overdue for return'
      },
      {
        status: 'cancelled',
        label: 'Cancelled',
        color: '#6b7280',
        icon: '❌',
        description: 'Booking has been cancelled'
      }
    ];

    for (const status of statusData) {
      await db.insert(statusConfig).values(status).onConflictDoNothing();
    }

    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run the seed function
console.log('🚀 Starting seed script...');
seedDatabase()
  .then(() => {
    console.log('🎉 Seeding process completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seeding process failed:', error);
    process.exit(1);
  });

export { seedDatabase };
