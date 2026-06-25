import React, { useState, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getSessions } from "./services/api";
import type { Session } from "./types";
import { ProviderIcon } from "./icons/ProviderIcons";
import { CloseIcon } from "./icons/CloseIcon";
import { PaperclipIcon } from "./icons/PaperclipIcon";
import { DownloadIcon } from "./icons/DownloadIcon";

const SummaryModal: React.FC<{ session: Session; onClose: () => void }> = ({
  session,
  onClose,
}) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ProviderIcon provider={session.provider} className="h-6 w-6" />
            <span>{session.summary_md.split("\n")[0]}</span>
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="overflow-y-auto">
          <div className="p-6">
            <article className="prose prose-invert prose-sm sm:prose-base max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{session.summary_md}</ReactMarkdown>
            </article>
          </div>
          {session.attachments && session.attachments.length > 0 && (
            <div className="p-6 border-t border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-3">Attachments</h3>
              <ul className="space-y-2">
                {session.attachments.map((att, index) => (
                  <li key={index}>
                    <a
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      title={att.gcs_path}
                      className="flex items-center gap-2 text-sky-400 hover:text-sky-300 hover:underline transition-colors"
                    >
                      <DownloadIcon className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{att.name}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const InboxPage: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [topicFilter, setTopicFilter] = useState("");

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      try {
        const data = await getSessions();
        const sortedData = data.sort(
          (a, b) => new Date(b.ended_at).getTime() - new Date(a.ended_at).getTime()
        );
        setSessions(sortedData);
      } catch (error) {
        console.error("Failed to fetch sessions:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  const filteredSessions = useMemo(() => {
    if (!topicFilter) {
      return sessions;
    }
    return sessions.filter((session) =>
      session.topics.some((topic) => topic.toLowerCase().includes(topicFilter.toLowerCase()))
    );
  }, [sessions, topicFilter]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-white">Inbox</h1>
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Filter by topic..."
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-md pl-3 pr-10 py-2 text-sm focus:ring-sky-500 focus:border-sky-500"
            aria-label="Filter sessions by topic"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-slate-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </div>
      <div className="bg-slate-800 shadow-lg rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading summaries...</div>
          ) : filteredSessions.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              {topicFilter ? "No summaries match your filter." : "No session summaries found."}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-slate-800">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider"
                  >
                    Provider
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider"
                  >
                    Summary
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider"
                  >
                    Topics
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider"
                  >
                    Attachments
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider"
                  >
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="bg-slate-800/50 divide-y divide-slate-700">
                {filteredSessions.map((session) => (
                  <tr
                    key={session.id}
                    onClick={() => setSelectedSession(session)}
                    className="hover:bg-slate-700/50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <ProviderIcon provider={session.provider} className="h-5 w-5 mr-2" />
                        <span className="text-sm font-medium text-slate-200 capitalize">
                          {session.provider}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 truncate max-w-xs">
                      {session.summary_md.split("\n")[0]}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {session.topics.map((topic) => (
                          <span
                            key={topic}
                            className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-sky-900 text-sky-200"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                      {session.attachments && session.attachments.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <PaperclipIcon className="h-4 w-4" />
                          <span>{session.attachments.length}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                      {formatDate(session.ended_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {selectedSession && (
        <SummaryModal session={selectedSession} onClose={() => setSelectedSession(null)} />
      )}
    </div>
  );
};

export default InboxPage;
