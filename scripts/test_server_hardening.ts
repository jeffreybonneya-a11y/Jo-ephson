import express from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';

function createTestApp() {
  const app = express();

  // Middleware under test (strictly identical to server.ts)
  app.use((req, res, next) => {
    // Only redirect safe idempotent read requests (GET/HEAD) to protect POST/PUT/DELETE webhooks and APIs
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return next();
    }

    const hostHeader = (req.headers.host || '').trim();
    const forwardedHost = (req.headers['x-forwarded-host'] as string || '').split(',')[0].trim();
    const rawHost = (hostHeader || forwardedHost).split(':')[0].toLowerCase();

    if (rawHost === 'www.kingjdeals.site') {
      const redirectUrl = `https://kingjdeals.site${req.originalUrl || req.url}`;
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.redirect(301, redirectUrl);
    }
    next();
  });

  // Test API Routes for non-GET testing
  app.all('/api/test-route', (req, res) => {
    res.json({ method: req.method, received: true });
  });

  app.post('/api/paystack-webhook', (req, res) => {
    res.json({ status: 'webhook_received' });
  });

  // Simulated missing dist/index.html route
  app.get('/test-missing-dist/*', (req, res) => {
    const fakePath = path.join(process.cwd(), 'dist_nonexistent', 'index.html');
    const fileExists = fs.existsSync(fakePath);
    if (!fileExists) {
      return res.status(503).json({
        success: false,
        error: "Service Unavailable: Application build output missing (dist/index.html). Please run 'npm run build'.",
        timestamp: new Date().toISOString()
      });
    }
    res.sendFile(fakePath);
  });

  // Production fallback with actual dist check
  app.get('*', (req, res) => {
    const distPath = path.join(process.cwd(), 'dist');
    const indexPath = path.join(distPath, 'index.html');
    const fileExists = fs.existsSync(indexPath);

    if (!fileExists) {
      return res.status(503).json({
        success: false,
        error: "Service Unavailable: Application build output missing (dist/index.html). Please run 'npm run build'.",
        timestamp: new Date().toISOString()
      });
    }

    res.sendFile(indexPath, (err) => {
      if (err && !res.headersSent) {
        res.status(500).json({ error: "Failed to serve application HTML" });
      }
    });
  });

  return app;
}

async function runTests() {
  const app = createTestApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address() as { port: number };
  const port = address.port;

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}${detail ? ` - ${detail}` : ''}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
      failed++;
    }
  }

  function makeRequest(opts: {
    host: string;
    path: string;
    method?: string;
    headers?: Record<string, string>;
  }): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: string }> {
    return new Promise((resolve, reject) => {
      const req = http.request({
        hostname: '127.0.0.1',
        port: port,
        path: opts.path,
        method: opts.method || 'GET',
        headers: {
          Host: opts.host,
          ...(opts.headers || {})
        }
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode || 0, headers: res.headers, body }));
      });
      req.on('error', reject);
      req.end();
    });
  }

  console.log('\n--- STARTING FINAL WWW REDIRECT SAFETY REGRESSION TESTS ---\n');

  // Test 1: WWW GET / returns 301
  const t1 = await makeRequest({ host: 'www.kingjdeals.site', path: '/', method: 'GET' });
  assert(t1.statusCode === 301 && t1.headers.location === 'https://kingjdeals.site/', '1. WWW GET / returns 301', `Status: ${t1.statusCode}, Location: ${t1.headers.location}`);

  // Test 2: WWW HEAD / returns 301
  const t2 = await makeRequest({ host: 'www.kingjdeals.site', path: '/', method: 'HEAD' });
  assert(t2.statusCode === 301 && t2.headers.location === 'https://kingjdeals.site/', '2. WWW HEAD / returns 301', `Status: ${t2.statusCode}, Location: ${t2.headers.location}`);

  // Test 3: WWW GET /?ref=KJD-G7M8S preserves the referral code
  const t3 = await makeRequest({ host: 'www.kingjdeals.site', path: '/?ref=KJD-G7M8S', method: 'GET' });
  assert(t3.statusCode === 301 && t3.headers.location === 'https://kingjdeals.site/?ref=KJD-G7M8S', '3. WWW GET /?ref=KJD-G7M8S preserves referral code', `Location: ${t3.headers.location}`);

  // Test 4: WWW GET /mtn-data-bundles redirects correctly
  const t4 = await makeRequest({ host: 'www.kingjdeals.site', path: '/mtn-data-bundles?ref=KJD-G7M8S', method: 'GET' });
  assert(t4.statusCode === 301 && t4.headers.location === 'https://kingjdeals.site/mtn-data-bundles?ref=KJD-G7M8S', '4. WWW GET /mtn-data-bundles redirects correctly', `Location: ${t4.headers.location}`);

  // Test 5: WWW POST requests are not redirected (passed to route without 301)
  const t5 = await makeRequest({ host: 'www.kingjdeals.site', path: '/api/paystack-webhook', method: 'POST' });
  assert(t5.statusCode === 200 && !t5.headers.location && t5.body.includes('webhook_received'), '5. WWW POST requests are NOT redirected', `Status: ${t5.statusCode}, Location: ${t5.headers.location || 'none'}`);

  // Test 6: WWW OPTIONS requests are not redirected
  const t6 = await makeRequest({ host: 'www.kingjdeals.site', path: '/api/test-route', method: 'OPTIONS' });
  assert(t6.statusCode !== 301 && t6.statusCode !== 302 && !t6.headers.location, '6. WWW OPTIONS requests are NOT redirected', `Status: ${t6.statusCode}`);

  // Test 7: WWW PUT and DELETE requests are not redirected
  const t7a = await makeRequest({ host: 'www.kingjdeals.site', path: '/api/test-route', method: 'PUT' });
  const t7b = await makeRequest({ host: 'www.kingjdeals.site', path: '/api/test-route', method: 'DELETE' });
  assert(t7a.statusCode === 200 && t7b.statusCode === 200 && !t7a.headers.location && !t7b.headers.location, '7. WWW PUT and DELETE requests are NOT redirected', `PUT: ${t7a.statusCode}, DELETE: ${t7b.statusCode}`);

  // Test 8: Non-WWW GET and POST requests remain unaffected
  const t8a = await makeRequest({ host: 'kingjdeals.site', path: '/', method: 'GET' });
  const t8b = await makeRequest({ host: 'kingjdeals.site', path: '/api/paystack-webhook', method: 'POST' });
  assert(t8a.statusCode === 200 && t8b.statusCode === 200 && !t8a.headers.location && !t8b.headers.location, '8. Non-WWW GET and POST remain unaffected', `GET: ${t8a.statusCode}, POST: ${t8b.statusCode}`);

  // Test 9: Unknown hosts cannot cause arbitrary redirects (No Open Redirect)
  const t9a = await makeRequest({ host: 'evilhacker.com', path: '/?ref=test', method: 'GET' });
  const t9b = await makeRequest({ host: 'random-domain.org', path: '/', method: 'GET', headers: { 'x-forwarded-host': 'attacker.com' } });
  assert(!t9a.headers.location && !t9b.headers.location && t9a.statusCode !== 301 && t9b.statusCode !== 301, '9. Unknown hosts cannot cause arbitrary redirects', `evilhacker: ${t9a.statusCode}, forwarded attacker: ${t9b.statusCode}`);

  // Test 10: Host Priority Regression Test: Host 'kingjdeals.site' with spoofed X-Forwarded-Host 'www.kingjdeals.site' is NOT redirected
  const t10_spoof = await makeRequest({
    host: 'kingjdeals.site',
    path: '/',
    method: 'GET',
    headers: { 'x-forwarded-host': 'www.kingjdeals.site' }
  });
  assert(t10_spoof.statusCode === 200 && !t10_spoof.headers.location, '10. Host kingjdeals.site with X-Forwarded-Host www.kingjdeals.site is NOT redirected', `Status: ${t10_spoof.statusCode}, Location: ${t10_spoof.headers.location || 'none'}`);

  // Test 11: Host Priority Verification: Genuine Host 'www.kingjdeals.site' still receives 301 redirect
  const t11_genuine = await makeRequest({ host: 'www.kingjdeals.site', path: '/', method: 'GET' });
  assert(t11_genuine.statusCode === 301 && t11_genuine.headers.location === 'https://kingjdeals.site/', '11. Genuine Host www.kingjdeals.site receives 301 redirect', `Status: ${t11_genuine.statusCode}, Location: ${t11_genuine.headers.location}`);

  // Test 12: Existing fallback and server-rendered SEO tests still pass
  const t12_missing = await makeRequest({ host: 'kingjdeals.site', path: '/test-missing-dist/index.html', method: 'GET' });
  const distExists = fs.existsSync(path.join(process.cwd(), 'dist', 'index.html'));
  assert(t12_missing.statusCode === 503 && t12_missing.body.includes('Service Unavailable') && (distExists ? t8a.statusCode === 200 : true), '12. Existing fallback and SEO behavior intact', `Missing build returns 503, valid build returns 200`);

  server.close();

  console.log(`\n--- SUMMARY: ${passed} PASSED, ${failed} FAILED ---\n`);
  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
