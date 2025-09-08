/**
 * Dynamic Color Palette System
 * Allows real-time color theme switching
 */

export interface ColorPalette {
  id: string;
  name: string;
  description: string;
  preview: string;
  colors: {
    // Background colors
    bgPrimary: string;
    bgSecondary: string;
    bgAccent: string;
    
    // Text colors
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    
    // Accent colors
    accentPrimary: string;
    accentSecondary: string;
    accentGold: string;
    
    // Button colors
    buttonPrimary: string;
    buttonSecondary: string;
    buttonHover: string;
    
    // Border and shadow
    border: string;
    shadow: string;
    overlay: string;
  };
  gradients: {
    hero: string;
    card: string;
    button: string;
  };
}

export const colorPalettes: ColorPalette[] = [
  {
    id: 'elegant-photography',
    name: 'Elegant Photography',
    description: 'Sophisticated & Professional',
    preview: 'linear-gradient(135deg, #f8f6f0 0%, #d4af37 100%)',
    colors: {
      bgPrimary: '#f8f6f0',
      bgSecondary: '#ffffff',
      bgAccent: '#f0ede5',
      textPrimary: '#1a1a1a',
      textSecondary: '#2d2d2d',
      textMuted: '#666666',
      accentPrimary: '#d4af37',
      accentSecondary: '#c9a96e',
      accentGold: '#e6b17a',
      buttonPrimary: '#d4af37',
      buttonSecondary: '#c9a96e',
      buttonHover: '#b8941f',
      border: '#e0ddd6',
      shadow: 'rgba(212, 175, 55, 0.1)',
      overlay: 'rgba(45, 45, 45, 0.8)'
    },
    gradients: {
      hero: 'linear-gradient(135deg, #f8f6f0 0%, #f0ede5 50%, #e8e3d8 100%)',
      card: 'linear-gradient(145deg, #ffffff 0%, #f8f6f0 100%)',
      button: 'linear-gradient(135deg, #d4af37 0%, #c9a96e 100%)'
    }
  },
  
  {
    id: 'modern-romantic',
    name: 'Modern Romantic',
    description: 'Soft & Romantic',
    preview: 'linear-gradient(135deg, #f7e7e1 0%, #9caf88 100%)',
    colors: {
      bgPrimary: '#f7e7e1',
      bgSecondary: '#ffffff',
      bgAccent: '#f0e6e0',
      textPrimary: '#3a3a3a',
      textSecondary: '#5a5a5a',
      textMuted: '#888888',
      accentPrimary: '#9caf88',
      accentSecondary: '#d4a574',
      accentGold: '#e6b17a',
      buttonPrimary: '#9caf88',
      buttonSecondary: '#d4a574',
      buttonHover: '#7a8f6b',
      border: '#e8d5cf',
      shadow: 'rgba(156, 175, 136, 0.15)',
      overlay: 'rgba(58, 58, 58, 0.75)'
    },
    gradients: {
      hero: 'linear-gradient(135deg, #f7e7e1 0%, #f0e6e0 50%, #e8d5cf 100%)',
      card: 'linear-gradient(145deg, #ffffff 0%, #f7e7e1 100%)',
      button: 'linear-gradient(135deg, #9caf88 0%, #d4a574 100%)'
    }
  },
  
  {
    id: 'bold-professional',
    name: 'Bold Professional',
    description: 'High Contrast & Modern',
    preview: 'linear-gradient(135deg, #000000 0%, #ffd700 100%)',
    colors: {
      bgPrimary: '#ffffff',
      bgSecondary: '#f5f5f5',
      bgAccent: '#000000',
      textPrimary: '#000000',
      textSecondary: '#404040',
      textMuted: '#666666',
      accentPrimary: '#ffd700',
      accentSecondary: '#ffed4e',
      accentGold: '#f4c430',
      buttonPrimary: '#ffd700',
      buttonSecondary: '#000000',
      buttonHover: '#e6c200',
      border: '#e0e0e0',
      shadow: 'rgba(255, 215, 0, 0.2)',
      overlay: 'rgba(0, 0, 0, 0.85)'
    },
    gradients: {
      hero: 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 50%, #eeeeee 100%)',
      card: 'linear-gradient(145deg, #ffffff 0%, #f8f8f8 100%)',
      button: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)'
    }
  },
  
  {
    id: 'warm-sunset',
    name: 'Warm Sunset',
    description: 'Warm & Inviting',
    preview: 'linear-gradient(135deg, #faf8f5 0%, #c65d00 100%)',
    colors: {
      bgPrimary: '#faf8f5',
      bgSecondary: '#ffffff',
      bgAccent: '#e6d2b7',
      textPrimary: '#8b4513',
      textSecondary: '#a0522d',
      textMuted: '#cd853f',
      accentPrimary: '#c65d00',
      accentSecondary: '#ff7f50',
      accentGold: '#daa520',
      buttonPrimary: '#ff7f50',
      buttonSecondary: '#c65d00',
      buttonHover: '#ff6347',
      border: '#deb887',
      shadow: 'rgba(255, 127, 80, 0.15)',
      overlay: 'rgba(139, 69, 19, 0.8)'
    },
    gradients: {
      hero: 'linear-gradient(135deg, #faf8f5 0%, #f5f0e8 50%, #e6d2b7 100%)',
      card: 'linear-gradient(145deg, #ffffff 0%, #faf8f5 100%)',
      button: 'linear-gradient(135deg, #ff7f50 0%, #c65d00 100%)'
    }
  },
  
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    description: 'Cool & Refreshing',
    preview: 'linear-gradient(135deg, #e6f3ff 0%, #4a90e2 100%)',
    colors: {
      bgPrimary: '#e6f3ff',
      bgSecondary: '#ffffff',
      bgAccent: '#d1e9ff',
      textPrimary: '#2c3e50',
      textSecondary: '#34495e',
      textMuted: '#7f8c8d',
      accentPrimary: '#4a90e2',
      accentSecondary: '#5dade2',
      accentGold: '#f39c12',
      buttonPrimary: '#4a90e2',
      buttonSecondary: '#5dade2',
      buttonHover: '#3498db',
      border: '#bde0ff',
      shadow: 'rgba(74, 144, 226, 0.15)',
      overlay: 'rgba(44, 62, 80, 0.8)'
    },
    gradients: {
      hero: 'linear-gradient(135deg, #e6f3ff 0%, #d1e9ff 50%, #bde0ff 100%)',
      card: 'linear-gradient(145deg, #ffffff 0%, #e6f3ff 100%)',
      button: 'linear-gradient(135deg, #4a90e2 0%, #5dade2 100%)'
    }
  },
  
  {
    id: 'forest-green',
    name: 'Forest Green',
    description: 'Natural & Organic',
    preview: 'linear-gradient(135deg, #f0f8f0 0%, #2d5a2d 100%)',
    colors: {
      bgPrimary: '#f0f8f0',
      bgSecondary: '#ffffff',
      bgAccent: '#e8f5e8',
      textPrimary: '#2d5a2d',
      textSecondary: '#3e6b3e',
      textMuted: '#6b8e6b',
      accentPrimary: '#2d5a2d',
      accentSecondary: '#4a7c59',
      accentGold: '#d4af37',
      buttonPrimary: '#4a7c59',
      buttonSecondary: '#2d5a2d',
      buttonHover: '#1e4a1e',
      border: '#c8e6c8',
      shadow: 'rgba(74, 124, 89, 0.15)',
      overlay: 'rgba(45, 90, 45, 0.8)'
    },
    gradients: {
      hero: 'linear-gradient(135deg, #f0f8f0 0%, #e8f5e8 50%, #d4edda 100%)',
      card: 'linear-gradient(145deg, #ffffff 0%, #f0f8f0 100%)',
      button: 'linear-gradient(135deg, #4a7c59 0%, #2d5a2d 100%)'
    }
  },

  // 🏆 RECOMMENDED FOR PHOTOGRAPHY
  {
    id: 'luxury-wedding',
    name: '🏆 Luxury Wedding',
    description: 'Premium & Elegant (RECOMMENDED)',
    preview: 'linear-gradient(135deg, #faf8f5 0%, #8b7355 100%)',
    colors: {
      bgPrimary: '#faf8f5',
      bgSecondary: '#ffffff',
      bgAccent: '#f5f2ed',
      textPrimary: '#2c2416',
      textSecondary: '#4a3f2a',
      textMuted: '#6b5d42',
      accentPrimary: '#8b7355',
      accentSecondary: '#b8956f',
      accentGold: '#d4af37',
      buttonPrimary: '#8b7355',
      buttonSecondary: '#b8956f',
      buttonHover: '#6d5a43',
      border: '#e8e0d1',
      shadow: 'rgba(139, 115, 85, 0.15)',
      overlay: 'rgba(44, 36, 22, 0.85)'
    },
    gradients: {
      hero: 'linear-gradient(135deg, #faf8f5 0%, #f5f2ed 50%, #f0ebe0 100%)',
      card: 'linear-gradient(145deg, #ffffff 0%, #faf8f5 100%)',
      button: 'linear-gradient(135deg, #8b7355 0%, #b8956f 100%)'
    }
  },

  {
    id: 'rose-gold-premium',
    name: 'Rose Gold Premium',
    description: 'Sophisticated & Feminine',
    preview: 'linear-gradient(135deg, #fff5f5 0%, #e91e63 100%)',
    colors: {
      bgPrimary: '#fff5f5',
      bgSecondary: '#ffffff',
      bgAccent: '#ffeef0',
      textPrimary: '#2d1b1b',
      textSecondary: '#4a2c2c',
      textMuted: '#6b4545',
      accentPrimary: '#e91e63',
      accentSecondary: '#f06292',
      accentGold: '#ff9800',
      buttonPrimary: '#e91e63',
      buttonSecondary: '#f06292',
      buttonHover: '#c2185b',
      border: '#f8d7da',
      shadow: 'rgba(233, 30, 99, 0.15)',
      overlay: 'rgba(45, 27, 27, 0.8)'
    },
    gradients: {
      hero: 'linear-gradient(135deg, #fff5f5 0%, #ffeef0 50%, #fce4ec 100%)',
      card: 'linear-gradient(145deg, #ffffff 0%, #fff5f5 100%)',
      button: 'linear-gradient(135deg, #e91e63 0%, #f06292 100%)'
    }
  },

  {
    id: 'midnight-elegance',
    name: 'Midnight Elegance',
    description: 'Dark & Sophisticated',
    preview: 'linear-gradient(135deg, #1a1a1a 0%, #ffd700 100%)',
    colors: {
      bgPrimary: '#1a1a1a',
      bgSecondary: '#2d2d2d',
      bgAccent: '#404040',
      textPrimary: '#ffffff',
      textSecondary: '#e0e0e0',
      textMuted: '#b0b0b0',
      accentPrimary: '#ffd700',
      accentSecondary: '#ffed4e',
      accentGold: '#f4c430',
      buttonPrimary: '#ffd700',
      buttonSecondary: '#ffed4e',
      buttonHover: '#e6c200',
      border: '#555555',
      shadow: 'rgba(255, 215, 0, 0.3)',
      overlay: 'rgba(0, 0, 0, 0.9)'
    },
    gradients: {
      hero: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #404040 100%)',
      card: 'linear-gradient(145deg, #2d2d2d 0%, #1a1a1a 100%)',
      button: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)'
    }
  },

  {
    id: 'vintage-sepia',
    name: 'Vintage Sepia',
    description: 'Classic & Timeless',
    preview: 'linear-gradient(135deg, #f4f1e8 0%, #8b4513 100%)',
    colors: {
      bgPrimary: '#f4f1e8',
      bgSecondary: '#fefcf7',
      bgAccent: '#ede6d3',
      textPrimary: '#3e2723',
      textSecondary: '#5d4037',
      textMuted: '#795548',
      accentPrimary: '#8b4513',
      accentSecondary: '#a0522d',
      accentGold: '#cd853f',
      buttonPrimary: '#8b4513',
      buttonSecondary: '#a0522d',
      buttonHover: '#6b3410',
      border: '#d7cc9a',
      shadow: 'rgba(139, 69, 19, 0.2)',
      overlay: 'rgba(62, 39, 35, 0.8)'
    },
    gradients: {
      hero: 'linear-gradient(135deg, #f4f1e8 0%, #ede6d3 50%, #e6d7b7 100%)',
      card: 'linear-gradient(145deg, #fefcf7 0%, #f4f1e8 100%)',
      button: 'linear-gradient(135deg, #8b4513 0%, #a0522d 100%)'
    }
  },

  {
    id: 'coral-sunset',
    name: 'Coral Sunset',
    description: 'Vibrant & Energetic',
    preview: 'linear-gradient(135deg, #fff0e6 0%, #ff6b35 100%)',
    colors: {
      bgPrimary: '#fff0e6',
      bgSecondary: '#ffffff',
      bgAccent: '#ffe6d9',
      textPrimary: '#2d1810',
      textSecondary: '#4a2c1a',
      textMuted: '#6b4423',
      accentPrimary: '#ff6b35',
      accentSecondary: '#ff8a65',
      accentGold: '#ffa726',
      buttonPrimary: '#ff6b35',
      buttonSecondary: '#ff8a65',
      buttonHover: '#e55722',
      border: '#ffccbc',
      shadow: 'rgba(255, 107, 53, 0.2)',
      overlay: 'rgba(45, 24, 16, 0.8)'
    },
    gradients: {
      hero: 'linear-gradient(135deg, #fff0e6 0%, #ffe6d9 50%, #ffccbc 100%)',
      card: 'linear-gradient(145deg, #ffffff 0%, #fff0e6 100%)',
      button: 'linear-gradient(135deg, #ff6b35 0%, #ff8a65 100%)'
    }
  },

  {
    id: 'lavender-dreams',
    name: 'Lavender Dreams',
    description: 'Soft & Dreamy',
    preview: 'linear-gradient(135deg, #f3e5f5 0%, #9c27b0 100%)',
    colors: {
      bgPrimary: '#f3e5f5',
      bgSecondary: '#ffffff',
      bgAccent: '#e1bee7',
      textPrimary: '#4a148c',
      textSecondary: '#6a1b9a',
      textMuted: '#8e24aa',
      accentPrimary: '#9c27b0',
      accentSecondary: '#ba68c8',
      accentGold: '#ff9800',
      buttonPrimary: '#9c27b0',
      buttonSecondary: '#ba68c8',
      buttonHover: '#7b1fa2',
      border: '#d1c4e9',
      shadow: 'rgba(156, 39, 176, 0.15)',
      overlay: 'rgba(74, 20, 140, 0.8)'
    },
    gradients: {
      hero: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 50%, #ce93d8 100%)',
      card: 'linear-gradient(145deg, #ffffff 0%, #f3e5f5 100%)',
      button: 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)'
    }
  },

  {
    id: 'emerald-luxury',
    name: 'Emerald Luxury',
    description: 'Rich & Prestigious',
    preview: 'linear-gradient(135deg, #e8f5e8 0%, #00695c 100%)',
    colors: {
      bgPrimary: '#e8f5e8',
      bgSecondary: '#ffffff',
      bgAccent: '#c8e6c8',
      textPrimary: '#1b5e20',
      textSecondary: '#2e7d32',
      textMuted: '#4caf50',
      accentPrimary: '#00695c',
      accentSecondary: '#26a69a',
      accentGold: '#ffc107',
      buttonPrimary: '#00695c',
      buttonSecondary: '#26a69a',
      buttonHover: '#004d40',
      border: '#a5d6a7',
      shadow: 'rgba(0, 105, 92, 0.15)',
      overlay: 'rgba(27, 94, 32, 0.8)'
    },
    gradients: {
      hero: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c8 50%, #a5d6a7 100%)',
      card: 'linear-gradient(145deg, #ffffff 0%, #e8f5e8 100%)',
      button: 'linear-gradient(135deg, #00695c 0%, #26a69a 100%)'
    }
  },

  {
    id: 'champagne-gold',
    name: 'Champagne Gold',
    description: 'Luxurious & Celebratory',
    preview: 'linear-gradient(135deg, #fefdf8 0%, #b8860b 100%)',
    colors: {
      bgPrimary: '#fefdf8',
      bgSecondary: '#ffffff',
      bgAccent: '#faf7e8',
      textPrimary: '#3e2723',
      textSecondary: '#5d4037',
      textMuted: '#8d6e63',
      accentPrimary: '#b8860b',
      accentSecondary: '#daa520',
      accentGold: '#ffd700',
      buttonPrimary: '#b8860b',
      buttonSecondary: '#daa520',
      buttonHover: '#9a7209',
      border: '#f5e6a3',
      shadow: 'rgba(184, 134, 11, 0.2)',
      overlay: 'rgba(62, 39, 35, 0.8)'
    },
    gradients: {
      hero: 'linear-gradient(135deg, #fefdf8 0%, #faf7e8 50%, #f5e6a3 100%)',
      card: 'linear-gradient(145deg, #ffffff 0%, #fefdf8 100%)',
      button: 'linear-gradient(135deg, #b8860b 0%, #daa520 100%)'
    }
  },

  {
    id: 'arctic-blue',
    name: 'Arctic Blue',
    description: 'Cool & Professional',
    preview: 'linear-gradient(135deg, #e3f2fd 0%, #0277bd 100%)',
    colors: {
      bgPrimary: '#e3f2fd',
      bgSecondary: '#ffffff',
      bgAccent: '#bbdefb',
      textPrimary: '#01579b',
      textSecondary: '#0277bd',
      textMuted: '#0288d1',
      accentPrimary: '#0277bd',
      accentSecondary: '#03a9f4',
      accentGold: '#ff9800',
      buttonPrimary: '#0277bd',
      buttonSecondary: '#03a9f4',
      buttonHover: '#01579b',
      border: '#90caf9',
      shadow: 'rgba(2, 119, 189, 0.15)',
      overlay: 'rgba(1, 87, 155, 0.8)'
    },
    gradients: {
      hero: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 50%, #90caf9 100%)',
      card: 'linear-gradient(145deg, #ffffff 0%, #e3f2fd 100%)',
      button: 'linear-gradient(135deg, #0277bd 0%, #03a9f4 100%)'
    }
  }
];

// 🏆 RECOMMENDED PALETTES FOR HAFIPORTRAIT
export const recommendedPalettes = [
  'elegant-photography', // #1 Current default - safe choice
  'champagne-gold',      // #2 Perfect for celebrations
  'arctic-blue'          // #3 Cool & Professional
];

export const defaultPalette = colorPalettes.find(p => p.id === 'elegant-photography') || colorPalettes[0];