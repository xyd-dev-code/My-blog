#!/usr/bin/env node
// Send email via Resend API
// Usage: RESEND_API_KEY=... MAIL_FROM=... MAIL_TO=... SUBJECT=... BODY=... node send-email.mjs

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.MAIL_FROM;
const to = process.env.MAIL_TO;
const subject = process.env.SUBJECT;
const body = process.env.BODY;

if (!apiKey || !from || !to || !subject || !body) {
  console.error('Missing required env: RESEND_API_KEY, MAIL_FROM, MAIL_TO, SUBJECT, BODY');
  process.exit(1);
}

const res = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from,
    to: [to],
    subject,
    text: body,
  }),
});

if (!res.ok) {
  const text = await res.text();
  console.error(`Resend API failed (${res.status}): ${text}`);
  process.exit(1);
}

const data = await res.json();
console.log(JSON.stringify({ id: data.id }));