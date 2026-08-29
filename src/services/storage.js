const supabase = require('../config/supabase');
const axios = require('axios');

async function uploadReceiptToStorage(mediaId, whatsappToken, transactionReference) {
  try {
    // Step 1 — Get the media URL from Meta
    const mediaResponse = await axios.get(
      `https://graph.facebook.com/v19.0/${mediaId}`,
      { headers: { Authorization: `Bearer ${whatsappToken}` } }
    );

    const mediaUrl = mediaResponse.data.url;

    // Step 2 — Download the media file
    const fileResponse = await axios.get(mediaUrl, {
      headers: { Authorization: `Bearer ${whatsappToken}` },
      responseType: 'arraybuffer',
    });

    const fileBuffer = Buffer.from(fileResponse.data);
    const contentType = fileResponse.headers['content-type'] || 'image/jpeg';
    const extension = contentType.includes('pdf') ? 'pdf' : 'jpg';
    const fileName = `${transactionReference}-${Date.now()}.${extension}`;

    // Step 3 — Upload to Supabase Storage
    const { error } = await supabase.storage
      .from('receipts')
      .upload(fileName, fileBuffer, {
        contentType,
        upsert: false,
      });

    if (error) throw error;

    // Step 4 — Get public URL
    const { data: urlData } = supabase.storage
      .from('receipts')
      .getPublicUrl(fileName);

    console.log('✅ Receipt uploaded to storage:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (err) {
    console.error('❌ Receipt upload failed:', err.message);
    return null;
  }
}

module.exports = { uploadReceiptToStorage };
