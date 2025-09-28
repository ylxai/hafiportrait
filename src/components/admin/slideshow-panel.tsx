'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  Search, 
  Plus, 
  CheckCircle, 
  GripVertical,
  Filter,
  Eye,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SlideshowPanelProps {
  isOpen: boolean;
  onClose: () => void;
  slideshowPhotos: any[];
  homepagePhotos: any[];
  onAddToSlideshow: (photoId: string) => void;
  onRemoveFromSlideshow: (photoId: string) => void;
  isAddingToSlideshow?: boolean;
}

export function SlideshowPanel({
  isOpen,
  onClose,
  slideshowPhotos = [],
  homepagePhotos = [],
  onAddToSlideshow,
  onRemoveFromSlideshow,
  isAddingToSlideshow = false
}: SlideshowPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'current' | 'add'>('current');

  // Load panel state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('slideshow-panel-state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setSearchQuery(parsed.searchQuery || '');
        setActiveTab(parsed.activeTab || 'current');
      } catch (error) {
        console.error('Failed to load slideshow panel state:', error);
      }
    }
  }, []);

  // Save panel state when it changes
  useEffect(() => {
    const state = { searchQuery, activeTab };
    localStorage.setItem('slideshow-panel-state', JSON.stringify(state));
  }, [searchQuery, activeTab]);

  // Filter photos based on search
  const filteredHomepagePhotos = homepagePhotos.filter(photo =>
    photo.original_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Slide-out Panel */}
      <div className={cn(
        "fixed top-0 right-0 h-full w-full md:w-[600px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div>
            <h2 className="text-lg font-semibold">Kelola Hero Slideshow</h2>
            <p className="text-sm text-blue-100">
              {slideshowPhotos.length} foto aktif • {homepagePhotos.length} foto tersedia
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('current')}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors",
              activeTab === 'current'
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            <Eye className="w-4 h-4 inline mr-2" />
            Slideshow Aktif ({slideshowPhotos.length})
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={cn(
              "flex-1 px-4 py-3 text-sm font-medium transition-colors",
              activeTab === 'add'
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Tambah Foto ({filteredHomepagePhotos.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 max-h-[calc(100vh-200px)]">
          {activeTab === 'current' ? (
            /* Current Slideshow Photos */
            <div className="space-y-4">
              {slideshowPhotos.length > 0 ? (
                <div className="space-y-3">
                  {slideshowPhotos.map((photo, index) => (
                    <div key={photo.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                      {/* Drag Handle */}
                      <div className="cursor-move text-gray-400">
                        <GripVertical className="w-4 h-4" />
                      </div>
                      
                      {/* Order Number */}
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      
                      {/* Photo */}
                      <img
                        src={photo.url}
                        alt={photo.original_name}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{photo.original_name}</p>
                        <p className="text-xs text-gray-500">Urutan #{index + 1}</p>
                      </div>
                      
                      {/* Remove Button */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRemoveFromSlideshow(photo.id)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Eye className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Foto Slideshow</h3>
                  <p className="text-gray-500 mb-4">Tambahkan foto dari galeri homepage untuk memulai slideshow</p>
                  <Button onClick={() => setActiveTab('add')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Foto Pertama
                  </Button>
                </div>
              )}
            </div>
          ) : (
            /* Add Photos Tab */
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Cari foto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Stats */}
              <div className="flex gap-2">
                <Badge variant="secondary">
                  {filteredHomepagePhotos.length} foto tersedia
                </Badge>
                <Badge variant="outline">
                  {filteredHomepagePhotos.filter(photo => 
                    !slideshowPhotos.some(sp => sp.id === photo.id)
                  ).length} belum di slideshow
                </Badge>
              </div>

              {/* Photo Grid */}
              <div className="grid grid-cols-2 gap-3">
                {filteredHomepagePhotos.map((photo) => {
                  const isInSlideshow = slideshowPhotos.some(sp => sp.id === photo.id);
                  
                  return (
                    <div key={photo.id} className={cn(
                      "relative group border-2 rounded-lg transition-all",
                      isInSlideshow 
                        ? "border-green-500 bg-green-50" 
                        : "border-gray-200 hover:border-blue-300"
                    )}>
                      {/* Photo */}
                      <img
                        src={photo.url}
                        alt={photo.original_name}
                        className="w-full aspect-square object-cover rounded-md"
                      />
                      
                      {/* Status Overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all rounded-md" />
                      
                      {/* Status Badge */}
                      <div className="absolute top-2 left-2">
                        {isInSlideshow ? (
                          <Badge className="bg-green-500 text-white">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Di Slideshow
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            Klik untuk tambah
                          </Badge>
                        )}
                      </div>
                      
                      {/* Action Button - Larger and more accessible */}
                      <div className="absolute bottom-3 right-3">
                        {isInSlideshow ? (
                          <div className="bg-green-500 text-white rounded-full p-3 shadow-lg">
                            <CheckCircle className="w-5 h-5" />
                          </div>
                        ) : (
                          <Button
                            size="lg"
                            onClick={() => onAddToSlideshow(photo.id)}
                            disabled={isAddingToSlideshow}
                            className="rounded-full p-3 bg-blue-500 hover:bg-blue-600 hover:scale-110 transition-all shadow-lg"
                          >
                            {isAddingToSlideshow ? (
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Plus className="w-5 h-5" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredHomepagePhotos.length === 0 && (
                <div className="text-center py-8">
                  <Search className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500">Tidak ada foto yang cocok dengan pencarian</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Maksimal 10 foto slideshow</span>
            <span>{slideshowPhotos.length}/10 foto</span>
          </div>
        </div>
      </div>
    </>
  );
}