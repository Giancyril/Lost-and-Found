import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── Raw claimed items data ────────────────────────────────────────────────────
const CLAIMED_DATA = [
  { name: "Reniel J. Pacutan", item: "ID", date: "9/22/2025" },
  { name: "Ragasi, Jo Lore", item: "Bag", date: "2/11/2026" },
  { name: "", item: "Blazer Black", date: "5/4/2026" },
  { name: "Annavi Espallardo", item: "Cellphone", date: "3/24/2026" },
  { name: "Vincent Rey Jamama", item: "Cellphone", date: "3/24/2026" },
  { name: "Vince Niño L. Gerong", item: "Cellphone", date: "4/22/2026" },
  { name: "Jelah Binayao", item: "Cellphone", date: "4/15/2026" },
  { name: "Espallardo, Samantha S.", item: "Cellphone", date: "5/5/2026" },
  { name: "Buikaton, Cherry Anne M.", item: "Cellphone", date: "3/9/2026" },
  { name: "Jean Caroline H. Pinayao", item: "Cellphone", date: "3/19/2026" },
  { name: "Sthyven Tura", item: "Cellphone", date: "9/16/2025" },
  { name: "Vanesse T. Madrial", item: "Cellphone", date: "9/25/2025" },
  { name: "Loren Grace S. Humayag", item: "Cellphone", date: "9/30/2025" },
  { name: "Axelle H. Mandayo", item: "Cellphone", date: "6-Nov-25" },
  { name: "Legaspi, Daisy Jane", item: "Cellphone", date: "12-Nov-25" },
  { name: "Gankris C. Modesto", item: "Cellphone", date: "2/10/2026" },
  { name: "Liloan, Arabelle Grace", item: "Cellphone", date: "2/10/2026" },
  { name: "Dela Cruz, Adrian B.", item: "Cellphone", date: "2/11/2026" },
  { name: "Coyoca, Nico C.", item: "Cellphone", date: "2/12/2026" },
  { name: "BEBIE C. JAZMINES JR.", item: "Cellphone", date: "1/14/2026" },
  { name: "Catayas, Rian J.", item: "Cellphone", date: "2/9/2026" },
  { name: "Emm Jay A. Rodriguez", item: "Cellphone & Charger", date: "4/22/2026" },
  { name: "Fernandez, John Joseph D.", item: "Charger", date: "3/24/2026" },
  { name: "Antolinau, Jephex", item: "Charger", date: "3/2/2026" },
  { name: "Jhon Christian C. Lapes", item: "Charger", date: "2/25/2026" },
  { name: "Sawanio, Yna Andrea C.", item: "Claim Slip", date: "12/10/2025" },
  { name: "Granada, Adrian Mark C.", item: "Watch", date: "3/30/2026" },
  { name: "Burburan, Keren Jemimah E.", item: "Umbrella", date: "4/6/2026" },
  { name: "Lintuan, John Valle C.", item: "Key", date: "4/30/2026" },
  { name: "John Klient C. Cabugnason", item: "Earphones", date: "4/8/2026" },
  { name: "Ranudell L. Compendio", item: "Envelope", date: "4/21/2026" },
  { name: "Diloy, Glenneth Mae", item: "Folder", date: "2/3/2026" },
  { name: "Cagape, Charlene Mae M.", item: "Glasses", date: "12/10/2025" },
  { name: "Kate Justine E. Bagongon", item: "Hair Clip", date: "2/25/2026" },
  { name: "Jane Baldesamso C.", item: "Hand Fan", date: "9/15/2025" },
  { name: "Elcita Kyna L. Dapat", item: "Heels", date: "3/16/2026" },
  { name: "Ando, Mecayla A.", item: "ID", date: "3/23/2026" },
  { name: "Figueroa, Alexander Dominic S.", item: "ID", date: "3/23/2026" },
  { name: "Dela Cerna, Liezel Jane E.", item: "ID", date: "3/24/2026" },
  { name: "Himaos, Jerwin J.", item: "ID", date: "3/24/2026" },
  { name: "Villa, Andre A.", item: "ID", date: "3/25/2026" },
  { name: "Himulatan, Chlier M.", item: "ID", date: "4/6/2026" },
  { name: "Cabang, Junmeldeso A.", item: "ID", date: "4/8/2026" },
  { name: "Jessabib Hilayon", item: "ID", date: "4/13/2026" },
  { name: "Anian, Donald Ferdy C.", item: "ID", date: "4/14/2026" },
  { name: "Zyreen Mae D. Taoy", item: "ID", date: "4/15/2026" },
  { name: "Keanne Myrille T. Madrid", item: "ID", date: "4/15/2026" },
  { name: "Maglasang, Hazel Ann O.", item: "ID", date: "4/16/2026" },
  { name: "Bolinquit, Ruxmar L.", item: "ID", date: "4/16/2026" },
  { name: "Dela Cerna, Liezel Jane E.", item: "ID", date: "4/20/2026" },
  { name: "Jan M. Navarro", item: "ID", date: "4/20/2026" },
  { name: "Arvin Glen Hinoyog", item: "ID", date: "4/21/2026" },
  { name: "Israelah Myrah F. Bendit", item: "ID", date: "4/22/2026" },
  { name: "Guanzon, Jemy Angelo", item: "ID", date: "4/28/2026" },
  { name: "Cepada, Gracezel Mae P.", item: "ID", date: "4/29/2026" },
  { name: "Dasilao, Ma. Alessandra A.", item: "ID", date: "4/30/2026" },
  { name: "Hadjula, Nur-Aine B.", item: "ID", date: "5/4/2026" },
  { name: "Quino, Nicole", item: "ID", date: "3/3/2026" },
  { name: "BERIOS, KIMEE", item: "ID", date: "3/3/2026" },
  { name: "LABRADOR, GIAN C.", item: "ID", date: "3/3/2026" },
  { name: "Tumulak, Juana N.", item: "ID", date: "3/3/2026" },
  { name: "MJ Magsalos", item: "ID", date: "3/4/2026" },
  { name: "Lopez, Christian Junel L.", item: "ID", date: "3/4/2026" },
  { name: "Paran, Angel C.", item: "ID", date: "3/10/2026" },
  { name: "RePuela, Jaymie Darl V.", item: "ID", date: "3/10/2026" },
  { name: "Iwilongan, Mecailla Ailez D.", item: "ID", date: "3/16/2026" },
  { name: "Remiter, E. Pilones", item: "ID", date: "3/16/2026" },
  { name: "Jhon Rommel D. Oloma", item: "ID", date: "3/19/2026" },
  { name: "Rina Jane M. Linday", item: "ID", date: "3/23/2026" },
  { name: "Jran Cordova", item: "ID", date: "12-Sep-25" },
  { name: "Varssa Obra Daniaganan", item: "ID", date: "12-Sep-25" },
  { name: "Kristine B. Rodriguez", item: "ID", date: "9/12/2025" },
  { name: "Frie Jose Morales", item: "ID", date: "9/26/2025" },
  { name: "Michelle N. Cagalitan", item: "ID", date: "9/9/2025" },
  { name: "Lindley L. Vitor", item: "ID", date: "9-Oct-25" },
  { name: "Carmelitis, Ralyn", item: "ID", date: "14-Oct-25" },
  { name: "Denmaric B. Camilong", item: "ID", date: "14-Oct-25" },
  { name: "Aple Jane P. Asis", item: "ID", date: "3-Nov-25" },
  { name: "Franzil P. Ubalde", item: "ID", date: "7-Nov-25" },
  { name: "Pandang, Dom Justin John E.", item: "ID", date: "19-Nov-25" },
  { name: "MOQUETE, EZRON S.", item: "ID", date: "14-Nov-25" },
  { name: "Tuctuc, Leanne G.", item: "ID", date: "20-Nov-25" },
  { name: "Hapayon, Daphne Andrea", item: "ID", date: "21-Nov-25" },
  { name: "Crystal Guilangon", item: "ID", date: "11/28/2025" },
  { name: "Bacolando, Riela Mae B.", item: "ID", date: "12/1/2025" },
  { name: "Denmaric B. Camilong", item: "ID", date: "12/8/2025" },
  { name: "Mabilata, Maria Josephine B.", item: "ID", date: "12/9/2025" },
  { name: "Gultiano, Neil James R.", item: "ID", date: "12/7/2025" },
  { name: "Dan Morris L. Hagonon", item: "ID", date: "2/10/2026" },
  { name: "Cristelna C. Ipalza", item: "ID", date: "2/10/2026" },
  { name: "Kyle Jove Maceren", item: "ID", date: "2/10/2026" },
  { name: "Geloran, Rhea Jean C.", item: "ID", date: "2/12/2026" },
  { name: "Derryl Quiño", item: "ID", date: "2/12/2026" },
  { name: "Jendy Lou L. Bautista", item: "ID", date: "2/12/2026" },
  { name: "Badayos, Monica H.", item: "ID", date: "2/12/2026" },
  { name: "Zamayla, Adrian Vince Louis J.", item: "ID", date: "2/13/2026" },
  { name: "Antonette Audrey Juliban", item: "ID", date: "2/23/2026" },
  { name: "Gretchen K. Sual", item: "ID", date: "2/23/2026" },
  { name: "Balendez, Daniel James A.", item: "ID", date: "2/26/2026" },
  { name: "Sarimo, Charmaine Pearl S.", item: "ID", date: "2/26/2026" },
  { name: "Guenton, Jesmael", item: "ID", date: "2/27/2026" },
  { name: "April Rose B. Cabang", item: "ID", date: "12/11/2025" },
  { name: "Missy T. Daigon", item: "ID", date: "12/16/2025" },
  { name: "Cristine Marie L. Sinangote", item: "ID", date: "1/6/2026" },
  { name: "HARVEY R. ALANDUGAN", item: "ID", date: "1/6/2026" },
  { name: "Junry M. Edani", item: "ID", date: "1/12/2026" },
  { name: "Jhoan L. Lopitana", item: "ID", date: "1/13/2026" },
  { name: "Kehn Kirsten C. Arebar", item: "ID", date: "1/22/2026" },
  { name: "Nian Niño Leonil L. Ruelito", item: "ID", date: "1/23/2026" },
  { name: "Balancas, Ranje Troy", item: "ID", date: "2/9/2026" },
  { name: "Lampon, Keith James", item: "ID", date: "2/11/2026" },
  { name: "Palanas, Neilbert A.", item: "ID", date: "2/12/2026" },
  { name: "Donque", item: "ID", date: "5/6/2026" },
  { name: "Datu, Aiza Mae L.", item: "ID", date: "5/6/2026" },
  { name: "Lalaman, Earl Vincent", item: "ID", date: "5/12/2026" },
  { name: "Teong, Marialyn", item: "ID", date: "5/14/2026" },
  { name: "Pelvera, Mikko Louise A.", item: "Key", date: "3/24/2026" },
  { name: "JOHN LLOYD E. SUA FAN", item: "Key", date: "3/12/2026" },
  { name: "Janrey G. Alcover", item: "Key", date: "16-Oct-25" },
  { name: "Alba, Jocel D.", item: "Key", date: "12-Nov-25" },
  { name: "Crystel Guilangon", item: "Key", date: "2/12/2026" },
  { name: "Dorque, John Lloyd", item: "Key", date: "2/12/2026" },
  { name: "MARK JASON M. JAPLANCO", item: "Key", date: "1/28/2026" },
  { name: "Laina, Benedict S.", item: "Key", date: "5/6/2026" },
  { name: "Binayao, Charmain-Ann C.", item: "Key Chain Flower", date: "4/29/2026" },
  { name: "Raki A. Pinohon", item: "Vehicle Key", date: "9/26/2025" },
  { name: "Lovely Mymh L. Homanlay", item: "ID", date: "2/19/2026" },
  { name: "Faciol, Zea Mae S.", item: "Wallet", date: "12/5/2025" },
  { name: "Antolinau, Jephex P.", item: "Mini Fan", date: "16-Oct-25" },
  { name: "Kothchel Keshia A. Ramirez", item: "Mini Fan", date: "10/24/2025" },
  { name: "Vilanova, Jamaica", item: "Money", date: "2/11/2026" },
  { name: "Ompocan, Jonathan Dare M.", item: "Key", date: "4/30/2026" },
  { name: "Zuce, Rica Jean S.", item: "Key", date: "3/3/2026" },
  { name: "Amans, Julius C. Canua", item: "Motorcycle Key", date: "19-Nov-25" },
  { name: "Daquio, Dave", item: "Motorcycle Key", date: "1/27/2026" },
  { name: "Mark Renald S. Jutba", item: "Notebook", date: "4/8/2026" },
  { name: "Mono Boel Castro", item: "Notebook", date: "3/19/2026" },
  { name: "Mark Paredin", item: "Notebook", date: "9/18/2025" },
  { name: "Jason E. Anasco", item: "ID", date: "2/18/2026" },
  { name: "Erika Jane A. Labian", item: "Paper Bag", date: "1/26/2026" },
  { name: "Estaño, KC May T.", item: "Pencil Case", date: "10/23/2025" },
  { name: "Syboc, Rhea Mae P.", item: "ID", date: "3/9/2026" },
  { name: "Doblas, Jhonth Dave Lauren", item: "ID", date: "5-Sep-25" },
  { name: "Tulugco, Blazy Kyle R.", item: "Tumbler", date: "4/8/2026" },
  { name: "Cabong, April Rose B.", item: "Tumbler", date: "4/15/2026" },
  { name: "Esleen, B. Cealipo", item: "Tumbler", date: "4/15/2026" },
  { name: "Jastyne Love Hope T. Baguio", item: "Tumbler", date: "9-Sep-25" },
  { name: "Josh Sanday", item: "Tumbler", date: "9/22/2025" },
  { name: "Bench Manalobang", item: "Tumbler", date: "9/23/2025" },
  { name: "Richel D. Defiesta", item: "Tumbler", date: "9/25/2025" },
  { name: "April Rose B. Cabana", item: "Tumbler", date: "10/27/2025" },
  { name: "Hustohan, Lara Mae P.", item: "Tumbler", date: "2/9/2026" },
  { name: "Cabang, April Rose B.", item: "Tumbler", date: "5/6/2026" },
  { name: "Sablo, Jessa Mae", item: "Tumbler", date: "5/13/2026" },
  { name: "Gulay, Michelle Angela D.", item: "Umbrella", date: "3/24/2026" },
  { name: "Abriol, Abeguil M.", item: "Umbrella", date: "3/26/2026" },
  { name: "Balaod, Faye C.", item: "Umbrella", date: "3/30/2026" },
  { name: "Roma, Remar", item: "Umbrella", date: "3/30/2026" },
  { name: "Tunayan, Rachel Grace", item: "Umbrella", date: "4/6/2026" },
  { name: "Fiona Angel G. Manhua", item: "Umbrella", date: "4/8/2026" },
  { name: "Gavayon, Ramon P. III", item: "Umbrella", date: "3/3/2026" },
  { name: "Sarimos, Charmaine Pearl S.", item: "Umbrella", date: "3/16/2026" },
  { name: "Guroclyn, Giannecan B.", item: "Umbrella", date: "12/10/2025" },
  { name: "Juhnao P. Florendo", item: "Umbrella", date: "2/18/2026" },
  { name: "Lester Angelo C. Dalde", item: "Umbrella", date: "2/27/2026" },
  { name: "Aiza P. Janlay", item: "Umbrella", date: "12/11/2025" },
  { name: "Inlanan, Peliza Mae C.", item: "Umbrella", date: "12/11/2025" },
  { name: "Pagal, Ismael Nathaniel S.", item: "Umbrella", date: "3/30/2026" },
  { name: "Daron, Via Camara", item: "Wallet", date: "4/22/2026" },
  { name: "Cordita, Fionalen", item: "Wallet", date: "3/2/2026" },
  { name: "Cabasagan, Mary Claire D.", item: "Wallet", date: "3/9/2026" },
  { name: "Jose Maria P. Cabreros II", item: "Wallet", date: "10/21/2025" },
  { name: "Erita G. Sullanon", item: "Wallet", date: "1/5/2026" },
  { name: "Joshua Amiel B. Nisnisan", item: "Tumbler", date: "10/23/2025" },
];

// ── Date parser that handles all formats ─────────────────────────────────────
function parseDate(raw: string): Date | null {
  if (!raw) return null;
  const s = raw.trim();

  // Format: D-Mon-YY or D-Mon-YY (e.g. "6-Nov-25", "12-Sep-25")
  const shortMonthMatch = s.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2})$/);
  if (shortMonthMatch) {
    const [, day, mon, yr] = shortMonthMatch;
    const months: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
    };
    const m = months[mon.toLowerCase()];
    if (m === undefined) return null;
    const year = 2000 + parseInt(yr);
    return new Date(Date.UTC(year, m, parseInt(day)));
  }

  // Format: M/D/YYYY
  const slashMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, mo, dy, yr] = slashMatch;
    return new Date(Date.UTC(parseInt(yr), parseInt(mo) - 1, parseInt(dy)));
  }

  // Format: 9-Sep-25 with hyphen variant already handled above
  // Fallback
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

// ── Item name fuzzy matching ──────────────────────────────────────────────────
function itemsMatch(claimedItem: string, foundItemName: string): boolean {
  const c = claimedItem.toLowerCase().trim();
  const f = foundItemName.toLowerCase().trim();

  // Direct contains check
  if (f.includes(c) || c.includes(f)) return true;

  // Token-based: check if the main keyword matches
  // Normalize common aliases
  const normalize = (s: string) => s
    .replace(/cellphone/g, "cellphone")
    .replace(/cell phone/g, "cellphone")
    .replace(/phone/g, "cellphone")
    .replace(/student id/g, "id")
    .replace(/ojt id/g, "id")
    .replace(/lanyard id/g, "id")
    .replace(/pwd-id/g, "id")
    .replace(/lost wallet/g, "wallet")
    .replace(/vehicle key/g, "key")
    .replace(/xrm key/g, "key")
    .replace(/motorcycle key.*$/g, "motorcycle key")
    .replace(/motor key.*$/g, "key")
    .replace(/key chain.*$/g, "key")
    .replace(/cor key.*$/g, "key")
    .replace(/water tumbler/g, "tumbler")
    .replace(/aqua flask/g, "tumbler")
    .replace(/aquaflask/g, "tumbler")
    .replace(/mini fan/g, "mini fan")
    .replace(/paper bag.*$/g, "bag")
    .replace(/blazer/g, "jacket")
    .replace(/hand fan/g, "fan")
    .replace(/\(.*?\)/g, "") // remove parentheses content
    .replace(/\s+/g, " ")
    .trim();

  const nc = normalize(c);
  const nf = normalize(f);
  if (nf.includes(nc) || nc.includes(nf)) return true;

  // Check if first significant word matches (for "Cellphone & Charger" → "Cellphone")
  const cWords = nc.split(/[\s&,/]+/).filter(w => w.length > 2);
  const fWords = nf.split(/[\s&,/]+/).filter(w => w.length > 2);
  if (cWords.length > 0 && fWords.length > 0) {
    if (cWords.some(cw => fWords.some(fw => fw === cw || fw.includes(cw) || cw.includes(fw)))) {
      return true;
    }
  }

  return false;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("=== Starting Claimed Items Import ===\n");

  // Track which DB found item IDs we've already claimed to avoid double-counting
  const alreadyClaimedIds = new Set<string>();

  let matched = 0;
  let skipped = 0;
  let alreadyWasClaimed = 0;

  const results: { claimant: string; item: string; date: string; status: string; foundItemName?: string }[] = [];

  for (const entry of CLAIMED_DATA) {
    const claimDate = parseDate(entry.date);
    if (!claimDate) {
      console.warn(`  ⚠ Could not parse date "${entry.date}" for ${entry.item} (${entry.name})`);
      results.push({ claimant: entry.name, item: entry.item, date: entry.date, status: "SKIP - bad date" });
      skipped++;
      continue;
    }

    // Search a ±2 day window to handle timezone offsets
    const from = new Date(claimDate.getTime() - 2 * 86400000);
    const to   = new Date(claimDate.getTime() + 2 * 86400000);

    // Find all found items in that date window (not deleted, not archived)
    const candidates = await prisma.foundItem.findMany({
      where: {
        isDeleted: false,
        date: { gte: from, lte: to },
      },
      select: { id: true, foundItemName: true, isClaimed: true, date: true },
    });

    // Filter by item name match
    const nameMatches = candidates.filter(c => itemsMatch(entry.item, c.foundItemName));

    // Among name matches, pick the first one that isn't already claimed by this script
    const unclaimedMatch = nameMatches.find(m => !alreadyClaimedIds.has(m.id) && !m.isClaimed);
    const alreadyClaimedMatch = nameMatches.find(m => m.isClaimed);

    if (unclaimedMatch) {
      // Mark it as claimed
      await prisma.foundItem.update({
        where: { id: unclaimedMatch.id },
        data: { isClaimed: true },
      });
      alreadyClaimedIds.add(unclaimedMatch.id);
      matched++;
      console.log(`  ✅ CLAIMED: "${entry.item}" on ${entry.date} → matched "${unclaimedMatch.foundItemName}" (${unclaimedMatch.id.slice(0, 8)}...)`);
      results.push({ claimant: entry.name, item: entry.item, date: entry.date, status: "MATCHED & CLAIMED", foundItemName: unclaimedMatch.foundItemName });
    } else if (alreadyClaimedMatch && !unclaimedMatch) {
      // A match exists but it's already claimed - still count it
      alreadyWasClaimed++;
      console.log(`  ⚡ ALREADY CLAIMED: "${entry.item}" on ${entry.date} → "${alreadyClaimedMatch.foundItemName}" was already claimed`);
      results.push({ claimant: entry.name, item: entry.item, date: entry.date, status: "ALREADY CLAIMED", foundItemName: alreadyClaimedMatch.foundItemName });
    } else {
      skipped++;
      console.log(`  ⛔ NO MATCH: "${entry.item}" on ${entry.date} — no found item with matching name/date`);
      results.push({ claimant: entry.name, item: entry.item, date: entry.date, status: "NO MATCH - SKIPPED" });
    }
  }

  console.log("\n=== SUMMARY ===");
  console.log(`✅ Newly marked as claimed: ${matched}`);
  console.log(`⚡ Already were claimed:    ${alreadyWasClaimed}`);
  console.log(`⛔ No match found (skipped): ${skipped}`);
  console.log(`📊 Total processed: ${CLAIMED_DATA.length}`);

  console.log("\n=== SKIPPED ITEMS (no DB match) ===");
  results.filter(r => r.status.includes("NO MATCH")).forEach(r => {
    console.log(`  - ${r.item} | ${r.date} | ${r.claimant}`);
  });
}

main().catch(console.error);
