# Jace Rock Capital — WhatsApp Webhook

Meta WhatsApp Cloud API webhook server for Jace Rock Capital.

---

## What This Does

- Receives incoming WhatsApp messages sent to your business number
- Handles message status updates (sent, delivered, read)
- Sends automated replies via Meta Cloud API
- Logs all events to `/logs/messages.log`

---

## Credentials

All credentials are stored securely in environment variables on the server. Never commit real credentials to this repository.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| WHATSAPP_TOKEN | Permanent access token from Meta |
| PHONE_NUMBER_ID | Your WhatsApp Phone Number ID |
| WHATSAPP_ACCOUNT_ID | Your WhatsApp Business Account ID |
| VERIFY_TOKEN | Must match what is entered in Meta dashboard |
| PORT | Server port (Railway sets this automatically) |

---

## Local Setup

```bash
npm install
cp .env.example .env
# Fill in .env values
npm start
```

---

## Deployment (Render)

1. Push this repo to GitHub (private)
2. Go to your Render project
3. Click New Service -> Web Service
4. Connect your GitHub repo
5. Add environment variables in Render dashboard under Environment
6. Render will auto-deploy and give you a public URL

---

## Meta Dashboard Configuration

Once deployed, go to:

developers.facebook.com -> Your App -> WhatsApp -> Configuration

Enter:
- **Callback URL:** your custom domain webhook URL
- **Verify Token:** the value set in your VERIFY_TOKEN environment variable

Click **Verify and Save.**

Then subscribe to these webhook fields:
- `messages`
- `message_status`

---

## API Endpoints

| Method | Route | Description |
|---|---|---|
| GET | / | Health check |
| GET | /webhook | Meta verification challenge |
| POST | /webhook | Receive WhatsApp events |

---

## DNS Setup (GoDaddy)

To use `webhook.jacerockcapital.com` instead of the Railway URL:

1. Go to GoDaddy DNS settings for `jacerockcapital.com`
2. Add a new CNAME record:
   - **Name:** `webhook`
   - **Value:** your Render app domain (e.g. `jacerock-webhook.onrender.com`)
   - **TTL:** 600
3. In Render dashboard, go to Settings -> Custom Domains -> Add Custom Domain
4. Enter your custom domain
5. Wait 10-30 minutes for DNS to propagate

---

## Support

For any issues with this webhook, contact the developer.
