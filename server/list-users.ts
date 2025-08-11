import { db } from "./db";
import { users } from "@shared/schema";

async function listAllUsers() {
  console.log("👥 Listing all users from database...\n");

  try {
    const allUsers = await db.select().from(users);
    
    if (allUsers.length === 0) {
      console.log("❌ No users found in the database");
      return;
    }

    console.log(`📊 Total users found: ${allUsers.length}\n`);
    
    allUsers.forEach((user, index) => {
      console.log(`--- User ${index + 1} ---`);
      console.log(`🆔 ID: ${user.id}`);
      console.log(`📧 Email: ${user.email}`);
      console.log(`👤 Name: ${user.firstName || 'N/A'} ${user.lastName || 'N/A'}`);
      console.log(`🎭 Role: ${user.role}`);
      console.log(`👥 Customer Type: ${user.customerType || 'N/A'}`);
      console.log(`✅ Active: ${user.isActive ? 'Yes' : 'No'}`);
      console.log(`📅 Created: ${user.createdAt}`);
      console.log(`🔄 Updated: ${user.updatedAt}`);
      console.log(`💳 Stripe Customer ID: ${user.stripeCustomerId || 'N/A'}`);
      console.log(`📱 Profile Image: ${user.profileImageUrl || 'N/A'}`);
      console.log(""); // Empty line for spacing
    });

    // Summary statistics
    const adminCount = allUsers.filter(u => u.role === 'admin').length;
    const customerCount = allUsers.filter(u => u.role === 'customer').length;
    const activeCount = allUsers.filter(u => u.isActive).length;
    const inactiveCount = allUsers.filter(u => !u.isActive).length;

    console.log("📈 Summary Statistics:");
    console.log(`👑 Admins: ${adminCount}`);
    console.log(`👤 Customers: ${customerCount}`);
    console.log(`✅ Active Users: ${activeCount}`);
    console.log(`❌ Inactive Users: ${inactiveCount}`);

  } catch (error) {
    console.error("❌ Error fetching users:", error);
  }
}

listAllUsers().then(() => process.exit(0));
