import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQSection() {
const faqs = [
  {
      question: "Bagaimana cara menggunakan platform ini?",
      answer: "Sangat mudah! Cukup buat event, bagikan link atau QR code kepada tamu, dan mereka bisa langsung upload foto melalui smartphone."
  },
  {
      question: "Apakah ada batasan jumlah foto yang bisa diupload?",
      answer: "Untuk paket Basic, tidak ada batasan upload. Untuk paket Premium dan Enterprise, dapatkan fitur tambahan seperti analytics dan custom branding."
  },
  {
      question: "Berapa lama foto akan tersimpan?",
      answer: "Foto akan tersimpan selamanya di platform kami dengan backup otomatis untuk memastikan keamanan data Anda."
  },
  {
      question: "Bisakah saya download semua foto sekaligus?",
      answer: "Ya! Fitur download ZIP tersedia untuk semua paket, memungkinkan Anda mengunduh semua foto dalam satu file."
  },
  {
      question: "Apakah platform ini aman?",
      answer: "Keamanan adalah prioritas utama kami. Semua data dienkripsi dan tersimpan di server yang aman dengan backup rutin."
    }
  ];

  return (
    <section className="py-20 bg-wedding-ivory">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="text-xl text-gray-600">
            Temukan jawaban untuk pertanyaan umum tentang layanan kami
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="bg-white rounded-lg px-6"
            >
              <AccordionTrigger className="text-left text-lg font-medium">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
            ))}
        </Accordion>
      </div>
    </section>
  );
}
