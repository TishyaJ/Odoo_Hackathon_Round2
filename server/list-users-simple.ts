import { db } from "./db";
import { users } from "@shared/schema";

async function listAllUsersSimple() {
  console.log("=== ALL USERS IN DATABASE ===");

  try {
    const allUsers = await db.select().from(users);
    
    console.log(`Total users: ${allUsers.length}\n`);
    
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName || 'N/A'} ${user.lastName || 'N/A'}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Type: ${user.customerType || 'N/A'}`);
      console.log(`   Active: ${user.isActive ? 'Yes' : 'No'}`);
      console.log(`   ID: ${user.id}`);
      console.log("");
    });

    const adminCount = allUsers.filter(u => u.role === 'admin').length;
    const customerCount = allUsers.filter(u => u.role === 'customer').length;
    
    console.log("=== SUMMARY ===");
    console.log(`Admins: ${adminCount}`);
    console.log(`Customers: ${customerCount}`);

  } catch (error) {
    console.error("Error:", error);
  }
}

listAllUsersSimple().then(() => process.exit(0));
