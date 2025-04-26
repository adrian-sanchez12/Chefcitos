"use client";
import SidebarSettings from "./SidebarSettings";

export default function SettingsLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarSettings />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
