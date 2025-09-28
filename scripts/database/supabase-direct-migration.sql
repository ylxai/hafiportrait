-- Supabase Migration for Pricing Packages
-- Run this directly in Supabase SQL Editor or via psql

-- Create pricing packages table
CREATE TABLE IF NOT EXISTS pricing_packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price VARCHAR(100) NOT NULL,
  duration VARCHAR(100),
  guests VARCHAR(100),
  photos VARCHAR(100),
  delivery VARCHAR(100),
  features JSONB NOT NULL DEFAULT '[]',
  badge VARCHAR(100),
  is_popular BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pricing_packages_active ON pricing_packages(is_active);
CREATE INDEX IF NOT EXISTS idx_pricing_packages_sort_order ON pricing_packages(sort_order);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pricing_packages_updated_at 
    BEFORE UPDATE ON pricing_packages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample packages
INSERT INTO pricing_packages (name, price, duration, guests, photos, delivery, features, badge, is_popular, sort_order) VALUES
('Paket Akad Nikah Basic', 'IDR 1.300.000', '1 hari kerja', '50-100 tamu', '200+ foto digital', '3-5 hari kerja', 
 '["1 fotografer profesional", "1 hari kerja (4-6 jam)", "40 cetak foto 5R (pilihan terbaik)", "Album magnetik (tempel)", "File foto digital tanpa batas", "Softcopy di flashdisk 16GB", "📱 Real-time sharing via app"]', 
 '💎 Hemat', FALSE, 1),

('Paket Resepsi Standard', 'IDR 1.800.000', '1 hari kerja', '100-200 tamu', '300+ foto digital', '3-5 hari kerja',
 '["1 fotografer & 1 asisten fotografer", "1 hari kerja (6-8 jam)", "40 cetak foto 5R (pilihan terbaik)", "Album magnetik premium", "File foto digital tanpa batas", "Softcopy di flashdisk 32GB", "1 cetak besar 14R + frame", "📱 Real-time sharing via app"]',
 '⭐ Populer', FALSE, 2),

('Paket Akad Nikah Premium', 'IDR 2.000.000', '1 hari kerja', '100-150 tamu', '400+ foto digital', '2-3 hari kerja',
 '["1 fotografer & 1 asisten fotografer", "1 hari kerja (6-8 jam)", "80 cetak foto 5R (pilihan terbaik)", "Album magnetik premium", "File foto digital tanpa batas", "Softcopy di flashdisk 32GB", "1 cetak besar 14R + frame", "🏷️ Professional watermark", "📱 Real-time sharing via app"]',
 '🔥 Trending', FALSE, 3),

('Paket Wedding Ultimate', 'IDR 6.000.000', '2 hari kerja', '400+ tamu', '1500+ foto digital', '1-2 hari kerja',
 '["2 fotografer & 1 asisten fotografer", "2 hari kerja (akad + resepsi)", "120 cetak foto 5R (pilihan terbaik)", "Album hard cover magnetik premium", "File foto digital tanpa batas", "Softcopy di flashdisk 256GB", "1 cetak besar 16R Jumbo + frame", "🏷️ Professional watermark", "📱 Real-time sharing via app", "💝 Bonus: 3 Mini album untuk keluarga", "🎥 Bonus: Highlight video (2-3 menit)", "⚡ Priority editing & delivery"]',
 '🏆 Best Value', TRUE, 4)

ON CONFLICT (id) DO NOTHING;

-- Verify the data
SELECT 
  id, 
  name, 
  price, 
  badge, 
  is_popular, 
  is_active, 
  sort_order,
  jsonb_array_length(features) as feature_count,
  created_at
FROM pricing_packages 
ORDER BY sort_order;