import { Resend } from 'resend';

const MAX_FIELD_LENGTHS = {
  fullName: 120,
  email: 254,
  subject: 160,
  message: 4000,
  website: 200,
};

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const rateLimitStore = new Map();

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(res, status, body) {
  return res.status(status).json(body);
}

function getHeader(req, name) {
  const value = req.headers?.[name.toLowerCase()] ?? req.headers?.[name];
  return Array.isArray(value) ? value[0] : value;
}

function isJsonRequest(req) {
  const contentType = getHeader(req, 'content-type') ?? '';
  return contentType.split(';')[0].trim().toLowerCase() === 'application/json';
}

function getClientIp(req) {
  const forwardedFor = getHeader(req, 'x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  return req.socket?.remoteAddress ?? 'unknown';
}

function isRateLimited(req) {
  const now = Date.now();
  const ip = getClientIp(req);
  const record = rateLimitStore.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  record.count += 1;
  return record.count > RATE_LIMIT_MAX;
}

function getAllowedOrigins(req) {
  const configured = (process.env.CONTACT_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const host = getHeader(req, 'host');

  if (!host) {
    return configured;
  }

  return [
    ...configured,
    `https://${host}`,
    `http://${host}`,
  ];
}

function hasAllowedSource(req) {
  const source = getHeader(req, 'origin') ?? getHeader(req, 'referer');

  if (!source) {
    return true;
  }

  try {
    const sourceOrigin = new URL(source).origin;
    return getAllowedOrigins(req).includes(sourceOrigin);
  } catch {
    return false;
  }
}

function normalizePayload(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Invalid request body.' };
  }

  const values = {};

  for (const field of Object.keys(MAX_FIELD_LENGTHS)) {
    const value = body[field] ?? '';

    if (typeof value !== 'string') {
      return { error: 'Invalid field type.' };
    }

    const trimmed = value.trim();

    if (trimmed.length > MAX_FIELD_LENGTHS[field]) {
      return { error: 'One or more fields are too long.' };
    }

    values[field] = trimmed;
  }

  if (values.website) {
    return { bot: true };
  }

  if (!values.fullName || !values.email || !values.subject || !values.message) {
    return { error: 'All fields are required.' };
  }

  if (!EMAIL_PATTERN.test(values.email)) {
    return { error: 'Please enter a valid email address.' };
  }

  return { values };
}

function buildEmailText({ fullName, email, subject, message }) {
  return [
    'New portfolio contact form submission',
    '',
    `From: ${fullName}`,
    `Email: ${email}`,
    `Subject: ${subject}`,
    '',
    'Message:',
    message,
  ].join('\n');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader?.('Allow', 'POST');
    return json(res, 405, { error: 'Method not allowed' });
  }

  if (!isJsonRequest(req)) {
    return json(res, 415, { error: 'Content-Type must be application/json.' });
  }

  if (!hasAllowedSource(req)) {
    return json(res, 403, { error: 'Request source is not allowed.' });
  }

  if (isRateLimited(req)) {
    return json(res, 429, { error: 'Too many requests. Please try again later.' });
  }

  const normalized = normalizePayload(req.body);

  if (normalized.bot) {
    return json(res, 200, { success: true });
  }

  if (normalized.error) {
    return json(res, 400, { error: normalized.error });
  }

  const { fullName, email, subject, message } = normalized.values;

  if (process.env.CONTACT_API_TEST_MODE === '1') {
    return json(res, 200, { success: true, testMode: true });
  }

  if (!process.env.RESEND_API_KEY || !process.env.CONTACT_EMAIL_TO) {
    return json(res, 500, { error: 'Contact email is not configured.' });
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: process.env.CONTACT_EMAIL_TO,
      subject: `Portfolio contact: ${subject}`,
      text: buildEmailText({ fullName, email, subject, message }),
      replyTo: email,
    });

    if (error) {
      throw error;
    }

    return json(res, 200, { success: true, id: data?.id });

  } catch (err) {
    console.error(err);
    return json(res, 500, { error: 'Email failed to send' });
  }
}
