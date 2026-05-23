import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── Category ID map ───────────────────────────────────────────────────────────
const CAT: Record<string, string> = {
  "id":          "c3da0e96-ca47-41cb-9d29-fbe2b86077b4", // ID
  "clothing":    "6d9205f0-ff1a-45cf-948d-b3dea7ce5ee6", // Clothing
  "books":       "d3e51ece-88bf-4fdf-9f76-5374acc0eccf", // Books & Stationery
  "keys":        "1e399a4d-0efd-47ba-aaa3-77934c349b26", // Keys
  "tumbler":     "80356849-ca93-4aca-9138-52dd7712ed8d", // Water Bottles & Tumblers
  "glasses":     "ff082cf3-faea-4c45-9be9-b8a773e6cccd", // Eyeglasses & Sunglasses
  "umbrella":    "57d59896-1153-4a68-b24f-04b6bc8cf11a", // Umbrellas
  "earphones":   "43a82067-b4b6-4b72-8003-68899a89e712", // Headphones & Earphones
  "charger":     "2c180ace-b700-4861-97d7-9a8312b1b236", // Chargers & Cables
  "wallet":      "0761e82e-93f3-4f5f-abd3-b6dc0d219268", // Wallets & Purses
  "watch":       "24447c6f-9ac5-439d-a235-285c2bbbec76", // Watches
  "others":      "bc621257-d639-495c-97ad-7a76c00bb638", // Others
  "bags":        "cb7cf87d-6f18-481e-b313-22862ba42578", // Bags
  "money":       "6135d56f-82c4-4bca-af78-9ffaacb4262f", // Money
  "device":      "94abd401-635e-4839-ba0e-a52f18fbf06d", // Device (phones)
  "documents":   "b94e6fb6-d2d1-4665-91ea-32b351176110", // Documents
  "accessories": "5da859df-33e1-4db1-b8fd-e53973e985c0", // Accessories
};

// ── Determine category from item name ─────────────────────────────────────────
function getCategory(item: string): string {
  const n = item.toLowerCase();
  if (n.includes("id") || n.includes("student id") || n.includes("ojt id") || n.includes("philhealth") || n.includes("ofw id")) return CAT.id;
  if (n.includes("cellphone") || n.includes("phone") || n.includes("mobile")) return CAT.device;
  if (n.includes("charger") || n.includes("cable")) return CAT.charger;
  if (n.includes("umbrella")) return CAT.umbrella;
  if (n.includes("tumbler") || n.includes("water") || n.includes("aquaflask") || n.includes("flask")) return CAT.tumbler;
  if (n.includes("key") || n.includes("vehicle key") || n.includes("motor")) return CAT.keys;
  if (n.includes("wallet") || n.includes("purse")) return CAT.wallet;
  if (n.includes("watch")) return CAT.watch;
  if (n.includes("glasses") || n.includes("sunglass") || n.includes("eyewear")) return CAT.glasses;
  if (n.includes("earphone") || n.includes("earbuds") || n.includes("headphone")) return CAT.earphones;
  if (n.includes("bag") || n.includes("backpack") || n.includes("manuscript")) return CAT.bags;
  if (n.includes("notebook") || n.includes("book") || n.includes("pencil") || n.includes("folder") || n.includes("paper") || n.includes("claim slip")) return CAT.books;
  if (n.includes("money") || n.includes("cash")) return CAT.money;
  if (n.includes("blazer") || n.includes("jacket") || n.includes("uniform") || n.includes("shirt") || n.includes("heels") || n.includes("shoes") || n.includes("boots")) return CAT.clothing;
  if (n.includes("fan") || n.includes("mini fan")) return CAT.accessories;
  if (n.includes("hair") || n.includes("clip") || n.includes("lanyard")) return CAT.accessories;
  if (n.includes("document") || n.includes("envelope") || n.includes("certificate")) return CAT.documents;
  return CAT.others;
}

// ── Date parser ───────────────────────────────────────────────────────────────
function parseDate(raw: string): Date {
  const s = raw.trim();
  const shortMonthMatch = s.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2})$/);
  if (shortMonthMatch) {
    const [, day, mon, yr] = shortMonthMatch;
    const months: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
    };
    const m = months[mon.toLowerCase()] ?? 0;
    return new Date(Date.UTC(2000 + parseInt(yr), m, parseInt(day)));
  }
  const slashMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, mo, dy, yr] = slashMatch;
    return new Date(Date.UTC(parseInt(yr), parseInt(mo) - 1, parseInt(dy)));
  }
  return new Date(s);
}

// ── The 63 skipped items to create as claimed ─────────────────────────────────
const SKIPPED_ITEMS = [
  { claimant: "Reniel J. Pacutan",               item: "ID",              date: "9/22/2025" },
  { claimant: "Ragasi, Jo Lore",                 item: "Bag",             date: "2/11/2026" },
  { claimant: "Buikaton, Cherry Anne M.",         item: "Cellphone",       date: "3/9/2026" },
  { claimant: "Axelle H. Mandayo",               item: "Cellphone",       date: "6-Nov-25" },
  { claimant: "Legaspi, Daisy Jane",             item: "Cellphone",       date: "12-Nov-25" },
  { claimant: "Fernandez, John Joseph D.",        item: "Charger",         date: "3/24/2026" },
  { claimant: "Antolinau, Jephex",               item: "Charger",         date: "3/2/2026" },
  { claimant: "Sawanio, Yna Andrea C.",           item: "Claim Slip",      date: "12/10/2025" },
  { claimant: "Granada, Adrian Mark C.",          item: "Watch",           date: "3/30/2026" },
  { claimant: "John Klient C. Cabugnason",        item: "Earphones",       date: "4/8/2026" },
  { claimant: "Diloy, Glenneth Mae",             item: "Folder",          date: "2/3/2026" },
  { claimant: "Cagape, Charlene Mae M.",          item: "Glasses",         date: "12/10/2025" },
  { claimant: "Kate Justine E. Bagongon",         item: "Hair Clip",       date: "2/25/2026" },
  { claimant: "Jane Baldesamso C.",              item: "Hand Fan",         date: "9/15/2025" },
  { claimant: "Elcita Kyna L. Dapat",            item: "Heels",           date: "3/16/2026" },
  { claimant: "Maglasang, Hazel Ann O.",          item: "ID",              date: "4/16/2026" },
  { claimant: "Bolinquit, Ruxmar L.",            item: "ID",              date: "4/16/2026" },
  { claimant: "Michelle N. Cagalitan",           item: "ID",              date: "9/9/2025" },
  { claimant: "Lindley L. Vitor",               item: "ID",              date: "9-Oct-25" },
  { claimant: "Aple Jane P. Asis",              item: "ID",              date: "3-Nov-25" },
  { claimant: "Franzil P. Ubalde",              item: "ID",              date: "7-Nov-25" },
  { claimant: "Pandang, Dom Justin John E.",     item: "ID",              date: "19-Nov-25" },
  { claimant: "MOQUETE, EZRON S.",              item: "ID",              date: "14-Nov-25" },
  { claimant: "Tuctuc, Leanne G.",              item: "ID",              date: "20-Nov-25" },
  { claimant: "Hapayon, Daphne Andrea",          item: "ID",              date: "21-Nov-25" },
  { claimant: "Crystal Guilangon",              item: "ID",              date: "11/28/2025" },
  { claimant: "Bacolando, Riela Mae B.",         item: "ID",              date: "12/1/2025" },
  { claimant: "Denmaric B. Camilong",           item: "ID",              date: "12/8/2025" },
  { claimant: "Mabilata, Maria Josephine B.",    item: "ID",              date: "12/9/2025" },
  { claimant: "Gultiano, Neil James R.",         item: "ID",              date: "12/7/2025" },
  { claimant: "April Rose B. Cabang",           item: "ID",              date: "12/11/2025" },
  { claimant: "Junry M. Edani",                 item: "ID",              date: "1/12/2026" },
  { claimant: "Jhoan L. Lopitana",              item: "ID",              date: "1/13/2026" },
  { claimant: "Balancas, Ranje Troy",           item: "ID",              date: "2/9/2026" },
  { claimant: "JOHN LLOYD E. SUA FAN",           item: "Key",             date: "3/12/2026" },
  { claimant: "Alba, Jocel D.",                 item: "Key",             date: "12-Nov-25" },
  { claimant: "Crystel Guilangon",              item: "Key",             date: "2/12/2026" },
  { claimant: "Dorque, John Lloyd",             item: "Key",             date: "2/12/2026" },
  { claimant: "MARK JASON M. JAPLANCO",          item: "Key",             date: "1/28/2026" },
  { claimant: "Raki A. Pinohon",               item: "Vehicle Key",      date: "9/26/2025" },
  { claimant: "Lovely Mymh L. Homanlay",        item: "ID",              date: "2/19/2026" },
  { claimant: "Faciol, Zea Mae S.",             item: "Wallet",          date: "12/5/2025" },
  { claimant: "Antolinau, Jephex P.",           item: "Mini Fan",        date: "16-Oct-25" },
  { claimant: "Kothchel Keshia A. Ramirez",     item: "Mini Fan",        date: "10/24/2025" },
  { claimant: "Vilanova, Jamaica",              item: "Money",           date: "2/11/2026" },
  { claimant: "Amans, Julius C. Canua",          item: "Motorcycle Key",  date: "19-Nov-25" },
  { claimant: "Mark Renald S. Jutba",           item: "Notebook",        date: "4/8/2026" },
  { claimant: "Mono Boel Castro",               item: "Notebook",        date: "3/19/2026" },
  { claimant: "Mark Paredin",                   item: "Notebook",        date: "9/18/2025" },
  { claimant: "Jason E. Anasco",               item: "ID",              date: "2/18/2026" },
  { claimant: "Erika Jane A. Labian",           item: "Paper Bag",       date: "1/26/2026" },
  { claimant: "Estaño, KC May T.",              item: "Pencil Case",     date: "10/23/2025" },
  { claimant: "Doblas, Jhonth Dave Lauren",      item: "ID",              date: "5-Sep-25" },
  { claimant: "April Rose B. Cabana",           item: "Tumbler",         date: "10/27/2025" },
  { claimant: "Hustohan, Lara Mae P.",          item: "Tumbler",         date: "2/9/2026" },
  { claimant: "Sablo, Jessa Mae",               item: "Tumbler",         date: "5/13/2026" },
  { claimant: "Guroclyn, Giannecan B.",          item: "Umbrella",        date: "12/10/2025" },
  { claimant: "Juhnao P. Florendo",             item: "Umbrella",        date: "2/18/2026" },
  { claimant: "Lester Angelo C. Dalde",          item: "Umbrella",        date: "2/27/2026" },
  { claimant: "Aiza P. Janlay",                 item: "Umbrella",        date: "12/11/2025" },
  { claimant: "Inlanan, Peliza Mae C.",          item: "Umbrella",        date: "12/11/2025" },
  { claimant: "Cabasagan, Mary Claire D.",       item: "Wallet",          date: "3/9/2026" },
  { claimant: "Erita G. Sullanon",              item: "Wallet",          date: "1/5/2026" },
  { claimant: "Ompocan, Jonathan Dare M.",       item: "Key",             date: "4/30/2026" }, 
];

async function main() {
  console.log("=== Creating 63 Claimed-Only Found Items ===\n");

  // Get a fallback admin user to assign as reporter (or leave null)
  const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } });

  let created = 0;
  let failed = 0;

  for (const entry of SKIPPED_ITEMS) {
    try {
      const itemDate = parseDate(entry.date);
      const categoryId = getCategory(entry.item);

      await prisma.foundItem.create({
        data: {
          foundItemName:  entry.item,
          description:    "[Historical Data - Claimed Record] Item was claimed directly. Returned to owner by SAS office.",
          location:       "SAS Office",
          date:           itemDate,
          categoryId,
          isClaimed:      true,
          reporterName:   entry.claimant,
          img:            "https://placehold.co/400x300/1a1a2e/9ca3af?text=Historical+Record",
          userId:         adminUser?.id ?? null,
        },
      });

      created++;
      console.log(`  ✅ Created: "${entry.item}" on ${entry.date} — Claimant: ${entry.claimant}`);
    } catch (err: any) {
      failed++;
      console.error(`  ❌ Failed: "${entry.item}" on ${entry.date} — ${err.message}`);
    }
  }

  console.log(`\n=== DONE ===`);
  console.log(`✅ Created: ${created}`);
  console.log(`❌ Failed:  ${failed}`);
}

main().catch(console.error);
