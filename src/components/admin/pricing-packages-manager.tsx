'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  GripVertical,
  Eye,
  EyeOff,
  Star,
  Crown,
  ArrowUp,
  ArrowDown,
  Move
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import dynamic from 'next/dynamic';

// Import the reorder helper component
const PackageReorderHelper = dynamic(() => import("./package-reorder-helper"), { ssr: false });

interface PricingPackage {
  id: string;
  name: string;
  price: string;
  duration?: string;
  guests?: string;
  photos?: string;
  delivery?: string;
  features: string[];
  badge?: string;
  is_popular: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface PackageFormData {
  name: string;
  price: string;
  duration: string;
  guests: string;
  photos: string;
  delivery: string;
  features: string[];
  badge: string;
  is_popular: boolean;
  is_active: boolean;
}

const initialFormData: PackageFormData = {
  name: '',
  price: '',
  duration: '',
  guests: '',
  photos: '',
  delivery: '',
  features: [''],
  badge: '',
  is_popular: false,
  is_active: true,
};

export default function PricingPackagesManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PricingPackage | null>(null);
  const [formData, setFormData] = useState<PackageFormData>(initialFormData);
  const [showReorderHelper, setShowReorderHelper] = useState(false);
  const [useEasyForm, setUseEasyForm] = useState(false);
  const [easyFormText, setEasyFormText] = useState('');

  // Fetch packages
  const { data: packages = [], isLoading } = useQuery<PricingPackage[]>({
    queryKey: ['/api/admin/pricing-packages'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/pricing-packages");
      return response.json();
    },
  });

  // Create package mutation
  const createPackageMutation = useMutation({
    mutationFn: async (packageData: PackageFormData) => {
      const response = await apiRequest("POST", "/api/admin/pricing-packages", packageData);
      if (!response.ok) throw new Error('Failed to create package');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pricing-packages'] });
      setIsFormOpen(false);
      setFormData(initialFormData);
      toast({
        title: "✅ Paket Berhasil Dibuat!",
        description: "Paket harga baru telah ditambahkan.",
      });
    },
    onError: () => {
      toast({
        title: "❌ Gagal Membuat Paket",
        description: "Terjadi kesalahan saat membuat paket.",
        variant: "destructive",
      });
    },
  });

  // Update package mutation
  const updatePackageMutation = useMutation({
    mutationFn: async ({ id, packageData }: { id: string; packageData: PackageFormData }) => {
      const response = await apiRequest("PUT", `/api/admin/pricing-packages/${id}`, packageData);
      if (!response.ok) throw new Error('Failed to update package');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pricing-packages'] });
      setIsFormOpen(false);
      setEditingPackage(null);
      setFormData(initialFormData);
      toast({
        title: "✅ Paket Berhasil Diupdate!",
        description: "Perubahan telah disimpan.",
      });
    },
    onError: () => {
      toast({
        title: "❌ Gagal Update Paket",
        description: "Terjadi kesalahan saat mengupdate paket.",
        variant: "destructive",
      });
    },
  });

  // Delete package mutation
  const deletePackageMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/admin/pricing-packages/${id}`);
      if (!response.ok) throw new Error('Failed to delete package');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pricing-packages'] });
      toast({
        title: "✅ Paket Berhasil Dihapus!",
        description: "Paket telah dihapus dari sistem.",
      });
    },
    onError: () => {
      toast({
        title: "❌ Gagal Menghapus Paket",
        description: "Terjadi kesalahan saat menghapus paket.",
        variant: "destructive",
      });
    },
  });

  // Toggle active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const response = await apiRequest("PUT", `/api/admin/pricing-packages/${id}/toggle-active`, { is_active });
      if (!response.ok) throw new Error('Failed to toggle active status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pricing-packages'] });
      toast({
        title: "✅ Status Berhasil Diubah!",
        description: "Status paket telah diupdate.",
      });
    },
  });

  // Reorder packages
  const reorderMutation = useMutation({
    mutationFn: async (reorderedPackages: { id: string; sort_order: number }[]) => {
      const response = await apiRequest("PUT", "/api/admin/pricing-packages/reorder", { packages: reorderedPackages });
      if (!response.ok) throw new Error('Failed to reorder packages');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pricing-packages'] });
      toast({
        title: "✅ Urutan Berhasil Diubah!",
        description: "Posisi paket telah diupdate.",
      });
    },
    onError: () => {
      toast({
        title: "❌ Gagal Mengubah Urutan",
        description: "Terjadi kesalahan saat mengubah posisi paket.",
        variant: "destructive",
      });
    },
  });

  const handleCreateNew = () => {
    setEditingPackage(null);
    setFormData(initialFormData);
    setEasyFormText('');
    setUseEasyForm(true); // Start with easy form for new packages
    setIsFormOpen(true);
  };

  const handleEdit = (pkg: PricingPackage) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      price: pkg.price,
      duration: pkg.duration || '',
      guests: pkg.guests || '',
      photos: pkg.photos || '',
      delivery: pkg.delivery || '',
      features: pkg.features.length > 0 ? pkg.features : [''],
      badge: pkg.badge || '',
      is_popular: pkg.is_popular,
      is_active: pkg.is_active,
    });
    
    // Convert to easy form format
    const easyText = convertToEasyFormat(pkg);
    setEasyFormText(easyText);
    setUseEasyForm(false); // Start with detailed form for editing
    setIsFormOpen(true);
  };

  const convertToEasyFormat = (pkg: PricingPackage) => {
    let text = `${pkg.name}\n${pkg.price}\n`;
    if (pkg.duration) text += `${pkg.duration}\n`;
    if (pkg.guests) text += `${pkg.guests}\n`;
    if (pkg.photos) text += `${pkg.photos}\n`;
    if (pkg.delivery) text += `${pkg.delivery}\n`;
    
    pkg.features.forEach(feature => {
      text += `${feature}\n`;
    });
    
    return text.trim();
  };

  const parseEasyForm = (text: string) => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    if (lines.length < 2) return null;

    const name = lines[0];
    const price = lines[1];
    const features = lines.slice(2);

    // Try to extract common fields from features
    let duration = '';
    let guests = '';
    let photos = '';
    let delivery = '';
    const remainingFeatures: string[] = [];

    features.forEach(feature => {
      const lower = feature.toLowerCase();
      if (lower.includes('hari kerja') || lower.includes('jam')) {
        duration = feature;
      } else if (lower.includes('tamu') || lower.includes('orang')) {
        guests = feature;
      } else if (lower.includes('foto') && (lower.includes('digital') || lower.includes('+'))) {
        photos = feature;
      } else if (lower.includes('hari kerja') && (lower.includes('delivery') || lower.includes('selesai'))) {
        delivery = feature;
      } else {
        remainingFeatures.push(feature);
      }
    });

    return {
      name,
      price,
      duration,
      guests,
      photos,
      delivery,
      features: remainingFeatures.length > 0 ? remainingFeatures : [''],
      badge: '',
      is_popular: false,
      is_active: true
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalData = formData;
    
    // If using easy form, parse the text first
    if (useEasyForm && easyFormText.trim()) {
      const parsedData = parseEasyForm(easyFormText);
      if (!parsedData) {
        toast({
          title: "❌ Format Tidak Valid",
          description: "Pastikan minimal ada nama paket dan harga di baris pertama dan kedua.",
          variant: "destructive",
        });
        return;
      }
      finalData = { ...formData, ...parsedData };
    }
    
    // Filter out empty features
    const cleanedData = {
      ...finalData,
      features: finalData.features.filter(feature => feature.trim() !== ''),
    };

    if (editingPackage) {
      updatePackageMutation.mutate({ id: editingPackage.id, packageData: cleanedData });
    } else {
      createPackageMutation.mutate(cleanedData);
    }
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const updateFeature = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((feature, i) => i === index ? value : feature)
    }));
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const movePackageUp = (index: number) => {
    if (index === 0) return;
    
    const newPackages = [...packages];
    const currentPackage = newPackages[index];
    const previousPackage = newPackages[index - 1];
    
    // Swap sort orders
    const tempSortOrder = currentPackage.sort_order;
    currentPackage.sort_order = previousPackage.sort_order;
    previousPackage.sort_order = tempSortOrder;
    
    // Swap positions in array
    [newPackages[index], newPackages[index - 1]] = [newPackages[index - 1], newPackages[index]];
    
    // Update backend
    reorderMutation.mutate([
      { id: currentPackage.id, sort_order: currentPackage.sort_order },
      { id: previousPackage.id, sort_order: previousPackage.sort_order }
    ]);
  };

  const movePackageDown = (index: number) => {
    if (index === packages.length - 1) return;
    
    const newPackages = [...packages];
    const currentPackage = newPackages[index];
    const nextPackage = newPackages[index + 1];
    
    // Swap sort orders
    const tempSortOrder = currentPackage.sort_order;
    currentPackage.sort_order = nextPackage.sort_order;
    nextPackage.sort_order = tempSortOrder;
    
    // Swap positions in array
    [newPackages[index], newPackages[index + 1]] = [newPackages[index + 1], newPackages[index]];
    
    // Update backend
    reorderMutation.mutate([
      { id: currentPackage.id, sort_order: currentPackage.sort_order },
      { id: nextPackage.id, sort_order: nextPackage.sort_order }
    ]);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Manajemen Paket Harga</h1>
          <p className="text-sm md:text-base text-gray-600">
            Kelola paket harga photography untuk website
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {packages.length > 1 && (
            <Button 
              onClick={() => setShowReorderHelper(!showReorderHelper)} 
              variant="outline"
              className="w-full sm:w-auto"
            >
              <Move className="w-4 h-4 mr-2" />
              {showReorderHelper ? 'Sembunyikan' : 'Atur Urutan'}
            </Button>
          )}
          <Button onClick={handleCreateNew} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Paket Baru
          </Button>
        </div>
      </div>

      {/* Bulk Reorder Helper */}
      {showReorderHelper && packages.length > 1 && (
        <PackageReorderHelper
          packages={packages}
          onReorder={(reorderedPackages) => reorderMutation.mutate(reorderedPackages)}
          isReordering={reorderMutation.isPending}
        />
      )}

      {/* Reorder Instructions */}
      {packages.length > 1 && !showReorderHelper && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Move className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Mengatur Urutan Paket</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Gunakan tombol ↑ ↓ untuk mengubah posisi paket satu per satu, atau klik "Atur Urutan" untuk mode bulk editing.
                  Urutan di sini akan sama dengan urutan tampil di website.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Packages List */}
      <div className="grid gap-4">
        {packages.map((pkg, index) => (
          <Card key={pkg.id} className={`${!pkg.is_active ? 'opacity-60' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {/* Position & Reorder Controls */}
                  <div className="flex flex-col items-center gap-1 pt-1 min-w-[60px]">
                    <div className="flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      <Move className="w-3 h-3" />
                      <span>#{index + 1}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-6 w-6 p-0 transition-colors ${
                          index === 0 ? 'text-gray-300' : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
                        }`}
                        onClick={() => movePackageUp(index)}
                        disabled={index === 0 || reorderMutation.isPending}
                        title={index === 0 ? "Sudah di posisi teratas" : "Pindah ke atas"}
                      >
                        <ArrowUp className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-6 w-6 p-0 transition-colors ${
                          index === packages.length - 1 ? 'text-gray-300' : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
                        }`}
                        onClick={() => movePackageDown(index)}
                        disabled={index === packages.length - 1 || reorderMutation.isPending}
                        title={index === packages.length - 1 ? "Sudah di posisi terbawah" : "Pindah ke bawah"}
                      >
                        <ArrowDown className="w-3 h-3" />
                      </Button>
                    </div>
                    {reorderMutation.isPending && (
                      <div className="text-xs text-blue-600 animate-pulse">
                        Updating...
                      </div>
                    )}
                  </div>

                  {/* Package Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{pkg.name}</CardTitle>
                      {pkg.is_popular && <Crown className="w-4 h-4 text-yellow-500" />}
                      {!pkg.is_active && <EyeOff className="w-4 h-4 text-gray-400" />}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="text-lg font-bold">
                        {pkg.price}
                      </Badge>
                      {pkg.badge && (
                        <Badge variant="outline">{pkg.badge}</Badge>
                      )}
                      <Badge variant={pkg.is_active ? "default" : "secondary"}>
                        {pkg.is_active ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleActiveMutation.mutate({ 
                      id: pkg.id, 
                      is_active: !pkg.is_active 
                    })}
                    title={pkg.is_active ? "Nonaktifkan" : "Aktifkan"}
                  >
                    {pkg.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(pkg)}
                    title="Edit paket"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" title="Hapus paket">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Paket</AlertDialogTitle>
                        <AlertDialogDescription>
                          Yakin ingin menghapus paket "{pkg.name}"? Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deletePackageMutation.mutate(pkg.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Hapus
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                {pkg.duration && (
                  <div>
                    <span className="font-medium">Durasi:</span>
                    <p className="text-gray-600">{pkg.duration}</p>
                  </div>
                )}
                {pkg.guests && (
                  <div>
                    <span className="font-medium">Tamu:</span>
                    <p className="text-gray-600">{pkg.guests}</p>
                  </div>
                )}
                {pkg.photos && (
                  <div>
                    <span className="font-medium">Foto:</span>
                    <p className="text-gray-600">{pkg.photos}</p>
                  </div>
                )}
                {pkg.delivery && (
                  <div>
                    <span className="font-medium">Delivery:</span>
                    <p className="text-gray-600">{pkg.delivery}</p>
                  </div>
                )}
              </div>
              
              {pkg.features.length > 0 && (
                <div>
                  <span className="font-medium text-sm">Fitur:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {pkg.features.slice(0, 3).map((feature, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                    {pkg.features.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{pkg.features.length - 3} lainnya
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPackage ? 'Edit Paket Harga' : 'Tambah Paket Baru'}
            </DialogTitle>
          </DialogHeader>
          
          {/* Form Mode Toggle */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Button
                type="button"
                variant={useEasyForm ? "default" : "outline"}
                size="sm"
                onClick={() => setUseEasyForm(true)}
              >
                📝 Form Mudah
              </Button>
              <Button
                type="button"
                variant={!useEasyForm ? "default" : "outline"}
                size="sm"
                onClick={() => setUseEasyForm(false)}
              >
                ⚙️ Form Detail
              </Button>
            </div>
            <div className="text-xs text-blue-600">
              {useEasyForm ? 'Copy-paste langsung dari daftar' : 'Form lengkap dengan field terpisah'}
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {useEasyForm ? (
              /* Easy Form Mode */
              <div className="space-y-4">
                <div>
                  <Label htmlFor="easy-form-text">
                    📝 Tulis atau Copy-Paste Paket Harga
                  </Label>
                  <Textarea
                    id="easy-form-text"
                    value={easyFormText}
                    onChange={(e) => setEasyFormText(e.target.value)}
                    placeholder={`Contoh format:
Akad Nikah & Resepsi
IDR 3.000.000
1 fotografer & 1 asisten fotografer
2 hari kerja
80 cetak foto 5R (pilihan)
Album magnetik (tempel)
File foto tanpa batas
Softcopy di flashdisk
1 cetak besar 14R + frame`}
                    className="min-h-[300px] font-mono text-sm"
                    required
                  />
                  <div className="mt-2 text-xs text-gray-600 space-y-1">
                    <p><strong>📋 Format:</strong></p>
                    <p>• Baris 1: Nama paket</p>
                    <p>• Baris 2: Harga (contoh: IDR 3.000.000)</p>
                    <p>• Baris 3+: Fitur-fitur (satu per baris)</p>
                    <p>• Gunakan Enter untuk baris baru</p>
                    <p>• Sistem akan otomatis mendeteksi durasi, tamu, foto, dll.</p>
                  </div>
                </div>

                {/* Preview parsed data */}
                {easyFormText.trim() && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium mb-2">👀 Preview:</h4>
                    <div className="text-xs space-y-1">
                      {easyFormText.split('\n').map((line, index) => (
                        <div key={index} className="flex">
                          <span className="w-12 text-gray-400">#{index + 1}</span>
                          <span className={index === 0 ? 'font-bold text-blue-600' : index === 1 ? 'font-bold text-green-600' : 'text-gray-700'}>
                            {line.trim() || '(kosong)'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Settings for Easy Form */}
                <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <Label htmlFor="easy-badge">Badge (opsional)</Label>
                    <Input
                      id="easy-badge"
                      value={formData.badge}
                      onChange={(e) => setFormData(prev => ({ ...prev, badge: e.target.value }))}
                      placeholder="⭐ Populer"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="easy-popular"
                        checked={formData.is_popular}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_popular: checked }))}
                      />
                      <Label htmlFor="easy-popular">Paket Populer</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="easy-active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                      />
                      <Label htmlFor="easy-active">Aktif</Label>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Detailed Form Mode */
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nama Paket *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Paket Wedding Basic"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="price">Harga *</Label>
                    <Input
                      id="price"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="IDR 1.500.000"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="duration">Durasi</Label>
                    <Input
                      id="duration"
                      value={formData.duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                      placeholder="1 hari kerja"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="guests">Kapasitas Tamu</Label>
                    <Input
                      id="guests"
                      value={formData.guests}
                      onChange={(e) => setFormData(prev => ({ ...prev, guests: e.target.value }))}
                      placeholder="100-200 tamu"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="photos">Jumlah Foto</Label>
                    <Input
                      id="photos"
                      value={formData.photos}
                      onChange={(e) => setFormData(prev => ({ ...prev, photos: e.target.value }))}
                      placeholder="300+ foto digital"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="delivery">Waktu Delivery</Label>
                    <Input
                      id="delivery"
                      value={formData.delivery}
                      onChange={(e) => setFormData(prev => ({ ...prev, delivery: e.target.value }))}
                      placeholder="3-5 hari kerja"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="badge">Badge</Label>
                  <Input
                    id="badge"
                    value={formData.badge}
                    onChange={(e) => setFormData(prev => ({ ...prev, badge: e.target.value }))}
                    placeholder="⭐ Populer"
                  />
                </div>

                <div>
                  <Label>Fitur Paket</Label>
                  <div className="space-y-2">
                    {formData.features.map((feature, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={feature}
                          onChange={(e) => updateFeature(index, e.target.value)}
                          placeholder="Masukkan fitur paket"
                        />
                        {formData.features.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeFeature(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addFeature}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah Fitur
                    </Button>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_popular"
                      checked={formData.is_popular}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_popular: checked }))}
                    />
                    <Label htmlFor="is_popular">Paket Populer</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label htmlFor="is_active">Aktif</Label>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={createPackageMutation.isPending || updatePackageMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {editingPackage ? 'Update' : 'Simpan'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}