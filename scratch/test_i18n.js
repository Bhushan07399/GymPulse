/**
 * GymPulse — i18n Verification Test
 *
 * Verifies:
 *   1. en.json, hi.json, mr.json load without syntax errors
 *   2. All English keys exist in Hindi and Marathi
 *   3. No empty values in any locale file
 *   4. Brand name 'GymPulse' is preserved untranslated
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

  // 1. Load files
  let en, hi, mr;
  try {
    en = loadLocale('en');
    pass('en.json loads successfully');
  } catch (err) {
    assert('en.json loads successfully', false, err.message);
  }
  try {
    hi = loadLocale('hi');
    pass('hi.json loads successfully');
  } catch (err) {
    assert('hi.json loads successfully', false, err.message);
  }
  try {
    mr = loadLocale('mr');
    pass('mr.json loads successfully');
  } catch (err) {
    assert('mr.json loads successfully', false, err.message);
  }

  function pass(label) {
    console.log(`  ✅ PASS  ${label}`);
    passCount++;
  }

  if (!en || !hi || !mr) {
    console.error('[FATAL] Failed to load one or more locale files');
    process.exit(1);
  }

  const enLeafs = getLeafKeys(en);
  const hiLeafs = getLeafKeys(hi);
  const mrLeafs = getLeafKeys(mr);

  const enMap = new Map(enLeafs.map((e) => [e.key, e.val]));
  const hiMap = new Map(hiLeafs.map((e) => [e.key, e.val]));
  const mrMap = new Map(mrLeafs.map((e) => [e.key, e.val]));

  assert('English contains keys', enLeafs.length > 0, `Key count: ${enLeafs.length}`);
  assert('Hindi key count matches English', hiLeafs.length === enLeafs.length, `En: ${enLeafs.length}, Hi: ${hiLeafs.length}`);
  assert('Marathi key count matches English', mrLeafs.length === enLeafs.length, `En: ${enLeafs.length}, Mr: ${mrLeafs.length}`);

  // 2. Check for missing keys in Hindi & Marathi
  const missingInHi = enLeafs.filter((e) => !hiMap.has(e.key));
  assert('All English keys present in Hindi', missingInHi.length === 0, `Missing: ${missingInHi.map((m) => m.key).join(', ')}`);

  const missingInMr = enLeafs.filter((e) => !mrMap.has(e.key));
  assert('All English keys present in Marathi', missingInMr.length === 0, `Missing: ${missingInMr.map((m) => m.key).join(', ')}`);

  // 3. Check for empty values
  const emptyInEn = enLeafs.filter((e) => typeof e.val !== 'string' || e.val.trim() === '');
  assert('No empty values in English locale', emptyInEn.length === 0, `Empty keys: ${emptyInEn.map((e) => e.key).join(', ')}`);

  const emptyInHi = hiLeafs.filter((e) => typeof e.val !== 'string' || e.val.trim() === '');
  assert('No empty values in Hindi locale', emptyInHi.length === 0, `Empty keys: ${emptyInHi.map((e) => e.key).join(', ')}`);

  const emptyInMr = mrLeafs.filter((e) => typeof e.val !== 'string' || e.val.trim() === '');
  assert('No empty values in Marathi locale', emptyInMr.length === 0, `Empty keys: ${emptyInMr.map((e) => e.key).join(', ')}`);

  // 4. Verify GymPulse brand integrity (should not be translated into Devanagari in JSON)
  const hiJsonStr = JSON.stringify(hi);
  const mrJsonStr = JSON.stringify(mr);
  const gymPulseTranslatedInHi = hiJsonStr.includes('जिमपल्स') || hiJsonStr.includes('जिम पल्स');
  const gymPulseTranslatedInMr = mrJsonStr.includes('जिमपल्स') || mrJsonStr.includes('जिम पल्स');
  assert('GymPulse brand name is NOT translated in Hindi', !gymPulseTranslatedInHi, 'Found translated GymPulse in hi.json');
  assert('GymPulse brand name is NOT translated in Marathi', !gymPulseTranslatedInMr, 'Found translated GymPulse in mr.json');

  console.log('\n══════════════════════════════════════════════════════════');
  console.log('   I18N LOCALE TEST SUMMARY');
  console.log('══════════════════════════════════════════════════════════');
  console.log(`  Total tests : ${passCount + failCount}`);
  console.log(`  ✅ PASS     : ${passCount}`);
  console.log(`  ❌ FAIL     : ${failCount}`);

  process.exit(failCount === 0 ? 0 : 1);
}

runI18nTest();
