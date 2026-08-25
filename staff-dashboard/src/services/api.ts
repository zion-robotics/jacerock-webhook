import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_WEBHOOK_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': import.meta.env.VITE_INTERNAL_API_KEY,
  },
});

export async function sendTemplate(to: string, templateName: string, variables: string[] = []) {
  const { data } = await api.post('/send-template', { to, templateName, variables });
  return data;
}

export async function sendDirectMessage(to: string, message: string, staffName: string) {
  const { data } = await api.post('/staff/send-message', { to, message, staffName });
  return data;
}

export async function pauseBot(whatsappNumber: string, staffName: string) {
  const { data } = await api.post('/staff/pause-bot', { whatsappNumber, staffName });
  return data;
}

export async function resumeBot(whatsappNumber: string, staffName: string) {
  const { data } = await api.post('/staff/resume-bot', { whatsappNumber, staffName });
  return data;
}
