#!/usr/bin/env node

/**
 * Check External Links
 * Validates external URLs in documentation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTEXT_DIR = path.join(process.cwd(), 'context_for_llms');
const TIMEOUT = 10000; // 10 seconds
const MAX_CONCURRENT = 5;

function extractUrls(content) {
  const urls = new Set();
  const linkPattern = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  let match;

  while ((match = linkPattern.exec(content)) !== null) {
    urls.add(match[2]);
  }

  // Also check for bare URLs
  const bareUrlPattern = /(?:^|\s)(https?:\/\/[^\s]+)/g;
  while ((match = bareUrlPattern.exec(content)) !== null) {
    urls.add(match[1]);
  }

  return Array.from(urls);
}

function checkUrl(url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    const timeoutId = setTimeout(() => {
      resolve({ url, status: 'timeout', message: 'Request timeout' });
    }, TIMEOUT);

    try {
      const request = protocol.get(url, { timeout: TIMEOUT }, (res) => {
        clearTimeout(timeoutId);

        if (res.statusCode >= 200 && res.statusCode < 400) {
          resolve({ url, status: 'ok', code: res.statusCode });
        } else if (res.statusCode >= 300 && res.statusCode < 400) {
          resolve({ url, status: 'redirect', code: res.statusCode, location: res.headers.location });
        } else {
          resolve({ url, status: 'error', code: res.statusCode });
        }

        // Consume response to free memory
        res.resume();
      });

      request.on('error', (err) => {
        clearTimeout(timeoutId);
        resolve({ url, status: 'error', message: err.message });
      });

      request.on('timeout', () => {
        request.destroy();
        clearTimeout(timeoutId);
        resolve({ url, status: 'timeout', message: 'Request timeout' });
      });
    } catch (err) {
      clearTimeout(timeoutId);
      resolve({ url, status: 'error', message: err.message });
    }
  });
}

async function checkUrlsBatch(urls) {
  const results = [];

  for (let i = 0; i < urls.length; i += MAX_CONCURRENT) {
    const batch = urls.slice(i, i + MAX_CONCURRENT);
    const batchResults = await Promise.all(batch.map(url => checkUrl(url)));
    results.push(...batchResults);

    // Progress indicator
    process.stdout.write(`\rChecking URLs: ${Math.min(i + MAX_CONCURRENT, urls.length)}/${urls.length}`);
  }

  process.stdout.write('\n');
  return results;
}

async function checkExternalLinks() {
  if (!fs.existsSync(CONTEXT_DIR)) {
    console.error('Error: context_for_llms directory not found');
    process.exit(1);
  }

  const files = fs.readdirSync(CONTEXT_DIR).filter(f => f.endsWith('.md'));
  const allUrls = new Map(); // url -> [files]

  // Collect all URLs
  for (const file of files) {
    const filePath = path.join(CONTEXT_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const urls = extractUrls(content);

    for (const url of urls) {
      if (!allUrls.has(url)) {
        allUrls.set(url, []);
      }
      allUrls.get(url).push(file);
    }
  }

  const uniqueUrls = Array.from(allUrls.keys());

  if (uniqueUrls.length === 0) {
    console.log('No external URLs found in documentation');
    return;
  }

  console.log(`\n🔗 Checking ${uniqueUrls.length} unique external URL(s)...\n`);

  const results = await checkUrlsBatch(uniqueUrls);

  // Categorize results
  const ok = results.filter(r => r.status === 'ok');
  const errors = results.filter(r => r.status === 'error');
  const timeouts = results.filter(r => r.status === 'timeout');
  const redirects = results.filter(r => r.status === 'redirect');

  // Print summary
  console.log(`\n📊 Summary:`);
  console.log(`  ✓ OK: ${ok.length}`);
  console.log(`  ↻ Redirects: ${redirects.length}`);
  console.log(`  ✗ Errors: ${errors.length}`);
  console.log(`  ⏱ Timeouts: ${timeouts.length}`);

  // Print issues
  if (errors.length > 0) {
    console.log(`\n❌ Errors:\n`);
    for (const result of errors) {
      console.log(`  ${result.url}`);
      console.log(`    Status: ${result.code || result.message}`);
      console.log(`    Found in: ${allUrls.get(result.url).join(', ')}\n`);
    }
  }

  if (timeouts.length > 0) {
    console.log(`\n⏱ Timeouts:\n`);
    for (const result of timeouts) {
      console.log(`  ${result.url}`);
      console.log(`    Found in: ${allUrls.get(result.url).join(', ')}\n`);
    }
  }

  if (redirects.length > 0) {
    console.log(`\n↻ Redirects (consider updating):\n`);
    for (const result of redirects) {
      console.log(`  ${result.url}`);
      console.log(`    → ${result.location || 'Unknown'}`);
      console.log(`    Found in: ${allUrls.get(result.url).join(', ')}\n`);
    }
  }

  if (errors.length === 0 && timeouts.length === 0) {
    console.log('\n✓ All external links are valid!');
  } else {
    console.log(`\n⚠ Some links need attention`);
  }
}

checkExternalLinks().catch(err => {
  console.error('Error checking links:', err);
  process.exit(1);
});
