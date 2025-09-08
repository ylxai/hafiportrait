'use client';

import { useState } from 'react';
import { Menu, X, LogOut, User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NotificationBell from '@/components/ui/notification-bell';
import { cn } from '@/lib/utils';
import type { AuthState } from '@/hooks/use-auth';

interface MobileHeaderProps {
  user: AuthState['user'];
  onLogout: () => void;
  className?: string;
}

export function MobileHeader({ user, onLogout, className }: MobileHeaderProps) {
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);

  return (
    <>
      {/* Header */}
      <header className={cn(
        "sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm md:hidden",
        className
      )}>
        <div className="flex items-center justify-between h-14 px-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <h1 className="text-base md:text-lg font-bold text-gray-900">Admin</h1>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <NotificationBell className="mobile-optimized" />
            
            {/* Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSideMenuOpen(true)}
              className="h-10 w-10"
              aria-label="Buka menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Side Menu Overlay */}
      {isSideMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-50 md:hidden"
            onClick={() => setIsSideMenuOpen(false)}
          />
          
          {/* Side Menu */}
          <div className={cn(
            "fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] z-50",
            "bg-white shadow-xl",
            "transform transition-transform duration-300 ease-out",
            "md:hidden",
            isSideMenuOpen ? "translate-x-0" : "translate-x-full"
          )}>
            {/* Menu Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Menu</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSideMenuOpen(false)}
                className="h-8 w-8"
                aria-label="Tutup menu"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* User Info */}
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{user?.full_name}</p>
                  <p className="text-sm text-gray-500">@{user?.username}</p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-4 space-y-2">
              <button
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors text-left"
                onClick={() => {
                  // Handle settings
                  setIsSideMenuOpen(false);
                }}
              >
                <Settings className="h-5 w-5 text-gray-600" />
                <span className="font-medium">Pengaturan</span>
              </button>

              <button
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 text-red-600 transition-colors text-left"
                onClick={() => {
                  onLogout();
                  setIsSideMenuOpen(false);
                }}
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Keluar</span>
              </button>
            </div>

            {/* App Info */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-gray-50">
              <p className="text-xs text-gray-500 text-center">
                HafiPortrait Photography
                <br />
                Admin Dashboard v2.0
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}