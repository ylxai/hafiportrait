const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

// Foto-foto yang akan diupload
const photos = [
  'DSC_7704.JPG',
  'DSC_7712.JPG'
];

async function uploadPhoto(filename) {
  try {
    console.log(`📸 Uploading ${filename}...`);
    
    // Baca file
    const filePath = path.join(__dirname, filename);
    if (!fs.existsSync(filePath)) {
      console.log(`❌ File ${filename} not found`);
      return;
    }
    
    // Buat FormData
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    formData.append('category', 'Wedding');
    formData.append('is_featured', 'false');
    
    // Upload ke API
    const response = await fetch('http://localhost:3000/api/admin/portfolio/upload', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ ${filename} uploaded successfully!`);
      console.log(`   URL: ${result.url}`);
    } else {
      console.log(`❌ Failed to upload ${filename}: ${result.error || 'Unknown error'}`);
    }
    
  } catch (error) {
    console.log(`❌ Error uploading ${filename}: ${error.message}`);
  }
}

async function uploadAllPhotos() {
  console.log('🚀 Starting portfolio upload...\n');
  
  for (const photo of photos) {
    await uploadPhoto(photo);
    console.log(''); // Empty line for readability
  }
  
  console.log('🎉 Upload process completed!');
}

uploadAllPhotos();