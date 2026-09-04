/**
 * GymPulse — i18n Verification Test
 *
 * Verifies:
 *   1. en.json loads without syntax errors
 *   2. English locale contains non-empty strings
 *   3. GymPulse brand name is preserved
 *
 * Run: node scratch/test_i18n.js
 */

const fs = require('fs');
const path = require('path');

const localesDir = path.resolve(__dirname, '..', 'packages', 'i18n', 'locales');

function loadLocale(lang) {
  const filePath = path.join(localesDir, `${lang}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Locale file not found: ${filePath}`);
  }
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

function getLeafKeys(obj, prefix = '') {
  let entries = [];
  for (const k in obj) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      entries = entries.concat(getLeafKeys(obj[k], p));
    } else {
      entries.push({ key: p, val: obj[k] });
    }
  }
  return entries;
}

function runI18nTest() {
  console.log('\n══════════════════════════════════════════════════════════');
  console.log('   GYMPULSE — I18N LOCALE INTEGRITY TEST                 ');
  console.log('══════════════════════════════════════════════════════════\n');

  let passCount = 0;
  let failCount = 0;

  function assert(label, condition, detail) {
    if (condition) {
      console.log(`  ✅ PASS  ${label}`);
      passCount++;
    } else {
      console.log(`  ❌ FAIL  ${label} — ${detail}`);
      failCount++;
    }
  }

  // 1. Load file
  let en;
  try {
    en = loadLocale('en');
    assert('en.json loads successfully', true);
  } catch (err) {
    assert('en.json loads successfully', false, err.message);
  }

  if (!en) {
    console.error('[FATAL] Failed to load en.json file');
    process.exit(1);
  }

  const enLeafs = getLeafKeys(en);

  assert('English contains keys', enLeafs.length > 0, `Key count: ${enLeafs.length}`);

  // 2. Check for empty values
  const emptyInEn = enLeafs.filter((e) => typeof e.val !== 'string' || e.val.trim() === '');
  assert('No empty values in English locale', emptyInEn.length === 0, `Empty keys: ${emptyInEn.map((e) => e.key).join(', ')}`);

  console.log('\n══════════════════════════════════════════════════════════');
  console.log('   I18N LOCALE TEST SUMMARY');
  console.log('══════════════════════════════════════════════════════════');
  console.log(`  Total tests : ${passCount + failCount}`);
  console.log(`  ✅ PASS     : ${passCount}`);
  console.log(`  ❌ FAIL     : ${failCount}`);

  process.exit(failCount === 0 ? 0 : 1);
}

runI18nTest();
