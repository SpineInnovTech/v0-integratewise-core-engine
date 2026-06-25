import React, { useState, useEffect, useCallback } from "react";
import { searchSessions, getTopics } from "../services/api";
import type { Session, Topic } from "../types";
import { ProviderIcon } from "./icons/ProviderIcons";
import { PaperclipIcon } from "./icons/PaperclipIcon";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const SearchResult: React.FC<{ session: Session }> = ({ session }) => {
  const title = session.summary_md.split("\n")[0] || "Session Summary";
  const contentSnippet = session.summary_md.substring(title.length, 300) + "...";
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  return (
    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 hover:border-sky-500 transition-all">
      <h3 className="text-lg font-semibold text-sky-400 mb-2">{title}</h3>
      <div className="text-sm text-slate-400 mb-3 prose prose-invert prose-sm max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{contentSnippet}</ReactMarkdown>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
        <div className="flex items-center gap-1">
          <ProviderIcon provider={session.provider} className="h-4 w-4" />
          <span className="capitalize">{session.provider}</span>
        </div>
        <span>{formatDate(session.ended_at)}</span>
        {session.attachments && session.attachments.length > 0 && (
          <div className="flex items-center gap-1">
            <PaperclipIcon className="h-4 w-4" />
            <span>{session.attachments.length} file(s)</span>
          </div>
        )}
        <div className="flex flex-wrap gap-1">
          {session.topics.map((topic) => (
            <span key={topic} className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
              {topic}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const SearchPage: React.FC = () => {
  const [query, setQuery] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({});
  const [allTopics, setAllTopics] = useState<Topic[]>([]);
  const [results, setResults] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    getTopics().then(setAllTopics);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);
    try {
      const data = await searchSessions(query, selectedTopics, dateRange);
      setResults(data);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTopicToggle = (topicName: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topicName) ? prev.filter((t) => t !== topicName) : [...prev, topicName]
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">Search Knowledge Bank</h1>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters */}
        <aside className="lg:col-span-1">
          <form
            onSubmit={handleSearch}
            className="bg-slate-800 p-4 rounded-lg space-y-6 sticky top-24"
          >
            <div>
              <label
                htmlFor="search-query"
                className="block text-sm font-medium text-slate-300 mb-1"
              >
                Search
              </label>
              <input
                type="text"
                id="search-query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., 'API integration'"
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-2">Topics</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                {allTopics.map((topic) => (
                  <label key={topic.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTopics.includes(topic.name)}
                      onChange={() => handleTopicToggle(topic.name)}
                      className="h-4 w-4 rounded bg-slate-700 border-slate-600 text-sky-600 focus:ring-sky-500"
                    />
                    <span className="text-sm text-slate-300">{topic.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-2">Date Range</h3>
              <div className="space-y-2">
                <input
                  type="date"
                  aria-label="Start date"
                  value={dateRange.start || ""}
                  onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-sky-500 focus:border-sky-500"
                />
                <input
                  type="date"
                  aria-label="End date"
                  value={dateRange.end || ""}
                  onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-sky-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-sky-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 disabled:bg-slate-600"
              disabled={loading}
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </form>
        </aside>

        {/* Results */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="text-center py-10 text-slate-400">Searching...</div>
          ) : !searched ? (
            <div className="text-center py-10 text-slate-500 bg-slate-800/50 rounded-lg">
              Enter search criteria and press Search.
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-10 text-slate-500 bg-slate-800/50 rounded-lg">
              No results found. Try broadening your search.
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-400">
                Found {results.length} result{results.length !== 1 && "s"}.
              </p>
              {results.map((session) => (
                <SearchResult key={session.id} session={session} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
