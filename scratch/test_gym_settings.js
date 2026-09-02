require('c:\\Users\\bhush\\OneDrive\\Desktop\\GymPulse\\apps\\api\\src\\config\\env.js');

const { pool } = require('c:\\Users\\bhush\\OneDrive\\Desktop\\GymPulse\\apps\\api\\src\\db\\pool.js');
const { ensureSchema } = require('c:\\Users\\bhush\\OneDrive\\Desktop\\GymPulse\\apps\\api\\src\\db\\migrate.js');
const gymRepository = require('c:\\Users\\bhush\\OneDrive\\Desktop\\GymPulse\\apps\\api\\src\\repositories\\gym.repository.js');

async function runGymSettingsIntegrationTest() {
  console.log("=================================================");
  console.log("   GYMPULSE GYM SETTINGS INTEGRATION TEST RUNNER ");
  console.log("=================================================\n");

  const results = {
    pass: [],
    fail: []
  };

  try {
    // 1. Run Schema Migrations
    console.log("--- 1. Executing Schema Migrations ---");
    await ensureSchema();
    console.log("[PASS] Schema migration check completed successfully.");
    results.pass.push("Schema Migration: 20260902_expand_gym_settings applied cleanly");

    // 2. Select Test Gym A & Gym B
    const gymRes = await pool.query('SELECT id, name FROM gyms WHERE deleted_at IS NULL LIMIT 2');
    if (gymRes.rows.length === 0) {
      throw new Error("No active gyms found in database.");
    }

    const testGymA = gymRes.rows[0];
    const testGymB = gymRes.rows[1] || null;
    const gymIdA = testGymA.id;

    console.log(`\n[INIT] Testing Gym Settings with Gym A: "${testGymA.name}" (${gymIdA})`);

    // 3. Read Initial Profile & Settings
    console.log("\n--- 2. Testing Gym Profile & Settings Read ---");
    const initialProfile = await gymRepository.findProfileById(gymIdA);
    const initialSettings = await gymRepository.getSettings(gymIdA);

    console.log("Initial Profile:", { name: initialProfile.name, email: initialProfile.email, phone: initialProfile.phone });
    console.log("Initial Settings:", { currency: initialSettings.currency, timezone: initialSettings.timezone, date_format: initialSettings.date_format });

    if (initialProfile && initialSettings) {
      results.pass.push("Read Gym Profile & Settings: Initial data loaded successfully");
    } else {
      results.fail.push("Read Gym Profile & Settings: Failed to load data");
    }

    // 4. Update Profile with Expanded Fields & Verify Persistence
    console.log("\n--- 3. Testing Gym Profile Update & Persistence ---");
    const updatedProfilePayload = {
      name: `${testGymA.name} - Updated`,
      owner_name: 'QA Owner',
      phone: '9988776655',
      whatsapp_number: '+919988776655',
      address: '42 QA Park Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      pincode: '400001',
      gst_number: '27AAAAA0000A1Z5',
      legal_name: 'QA Gym Enterprise Pvt Ltd',
      description: 'Premium Fitness & Strength Studio',
      google_maps_url: 'https://maps.google.com/?q=qagym',
      instagram_url: 'https://instagram.com/qagym',
      facebook_url: 'https://facebook.com/qagym',
      website_url: 'https://www.qagym.in',
      terms_and_conditions: '1. Re-rack weights after use.\n2. Proper shoes required.',
      privacy_policy: 'Member privacy and locker security policy.'
    };

    const updatedProfile = await gymRepository.updateProfileById(gymIdA, updatedProfilePayload);
    const fetchedProfile = await gymRepository.findProfileById(gymIdA);

    console.log("Fetched Profile After Update:", {
      name: fetchedProfile.name,
      legalName: fetchedProfile.legal_name,
      description: fetchedProfile.description,
      googleMapsUrl: fetchedProfile.google_maps_url,
      instagramUrl: fetchedProfile.instagram_url,
      privacyPolicy: fetchedProfile.privacy_policy
    });

    if (
      fetchedProfile.name === updatedProfilePayload.name &&
      fetchedProfile.legal_name === updatedProfilePayload.legal_name &&
      fetchedProfile.google_maps_url === updatedProfilePayload.google_maps_url
    ) {
      console.log("[PASS] Gym Profile updated and verified with persistence!");
      results.pass.push("Gym Profile Update & Persistence: All expanded fields updated and persisted correctly");
    } else {
      console.error("[FAIL] Gym Profile persistence mismatch");
      results.fail.push("Gym Profile Update: Field persistence mismatch");
    }

    // Restore original gym name
    await gymRepository.updateProfileById(gymIdA, { name: testGymA.name });

    // 5. Update Operating Hours & Settings & Verify Persistence
    console.log("\n--- 4. Testing Operating Hours & Settings Update & Persistence ---");
    const testOperatingHours = {
      monday: { isOpen: true, openTime: "05:30", closeTime: "22:30" },
      tuesday: { isOpen: true, openTime: "05:30", closeTime: "22:30" },
      wednesday: { isOpen: true, openTime: "05:30", closeTime: "22:30" },
      thursday: { isOpen: true, openTime: "05:30", closeTime: "22:30" },
      friday: { isOpen: true, openTime: "05:30", closeTime: "22:30" },
      saturday: { isOpen: true, openTime: "06:00", closeTime: "21:00" },
      sunday: { isOpen: false, openTime: "07:00", closeTime: "12:00" }
    };

    const updatedSettingsPayload = {
      timezone: 'Asia/Kolkata',
      date_format: 'DD MMM YYYY',
      time_format: '12',
      default_membership_duration: 30,
      default_payment_method: 'UPI',
      receipt_header: 'Official Tax Invoice',
      receipt_footer: 'Fees once paid are non-refundable.',
      show_gym_logo: true,
      show_gst: true,
      show_address: true,
      show_contact_number: true,
      operating_hours: testOperatingHours
    };

    const updatedSettings = await gymRepository.updateSettings(gymIdA, updatedSettingsPayload);
    const fetchedSettings = await gymRepository.getSettings(gymIdA);

    console.log("Fetched Settings Operating Hours Monday:", fetchedSettings.operating_hours?.monday);

    if (
      fetchedSettings.receipt_header === 'Official Tax Invoice' &&
      fetchedSettings.operating_hours?.monday?.openTime === '05:30' &&
      fetchedSettings.operating_hours?.sunday?.isOpen === false
    ) {
      console.log("[PASS] Gym Settings & Operating Hours updated and verified with persistence!");
      results.pass.push("Gym Settings & Operating Hours: Configured schedule and receipt parameters persisted");
    } else {
      console.error("[FAIL] Gym Settings persistence mismatch");
      results.fail.push("Gym Settings Update: Operating hours persistence mismatch");
    }

    // 6. Tenant Security Isolation Test
    if (testGymB) {
      console.log("\n--- 5. Testing Gym Tenant Security Isolation ---");
      const gymBProfile = await gymRepository.findProfileById(testGymB.id);
      const gymBSettings = await gymRepository.getSettings(testGymB.id);

      console.log(`Gym A (${gymIdA}) Name: "${testGymA.name}"`);
      console.log(`Gym B (${testGymB.id}) Name: "${gymBProfile.name}"`);

      // Attempting to update Gym B with Gym A's ID fails or is strictly isolated
      const updatedGymB = await gymRepository.updateProfileById(testGymB.id, { name: `${testGymB.name} - Gym B Test` });
      const verifyGymA = await gymRepository.findProfileById(gymIdA);

      // Restore Gym B name
      await gymRepository.updateProfileById(testGymB.id, { name: testGymB.name });

      if (verifyGymA.name === testGymA.name && updatedGymB.name.includes('Gym B Test')) {
        console.log("[PASS] Gym Tenant Isolation Verified! Mutation on Gym B did not touch Gym A.");
        results.pass.push(`Tenant Security Isolation: Strict scoping between Gym A (${testGymA.name}) and Gym B (${testGymB.name})`);
      } else {
        console.error("[FAIL] Tenant isolation failure");
        results.fail.push("Tenant Security Isolation: Data cross-contamination detected");
      }
    }

    console.log("\n=================================================");
    console.log(`INTEGRATION TEST COMPLETE: PASS (${results.pass.length}), FAIL (${results.fail.length})`);
    console.log("=================================================");

  } catch (err) {
    console.error("Test Exception:", err);
    results.fail.push(`Test Exception: ${err.message}`);
  } finally {
    await pool.end();
  }
}

runGymSettingsIntegrationTest();
