'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SmartNotificationManager } from './smart-notification-manager';
import { useIsMobile, useBreakpoint } from '@/hooks/use-mobile';
import { 
  Menu, 
  X, 
  Bell, 
  BellRing, 
  User, 
  LogOut, 
  Settings,
  ChevronDown
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import NotificationBell from '@/components/ui/notification-bell';
import type { Event } from '@/lib/database';

interface EnhancedAdminHeaderProps {
  user: {
    full_name?: string;
    username?: string;
  } | null;
  events: Event[];
  onRefresh: () => void;
  onStatusChange: (eventId: string, status: string) => void;
  onLogout: () => void;
}

export function EnhancedAdminHeader({
  user,
  events,
  onRefresh,
  onStatusChange,
  onLogout
}: EnhancedAdminHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const breakpoint = useBreakpoint();

  const userInitial = user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'A';

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title - Mobile Optimized */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">H</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg lg:text-xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-xs text-gray-500 hidden lg:block">HafiPortrait Photography</p>
              </div>
              <div className="sm:hidden">
                <h1 className="text-base font-bold text-gray-900">Admin</h1>
              </div>
            </div>
          </div>

          {/* Desktop Navigation & Actions */}
          <div className="hidden md:flex items-center gap-4">
            {/* Smart Notification Manager */}
            <SmartNotificationManager 
              events={events}
              onRefresh={onRefresh}
              onStatusChange={onStatusChange}
            />

            {/* Enhanced Notification Bell */}
            <NotificationBell className="relative" />

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">{userInitial}</span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                    <p className="text-xs text-gray-500">@{user?.username}</p>
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* User Dropdown */}
              {isUserMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border z-20">
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          // Handle settings
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                      >
                        <Settings className="w-4 h-4" />
                        Pengaturan
                      </button>
                      <hr className="my-1" />
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Mobile Actions */}
          <div className="md:hidden flex items-center gap-2">
            {/* Mobile Notification Bell - Enhanced */}
            <div className="relative">
              <NotificationBell className="mobile-optimized" />
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors touch-manipulation"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-gray-700" />
              ) : (
                <Menu className="w-5 h-5 text-gray-700" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-3 space-y-3">
              {/* User Info */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">{userInitial}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{user?.full_name}</p>
                  <p className="text-sm text-gray-500">@{user?.username}</p>
                </div>
              </div>

              {/* Mobile Smart Notification Manager */}
              <div className="p-3 bg-blue-50 rounded-lg">
                <SmartNotificationManager 
                  events={events}
                  onRefresh={onRefresh}
                  onStatusChange={onStatusChange}
                />
              </div>

              {/* Mobile Actions */}
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    // Handle settings
                  }}
                  className="w-full flex items-center gap-3 p-3 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Settings className="w-5 h-5" />
                  <span>Pengaturan</span>
                </button>
                
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-3 p-3 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </header>
  );
}