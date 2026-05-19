const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function run() {
  try {
    console.log("Connecting to Database...");
    const categories = await prisma.itemCategory.findMany({
      select: { id: true, name: true }
    });
    console.log("Success! Categories found:", categories.length);
    console.log(categories);
  } catch (err) {
    console.error("Database connection failed!");
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
