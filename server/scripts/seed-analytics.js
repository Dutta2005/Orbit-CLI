import prisma from "../src/lib/db.js";

async function seedAnalytics() {
  try {
    console.log("🌱 Seeding analytics data...");

    // Get the first user
    const user = await prisma.user.findFirst();
    
    if (!user) {
      console.log("⚠️  No users found. Please login first using 'orbit login'");
      return;
    }

    console.log(`📊 Creating analytics for user: ${user.name}`);

    // Create command logs
    const commands = [
      { command: "login", status: "success", duration: 1200 },
      { command: "wakeup", status: "success", duration: 450 },
      { command: "wakeup", status: "success", duration: 380 },
      { command: "config", status: "success", duration: 890 },
      { command: "wakeup", status: "failure", duration: 250, errorMessage: "AI service error" },
      { command: "logout", status: "success", duration: 150 },
      { command: "login", status: "success", duration: 1100 },
      { command: "wakeup", status: "success", duration: 420 },
    ];

    for (const cmd of commands) {
      await prisma.commandLog.create({
        data: {
          userId: user.id,
          command: cmd.command,
          status: cmd.status,
          duration: cmd.duration,
          errorMessage: cmd.errorMessage || null,
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last 7 days
        },
      });
    }

    console.log(`✅ Created ${commands.length} command logs`);

    // Create API call logs
    const apiCalls = [
      { provider: "google", model: "gemini-2.5-flash", status: "success", duration: 1200, tokensUsed: 450 },
      { provider: "google", model: "gemini-2.5-flash", status: "success", duration: 980, tokensUsed: 380 },
      { provider: "google", model: "gemini-2.0-flash-exp", status: "success", duration: 1450, tokensUsed: 520 },
      { provider: "google", model: "gemini-2.5-flash", status: "failure", duration: 450, errorMessage: "Rate limit exceeded" },
      { provider: "google", model: "gemini-1.5-pro", status: "success", duration: 2100, tokensUsed: 890 },
      { provider: "google", model: "gemini-2.5-flash", status: "success", duration: 1050, tokensUsed: 420 },
      { provider: "google", model: "gemini-2.0-flash-exp", status: "success", duration: 1300, tokensUsed: 480 },
    ];

    for (const call of apiCalls) {
      await prisma.apiCallLog.create({
        data: {
          userId: user.id,
          provider: call.provider,
          model: call.model,
          status: call.status,
          duration: call.duration,
          tokensUsed: call.tokensUsed || null,
          errorMessage: call.errorMessage || null,
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last 7 days
        },
      });
    }

    console.log(`✅ Created ${apiCalls.length} API call logs`);
    console.log("\n🎉 Analytics data seeded successfully!");
    console.log("\n📈 View your analytics at: http://localhost:3000/analytics");
    
  } catch (error) {
    console.error("❌ Error seeding data:", error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedAnalytics()
  .catch((error) => {
    console.error("❌ Fatal error during seeding:", error);
    process.exit(1);
  });
