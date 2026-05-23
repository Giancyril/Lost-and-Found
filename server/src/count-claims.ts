import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const allClaims = await prisma.claim.findMany({
    include: {
      foundItem: true
    }
  });
  console.log("Total claims in DB:", allClaims.length);
  console.log("Claims with isDeleted=false:", allClaims.filter(c => !c.isDeleted).length);
  console.log("Claims with isDeleted=false and foundItem.isDeleted=false:", allClaims.filter(c => !c.isDeleted && c.foundItem && !c.foundItem.isDeleted).length);
  console.log("Details:");
  allClaims.forEach(c => {
    console.log(`- ID: ${c.id}, Claimant: ${c.claimantName}, isDeleted: ${c.isDeleted}, FoundItem: ${c.foundItem ? `ID: ${c.foundItem.id}, Name: ${c.foundItem.foundItemName}, isDeleted: ${c.foundItem.isDeleted}` : 'null'}`);
  });
}
main().catch(err => console.error(err)).finally(() => prisma.$disconnect());
