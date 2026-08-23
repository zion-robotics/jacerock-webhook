const express = require('express');
const { handleMessage } = require('./src/handlers/conversation');
const { sendTemplate, APPROVED_TEMPLATES } = require('./src/services/whatsapp');
require('dotenv').config();

const app = express();
app.use(express.json());

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
