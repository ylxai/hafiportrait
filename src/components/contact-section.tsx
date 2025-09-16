'use client';

import { Phone, Instagram, MapPin, Clock, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSectionScrollAnimations } from "@/hooks/use-scroll-animations";
// import { motion, Easing } from "framer-motion"; // Disabled for build

export default function ContactSection() {
  // Consolidated scroll animations - optimized untuk mobile dan performance
  const { section, title, stagger, deviceInfo } = useSectionScrollAnimations({
    sectionThreshold: 0.1,
    titleThreshold: 0.3,
    itemCount: 4, // Contact cards count
    staggerDelay: 200,
    enableGPUOptimization: true,
    respectReducedMotion: true
  });

  // Destructure untuk backward compatibility
  const { elementRef: sectionRef, isVisible } = section;
  const { elementRef: titleRef, isVisible: titleVisible } = title;
  const { containerRef: cardsRef, visibleItems } = stagger;
  
  // Animation disabled for build
  // const easeOutCubicBezier: Easing = [0, 0, 0.58, 1];
  // const sectionHeaderVariants = { hidden: { opacity: 0, y: 50 }, visible: { opacity: 1, y: 0 } };
  // const cardContainerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
  // const cardItemVariants = { hidden: { opacity: 0, y: 30, scale: 0.95 }, visible: { opacity: 1, y: 0, scale: 1 } };

  const contactInfo = [
    {
      icon: Phone,
      title: "WhatsApp",
      content: "+62 895 700503193",
      href: "https://wa.me/6289570503193",
      description: "Chat langsung untuk konsultasi",
      color: "text-gray-900",
      bgColor: "bg-gray-50",
      hoverColor: "hover:bg-gray-100"
    },
    {
      icon: Instagram,
      title: "Instagram",
      content: "@hafiportrait",
      href: "https://instagram.com/hafiportrait",
      description: "Lihat portfolio terbaru kami",
      color: "text-gray-900",
      bgColor: "bg-gray-50",
      hoverColor: "hover:bg-gray-100"
    },
    {
      icon: Mail,
      title: "Email",
      content: "hafiportrait@gmail.com",
      href: "mailto:hafiportrait@gmail.com",
      description: "Kirim detail acara Anda",
      color: "text-gray-900",
      bgColor: "bg-gray-50",
      hoverColor: "hover:bg-gray-100"
    }
  ];

  const workingHours = [
    { day: "Senin - Jumat", time: "09:00 - 18:00" },
    { day: "Sabtu", time: "09:00 - 15:00" },
    { day: "Minggu", time: "By Appointment" }
  ];

  return (
    <section 
      ref={sectionRef}
      id="contact" 
      className="py-12 bg-gray-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div 
          ref={titleRef}
          className="text-center mb-16"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Hubungi Kami
          </h2>
          <p className="text-sm text-gray-600 max-w-3xl mx-auto">
            Siap untuk mengabadikan momen spesial Anda? Mari diskusikan kebutuhan photography Anda dengan tim profesional kami
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Contact Methods */}
          <div ref={cardsRef}>
            
            {contactInfo.map((contact, index) => (
              <div 
                key={index} 
                className=""
              >
                <Card className={`border-0 shadow-lg ${contact.bgColor} ${contact.hoverColor} transition-all duration-300 hover:shadow-xl group`}>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-full bg-white shadow-md group-hover:scale-110 transition-transform flex-shrink-0`}>
                        <contact.icon className={`h-6 w-6 ${contact.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 text-lg">{contact.title}</h4>
                        <p className="text-gray-600 text-sm mb-2">{contact.description}</p>
                        <a
                          href={contact.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`font-semibold ${contact.color} hover:underline text-sm sm:text-lg break-words`} 
                        >
                          {contact.content}
                        </a>
                      </div>
                      <Button
                        size="sm"
                        className="bg-white text-gray-700 hover:bg-gray-50 shadow-md flex-shrink-0 mobile-button"
                        onClick={() => window.open(contact.href, '_blank')}
                      >
                        Connect
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}

          </div>

          {/* Business Info */}
          <div className="space-y-6">
            <div> {/* Terapkan varian */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl text-gray-900"> {/* Menyesuaikan warna teks */}
                    <Clock className="h-6 w-6 text-wedding-gold mr-2" /> {/* Menggunakan warna tema */}
                    Jam Operasional
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {workingHours.map((schedule, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <span className="font-medium text-gray-900">{schedule.day}</span>
                      <span className="text-gray-900 font-semibold">{schedule.time}</span>
                    </div>
                  ))}
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>Note:</strong> Emergency booking dan konsultasi weekend bisa diatur dengan appointment terlebih dahulu
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div> {/* Terapkan varian */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl text-gray-900">
                    <MapPin className="h-6 w-6 text-gray-900 mr-2" />
                    Coverage Area
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-900">Jabodetabek</span>
                      <span className="text-green-600 font-semibold">Free Travel</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-900">Kalimantan Selatan</span>
                      <span className="text-blue-600 font-semibold">Available</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-900">Luar Kalimantan</span>
                      <span className="text-gray-900 font-semibold">By Request</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Social Proof */}
            <div> 
              <Card className="border-0 shadow-lg bg-white"> {/* Menggunakan warna tema */}
                <CardContent className="p-6 text-center">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">500+</p>
                      <p className="text-sm text-gray-600">Happy Couples</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">5</p>
                      <p className="text-sm text-gray-600">Years Experience</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">100%</p>
                      <p className="text-sm text-gray-600">Satisfaction</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
