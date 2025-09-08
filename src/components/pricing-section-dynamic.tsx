'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, MessageCircle, Star, Crown, Clock, Users } from "lucide-react";
import { useState, useEffect } from "react";
import WhatsAppContactModal from "@/components/ui/whatsapp-contact-modal";
import { PackageDetails } from "@/lib/whatsapp-integration";

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
}

export default function PricingSectionDynamic() {
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
        console.error('Failed to fetch packages');
        // Fallback to static packages if API fails
        setPackages([]);
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
      features: pkg.features,
      duration: pkg.duration,
      guests: pkg.guests,
      photos: pkg.photos,
      delivery: pkg.delivery
    };
    
    setSelectedPackage(packageDetails);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <section id="pricing" className="py-20 bg-dynamic-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-dynamic-primary mb-3">
              💰 Paket Harga Terbaik
            </h2>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardHeader className="text-center pb-4">
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 mb-6">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-4 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section id="pricing" className="py-20 bg-dynamic-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-dynamic-primary mb-3">
              💰 Paket Harga Terbaik
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-dynamic-secondary max-w-2xl mx-auto px-4">
              Pilih paket yang sesuai dengan kebutuhan event spesial Anda.
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs sm:text-sm text-dynamic-accent font-medium px-4">
              <span className="bg-dynamic-accent/10 px-2 py-1 rounded-full">✨ Konsultasi gratis</span>
              <span className="bg-dynamic-accent/10 px-2 py-1 rounded-full">📱 WhatsApp langsung</span>
              <span className="bg-dynamic-accent/10 px-2 py-1 rounded-full">🎯 Harga transparan</span>
            </div>
          </div>
          
          {packages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-dynamic-secondary">Paket harga sedang dalam pembaruan. Silakan hubungi kami untuk informasi terbaru.</p>
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
                className="mt-4"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Hubungi WhatsApp
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
              {packages.map((pkg, index) => (
                <Card 
                  key={pkg.id} 
                  className={`relative hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 ${
                    pkg.is_popular 
                      ? 'border-dynamic-accent border-2 shadow-xl scale-105' 
                      : 'border-dynamic hover:border-dynamic-accent/50'
                  }`}
                >
                  {/* Badge */}
                  {pkg.badge && (
                    <div className="absolute -top-3 left-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        pkg.is_popular 
                          ? 'bg-dynamic-accent text-white' 
                          : 'bg-dynamic-accent/10 text-dynamic-accent border border-dynamic-accent/20'
                      }`}>
                        {pkg.badge}
                      </span>
                    </div>
                  )}

                  {pkg.is_popular && (
                    <div className="absolute -top-4 right-4">
                      <Crown className="w-8 h-8 text-dynamic-accent" />
                    </div>
                  )}

                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-xl font-bold text-dynamic-primary mb-2">
                      {pkg.name}
                    </CardTitle>
                    <div className="text-3xl font-black text-dynamic-accent mb-2">
                      {pkg.price}
                      <span className="text-sm font-normal text-dynamic-secondary block">/event</span>
                    </div>
                    
                    {/* Quick Info */}
                    {pkg.duration && (
                      <div className="flex justify-center text-xs text-dynamic-secondary mt-4">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{pkg.duration}</span>
                        </div>
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="pt-0">
                    {/* Features List */}
                    <ul className="space-y-2 mb-6">
                      {pkg.features.slice(0, 6).map((feature, i) => (
                        <li key={i} className="flex items-start text-sm">
                          <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-dynamic-secondary">{feature}</span>
                        </li>
                      ))}
                      {pkg.features.length > 6 && (
                        <li className="text-xs text-dynamic-accent font-medium">
                          +{pkg.features.length - 6} fitur lainnya...
                        </li>
                      )}
                    </ul>

                    {/* WhatsApp Button */}
                    <Button 
                      onClick={() => handleSelectPackage(pkg)}
                      className={`w-full mobile-button text-sm font-bold py-3 transition-all duration-300 ${
                        pkg.is_popular 
                          ? 'btn-dynamic-primary shadow-lg hover:shadow-xl' 
                          : 'btn-dynamic-secondary hover:btn-dynamic-primary'
                      }`}
                      size="lg"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      {pkg.is_popular ? '🚀 Pilih Sekarang' : '💬 Chat WhatsApp'}
                    </Button>

                    {/* Trust Indicator */}
                    <div className="mt-3 text-center">
                      <div className="flex items-center justify-center gap-1 text-xs text-dynamic-secondary">
                        <Star className="w-3 h-3 text-yellow-500" />
                        <span>Respon dalam 5 menit</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* WhatsApp Contact Modal */}
      {selectedPackage && (
        <WhatsAppContactModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          packageDetails={selectedPackage}
        />
      )}
    </>
  );
}