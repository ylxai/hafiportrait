/**
 * WhatsApp Integration Utility
 * Handles WhatsApp message formatting and URL generation
 */

export interface PackageDetails {
  name: string;
  price: string;
  features: string[];
  duration?: string;
  guests?: string;
  photos?: string;
  delivery?: string;
}

export interface ContactInfo {
  name?: string;
  phone?: string;
  email?: string;
  eventDate?: string;
  eventType?: string;
  guestCount?: number;
  venue?: string;
  additionalNotes?: string;
}

export class WhatsAppIntegration {
  private static readonly WHATSAPP_NUMBER = "62895700503193"; // Nomor WhatsApp HafiPortrait
  private static readonly BASE_URL = "https://wa.me/";

  /**
   * Generate WhatsApp message for package inquiry
   */
  static generatePackageMessage(packageDetails: PackageDetails, contactInfo?: ContactInfo): string {
    const greeting = this.getTimeBasedGreeting();
    
    let message = `${greeting} 👋\n\n`;
    message += `Saya tertarik dengan paket *${packageDetails.name}* dari HafiPortrait:\n\n`;
    
    // Package details
    message += `📦 *Detail Paket:*\n`;
    message += `💰 Harga: ${packageDetails.price}\n`;
    
    if (packageDetails.duration) message += `⏱️ Durasi: ${packageDetails.duration}\n`;
    if (packageDetails.guests) message += `👥 Kapasitas: ${packageDetails.guests}\n`;
    if (packageDetails.photos) message += `📸 Foto: ${packageDetails.photos}\n`;
    if (packageDetails.delivery) message += `📅 Delivery: ${packageDetails.delivery}\n`;
    
    message += `\n✨ *Fitur yang Termasuk:*\n`;
    packageDetails.features.forEach((feature, index) => {
      message += `${index + 1}. ${feature}\n`;
    });

    // Contact information if provided
    if (contactInfo) {
      message += `\n👤 *Informasi Event:*\n`;
      if (contactInfo.name) message += `Nama: ${contactInfo.name}\n`;
      if (contactInfo.eventType) message += `Jenis Event: ${contactInfo.eventType}\n`;
      if (contactInfo.eventDate) message += `Tanggal Event: ${contactInfo.eventDate}\n`;
      if (contactInfo.guestCount) message += `Jumlah Tamu: ${contactInfo.guestCount} orang\n`;
      if (contactInfo.venue) message += `Venue: ${contactInfo.venue}\n`;
      if (contactInfo.phone) message += `No. HP: ${contactInfo.phone}\n`;
      if (contactInfo.email) message += `Email: ${contactInfo.email}\n`;
      if (contactInfo.additionalNotes) message += `Catatan: ${contactInfo.additionalNotes}\n`;
    }

    message += `\n💬 Mohon informasi lebih lanjut dan ketersediaan tanggal. Terima kasih! 🙏`;
    
    return message;
  }

  /**
   * Generate WhatsApp message for general inquiry
   */
  static generateGeneralInquiry(contactInfo: ContactInfo): string {
    const greeting = this.getTimeBasedGreeting();
    
    let message = `${greeting} 👋\n\n`;
    message += `Saya ingin mengetahui lebih lanjut tentang layanan fotografi HafiPortrait.\n\n`;
    
    if (contactInfo.eventType || contactInfo.eventDate || contactInfo.guestCount) {
      message += `📋 *Detail Event:*\n`;
      if (contactInfo.eventType) message += `Jenis Event: ${contactInfo.eventType}\n`;
      if (contactInfo.eventDate) message += `Tanggal Event: ${contactInfo.eventDate}\n`;
      if (contactInfo.guestCount) message += `Perkiraan Tamu: ${contactInfo.guestCount} orang\n`;
      if (contactInfo.venue) message += `Venue: ${contactInfo.venue}\n`;
    }

    if (contactInfo.name || contactInfo.phone || contactInfo.email) {
      message += `\n👤 *Kontak Saya:*\n`;
      if (contactInfo.name) message += `Nama: ${contactInfo.name}\n`;
      if (contactInfo.phone) message += `No. HP: ${contactInfo.phone}\n`;
      if (contactInfo.email) message += `Email: ${contactInfo.email}\n`;
    }

    if (contactInfo.additionalNotes) {
      message += `\n📝 *Catatan Tambahan:*\n${contactInfo.additionalNotes}\n`;
    }

    message += `\n💬 Mohon informasi paket dan harga yang tersedia. Terima kasih! 🙏`;
    
    return message;
  }

  /**
   * Generate WhatsApp URL with pre-filled message
   */
  static generateWhatsAppURL(message: string): string {
    const encodedMessage = encodeURIComponent(message);
    return `${this.BASE_URL}${this.WHATSAPP_NUMBER}?text=${encodedMessage}`;
  }

  /**
   * Open WhatsApp with package details
   */
  static openWhatsAppWithPackage(packageDetails: PackageDetails, contactInfo?: ContactInfo): void {
    const message = this.generatePackageMessage(packageDetails, contactInfo);
    const url = this.generateWhatsAppURL(message);
    
    // Analytics tracking (optional)
    this.trackWhatsAppClick('package_inquiry', packageDetails.name);
    
    // Open WhatsApp
    window.open(url, '_blank');
  }

  /**
   * Open WhatsApp with general inquiry
   */
  static openWhatsAppWithInquiry(contactInfo: ContactInfo): void {
    const message = this.generateGeneralInquiry(contactInfo);
    const url = this.generateWhatsAppURL(message);
    
    // Analytics tracking (optional)
    this.trackWhatsAppClick('general_inquiry');
    
    // Open WhatsApp
    window.open(url, '_blank');
  }

  /**
   * Get time-based greeting
   */
  private static getTimeBasedGreeting(): string {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
      return "Selamat pagi";
    } else if (hour >= 12 && hour < 15) {
      return "Selamat siang";
    } else if (hour >= 15 && hour < 18) {
      return "Selamat sore";
    } else {
      return "Selamat malam";
    }
  }

  /**
   * Track WhatsApp clicks for analytics
   */
  private static trackWhatsAppClick(type: string, packageName?: string): void {
    // Google Analytics or other tracking
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'whatsapp_click', {
        event_category: 'engagement',
        event_label: packageName || type,
        value: 1
      });
    }

    // Console log for development
    console.log('WhatsApp Click Tracked:', { type, packageName });
  }

  /**
   * Validate WhatsApp number format
   */
  static validateWhatsAppNumber(number: string): boolean {
    const cleanNumber = number.replace(/\D/g, '');
    return cleanNumber.length >= 10 && cleanNumber.length <= 15;
  }

  /**
   * Format phone number for WhatsApp
   */
  static formatPhoneNumber(phone: string): string {
    let cleanPhone = phone.replace(/\D/g, '');
    
    // Add country code if not present
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('62')) {
      cleanPhone = '62' + cleanPhone;
    }
    
    return cleanPhone;
  }
}

// Types already exported above