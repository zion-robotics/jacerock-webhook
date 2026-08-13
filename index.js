const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

// ─── Utility: Log event ───────────────────────────────────────────────────────
function logEvent(data) {
  console.log(`[${new Date().toISOString()}]`, JSON.stringify(data, null, 2));
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.status(200).json({
    status: "running",
    service: "Jace Rock Capital WhatsApp Webhook",
    timestamp: new Date().toISOString(),
  });
});

// ─── Meta Webhook Verification (GET) ──────────────────────────────────────────
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verified successfully by Meta.");
    return res.status(200).send(challenge);
  }

  console.error("❌ Webhook verification failed. Token mismatch.");
  return res.status(403).json({ error: "Verification failed" });
});

// ─── Receive Incoming WhatsApp Events (POST) ───────────────────────────────────
app.post("/webhook", (req, res) => {
  const body = req.body;

  if (body.object !== "whatsapp_business_account") {
    return res.status(404).json({ error: "Not a WhatsApp event" });
  }

  try {
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    // Handle incoming messages
    if (value?.messages) {
      const message = value.messages[0];
      const from = message.from; // sender's WhatsApp number
      const messageId = message.id;
      const timestamp = message.timestamp;
      const contact = value.contacts?.[0];
      const senderName = contact?.profile?.name || "Unknown";

      let messageContent = "";

      if (message.type === "text") {
        messageContent = message.text.body;
      } else {
        messageContent = `[${message.type} message received]`;
      }

      const logData = {
        event: "incoming_message",
        from,
        senderName,
        messageId,
        messageContent,
        timestamp: new Date(parseInt(timestamp) * 1000).toISOString(),
      };

      console.log("📩 Incoming message:", logData);
      logEvent(logData);

      // Auto-reply (optional — remove or customize this)
      sendMessage(from, `Hello ${senderName}, thank you for reaching out to Jace Rock Capital. We have received your message and will get back to you shortly.`);
    }

    // Handle message status updates (sent, delivered, read, failed)
    if (value?.statuses) {
      const status = value.statuses[0];
      const logData = {
        event: "message_status",
        messageId: status.id,
        recipientId: status.recipient_id,
        status: status.status,
        timestamp: new Date(parseInt(status.timestamp) * 1000).toISOString(),
      };

      console.log("📋 Status update:", logData);
      logEvent(logData);
    }
  } catch (error) {
    console.error("❌ Error processing webhook event:", error.message);
    logEvent({ event: "error", error: error.message });
  }

  // Always respond 200 to Meta immediately
  return res.status(200).json({ status: "received" });
});

// ─── Send WhatsApp Message ─────────────────────────────────────────────────────
async function sendMessage(to, text) {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("✅ Message sent to", to, "| Message ID:", response.data.messages?.[0]?.id);
    return response.data;
  } catch (error) {
    console.error("❌ Failed to send message:", error.response?.data || error.message);
  }
}

// ─── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Jace Rock Capital Webhook running on port ${PORT}`);
  console.log(`📡 Webhook URL: /webhook`);
  console.log(`🕐 Started at: ${new Date().toISOString()}`);
});

module.exports = { sendMessage };