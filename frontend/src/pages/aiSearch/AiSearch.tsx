import React, { useState } from "react";
import { FaSearch, FaRobot, FaBrain, FaSpinner, FaEye, FaMapMarkerAlt, FaCalendarAlt, FaUser, FaTags } from "react-icons/fa";
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

const AiSearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [aiSearch, { isLoading }] = useAiSearchMutation();
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchQuery.trim()) {
      toast.error("Please enter a search query");
      return;
    }

    try {
      const response = await aiSearch({ query: searchQuery }).unwrap();
      console.log("Full API response:", response);

      // The response might be wrapped in a data property
      const result = response.data || response;
      console.log("Search results:", result);

      setSearchResults(result);
      toast.success("AI search completed successfully!");
    } catch (error: any) {
      console.error("Search error:", error);
      toast.error(error?.data?.message || "Search failed. Please try again.");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl mr-4">
              <FaBrain className="text-3xl text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              AI-Powered Search
            </h1>
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Harness the power of artificial intelligence to find lost or found items.
            Simply describe what you're looking for in natural language!
          </p>
        </div>

        {/* Search Form */}
        <div className="max-w-5xl mx-auto mb-10">
          <form onSubmit={handleSearch} className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-2xl shadow-2xl p-8 border border-gray-600">
            <div className="flex flex-col lg:flex-row items-center space-y-4 lg:space-y-0 lg:space-x-6">
              <div className="flex-1 w-full">
                <div className="relative">
                  <FaRobot className="absolute left-4 top-1/2 transform -translate-y-1/2 text-cyan-400 text-xl" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g., I lost a black iPhone 13 with a cracked screen near the library yesterday..."
                    className="w-full pl-12 pr-6 py-4 bg-gray-900 border border-gray-600 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-400 text-lg"
                    disabled={isLoading}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-8 py-4 rounded-xl flex items-center space-x-3 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                {isLoading ? (
                  <FaSpinner className="animate-spin text-xl" />
                ) : (
                  <FaSearch className="text-xl" />
                )}
                <span>{isLoading ? "Searching..." : "Search with AI"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Search Results */}
        {searchResults && (
          <div className="max-w-7xl mx-auto">
            {/* AI Reasoning */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-2xl shadow-2xl p-8 mb-8 border border-gray-600">
              <h3 className="text-2xl font-semibold text-white mb-4 flex items-center">
                <FaBrain className="mr-3 text-cyan-400 text-3xl" />
                AI Analysis
              </h3>
              <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 p-6 rounded-xl border border-cyan-500/20">
                <p className="text-gray-200 text-lg leading-relaxed">
                  {searchResults.reasoning}
                </p>
              </div>
            </div>

            {/* Results Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-r from-emerald-600 to-green-600 rounded-2xl p-6 text-center shadow-xl">
                <h4 className="text-xl font-semibold text-white mb-2">Found Items</h4>
                <p className="text-4xl font-bold text-white">{searchResults.totalFound}</p>
                <p className="text-green-100 mt-2">Items waiting to be claimed</p>
              </div>
              <div className="bg-gradient-to-r from-red-600 to-pink-600 rounded-2xl p-6 text-center shadow-xl">
                <h4 className="text-xl font-semibold text-white mb-2">Lost Items</h4>
                <p className="text-4xl font-bold text-white">{searchResults.totalLost}</p>
                <p className="text-red-100 mt-2">Items looking for owners</p>
              </div>
            </div>

            {/* Found Items Results */}
            {searchResults.foundItems.length > 0 && (
              <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-2xl shadow-2xl p-8 mb-8 border border-gray-600">
                <h3 className="text-2xl font-semibold text-white mb-6 flex items-center">

                  Found Items That Match Your Search
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {searchResults.foundItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-600 rounded-xl p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:border-emerald-500/50"
                    >
                      {item.img && (
                        <div className="relative mb-4">
                          <img
                            src={item.img}
                            alt={item.foundItemName}
                            className="w-full h-40 object-cover rounded-lg"
                          />
                          {item.isClaimed ?<div className="absolute top-2 right-2 bg-emerald-500 text-white px-2 py-1 rounded-lg text-xs font-semibold">
                            Found
                          </div>:<div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-semibold">
                            Not Claimed
                          </div>}


                        </div>
                      )}
                      <h4 className="font-bold text-white text-lg mb-3 overflow-hidden text-ellipsis whitespace-nowrap">
                        {item.foundItemName}
                      </h4>
                      <p className="text-gray-300 text-sm mb-4 overflow-hidden" style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: '1.4em',
                        maxHeight: '4.2em'
                      }}>
                        {item.description}
                      </p>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-gray-400 text-sm">
                          <FaTags className="mr-2 text-cyan-400" />
                          <span className="text-cyan-300">{item.category?.name || "No category"}</span>
                        </div>
                        <div className="flex items-center text-gray-400 text-sm">
                          <FaMapMarkerAlt className="mr-2 text-cyan-400" />
                          <span>{item.location}</span>
                        </div>
                        <div className="flex items-center text-gray-400 text-sm">
                          <FaCalendarAlt className="mr-2 text-cyan-400" />
                          <span>{formatDate(item.date)}</span>
                        </div>
                        <div className="flex items-center text-gray-400 text-sm">
                          <FaUser className="mr-2 text-cyan-400" />
                          <span>{item.user?.username}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/foundItems/${item.id}`)}
                        className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-all duration-300 font-semibold"
                      >
                        <FaEye />
                        <span>View Details</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lost Items Results */}
            {searchResults.lostItems.length > 0 && (
              <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-2xl shadow-2xl p-8 mb-8 border border-gray-600">
                <h3 className="text-2xl font-semibold text-white mb-6 flex items-center">
                 
                  Lost Items That Match Your Search
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {searchResults.lostItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-600 rounded-xl p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:border-red-500/50"
                    >
                      {item.img && (
                        <div className="relative mb-4">
                          <img
                            src={item.img}
                            alt={item.lostItemName}
                            className="w-full h-40 object-cover rounded-lg"
                          />
                          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-semibold">
                            LOST
                          </div>
                        </div>
                      )}
                      <h4 className="font-bold text-white text-lg mb-3 overflow-hidden text-ellipsis whitespace-nowrap">
                        {item.lostItemName}
                      </h4>
                      <p className="text-gray-300 text-sm mb-4 overflow-hidden" style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: '1.4em',
                        maxHeight: '4.2em'
                      }}>
                        {item.description}
                      </p>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-gray-400 text-sm">
                          <FaTags className="mr-2 text-cyan-400" />
                          <span className="text-cyan-300">{item.category?.name || "No category"}</span>
                        </div>
                        <div className="flex items-center text-gray-400 text-sm">
                          <FaMapMarkerAlt className="mr-2 text-cyan-400" />
                          <span>{item.location}</span>
                        </div>
                        <div className="flex items-center text-gray-400 text-sm">
                          <FaCalendarAlt className="mr-2 text-cyan-400" />
                          <span>{formatDate(item.date)}</span>
                        </div>
                        <div className="flex items-center text-gray-400 text-sm">
                          <FaUser className="mr-2 text-cyan-400" />
                          <span>{item.user?.username}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/lostItems/${item.id}`)}
                        className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-all duration-300 font-semibold"
                      >
                        <FaEye />
                        <span>View Details</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {searchResults.totalFound === 0 && searchResults.totalLost === 0 && (
              <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-2xl shadow-2xl p-12 text-center border border-gray-600">
                <div className="w-20 h-20 bg-gradient-to-r from-gray-600 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FaSearch className="text-3xl text-gray-300" />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-4">
                  No items found
                </h3>
                <p className="text-gray-300 text-lg max-w-md mx-auto">
                  Try adjusting your search query or check back later for new items. Our AI is constantly learning to provide better results!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Search Tips */}
        <div className="max-w-5xl mx-auto mt-12">
          <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-2xl shadow-2xl p-8 border border-gray-600">
            <h3 className="text-2xl font-semibold text-white mb-6 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center mr-3">
                💡
              </div>
              Search Tips for Better Results
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="text-cyan-300 font-semibold">Be Descriptive</h4>
                    <p className="text-gray-300 text-sm">
                      "I lost a black iPhone 13 with a cracked screen and blue case"
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="text-cyan-300 font-semibold">Include Location</h4>
                    <p className="text-gray-300 text-sm">
                      "near the library", "in the cafeteria", "at the parking lot"
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="text-cyan-300 font-semibold">Mention Timing</h4>
                    <p className="text-gray-300 text-sm">
                      "yesterday afternoon", "last week", "this morning"
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs font-bold">4</span>
                  </div>
                  <div>
                    <h4 className="text-cyan-300 font-semibold">Add Unique Features</h4>
                    <p className="text-gray-300 text-sm">
                      "silver keychain attached", "has a sticker", "scratched surface"
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-xs font-bold">5</span>
                  </div>
                  <div>
                    <h4 className="text-cyan-300 font-semibold">Use Natural Language</h4>
                    <p className="text-gray-300 text-sm">
                      Our AI understands context - speak naturally!
                    </p>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 p-4 rounded-lg border border-cyan-500/20">
                  <p className="text-cyan-200 text-sm font-medium">
                    🤖 Powered by advanced AI that learns from every search to provide more accurate results
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiSearch;
