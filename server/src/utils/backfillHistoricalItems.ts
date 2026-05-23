import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

const prisma = new PrismaClient();

const dataPath = path.join(__dirname, "historical_data.txt");
const rawData = fs.readFileSync(dataPath, "utf-8");

const categoryMapping: Record<string, string> = {
  id: "c3da0e96-ca47-41cb-9d29-fbe2b86077b4",
  charger: "2c180ace-b700-4861-97d7-9a8312b1b236",
  "charger connector": "2c180ace-b700-4861-97d7-9a8312b1b236",
  money: "6135d56f-82c4-4bca-af78-9ffaacb4262f",
  jacket: "6d9205f0-ff1a-45cf-948d-b3dea7ce5ee6",
  cellphone: "94abd401-635e-4839-ba0e-a52f18fbf06d",
  phone: "94abd401-635e-4839-ba0e-a52f18fbf06d",
  usb: "1c09099f-eaf4-46e5-b12d-09a89e6a3f3e",
  wallet: "0761e82e-93f3-4f5f-abd3-b6dc0d219268",
  hat: "6d9205f0-ff1a-45cf-948d-b3dea7ce5ee6",
  shades: "ff082cf3-faea-4c45-9be9-b8a773e6cccd",
  umbrella: "57d59896-1153-4a68-b24f-04b6bc8cf11a",
  key: "1e399a4d-0efd-47ba-aaa3-77934c349b26",
  keys: "1e399a4d-0efd-47ba-aaa3-77934c349b26",
  aquaflask: "80356849-ca93-4aca-9138-52dd7712ed8d",
  tumbler: "80356849-ca93-4aca-9138-52dd7712ed8d",
  fan: "734819d4-bc27-4a0d-a683-7db7fffd9564",
  notebook: "d3e51ece-88bf-4fdf-9f76-5374acc0eccf",
  document: "b94e6fb6-d2d1-4665-91ea-32b351176110",
  envelope: "b94e6fb6-d2d1-4665-91ea-32b351176110",
  calculator: "6a82da33-4734-493c-980b-a1b392794094",
  watch: "24447c6f-9ac5-439d-a235-285c2bbbec76",
  earbuds: "43a82067-b4b6-4b72-8003-68899a89e712",
  bag: "cb7cf87d-6f18-481e-b313-22862ba42578",
  pouch: "cb7cf87d-6f18-481e-b313-22862ba42578",
  "clip board": "d3e51ece-88bf-4fdf-9f76-5374acc0eccf",
  pin: "4b570af6-1b05-4d3d-8969-c0846c099169",
  boots: "6d9205f0-ff1a-45cf-948d-b3dea7ce5ee6",
  "pencil case": "d3e51ece-88bf-4fdf-9f76-5374acc0eccf",
  shorts: "6d9205f0-ff1a-45cf-948d-b3dea7ce5ee6",
  keychain: "5da859df-33e1-4db1-b8fd-e53973e985c0",
  sayal: "6d9205f0-ff1a-45cf-948d-b3dea7ce5ee6",
  mat: "bc621257-d639-495c-97ad-7a76c00bb638",
  polo: "6d9205f0-ff1a-45cf-948d-b3dea7ce5ee6",
  "t-shirt": "6d9205f0-ff1a-45cf-948d-b3dea7ce5ee6",
  "pwd-id": "c3da0e96-ca47-41cb-9d29-fbe2b86077b4",
  cap: "6d9205f0-ff1a-45cf-948d-b3dea7ce5ee6",
  card: "b94e6fb6-d2d1-4665-91ea-32b351176110",
  tuxedo: "6d9205f0-ff1a-45cf-948d-b3dea7ce5ee6",
  "memory card": "1c09099f-eaf4-46e5-b12d-09a89e6a3f3e",
  comb: "5da859df-33e1-4db1-b8fd-e53973e985c0",
  binder: "d3e51ece-88bf-4fdf-9f76-5374acc0eccf",
  stick: "bc621257-d639-495c-97ad-7a76c00bb638"
};

function determineCategory(itemName: string): string {
  const nameLower = itemName.toLowerCase();
  for (const [key, categoryId] of Object.entries(categoryMapping)) {
    if (nameLower.includes(key)) {
      return categoryId;
    }
  }
  return "bc621257-d639-495c-97ad-7a76c00bb638";
}

const lines = rawData.trim().split("\n");
const items = lines.map(line => {
  const cols = line.split("\t");
  if (cols.length < 5) return null;
  
  const name = cols[1].trim();
  const itemName = cols[3].trim();
  const dateStr = cols[4].trim();
  const location = cols[5] ? cols[5].trim() : "Unknown / Campus";

  const [month, day, year] = dateStr.split("/");
  const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

  return {
    id: crypto.randomUUID(),
    foundItemName: itemName,
    description: "[Historical Data - Imported]",
    location,
    date: dateObj,
    reporterName: name,
    categoryId: determineCategory(itemName),
    img: "https://placehold.co/600x400/1e293b/a1a1aa?text=Historical+Record%5CnNo+Image+Available",
    isClaimed: false
  };
}).filter(item => item !== null) as any[];

async function main() {
  console.log("Found " + items.length + " items to insert.");
  
  await prisma.foundItem.createMany({
    data: items
  });

  console.log("Successfully backfilled historical items!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
