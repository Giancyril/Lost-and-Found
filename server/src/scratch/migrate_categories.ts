
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
  try {
    // 1. Find the old category
    const oldCategory = await prisma.itemCategory.findFirst({
      where: {
        name: {
          contains: 'ID & Documents',
          mode: 'insensitive'
        }
      }
    });

    if (!oldCategory) {
      console.log('Could not find "ID & Documents" category.');
      return;
    }

    // 2. Find the new "ID" category
    const newCategory = await prisma.itemCategory.findFirst({
      where: {
        name: {
          equals: 'ID',
          mode: 'insensitive'
        }
      }
    });

    if (!newCategory) {
      console.log('Could not find new "ID" category. Please create it first.');
      return;
    }

    console.log(`Migrating items from ${oldCategory.name} (${oldCategory.id}) to ${newCategory.name} (${newCategory.id})...`);

    // 3. Update FoundItems
    const foundUpdate = await prisma.foundItem.updateMany({
      where: { categoryId: oldCategory.id },
      data: { categoryId: newCategory.id }
    });

    // 4. Update LostItems
    const lostUpdate = await prisma.lostItem.updateMany({
      where: { categoryId: oldCategory.id },
      data: { categoryId: newCategory.id }
    });

    console.log(`Updated ${foundUpdate.count} found items.`);
    console.log(`Updated ${lostUpdate.count} lost items.`);
    console.log('Migration complete. You should now be able to delete the old category.');

  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
