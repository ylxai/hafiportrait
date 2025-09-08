'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowUp, 
  ArrowDown, 
  Save, 
  RotateCcw,
  Move,
  Eye,
  EyeOff
} from "lucide-react";

interface PricingPackage {
  id: string;
  name: string;
  price: string;
  badge?: string;
  is_popular: boolean;
  is_active: boolean;
  sort_order: number;
}

interface PackageReorderHelperProps {
  packages: PricingPackage[];
  onReorder: (reorderedPackages: { id: string; sort_order: number }[]) => void;
  isReordering?: boolean;
}

export default function PackageReorderHelper({ 
  packages, 
  onReorder, 
  isReordering = false 
}: PackageReorderHelperProps) {
  const [localPackages, setLocalPackages] = useState([...packages]);
  const [hasChanges, setHasChanges] = useState(false);

  const movePackage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= localPackages.length) return;
    
    const newPackages = [...localPackages];
    const [movedPackage] = newPackages.splice(fromIndex, 1);
    newPackages.splice(toIndex, 0, movedPackage);
    
    // Update sort orders
    const updatedPackages = newPackages.map((pkg, index) => ({
      ...pkg,
      sort_order: index + 1
    }));
    
    setLocalPackages(updatedPackages);
    setHasChanges(true);
  };

  const handleSave = () => {
    const reorderData = localPackages.map((pkg, index) => ({
      id: pkg.id,
      sort_order: index + 1
    }));
    
    onReorder(reorderData);
    setHasChanges(false);
  };

  const handleReset = () => {
    setLocalPackages([...packages]);
    setHasChanges(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Move className="w-5 h-5" />
            Preview Urutan Paket
          </CardTitle>
          {hasChanges && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={isReordering}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isReordering}
              >
                <Save className="w-4 h-4 mr-2" />
                {isReordering ? 'Menyimpan...' : 'Simpan Urutan'}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {localPackages.map((pkg, index) => (
            <div
              key={pkg.id}
              className={`flex items-center gap-3 p-3 border rounded-lg transition-all ${
                hasChanges ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
              }`}
            >
              {/* Position */}
              <div className="flex items-center gap-2 min-w-[80px]">
                <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0"
                    onClick={() => movePackage(index, index - 1)}
                    disabled={index === 0 || isReordering}
                  >
                    <ArrowUp className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0"
                    onClick={() => movePackage(index, index + 1)}
                    disabled={index === localPackages.length - 1 || isReordering}
                  >
                    <ArrowDown className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Package Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{pkg.name}</span>
                  {!pkg.is_active && <EyeOff className="w-4 h-4 text-gray-400" />}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {pkg.price}
                  </Badge>
                  {pkg.badge && (
                    <Badge variant="outline" className="text-xs">
                      {pkg.badge}
                    </Badge>
                  )}
                  {pkg.is_popular && (
                    <Badge className="text-xs bg-yellow-500">
                      Populer
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {hasChanges && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ Ada perubahan urutan yang belum disimpan. Klik "Simpan Urutan" untuk menerapkan perubahan.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}