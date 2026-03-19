import { Link } from "react-router-dom";
import { useGetFoundItemsQuery } from "../../redux/api/api";
import { FaMapMarkerAlt, FaCalendarAlt, FaLightbulb, FaArrowRight } from "react-icons/fa";

interface Props {
  categoryId: string;
  categoryName: string;
  itemName: string;
  location: string;
}

// Tokenize a string into lowercase words (3+ chars)
const tokens = (s: string) =>
  s.toLowerCase().split(/[\s,./\-_]+/).filter(w => w.length >= 3);

// Score location match: exact full match > partial word overlap
// Returns: 3 = exact match, 2 = all tokens match, 1 = some tokens match, 0 = no match
const locationScore = (input: string, itemLoc: string): number => {
  if (!input || !itemLoc) return 0;
  const a = input.toLowerCase().trim();
  const b = itemLoc.toLowerCase().trim();
  if (a === b) return 3;                          // exact match
  const ta = tokens(a);
  const tb = tokens(b);
  if (ta.length === 0) return 0;
  const matched = ta.filter(t => tb.includes(t)).length;
  if (matched === ta.length) return 2;            // all input tokens found
  if (matched > 0) return 1;                      // partial
  return 0;
};

// Name overlap score
const nameScore = (input: string, itemName: string): number => {
  if (!input || !itemName) return 0;
  return tokens(input).filter(t =>
    tokens(itemName).some(bt => bt.includes(t) || t.includes(bt))
  ).length;
};

const ItemMatchSuggestions = ({ categoryId, categoryName, itemName, location }: Props) => {
  const { data, isLoading } = useGetFoundItemsQuery(
    { categoryId, limit: 20, sortBy: "date", sortOrder: "desc" },
    { skip: !categoryId }
  );

  const raw: any[] = (data?.data ?? []).filter((item: any) => !item.isClaimed);

  if (!categoryId || isLoading || raw.length === 0) return null;

  // Score each item: location match (weight 3x) + name match (weight 1x)
  const scored = raw
    .map(item => {
      const ls = location ? locationScore(location, item.location ?? "") : 0;
      const ns = itemName ? nameScore(itemName, item.foundItemName ?? "") : 0;
      return { item, score: ls * 3 + ns, locScore: ls };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  const hasAnyScore = scored.some(s => s.score > 0);

  const matchLabel = (s: { score: number; locScore: number }) => {
    if (s.locScore === 3) return { text: "Same location", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" };
    if (s.locScore === 2) return { text: "Same area",     cls: "bg-blue-500/15 text-blue-400 border-blue-500/20" };
    if (s.locScore === 1) return { text: "Nearby",        cls: "bg-violet-500/15 text-violet-400 border-violet-500/20" };
    if (s.score > 0)      return { text: "Name match",    cls: "bg-gray-500/15 text-gray-400 border-gray-500/20" };
    return null;
  };

  return (
    <div className="rounded-xl border border-blue-500/20 bg-blue-950/20 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-blue-500/10">
        <div className="w-6 h-6 rounded-lg bg-blue-500/15 border border-blue-500/20 flex items-center justify-center shrink-0">
          <FaLightbulb size={10} className="text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-blue-300 text-xs font-semibold">Possible Matches Found</p>
          <p className="text-blue-400/60 text-[10px]">
            {hasAnyScore
              ? `Sorted by relevance — same location & category as your report`
              : `Recent unclaimed ${categoryName} items — could one be yours?`}
          </p>
        </div>
      </div>

      {/* Items */}
      <div className="divide-y divide-blue-500/10">
        {scored.map(({ item, score, locScore }) => {
          const badge = matchLabel({ score, locScore });
          return (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-blue-900/10 transition-colors">
              {/* Image */}
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-800 border border-gray-700 shrink-0">
                <img
                  src={
                    (Array.isArray(item.images) && item.images.length > 0
                      ? (typeof item.images[0] === "string" ? item.images[0] : item.images[0]?.url ?? "")
                      : "") || item.img || "/bgimg.png"
                  }
                  alt={item.foundItemName}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/bgimg.png"; }}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-white text-xs font-semibold truncate">{item.foundItemName}</p>
                  {badge && (
                    <span className={`shrink-0 text-[9px] border px-1.5 py-0.5 rounded-full font-medium ${badge.cls}`}>
                      {badge.text}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  <span className={`flex items-center gap-1 text-[10px] ${locScore >= 2 ? "text-blue-400 font-medium" : "text-gray-500"}`}>
                    <FaMapMarkerAlt size={7} /> {item.location}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-gray-500">
                    <FaCalendarAlt size={7} /> {item.date?.split("T")[0]}
                  </span>
                </div>
              </div>

              {/* Link */}
              <Link
                to={`/foundItems/${item.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                View <FaArrowRight size={8} />
              </Link>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-blue-500/10 flex items-center justify-between">
        <p className="text-[10px] text-blue-400/50">
          If you see your item, submit a claim from its page.
        </p>
        <Link to="/foundItems" target="_blank" rel="noopener noreferrer"
          className="text-[10px] text-blue-400 hover:text-blue-300 font-medium transition-colors whitespace-nowrap">
          Browse all →
        </Link>
      </div>
    </div>
  );
};

export default ItemMatchSuggestions;
