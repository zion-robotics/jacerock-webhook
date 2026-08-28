const axios = require('axios');

const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const BASE_URL = `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`;
const GRAPH_BASE = 'https://graph.facebook.com/v19.0';

const HEADERS = {
  Authorization: `Bearer ${WHATSAPP_TOKEN}`,
  'Content-Type': 'application/json',
};

const APPROVED_TEMPLATES = [
  'welcome_message',
  'payment_received',
  'payment_verified',
  'transaction_completed',
  'payment_unverified',
  'transaction_on_hold',
  'additional_info_required',
];

// Send plain text message
async function sendText(to, text) {
  try {
    const res = await axios.post(BASE_URL, {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    }, { headers: HEADERS });
    console.log('✅ Text sent to', to);
    return res.data;
  } catch (err) {
    console.error('❌ sendText error:', err.response?.data || err.message);
  }
}

// Send interactive button message (max 3 buttons)
async function sendButtons(to, bodyText, buttons) {
  try {
    const res = await axios.post(BASE_URL, {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: bodyText },
        action: {
          buttons: buttons.map((btn) => ({
            type: 'reply',
            reply: { id: btn.id, title: btn.title },
          })),
        },
      },
    }, { headers: HEADERS });
    console.log('✅ Buttons sent to', to);
    return res.data;
  } catch (err) {
    console.error('❌ sendButtons error:', err.response?.data || err.message);
  }
}

// Send interactive list message (for more than 3 options)
async function sendList(to, bodyText, buttonLabel, sections) {
  try {
    const res = await axios.post(BASE_URL, {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'list',
        body: { text: bodyText },
        action: {
          button: buttonLabel,
          sections,
        },
      },
    }, { headers: HEADERS });
    console.log('✅ List sent to', to);
    return res.data;
  } catch (err) {
    console.error('❌ sendList error:', err.response?.data || err.message);
  }
}

// Send approved Meta template
async function sendTemplate(to, templateName, variables = []) {
  if (!APPROVED_TEMPLATES.includes(templateName)) {
    console.error('❌ Unknown template:', templateName);
    return null;
  }
  try {
    const components = variables.length
      ? [{ type: 'body', parameters: variables.map((v) => ({ type: 'text', text: String(v) })) }]
      : [];

    const res = await axios.post(BASE_URL, {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'en' },
        components,
      },
    }, { headers: HEADERS });
    console.log('✅ Template sent:', templateName, 'to', to);
    return res.data;
  } catch (err) {
    console.error('❌ sendTemplate error:', err.response?.data || err.message);
    return null;
  }
}

// Download media (image/document) from WhatsApp using a media ID.
// Returns { buffer, mimeType } or null on failure.
async function downloadMedia(mediaId) {
  try {
    // Step 1: ask Meta for the temporary download URL
    const urlRes = await axios.get(`${GRAPH_BASE}/${mediaId}`, {
      headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` },
    });
    const mediaUrl = urlRes.data?.url;
    const mimeType = urlRes.data?.mime_type || 'image/jpeg';
    if (!mediaUrl) throw new Error('No media URL returned');

    // Step 2: download the actual bytes using that URL
    const fileRes = await axios.get(mediaUrl, {
      headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` },
      responseType: 'arraybuffer',
    });

    console.log('✅ Media downloaded:', mediaId);
    return { buffer: fileRes.data, mimeType };
  } catch (err) {
    console.error('❌ downloadMedia error:', err.response?.data || err.message);
    return null;
  }
}

module.exports = { sendText, sendButtons, sendList, sendTemplate, downloadMedia, APPROVED_TEMPLATES };