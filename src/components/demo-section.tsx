import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DemoSection() {
  const stats = [
    { value: "10 sec", label: "Average setup time" },
    { value: "89%", label: "Guest participation rate" },
    { value: "4.9★", label: "Average user rating" }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            See Wedibox in Action
          </h2>
          <p className="text-xl text-gray-600">
            Watch how easy it is to create and share your celebration album
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="relative bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1606216794074-735e91aa2c92?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=675"
              alt="Wedding photographer at ceremony"
              className="w-full h-auto"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Button
                size="lg"
                className="w-20 h-20 bg-white/90 rounded-full hover:bg-white hover:scale-110 transition-all"
              >
                <Play className="h-8 w-8 text-rose-gold ml-1" />
              </Button>
            </div>
            <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full">
              <p className="text-sm font-semibold">2:30 - Complete walkthrough</p>
            </div>
          </div>

          {/* Demo stats */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-rose-gold mb-2">{stat.value}</div>
                <p className="text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
