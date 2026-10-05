import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from "./Navbar.jsx";
import { Sidebar } from "./Sidebar.jsx";
export function Layout({ theme, setTheme, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-muted font-sans">
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} theme={theme} setTheme={setTheme} onLogout={onLogout} />
      <div className="relative flex min-w-0 flex-1 overflow-hidden pt-16">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        <main className="custom-scrollbar relative w-full min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1600px] animate-fade-in-up p-5 sm:p-8 lg:p-10"><Outlet /></div>
        </main>
      </div>
    </div>
  );
}
