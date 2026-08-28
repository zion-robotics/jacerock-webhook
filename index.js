const express = require('express');
const cors = require('cors');
const { handleMessage } = require('./src/handlers/conversation');
const { sendTemplate, APPROVED_TEMPLATES, downloadMedia } = require('./src/services/whatsapp');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors({ origin: '*' }));

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'running',
    service: 'Jacerock Capital / AfrikBerry WhatsApp AI Platform',
    timestamp: new Date().toISOString(),
  });
});

// ── Meta Webhook Verification ─────────────────────────────────────────────────
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verified by Meta.');
    return res.status(200).send(challenge);
  }

  console.error('❌ Webhook verification failed.');
  return res.status(403).json({ error: 'Verification failed' });
});

// ── Incoming WhatsApp Events ──────────────────────────────────────────────────
app.post('/webhook', async (req, res) => {
  res.status(200).json({ status: 'received' });

  const body = req.body;
  if (body.object !== 'whatsapp_business_account') return;

  try {
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (value?.messages) {
      const message = value.messages[0];
      const from = message.from;
      const contact = value.contacts?.[0];
      const senderName = contact?.profile?.name || 'Valued Customer';

      console.log(`📩 Message from ${from} | Type: ${message.type}`);

      // Save inbound message
      const db = require('./src/services/database');
      if (message.type === 'text') {
        await db.saveMessage(from, 'INBOUND', message.text?.body, senderName, 'CUSTOMER');
      } else if (message.type === 'interactive') {
        const buttonReply = message.interactive?.button_reply;
        const listReply = message.interactive?.list_reply;
        const replyText = buttonReply?.title || listReply?.title || '[button tap]';
        await db.saveMessage(from, 'INBOUND', replyText, senderName, 'CUSTOMER');
      } else if (message.type === 'image' || message.type === 'document') {
        const mediaId = message[message.type]?.id;
        let mediaUrl = null;

        if (mediaId) {
          const media = await downloadMedia(mediaId);
          if (media) {
            mediaUrl = await db.uploadMedia(media.buffer, media.mimeType, from);
          }
        }

        await db.saveMessage(
          from,
          'INBOUND',
          `[${message.type} uploaded]`,
          senderName,
          'CUSTOMER',
          mediaUrl
        );
      }

      await handleMessage(from, message, senderName);
    }

    if (value?.statuses) {
      const status = value.statuses[0];
      console.log(`📋 Status: ${status.status} | To: ${status.recipient_id}`);
    }
  } catch (err) {
    console.error('❌ Webhook handler error:', err.message);
  }
});

// ── Staff Send Message Directly (human takeover) ─────────────────────────────
app.post('/staff/send-message', async (req, res) => {
  const { to, message, staffName } = req.body;
  if (!to || !message) return res.status(400).json({ error: "Missing 'to' or 'message'" });

  const { sendText } = require('./src/services/whatsapp');
  const result = await sendText(to, message);
  if (!result) return res.status(500).json({ error: 'Failed to send message' });

  const db = require('./src/services/database');
  await db.saveMessage(to, 'OUTBOUND', message, staffName || 'STAFF', staffName || 'STAFF');
  await db.logAudit(null, null, 'STAFF_MESSAGE_SENT', null, null, staffName || 'STAFF', `Message sent to ${to}: ${message}`);

  return res.status(200).json({ status: 'sent', data: result });
});

// ── Pause Bot for a customer (staff takes over) ───────────────────────────────
app.post('/staff/pause-bot', async (req, res) => {
  const { whatsappNumber, staffName } = req.body;
  if (!whatsappNumber) return res.status(400).json({ error: "Missing 'whatsappNumber'" });

  const db = require('./src/services/database');
  await db.pauseBot(whatsappNumber, staffName || 'STAFF');
  await db.logAudit(null, null, 'BOT_PAUSED', null, null, staffName || 'STAFF', `Bot paused for ${whatsappNumber}`);

  console.log(`⏸️  Bot paused for ${whatsappNumber} by ${staffName}`);
  return res.status(200).json({ status: 'paused', whatsappNumber });
});

// ── Resume Bot for a customer ─────────────────────────────────────────────────
app.post('/staff/resume-bot', async (req, res) => {
  const { whatsappNumber, staffName } = req.body;
  if (!whatsappNumber) return res.status(400).json({ error: "Missing 'whatsappNumber'" });

  const db = require('./src/services/database');
  await db.resumeBot(whatsappNumber);
  await db.logAudit(null, null, 'BOT_RESUMED', null, null, staffName || 'STAFF', `Bot resumed for ${whatsappNumber}`);

  console.log(`▶️  Bot resumed for ${whatsappNumber} by ${staffName}`);
  return res.status(200).json({ status: 'resumed', whatsappNumber });
});

// ── Staff Template Trigger (used by dashboard) ────────────────────────────────
app.post('/send-template', async (req, res) => {
  const { to, templateName, variables } = req.body;

  if (!to || !templateName) {
    return res.status(400).json({ error: "Missing 'to' or 'templateName'" });
  }

  if (!APPROVED_TEMPLATES.includes(templateName)) {
    return res.status(400).json({ error: 'Unknown template', allowed: APPROVED_TEMPLATES });
  }

  const result = await sendTemplate(to, templateName, variables || []);
  if (!result) return res.status(500).json({ error: 'Failed to send template' });

  return res.status(200).json({ status: 'sent', data: result });
});

// ── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Jacerock Capital Webhook running on port ${PORT}`);
  console.log(`🕐 Started at: ${new Date().toISOString()}`);
});