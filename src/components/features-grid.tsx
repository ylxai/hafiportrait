import { Camera, Share2, Download, Smartphone, Heart, Shield } from "lucide-react";

export default function FeaturesGrid() {
  const features = [
    {
      icon: Camera,
      title: "Upload Mudah",
      description: "Interface sederhana untuk upload foto langsung dari smartphone"
    },
    {
      icon: Share2,
      title: "Berbagi Instan",
      description: "Bagikan galeri dengan tamu melalui link atau QR code"
    },
    {
      icon: Download,
      title: "Download Batch",
      description: "Download semua foto dalam format ZIP dengan kualitas tinggi"
    },
    {
      icon: Smartphone,
      title: "Mobile Friendly",
      description: "Optimized untuk semua perangkat mobile dan desktop"
    },
    {
      icon: Heart,
      title: "Like & Comment",
      description: "Tamu dapat memberikan like dan komentar pada foto"
    },
    {
      icon: Shield,
      title: "Aman & Privat",
      description: "Data dan foto terlindungi dengan sistem keamanan terdepan"
    }
  ];

  return (
    <section id="features" className="py-20 bg-wedding-ivory">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Fitur Unggulan
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Fitur-fitur canggih yang membuat event Anda lebih berkesan
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center p-6 bg-white rounded-lg shadow-lg">
              <feature.icon className="w-12 h-12 mx-auto text-wedding-gold mb-4" />
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
