/**
 * Script to set up Supabase Storage bucket for confessions
 * Run this once to create the bucket with proper permissions
 */

const { createClient } = require('@supabase/supabase-js');

// You need to get the service role key from your Supabase dashboard
// Go to Settings > API > Service Role Key (secret)
const supabaseUrl = 'https://auxaqhtrluwbkcprtlks.supabase.co';
const serviceRoleKey = 'YOUR_SERVICE_ROLE_KEY_HERE'; // Replace with actual service role key

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function setupStorageBucket() {
  try {
    console.log('Setting up storage bucket...');
    
    // Create the confessions bucket
    const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('confessions', {
      public: true,
      allowedMimeTypes: ['audio/*', 'video/*', 'image/*'],
      fileSizeLimit: 50 * 1024 * 1024 // 50MB
    });
    
    if (bucketError) {
      if (bucketError.message.includes('already exists')) {
        console.log('✅ Bucket already exists');
      } else {
        console.error('❌ Error creating bucket:', bucketError);
        return;
      }
    } else {
      console.log('✅ Bucket created successfully:', bucketData);
    }
    
    // Test upload
    const testBlob = new Blob(['test content'], { type: 'text/plain' });
    const fileName = 'test_' + Date.now() + '.txt';
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('confessions')
      .upload(fileName, testBlob);
      
    if (uploadError) {
      console.error('❌ Test upload failed:', uploadError);
    } else {
      console.log('✅ Test upload successful');
      
      // Clean up test file
      await supabase.storage.from('confessions').remove([fileName]);
      console.log('✅ Test file cleaned up');
    }
    
    console.log('\n🎉 Storage setup complete! Your app should now be able to upload files.');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    console.log('\n📋 To fix this manually:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to Storage');
    console.log('3. Create a new bucket named "confessions"');
    console.log('4. Make it public');
    console.log('5. Set allowed MIME types: audio/*, video/*, image/*');
    console.log('6. Set file size limit to 50MB');
  }
}

if (serviceRoleKey === 'YOUR_SERVICE_ROLE_KEY_HERE') {
  console.log('❌ Please replace YOUR_SERVICE_ROLE_KEY_HERE with your actual service role key');
  console.log('You can find this in your Supabase dashboard under Settings > API > Service Role Key');
} else {
  setupStorageBucket();
}
