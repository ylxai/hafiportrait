#!/usr/bin/env node

/**
 * Supabase Migration Script for Pricing Packages
 * Runs the pricing packages table creation on Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration from .env
const SUPABASE_URL = 'https://azspktldiblhrwebzmwq.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6c3BrdGxkaWJsaHJ3ZWJ6bXdxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzk0NDA0NCwiZXhwIjoyMDY5NTIwMDQ0fQ.hk8vOgFoW3PJZxhw40sHiNyvNxbD4_c4x6fqBynvlmE';

async function runMigration() {
  console.log('🚀 Starting Supabase Migration for Pricing Packages...');
  
  try {
    // Create Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    console.log('✅ Connected to Supabase');
    
    // Check if table already exists
    const { data: existingTable, error: checkError } = await supabase
      .from('pricing_packages')
      .select('id')
      .limit(1);
    
    if (!checkError) {
      console.log('⚠️  Table pricing_packages already exists!');
      console.log('   Checking current data...');
      
      const { data: packages, error: countError } = await supabase
        .from('pricing_packages')
        .select('id, name, price');
        
      if (!countError && packages) {
        console.log(`   Found ${packages.length} existing packages:`);
        packages.forEach((pkg, index) => {
          console.log(`   ${index + 1}. ${pkg.name} - ${pkg.price}`);
        });
      }
      
      console.log('\n🤔 Do you want to:');
      console.log('   1. Keep existing data (recommended)');
      console.log('   2. Add sample packages if table is empty');
      console.log('   3. Skip migration');
      
      return;
    }
    
    console.log('📋 Creating pricing_packages table...');
    
    // Create the table using SQL
    const createTableSQL = `
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
    `;
    
    const { error: createError } = await supabase.rpc('exec_sql', { 
      sql: createTableSQL 
    });
    
    if (createError) {
      console.error('❌ Error creating table:', createError);
      return;
    }
    
    console.log('✅ Table created successfully!');
    
    // Insert sample data
    console.log('📦 Inserting sample pricing packages...');
    
    const samplePackages = [
      {
        name: 'Paket Akad Nikah Basic',
        price: 'IDR 1.300.000',
        duration: '1 hari kerja',
        guests: '50-100 tamu',
        photos: '200+ foto digital',
        delivery: '3-5 hari kerja',
        features: [
          '1 fotografer profesional',
          '1 hari kerja (4-6 jam)',
          '40 cetak foto 5R (pilihan terbaik)',
          'Album magnetik (tempel)',
          'File foto digital tanpa batas',
          'Softcopy di flashdisk 16GB',
          '📱 Real-time sharing via app'
        ],
        badge: '💎 Hemat',
        is_popular: false,
        sort_order: 1
      },
      {
        name: 'Paket Resepsi Standard',
        price: 'IDR 1.800.000',
        duration: '1 hari kerja',
        guests: '100-200 tamu',
        photos: '300+ foto digital',
        delivery: '3-5 hari kerja',
        features: [
          '1 fotografer & 1 asisten fotografer',
          '1 hari kerja (6-8 jam)',
          '40 cetak foto 5R (pilihan terbaik)',
          'Album magnetik premium',
          'File foto digital tanpa batas',
          'Softcopy di flashdisk 32GB',
          '1 cetak besar 14R + frame',
          '📱 Real-time sharing via app'
        ],
        badge: '⭐ Populer',
        is_popular: false,
        sort_order: 2
      },
      {
        name: 'Paket Wedding Ultimate',
        price: 'IDR 6.000.000',
        duration: '2 hari kerja',
        guests: '400+ tamu',
        photos: '1500+ foto digital',
        delivery: '1-2 hari kerja',
        features: [
          '2 fotografer & 1 asisten fotografer',
          '2 hari kerja (akad + resepsi)',
          '120 cetak foto 5R (pilihan terbaik)',
          'Album hard cover magnetik premium',
          'File foto digital tanpa batas',
          'Softcopy di flashdisk 256GB',
          '1 cetak besar 16R Jumbo + frame',
          '🏷️ Professional watermark',
          '📱 Real-time sharing via app',
          '💝 Bonus: 3 Mini album untuk keluarga',
          '🎥 Bonus: Highlight video (2-3 menit)',
          '⚡ Priority editing & delivery'
        ],
        badge: '🏆 Best Value',
        is_popular: true,
        sort_order: 3
      }
    ];
    
    const { data: insertedPackages, error: insertError } = await supabase
      .from('pricing_packages')
      .insert(samplePackages)
      .select();
    
    if (insertError) {
      console.error('❌ Error inserting sample data:', insertError);
      return;
    }
    
    console.log('✅ Sample packages inserted successfully!');
    console.log(`   Created ${insertedPackages.length} packages:`);
    
    insertedPackages.forEach((pkg, index) => {
      console.log(`   ${index + 1}. ${pkg.name} - ${pkg.price}`);
    });
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Access admin panel: /admin → Settings → Paket Harga');
    console.log('   2. Test creating new packages');
    console.log('   3. Test reordering functionality');
    console.log('   4. Check frontend display at /#pricing');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run the migration
runMigration();