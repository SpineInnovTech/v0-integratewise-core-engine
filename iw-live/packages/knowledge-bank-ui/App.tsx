import React, { useState } from "react";
import Header from "./components/Header";
import InboxPage from "./components/InboxPage";
import SearchPage from "./components/SearchPage";
import TopicsPage from "./components/TopicsPage";
import DemoPage from "./components/DemoPage";
import type { Page } from "./types";

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>("inbox");

  const renderPage = () => {
    switch (currentPage) {
      case "inbox":
        return <InboxPage />;
      case "search":
        return <SearchPage />;
      case "topics":
        return <TopicsPage />;
      case "demo":
        return <DemoPage />;
      default:
        return <InboxPage />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans">
      <Header currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="p-4 sm:p-6 lg:p-8">{renderPage()}</main>
    </div>
  );
};

export default App;
