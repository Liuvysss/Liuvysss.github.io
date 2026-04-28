import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { EventEmitter } from 'node:events';
import handler from '../api/contact.js';

const root = process.cwd();
const port = Number(process.env.PORT ?? 4173);
const origin = `http://127.0.0.1:${port}`;

process.env.CONTACT_API_TEST_MODE = '1';

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';

    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : undefined);
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function createResponse(res) {
  return {
    setHeader(name, value) {
      res.setHeader(name, value);
    },
    status(statusCode) {
      res.statusCode = statusCode;
      return this;
    },
    json(body) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(body));
    },
  };
}

function createMockRequest(body) {
  const req = new EventEmitter();
  req.method = 'POST';
  req.url = '/api/contact';
  req.headers = {
    'content-type': 'application/json',
    host: `127.0.0.1:${port}`,
    origin,
  };
  req.socket = {
    remoteAddress: '127.0.0.1',
  };
  req.body = body;

  return req;
}

function createMockResponse() {
  const headers = {};

  return {
    statusCode: 200,
    body: undefined,
    setHeader(name, value) {
      headers[name.toLowerCase()] = value;
    },
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
    },
  };
}

async function serveStatic(req, res) {
  const requestUrl = new URL(req.url, origin);
  const pathname = requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname;
  const normalizedPath = normalize(pathname).replace(/^(\.\.[/\\])+/, '');
  const filePath = join(root, normalizedPath);

  try {
    const file = await readFile(filePath);
    res.writeHead(200, {
      'Content-Type': mimeTypes[extname(filePath)] ?? 'application/octet-stream',
    });
    res.end(file);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.url === '/api/contact') {
      req.body = await readJsonBody(req);
      await handler(req, createResponse(res));
      return;
    }

    await serveStatic(req, res);
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: error.message }));
  }
});

async function assertPageHasContactForm(html) {
  if (!html.includes('id="contactForm"')) {
    throw new Error('Contact form was not found on the page.');
  }
}

function createValidPayload() {
  return {
    fullName: 'E2E Tester',
    email: 'tester@example.com',
    subject: 'Contact flow check',
    message: 'This verifies the local contact route contract.',
    website: '',
  };
}

async function runInProcessCheck() {
  const html = await readFile(join(root, 'index.html'), 'utf8');
  await assertPageHasContactForm(html);

  const req = createMockRequest(createValidPayload());
  const res = createMockResponse();
  await handler(req, res);

  if (res.statusCode !== 200 || res.body?.success !== true || res.body?.testMode !== true) {
    throw new Error(`Contact submission failed: ${res.statusCode} ${JSON.stringify(res.body)}`);
  }

  console.log('Contact E2E contract check passed without localhost binding.');
}

async function runServerCheck() {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });

  try {
    const page = await fetch(origin);
    const html = await page.text();

    if (!page.ok) {
      throw new Error(`Page request failed: ${page.status}`);
    }

    await assertPageHasContactForm(html);

    const response = await fetch(`${origin}/api/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: origin,
      },
      body: JSON.stringify(createValidPayload()),
    });
    const body = await response.json();

    if (!response.ok || body.success !== true || body.testMode !== true) {
      throw new Error(`Contact submission failed: ${response.status} ${JSON.stringify(body)}`);
    }

    console.log('Contact E2E check passed.');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

try {
  await runServerCheck();
} catch (error) {
  if (error.code !== 'EPERM' && error.code !== 'EACCES') {
    throw error;
  }

  await runInProcessCheck();
}
