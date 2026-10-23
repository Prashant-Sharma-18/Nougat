#!/usr/bin/env node

/**
 * Nougat Loyalty & Rewards - Automated Verification & Concurrency Test Runner
 * Runs all 12 platform milestones and 5-thread concurrency test.
 */

const http = require('http');

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data.slice(0, 200)}`));
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('====================================================');
  console.log(' NOUAT LOYALTY & REWARDS - AUTOMATED TEST SUITE');
  console.log(` Target Server: ${BASE_URL}`);
  console.log('====================================================\n');

  try {
    // 1. Run Milestones
    console.log('[1/2] Executing Enterprise Milestone Tests (/api/verify)...');
    const verifyData = await fetchJson(`${BASE_URL}/api/verify`);
    const checks = verifyData?.verification?.milestoneChecks || [];
    
    let passed = 0;
    checks.forEach((c) => {
      const isPass = c.status === 'PASSED';
      if (isPass) passed++;
      console.log(`  ${isPass ? 'PASS' : 'FAIL'} | ${c.milestone}`);
    });
    console.log(`\n  Milestones Result: ${passed}/${checks.length} checks passed.\n`);

    // 2. Run Stress Test
    console.log('[2/2] Executing 5-Thread Concurrency Stress Test (/api/stress-test)...');
    const stressData = await fetchJson(`${BASE_URL}/api/stress-test`);
    const cr = stressData?.concurrencyResults || {};
    
    console.log(`  Simultaneous Requests: ${cr.totalSimultaneousRequests}`);
    console.log(`  Successful Redemptions: ${cr.successfulRedemptions}`);
    console.log(`  Rejected (Protected):   ${cr.rejectedRedemptions}`);
    console.log(`  Double-Spend Prevented: ${cr.doubleSpendPrevented ? 'YES' : 'NO'}`);
    console.log(`  Verdict: ${cr.verdict}\n`);

    if (passed === checks.length && cr.doubleSpendPrevented) {
      console.log('====================================================');
      console.log(' ALL TESTS PASSED SUCCESSFULLY! PLATFORM READY.');
      console.log('====================================================\n');
      process.exit(0);
    } else {
      console.error('Some tests failed.');
      process.exit(1);
    }
  } catch (err) {
    console.error('\nTest Execution Error:', err.message);
    console.error(`Ensure Next.js production server is running on port ${PORT}.\n`);
    process.exit(1);
  }
}

run();

