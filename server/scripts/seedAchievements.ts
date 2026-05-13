import { seedAchievements } from "../src/app/utils/achievementService";

async function runSeed() {
  console.log("Seeding achievements...");
  try {
    await seedAchievements();
    console.log("Achievements seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding achievements:", error);
    process.exit(1);
  }
}

runSeed();
