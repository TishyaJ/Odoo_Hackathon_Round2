import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function makeUserAdmin(email: string) {
  console.log(`🔧 Making user ${email} an admin...`);

  try {
    // Find the user by email
    const existingUser = await db.select().from(users).where(eq(users.email, email));
    
    if (existingUser.length === 0) {
      console.log(`❌ User with email ${email} not found`);
      return;
    }

    const user = existingUser[0];
    console.log(`📧 Found user: ${user.firstName} ${user.lastName} (${user.email})`);
    console.log(`👤 Current role: ${user.role}`);

    if (user.role === 'admin') {
      console.log(`ℹ️ User ${email} is already an admin`);
      return;
    }

    // Update user to admin role
    await db.update(users)
      .set({ 
        role: 'admin',
        updatedAt: new Date()
      })
      .where(eq(users.email, email));

    console.log(`✅ Successfully made ${email} an admin!`);
    console.log(`🎉 User can now access the admin dashboard at /admin`);

  } catch (error) {
    console.error("❌ Error making user admin:", error);
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.log("❌ Please provide an email address");
  console.log("Usage: npx tsx server/make-admin.ts user@example.com");
  process.exit(1);
}

makeUserAdmin(email).then(() => process.exit(0));
