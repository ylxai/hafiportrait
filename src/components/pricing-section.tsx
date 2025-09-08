'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, MessageCircle, Star, Crown, Clock, Users } from "lucide-react";
import { useState } from "react";
import WhatsAppContactModal from "@/components/ui/whatsapp-contact-modal";
import { PackageDetails } from "@/lib/whatsapp-integration";

export default function PricingSection() {
  const [selectedPackage, setSelectedPackage] = useState<PackageDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const plans = [
    {
      name: "Paket Akad Nikah Basic",
      price: "IDR 1.300.000",
      duration: "1 hari kerja",
      guests: "50-100 tamu",
      photos: "200+ foto digital",
      delivery: "3-5 hari kerja",
      features: [
        "1 fotografer profesional",
        "1 hari kerja (4-6 jam)",
        "40 cetak foto 5R (pilihan terbaik)",
        "Album magnetik (tempel)",
        "File foto digital tanpa batas",
        "Softcopy di flashdisk 16GB",
        "📱 Real-time sharing via app"
      ],
      badge: "💎 Hemat"
    },
    {
      name: "Paket Resepsi Standard",
      price: "IDR 1.800.000",
      duration: "1 hari kerja",
      guests: "100-200 tamu", 
      photos: "300+ foto digital",
      delivery: "3-5 hari kerja",
      features: [
        "1 fotografer & 1 asisten fotografer",
        "1 hari kerja (6-8 jam)",
        "40 cetak foto 5R (pilihan terbaik)",
        "Album magnetik premium",
        "File foto digital tanpa batas",
        "Softcopy di flashdisk 32GB",
        "1 cetak besar 14R + frame",
        "📱 Real-time sharing via app"
      ],
      badge: "⭐ Populer"
    },
    {
      name: "Paket Akad Nikah Premium",
      price: "IDR 2.000.000",
      duration: "1 hari kerja",
      guests: "100-150 tamu",
      photos: "400+ foto digital", 
      delivery: "2-3 hari kerja",
      features: [
        "1 fotografer & 1 asisten fotografer",
        "1 hari kerja (6-8 jam)",
        "80 cetak foto 5R (pilihan terbaik)",
        "Album magnetik premium",
        "File foto digital tanpa batas",
        "Softcopy di flashdisk 32GB",
        "1 cetak besar 14R + frame",
        "🏷️ Professional watermark",
        "📱 Real-time sharing via app"
      ],
      badge: "🔥 Trending"
    },
    {
      name: "Paket Resepsi Premium",
      price: "IDR 2.300.000",
      duration: "1 hari kerja",
      guests: "150-250 tamu",
      photos: "500+ foto digital",
      delivery: "2-3 hari kerja", 
      features: [
        "1 fotografer & 1 asisten fotografer",
        "1 hari kerja (8-10 jam)",
        "80 cetak foto 5R (pilihan terbaik)",
        "Album magnetik premium",
        "File foto digital tanpa batas",
        "Softcopy di flashdisk 64GB",
        "1 cetak besar 14R + frame",
        "🏷️ Professional watermark",
        "📱 Real-time sharing via app"
      ],
      badge: "💫 Recommended"
    },
    {
      name: "Paket Akad & Resepsi",
      price: "IDR 3.000.000",
      duration: "2 hari kerja",
      guests: "200-300 tamu",
      photos: "800+ foto digital",
      delivery: "3-5 hari kerja",
      features: [
        "1 fotografer & 1 asisten fotografer",
        "2 hari kerja (akad + resepsi)",
        "80 cetak foto 5R (pilihan terbaik)",
        "Album magnetik premium",
        "File foto digital tanpa batas",
        "Softcopy di flashdisk 64GB",
        "1 cetak besar 14R + frame",
        "🏷️ Professional watermark",
        "📱 Real-time sharing via app",
        "💝 Bonus: Mini album untuk orangtua"
      ],
      badge: "💎 Value"
    },
    {
      name: "Paket Wedding Deluxe",
      price: "IDR 4.000.000",
      duration: "2 hari kerja",
      guests: "300-400 tamu",
      photos: "1000+ foto digital",
      delivery: "2-3 hari kerja",
      features: [
        "1 fotografer & 1 asisten fotografer",
        "2 hari kerja (akad + resepsi)",
        "80 cetak foto 5R (pilihan terbaik)",
        "Album magnetik premium",
        "File foto digital tanpa batas",
        "Softcopy di flashdisk 128GB",
        "1 Photo Box eksklusif",
        "Cetak besar 14R Jumbo + frame",
        "🏷️ Professional watermark",
        "📱 Real-time sharing via app",
        "💝 Bonus: 2 Mini album untuk orangtua"
      ],
      badge: "👑 Luxury"
    },
    {
      name: "Paket Wedding Ultimate",
      price: "IDR 6.000.000",
      duration: "2 hari kerja",
      guests: "400+ tamu",
      photos: "1500+ foto digital",
      delivery: "1-2 hari kerja",
      features: [
        "2 fotografer & 1 asisten fotografer",
        "2 hari kerja (akad + resepsi)",
        "120 cetak foto 5R (pilihan terbaik)",
        "Album hard cover magnetik premium",
        "File foto digital tanpa batas",
        "Softcopy di flashdisk 256GB",
        "1 cetak besar 16R Jumbo + frame",
        "🏷️ Professional watermark",
        "📱 Real-time sharing via app",
        "💝 Bonus: 3 Mini album untuk keluarga",
        "🎥 Bonus: Highlight video (2-3 menit)",
        "⚡ Priority editing & delivery"
      ],
      popular: true,
      badge: "🏆 Best Value"
    }
  ];

  const handleSelectPackage = (plan: any) => {
    const packageDetails: PackageDetails = {
      name: plan.name,
      price: plan.price,
      features: plan.features,
      duration: plan.duration,
      guests: plan.guests,
      photos: plan.photos,
      delivery: plan.delivery
    };
    
    setSelectedPackage(packageDetails);
    setIsModalOpen(true);
  };

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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 ${
                  plan.popular 
                    ? 'border-dynamic-accent border-2 shadow-xl scale-105' 
                    : 'border-dynamic hover:border-dynamic-accent/50'
                }`}
              >
                {/* Badge */}
                <div className="absolute -top-3 left-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    plan.popular 
                      ? 'bg-dynamic-accent text-white' 
                      : 'bg-dynamic-accent/10 text-dynamic-accent border border-dynamic-accent/20'
                  }`}>
                    {plan.badge}
                  </span>
                </div>

                {plan.popular && (
                  <div className="absolute -top-4 right-4">
                    <Crown className="w-8 h-8 text-dynamic-accent" />
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl font-bold text-dynamic-primary mb-2">
                    {plan.name}
                  </CardTitle>
                  <div className="text-3xl font-black text-dynamic-accent mb-2">
                    {plan.price}
                    <span className="text-sm font-normal text-dynamic-secondary block">/event</span>
                  </div>
                  
                  {/* Quick Info */}
                  <div className="flex justify-center text-xs text-dynamic-secondary mt-4">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{plan.duration}</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">

                  {/* Features List */}
                  <ul className="space-y-2 mb-6">
                    {plan.features.slice(0, 6).map((feature, i) => (
                      <li key={i} className="flex items-start text-sm">
                        <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-dynamic-secondary">{feature}</span>
                      </li>
                    ))}
                    {plan.features.length > 6 && (
                      <li className="text-xs text-dynamic-accent font-medium">
                        +{plan.features.length - 6} fitur lainnya...
                      </li>
                    )}
                  </ul>

                  {/* WhatsApp Button */}
                  <Button 
                    onClick={() => handleSelectPackage(plan)}
                    className={`w-full mobile-button text-sm font-bold py-3 transition-all duration-300 ${
                      plan.popular 
                        ? 'btn-dynamic-primary shadow-lg hover:shadow-xl' 
                        : 'btn-dynamic-secondary hover:btn-dynamic-primary'
                    }`}
                    size="lg"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    {plan.popular ? '🚀 Pilih Sekarang' : '💬 Chat WhatsApp'}
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