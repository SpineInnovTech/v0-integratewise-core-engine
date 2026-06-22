import React from "react";

export function Layout({ children }: { children: React.ReactNode }) {
  // Simple layout wrapper for subpages
  return (
    <div className="min-h-screen bg-white">
      {/* Note: Navbar and Footer are handled by App.tsx main routing, 
          but we provide a wrapper here for subpage structure if needed. 
          Actually, let's keep it simple and just return children. */}
      {children}
    </div>
  );
}