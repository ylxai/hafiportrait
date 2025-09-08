'use client';

import { Button } from "@/components/ui/button";
import { Check, MessageCircle, Clock, Camera } from "lucide-react";
import { useState, useEffect } from "react";
import WhatsAppContactModal from "@/components/ui/whatsapp-contact-modal";
import { PackageDetails } from "@/lib/whatsapp-integration";

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

export default function ModernGlassmorphismPricing() {
  const [selectedPackage, setSelectedPackage] = useState<PackageDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [packages, setPackages] = useState<PricingPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/pricing-packages');
      if (response.ok) {
        const data = await response.json();
        setPackages(data);
      } else {
        // Fallback data untuk demo
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

  return (
    <>
      <section className="py-20 bg-[var(--color-bg-secondary)] relative overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--color-text-primary)] mb-6">
              Paket Harga
            </h2>
            
            <p className="text-base text-[var(--color-text-secondary)] max-w-2xl mx-auto mb-6">
              Pilih paket yang sesuai dengan kebutuhan event spesial Anda
            </p>
          </div>
          
          {isLoading && (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-accent)] mx-auto"></div>
              <p className="mt-4 text-[var(--color-text-secondary)]">Memuat paket harga...</p>
            </div>
          )}
          
          {!isLoading && packages.length === 0 && (
            <div className="text-center py-16">
              <div className="bg-white rounded-lg p-8 max-w-md mx-auto shadow-sm">
                <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-[var(--color-text-secondary)] mb-6">Paket harga sedang dalam pembaruan. Silakan hubungi kami untuk informasi terbaru.</p>
                <Button 
                  onClick={() => {
                    const fallbackPackage: PackageDetails = {
                      name: "Konsultasi Paket",
                      price: "Hubungi Kami",
                      features: ["Konsultasi gratis", "Paket custom sesuai kebutuhan", "Harga terbaik"]
                    };
                    setSelectedPackage(fallbackPackage);
                    setIsModalOpen(true);
                  }}
                  className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] text-white rounded-lg px-6 py-3"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Hubungi WhatsApp
                </Button>
              </div>
            </div>
          )}
          
          {!isLoading && packages.length > 0 && (
            <div className="pt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`group relative transition-all duration-300 hover:scale-105 ${
                      pkg.is_popular ? 'lg:-mt-4' : ''
                    }`}
                  >
                    {/* Popular Badge */}
                    {pkg.is_popular && (
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-30">
                        <div className="bg-[var(--color-accent)] text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                          TERPOPULER
                        </div>
                      </div>
                    )}

                    {/* Pricing Card */}
                    <div className={`
                      relative h-full bg-white rounded-lg overflow-hidden transition-all duration-300
                      ${pkg.is_popular 
                        ? 'ring-2 ring-[var(--color-accent)] shadow-lg' 
                        : 'shadow-md hover:shadow-lg'
                      }
                      min-h-[600px]
                    `}>
                      
                      {/* Badge */}
                      {pkg.badge && !pkg.is_popular && (
                        <div className="absolute top-4 right-4 z-20">
                          <span className="bg-gray-100 text-[var(--color-text-secondary)] px-3 py-1 rounded-lg text-xs font-medium">
                            {pkg.badge}
                          </span>
                        </div>
                      )}

                      <div className="relative z-10 p-6 sm:p-8 h-full flex flex-col">
                        {/* Header */}
                        <div className="text-center mb-6">
                          <h3 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)] mb-4 leading-tight">
                            {pkg.name}
                          </h3>
                          
                          <div className="mb-6">
                            <div className="text-3xl sm:text-4xl font-black text-[var(--color-accent)]">
                              {pkg.price}
                            </div>
                            <div className="text-sm text-[var(--color-text-muted)] mt-1">/event</div>
                          </div>

                          {/* Quick Stats */}
                          {(pkg.duration || pkg.photos) && (
                            <div className={`grid gap-4 text-sm ${
                              pkg.duration && pkg.photos 
                                ? 'grid-cols-2' 
                                : 'grid-cols-1 max-w-[200px] mx-auto'
                            } mb-6`}>
                              {pkg.duration && (
                                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                  <Clock className="w-5 h-5 text-[var(--color-accent)] mx-auto mb-2" />
                                  <div className="font-medium text-[var(--color-text-primary)] text-center">{pkg.duration}</div>
                                </div>
                              )}
                              {pkg.photos && (
                                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                  <Camera className="w-5 h-5 text-[var(--color-accent)] mx-auto mb-2" />
                                  <div className="font-medium text-[var(--color-text-primary)] text-center">{pkg.photos}</div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Features List */}
                        <div className="flex-1 mb-6">
                          <ul className="space-y-3">
                            {pkg.features.map((feature, i) => (
                              <li key={i} className="flex items-start text-sm">
                                <div className="flex-shrink-0 mr-3 mt-0.5">
                                  <Check className="w-4 h-4 text-green-500" />
                                </div>
                                <span className="text-[var(--color-text-secondary)] leading-relaxed">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* CTA Button */}
                        <div className="mt-auto">
                          <Button 
                            onClick={() => handleSelectPackage(pkg)}
                            className={`
                              w-full py-3 rounded-lg font-medium text-sm transition-all duration-300
                              ${pkg.is_popular 
                                ? 'bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] text-white shadow-md hover:shadow-lg' 
                                : 'bg-gray-100 hover:bg-gray-200 text-[var(--color-text-primary)]'
                              }
                            `}
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            {pkg.is_popular ? 'Pilih Paket Ini' : 'Konsultasi Gratis'}
                          </Button>

                          {/* Trust Indicator */}
                          <div className="mt-4 text-center">
                            <div className="bg-gray-50 rounded-full px-4 py-2 inline-flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                              <span className="font-medium">Respon cepat</span>
                              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                              <span className="font-medium">Konsultasi gratis</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* WhatsApp Modal */}
        {selectedPackage && (
          <WhatsAppContactModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            packageDetails={selectedPackage}
          />
        )}
      </section>
    </>
  );
}