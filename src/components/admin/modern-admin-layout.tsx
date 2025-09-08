'use client';

import { useState, useEffect } from 'react';
import { 
  Home, 
  Calendar, 
  Image, 
  Settings, 
  Monitor,
  ChevronDown,
  ChevronRight,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  Search,
  Plus,
  Activity,
  AlertTriangle,
  BarChart3,
  DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  badge?: number;
  children?: MenuItem[];
  action?: () => void;
}

interface ModernAdminLayoutProps {
  children: React.ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
  user: any;
  onLogout: () => void;
  stats?: any;
}

export function ModernAdminLayout({ 
  children, 
  activeSection, 
  onSectionChange, 
  user, 
  onLogout,
  stats 
}: ModernAdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['dashboard']);
  const [searchQuery, setSearchQuery] = useState('');

  // Menu structure yang lebih terorganisir
  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      action: () => onSectionChange('dashboard')
    },
    {
      id: 'events',
      label: 'Event Management',
      icon: Calendar,
      badge: stats?.totalEvents || 0,
      children: [
        {
          id: 'events-list',
          label: 'Daftar Event',
          icon: Calendar,
          action: () => onSectionChange('events-list')
        },
        {
          id: 'events-create',
          label: 'Buat Event Baru',
          icon: Plus,
          action: () => onSectionChange('events-create')
        },
        {
          id: 'events-status',
          label: 'Status Manager',
          icon: Monitor,
          action: () => onSectionChange('events-status')
        }
      ]
    },
    {
      id: 'media',
      label: 'Media & Gallery',
      icon: Image,
      badge: stats?.totalPhotos || 0,
      children: [
        {
          id: 'media-homepage',
          label: 'Galeri Homepage',
          icon: Image,
          action: () => onSectionChange('media-homepage')
        },
        {
          id: 'media-slideshow',
          label: 'Hero Slideshow',
          icon: Monitor,
          action: () => onSectionChange('media-slideshow')
        },
        {
          id: 'media-events',
          label: 'Foto Event',
          icon: Calendar,
          action: () => onSectionChange('media-events')
        }
      ]
    },
    {
      id: 'system',
      label: 'System & Monitoring',
      icon: Monitor,
      children: [
        {
          id: 'system-monitor',
          label: 'System Monitor',
          icon: Monitor,
          action: () => onSectionChange('system-monitor')
        },
        {
          id: 'system-alerts',
          label: 'Alert Dashboard',
          icon: AlertTriangle,
          action: () => onSectionChange('system-alerts')
        },
        {
          id: 'system-advanced',
          label: 'Advanced Monitoring',
          icon: BarChart3,
          action: () => onSectionChange('system-advanced')
        },
        {
          id: 'system-dslr',
          label: 'DSLR Monitor',
          icon: Monitor,
          action: () => onSectionChange('system-dslr')
        },
        {
          id: 'system-backup',
          label: 'Backup Status',
          icon: Monitor,
          action: () => onSectionChange('system-backup')
        },
        {
          id: 'system-notifications',
          label: 'Notifications',
          icon: Bell,
          action: () => onSectionChange('system-notifications')
        }
      ]
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      children: [
        {
          id: 'settings-theme',
          label: 'Tema & Tampilan',
          icon: Settings,
          action: () => onSectionChange('settings-theme')
        },
        {
          id: 'settings-pricing',
          label: 'Paket Harga',
          icon: DollarSign,
          action: () => onSectionChange('settings-pricing')
        },
        {
          id: 'settings-profile',
          label: 'Profile',
          icon: User,
          action: () => onSectionChange('settings-profile')
        }
      ]
    }
  ];

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const filteredMenuItems = menuItems.filter(item => 
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.children?.some(child => 
      child.label.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Close sidebar on mobile when section changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [activeSection]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">HP</span>
            </div>
            <div>
              <h1 className="text-xs md:text-sm font-semibold text-gray-900">HafiPortrait</h1>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredMenuItems.map((item) => (
            <div key={item.id}>
              {/* Parent Menu Item */}
              <div
                className={cn(
                  "flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer",
                  activeSection.startsWith(item.id) 
                    ? "bg-blue-50 text-blue-700 border border-blue-200" 
                    : "text-gray-700 hover:bg-gray-100"
                )}
                onClick={() => {
                  if (item.children) {
                    toggleMenu(item.id);
                  } else if (item.action) {
                    item.action();
                  }
                }}
              >
                <div className="flex items-center space-x-3">
                  <item.icon className="h-4 w-4" />
                  <span className="font-medium">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </div>
                {item.children && (
                  <div className="flex-shrink-0">
                    {expandedMenus.includes(item.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </div>
                )}
              </div>

              {/* Child Menu Items */}
              {item.children && expandedMenus.includes(item.id) && (
                <div className="ml-4 mt-2 space-y-1">
                  {item.children.map((child) => (
                    <div
                      key={child.id}
                      className={cn(
                        "flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer",
                        activeSection === child.id
                          ? "bg-blue-100 text-blue-800 border-l-2 border-blue-500"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )}
                      onClick={() => child.action?.()}
                    >
                      <child.icon className="h-3 w-3" />
                      <span>{child.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* User Profile */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.full_name || 'Admin'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email || 'admin@hafiportrait.com'}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
            className="w-full justify-start"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Keluar
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 lg:hidden">
          <div className="flex items-center justify-between h-16 px-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-base md:text-lg font-semibold text-gray-900">Admin Dashboard</h1>
            <div className="w-10" /> {/* Spacer */}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}