import React from "react";
import type { Page } from "./types";
import { LogoIcon } from "./icons/LogoIcon";

interface HeaderProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
}

const NavItem: React.FC<{
  page: Page;
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  children: React.ReactNode;
}> = ({ page, currentPage, setCurrentPage, children }) => {
  const isActive = currentPage === page;
  return (
    <button
      onClick={() => setCurrentPage(page)}
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
      }`}
      aria-current={isActive ? "page" : undefined}
    >
      {children}
    </button>
  );
};

const Header: React.FC<HeaderProps> = ({ currentPage, setCurrentPage }) => {
  return (
    <header className="bg-slate-900/70 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <LogoIcon className="h-8 w-8 text-sky-500" />
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <NavItem page="inbox" currentPage={currentPage} setCurrentPage={setCurrentPage}>
                  Inbox
                </NavItem>
                <NavItem page="search" currentPage={currentPage} setCurrentPage={setCurrentPage}>
                  Search
                </NavItem>
                <NavItem page="topics" currentPage={currentPage} setCurrentPage={setCurrentPage}>
                  Topic Config
                </NavItem>
                <NavItem page="demo" currentPage={currentPage} setCurrentPage={setCurrentPage}>
                  API & Demo
                </NavItem>
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <span className="text-sm text-slate-400">
              Tenant: <span className="font-semibold text-slate-200">demo-tenant</span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
