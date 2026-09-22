import React from 'react';
import Sidebar from './Sidebar';

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-background text-white">
      {/* Overlay navigation.
          It no longer occupies horizontal layout space. */}
      <Sidebar />

      {/* Full-width application content */}
      <main className="min-h-screen w-full overflow-x-hidden overflow-y-auto">
        <div className="w-full px-6 py-8 sm:px-8 lg:px-10">
          {children}
        </div>
      </main>
    </div>
  );
}