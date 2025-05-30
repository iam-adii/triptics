import React from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export function Layout() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Header />
      <div className="flex flex-1 relative">
        <Sidebar />
        <main className="flex-1 overflow-y-auto pt-4 pb-16 md:pt-6 md:pb-8 md:ml-[240px]">
          <div className="container px-3 sm:px-6 max-w-7xl mx-auto">
            <Outlet />
          </div>
          
          {/* Safe area for mobile devices */}
          <div className="h-8 md:hidden" />
        </main>
      </div>
    </div>
  );
}
