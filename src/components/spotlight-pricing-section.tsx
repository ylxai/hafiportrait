'use client';

import React, { useState, useEffect } from 'react';
import SpotlightCard from './ui/spotlight-card';
import { Button } from './ui/button';
import { Check, Star, Zap, Crown, Camera, Clock, MessageCircle } from 'lucide-react';
import WhatsAppContactModal from './ui/whatsapp-contact-modal';
import { PackageDetails } from '@/lib/whatsapp-integration';

type PricingPackage = {
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
  tier?: 'basic' | 'standard' | 'premium' | 'luxury';
};

// Helper function to get spotlight color based on tier
const getSpotlightColor = (tier?: string) => {
  switch (tier) {
    case 'basic': return 'rgba(59, 130, 246, 0.3)'; // Keep blue for basic
    case 'standard': return 'rgba(34, 197, 94, 0.3)'; // Keep green for popular
    case 'premium': return 'rgba(244, 114, 182, 0.35)'; // Soft pink instead of purple
    case 'luxury': return 'rgba(236, 72, 153, 0.3)'; // Dark pink for luxury
    default: return 'rgba(156, 163, 175, 0.3)';
  }
};

// Helper function to get icon based on tier
const getTierIcon = (tier?: string) => {
  switch (tier) {
    case 'basic': return <Zap className="w-6 h-6" />;
    case 'standard': return <Star className="w-6 h-6" />;
    case 'premium': return <Crown className="w-6 h-6" />;
    case 'luxury': return <Camera className="w-6 h-6" />;
    default: return <Camera className="w-6 h-6" />;
  }
};

export default function SpotlightPricingSection() {
  const [selectedPackage, setSelectedPackage] = useState<PackageDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [packages, setPackages] = useState<PricingPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/pricing-packages', {
        credentials: 'same-origin',
        headers: {
          'Accept': 'application/json',
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPackages(data);
      } else {
        // Fallback data yang sama dengan glassmorphism
        setPackages([
          {
            id: '1',
            name: 'Paket Akad Basic',
            price: 'IDR 1.300.000',
            duration: '4-6 jam',
            guests: '50-100 tamu',
            photos: '200+ foto',
            delivery: '3-5 hari',
            features: [
              '1 fotografer profesional',
              '40 cetak foto 5R premium',
              'Album magnetik eksklusif',
              'File digital tanpa batas',
              'Flashdisk 16GB branded',
              'Real-time sharing app'
            ],
            badge: 'Hemat',
            is_popular: false,
            is_active: true,
            sort_order: 1,
            tier: 'basic'
          },
          {
            id: '2',
            name: 'Paket Resepsi Standard',
            price: 'IDR 1.800.000',
            duration: '6-8 jam',
            guests: '100-200 tamu',
            photos: '300+ foto',
            delivery: '3-5 hari',
            features: [
              '1 fotografer + 1 asisten',
              '40 cetak foto 5R premium',
              'Album magnetik premium',
              'File digital tanpa batas',
              'Flashdisk 32GB branded',
              'Cetak besar 14R + frame',
              'Real-time sharing app',
              'Backup cloud storage'
            ],
            badge: 'Populer',
            is_popular: true,
            is_active: true,
            sort_order: 2,
            tier: 'standard'
          },
          {
            id: '3',
            name: 'Paket Premium Complete',
            price: 'IDR 2.500.000',
            duration: '8-10 jam',
            guests: '200-300 tamu',
            photos: '500+ foto',
            delivery: '2-3 hari',
            features: [
              '2 fotografer profesional',
              '2 asisten fotografer',
              '60 cetak foto 5R premium',
              'Album kolase premium',
              'File digital tanpa batas',
              'Flashdisk 64GB branded',
              'Cetak besar 16R + frame',
              'Video cinematic 3-5 menit',
              'Drone shot (jika memungkinkan)',
              'Real-time sharing app',
              'Backup cloud storage'
            ],
            badge: 'Premium',
            is_popular: false,
            is_active: true,
            sort_order: 3,
            tier: 'premium'
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
      setPackages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPackage = (pkg: PricingPackage) => {
    const packageDetails: PackageDetails = {
      name: pkg.name,
      price: pkg.price,
      features: pkg.features
    };
    setSelectedPackage(packageDetails);
    setIsModalOpen(true);
  };

  // Filter and sort active packages
  const activePackages = packages
    .filter(pkg => pkg.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);

  if (isLoading) {
    return (
      <section className="py-20 px-4 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-white">Loading packages...</div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section id="pricing" className="py-20 px-4 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Paket <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-pink-500 to-green-400">Photography</span>
            </h2>
            <p className="text-xl text-neutral-400 max-w-3xl mx-auto">
              Pilih paket yang sesuai dengan kebutuhan event spesial Anda
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {activePackages.map((pkg) => (
              <div key={pkg.id} className="relative">
                {/* Popular Badge */}
                {pkg.is_popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                      {pkg.badge || 'Populer'}
                    </div>
                  </div>
                )}
                
                {/* Other Badge */}
                {pkg.badge && !pkg.is_popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                      {pkg.badge}
                    </div>
                  </div>
                )}

                <SpotlightCard 
                  className={`h-full transition-transform duration-300 hover:scale-105 ${
                    pkg.is_popular ? 'border-green-500/50' : pkg.tier === 'premium' ? 'border-pink-500/50' : 'border-neutral-700'
                  }`}
                  spotlightColor={getSpotlightColor(pkg.tier)}
                >
                  <div className="relative z-10 h-full flex flex-col">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`p-2 rounded-lg ${
                        pkg.is_popular 
                          ? 'bg-green-500/20 text-green-400' 
                          : pkg.tier === 'premium' 
                          ? 'bg-pink-500/20 text-pink-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {getTierIcon(pkg.tier)}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">{pkg.name}</h3>
                        {pkg.duration && (
                          <p className="text-neutral-400 text-sm flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {pkg.duration}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-6">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-white">
                          {pkg.price}
                        </span>
                      </div>
                      {pkg.guests && (
                        <span className="text-neutral-400">{pkg.guests}</span>
                      )}
                      {pkg.photos && (
                        <div className="text-neutral-400 text-sm mt-1">{pkg.photos}</div>
                      )}
                    </div>

                    {/* Features */}
                    <div className="flex-1 mb-8">
                      <ul className="space-y-3">
                        {pkg.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-center gap-3">
                            <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                            <span className="text-neutral-300">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* CTA Button */}
                    <Button 
                      onClick={() => handleSelectPackage(pkg)}
                      className={`w-full py-3 font-semibold transition-all duration-300 ${
                        pkg.is_popular
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
                          : pkg.tier === 'premium'
                          ? 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white'
                          : 'bg-transparent border-2 border-neutral-600 text-white hover:border-neutral-400 hover:bg-neutral-800'
                      }`}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Pilih Paket
                    </Button>
                  </div>
                </SpotlightCard>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-16">
            <p className="text-neutral-400 mb-6">
              Butuh paket custom atau ada pertanyaan? 
            </p>
            <Button 
              variant="outline" 
              className="bg-transparent border-neutral-600 text-white hover:border-neutral-400 hover:bg-neutral-800"
              onClick={() => setIsModalOpen(true)}
            >
              Konsultasi Gratis
            </Button>
          </div>
        </div>
      </section>

      {/* WhatsApp Modal */}
      <WhatsAppContactModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        packageDetails={selectedPackage}
      />
    </>
  );
}