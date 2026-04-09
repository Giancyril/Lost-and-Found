import React, { useState } from "react";
import {
  FaSearch, FaRobot, FaBrain, FaSpinner, FaEye,
  FaMapMarkerAlt, FaCalendarAlt, FaTags, FaCheckCircle,
} from "react-icons/fa";
import { useAiSearchMutation } from "../../redux/api/api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

interface SearchResult {
  foundItems: any[];
  lostItems: any[];
  reasoning: string;
  totalFound: number;
  totalLost: number;
}

const exampleQueries = [
  "Black iPhone with cracked screen near the library",
  "Gray Lenovo laptop with sticker on the cover",
  "Wallet with student ID inside Room 205",
];

const AiSearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [lastQuery, setLastQuery] = useState("");
  const [aiSearch, { isLoading }] = useAiSearchMutation();
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent, overrideQuery?: string) => {
    e.preventDefault();
    const q = overrideQuery ?? searchQuery;
    if (!q.trim()) { toast.error("Please enter a search query"); return; }

    try {
      const response = await aiSearch({ query: q }).unwrap();
      const result = response.data || response;
      setSearchResults(result);
      setLastQuery(q);
    } catch (error: any) {
      toast.error(error?.data?.message || "Search failed. Please try again.");
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const totalResults = (searchResults?.totalFound ?? 0) + (searchResults?.totalLost ?? 0);

  return (
    <div className="min-h-screen bg-gray-950 relative overflow-x-hidden">

      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-20 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-16">

        {/* ── Hero ── */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
            Smart Item Search
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Describe what you lost or found in natural language 
          </p>
        </div>

        {/* ── Search bar ── */}
        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex flex-col sm:flex-row gap-3 bg-gray-900 border border-white/10 rounded-2xl p-3 shadow-2xl shadow-black/40">
            <div className="flex-1 relative">
              <FaRobot className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-500" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch(e)}
                placeholder="e.g., I lost a gray laptop with a sticker at Room 205..."
                className="w-full pl-11 pr-4 py-3.5 bg-transparent text-white placeholder-gray-600 text-sm focus:outline-none"
                disabled={isLoading}
                maxLength={200}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !searchQuery.trim()}
              className="flex items-center justify-center gap-2.5 px-6 py-3.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-700 disabled:text-gray-500 text-gray-950 font-semibold text-sm rounded-xl transition-all duration-200 shrink-0"
            >
              {isLoading ? <FaSpinner className="animate-spin" size={14} /> : <FaSearch size={14} />}
              {isLoading ? "Searching..." : "Search"}
            </button>
          </div>
          {searchQuery && (
            <p className="text-right text-gray-600 text-xs mt-1.5 pr-1">{searchQuery.length}/200</p>
          )}
        </form>

        {/* ── Example queries ── */}
        {!searchResults && (
          <div className="flex flex-wrap gap-2 justify-center mb-16">
            {exampleQueries.map((q) => (
              <button key={q} onClick={(e) => { setSearchQuery(q); handleSearch(e as any, q); }}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-gray-400 hover:text-white text-xs rounded-full transition-all">
                {q}
              </button>
            ))}
          </div>
        )}

        {/* ── Results ── */}
        {searchResults && (
          <div className="space-y-8">

            {/* Result meta */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-white font-semibold">
                  {totalResults > 0 ? `${totalResults} result${totalResults !== 1 ? "s" : ""} found` : "No results found"}
                </p>
                <p className="text-gray-500 text-sm mt-0.5">
                  for <span className="text-gray-300 italic">"{lastQuery}"</span>
                </p>
              </div>
              <button onClick={() => { setSearchResults(null); setSearchQuery(""); setLastQuery(""); }}
                className="text-xs text-gray-500 hover:text-white border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition-all">
                Clear results
              </button>
            </div>

            {/* AI Reasoning */}
            {searchResults.reasoning && searchResults.reasoning !== "Simple text-based search results" && (
              <div className="bg-gray-900 border border-white/5 rounded-2xl p-5">
                <div className="flex items-center gap-2.5 mb-3">
                  <FaBrain size={14} className="text-cyan-400" />
                  <h3 className="text-white text-sm font-semibold">AI Analysis</h3>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">{searchResults.reasoning}</p>
              </div>
            )}

            {/* No results empty state */}
            {totalResults === 0 && (
              <div className="text-center py-20 border border-white/5 rounded-2xl bg-gray-900">
                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FaSearch size={20} className="text-gray-600" />
                </div>
                <h3 className="text-white font-semibold mb-2">No matching items</h3>
                <p className="text-gray-500 text-sm max-w-xs mx-auto">
                  Try different keywords, include the location or color, or check back later as new items are added daily.
                </p>
              </div>
            )}

            {/* Found Items */}
            {searchResults.foundItems.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full" />
                  <h2 className="text-white font-semibold text-sm uppercase tracking-widest">
                    Found Items — {searchResults.foundItems.length}
                  </h2>
                  <div className="flex-1 h-px bg-white/5" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.foundItems.map((item) => (
                    <ItemCard
                      key={item.id}
                      img={item.img}
                      name={item.foundItemName}
                      description={item.description}
                      category={item.category?.name}
                      location={item.location}
                      date={formatDate(item.date)}
                      badge={item.isClaimed
                        ? { label: "Claimed", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" }
                        : { label: "Available", color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" }
                      }
                      accentHover="hover:border-emerald-500/30"
                      onView={() => navigate(`/foundItems/${item.id}`)}
                      btnColor="bg-emerald-500/10 hover:bg-emerald-500 border-emerald-500/20 text-emerald-400 hover:text-white"
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Lost Items */}
            {searchResults.lostItems.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-2 h-2 bg-red-400 rounded-full" />
                  <h2 className="text-white font-semibold text-sm uppercase tracking-widest">
                    Lost Items — {searchResults.lostItems.length}
                  </h2>
                  <div className="flex-1 h-px bg-white/5" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.lostItems.map((item) => (
                    <ItemCard
                      key={item.id}
                      img={item.img}
                      name={item.lostItemName}
                      description={item.description}
                      category={item.category?.name}
                      location={item.location}
                      date={formatDate(item.date)}
                      badge={{ label: "Lost", color: "text-red-400 bg-red-400/10 border-red-400/20" }}
                      accentHover="hover:border-red-500/30"
                      onView={() => navigate(`/lostItems/${item.id}`)}
                      btnColor="bg-red-500/10 hover:bg-red-500 border-red-500/20 text-red-400 hover:text-white"
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* ── Tips (only shown before search) ── */}
        {!searchResults && (
          <div className="mt-4 border border-white/5 rounded-2xl p-6 bg-gray-900/50">
            <p className="text-gray-500 text-xs uppercase tracking-widest font-medium mb-4">Tips for better results</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { n: "1", title: "Be descriptive", tip: "Include color, brand, size — e.g. \"black Lenovo laptop\"" },
                { n: "2", title: "Add location",   tip: "\"near the library\", \"Room 205\", \"cafeteria\"" },
                { n: "3", title: "Mention timing",  tip: "\"yesterday\", \"last Monday\", \"this morning\"" },
                { n: "4", title: "Unique features", tip: "Stickers, scratches, keychains, case color" },
              ].map((tip) => (
                <div key={tip.n} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{tip.n}</span>
                  <div>
                    <p className="text-white text-xs font-medium">{tip.title}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{tip.tip}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

/* ── Item Card ── */
interface ItemCardProps {
  img?: string;
  name: string;
  description: string;
  category?: string;
  location: string;
  date: string;
  badge: { label: string; color: string };
  accentHover: string;
  onView: () => void;
  btnColor: string;
}

const ItemCard = ({ img, name, description, category, location, date, badge, accentHover, onView, btnColor }: ItemCardProps) => (
  <div className={`group bg-gray-900 border border-white/5 ${accentHover} rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:shadow-xl hover:shadow-black/40`}>
    {img && (
      <div className="relative h-44 overflow-hidden shrink-0">
        <img src={img} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent" />
        <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${badge.color}`}>
          {badge.label === "Claimed" && <FaCheckCircle className="inline mr-1" size={9} />}
          {badge.label}
        </span>
      </div>
    )}
    <div className="p-4 flex flex-col flex-1">
      {!img && (
        <span className={`self-start mb-3 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${badge.color}`}>
          {badge.label}
        </span>
      )}
      <h4 className="text-white font-semibold text-sm truncate mb-1">{name}</h4>
      <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 mb-3">{description}</p>
      <div className="space-y-1.5 mt-auto mb-4">
        {category && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <FaTags size={10} className="text-gray-600" />{category}
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <FaMapMarkerAlt size={10} className="text-gray-600" />{location}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <FaCalendarAlt size={10} className="text-gray-600" />{date}
        </div>
      </div>
      <button onClick={onView}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 ${btnColor}`}>
        <FaEye size={11} /> View Details
      </button>
    </div>
  </div>
);

export default AiSearch;