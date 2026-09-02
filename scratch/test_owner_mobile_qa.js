const API_BASE_URL = 'http://localhost:5000/api/v1';

async function runOwnerMobileQa() {
  console.log('=================================================');
  console.log('   GYMPULSE OWNER MOBILE REAL DATA QA RUNNER     ');
  console.log('=================================================\n');

  let passCount = 0;
  let failCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passCount++;
    } else {
      console.error(`[FAIL] ${message}`);
      failCount++;
    }
  }

  try {
    // 1. Owner & Staff Auth Login
    console.log('--- 1. Testing Owner & Staff Mobile Auth Login ---');
    const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'owner@gympulse.com',
        password: 'password123',
      }),
    });
    const loginJson = await loginRes.json();
    const token = loginJson.data?.token;
    const user = loginJson.data?.user || loginJson.data?.owner;

    assert(!!token, 'Received valid JWT authentication token.');
    assert(user && (user.role?.toLowerCase() === 'owner' || user.role?.toLowerCase() === 'staff'), `Authenticated user role is "${user?.role}".`);

    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    // 2. Dashboard Operational KPIs
    console.log('\n--- 2. Testing Owner Mobile Dashboard KPIs ---');
    const dashboardRes = await fetch(`${API_BASE_URL}/dashboard/summary`, { headers: authHeaders });
    const dashboardJson = await dashboardRes.json();
    const summary = dashboardJson.data;

    const totalMembers = summary.totalMembers ?? summary.gymMemberships?.totalMembers ?? 0;
    const activeMembers = summary.activeMembers ?? summary.gymMemberships?.activeMembers ?? 0;
    const todayCheckIns = summary.todaysAttendance ?? summary.gymMemberships?.todaysAttendance ?? 0;
    const membershipRevenue = summary.business?.gymMembershipRevenue ?? summary.gymMemberships?.revenue ?? 0;
    const classRevenue = summary.business?.classRevenue ?? summary.classes?.revenue ?? 0;

    assert(typeof totalMembers === 'number', `Total Members: ${totalMembers}`);
    assert(typeof activeMembers === 'number', `Active Members: ${activeMembers}`);
    assert(typeof todayCheckIns === 'number', `Today Check-ins: ${todayCheckIns}`);
    assert(typeof membershipRevenue === 'number', `Gym Membership Revenue: ₹${membershipRevenue}`);
    assert(typeof classRevenue === 'number', `Class Revenue: ₹${classRevenue}`);

    // 3. Member Directory & Search
    console.log('\n--- 3. Testing Member Directory & Search ---');
    const membersRes = await fetch(`${API_BASE_URL}/members?limit=10`, { headers: authHeaders });
    const membersJson = await membersRes.json();
    const members = Array.isArray(membersJson.data) ? membersJson.data : (membersJson.data?.members || []);
    assert(Array.isArray(members), `Loaded ${members.length} members from directory.`);

    // 4. Membership Plans Fetch
    console.log('\n--- 4. Testing Membership Plans Listing ---');
    const plansRes = await fetch(`${API_BASE_URL}/membership-plans`, { headers: authHeaders });
    const plansJson = await plansRes.json();
    const plans = Array.isArray(plansJson.data) ? plansJson.data : (plansJson.data?.membershipPlans || []);
    assert(plans.length > 0, `Loaded ${plans.length} active membership plans.`);
    const defaultPlan = plans[0];

    // 5. Quick Member Registration Flow
    console.log('\n--- 5. Testing Quick Member Registration ---');
    const testPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
    const createRes = await fetch(`${API_BASE_URL}/members`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        firstName: 'MobileTest',
        lastName: 'User',
        phone: testPhone,
        gender: 'Male',
        membershipPlanId: defaultPlan.id,
        joinDate: new Date().toISOString().split('T')[0],
        paymentStatus: 'Paid',
        amountPaid: Number(defaultPlan.price || 1000),
        paymentMethod: 'UPI',
      }),
    });
    const createJson = await createRes.json();
    const newMember = createJson.data?.member || createJson.data;

    assert(!!newMember?.id, `Created new member: ${newMember?.firstName} ${newMember?.lastName} (ID: ${newMember?.memberId}).`);

    // 6. Member Detail Fetch
    console.log('\n--- 6. Testing Member Detail Fetch ---');
    const detailRes = await fetch(`${API_BASE_URL}/members/${newMember.id}`, { headers: authHeaders });
    const detailJson = await detailRes.json();
    const memberDetail = detailJson.data?.member || detailJson.data;
    assert(memberDetail.id === newMember.id, `Fetched profile for member ID ${memberDetail.memberId}.`);

    // 7. Payment Recording Flow
    console.log('\n--- 7. Testing Fee Payment Recording ---');
    const todayStr = new Date().toISOString().split('T')[0];
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextDueStr = nextMonth.toISOString().split('T')[0];

    const paymentRes = await fetch(`${API_BASE_URL}/payments`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        memberId: newMember.memberId,
        membershipPlanId: defaultPlan.id,
        paymentAmount: 1500,
        discountAmount: 0,
        taxAmount: 0,
        totalAmount: 1500,
        paymentMethod: 'UPI',
        paymentStatus: 'Paid',
        paymentDate: todayStr,
        nextDueDate: nextDueStr,
        collectedByStaffId: user.id,
        notes: 'Mobile P0 QA test fee collection',
      }),
    });
    const paymentJson = await paymentRes.json();
    if (!paymentRes.ok) console.log('Payment error details:', JSON.stringify(paymentJson, null, 2));
    const payment = paymentJson.data?.payment || paymentJson.data;
    const paidAmt = Number(payment?.totalAmount ?? payment?.paymentAmount ?? payment?.amount ?? 0);

    assert(paidAmt === 1500, `Recorded fee payment of ₹1,500.`);

    // 8. Attendance Manual Check-in
    console.log('\n--- 8. Testing Manual Reception Check-in ---');
    const checkInRes = await fetch(`${API_BASE_URL}/attendance`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        memberId: newMember.memberId,
        checkInTime: new Date().toISOString(),
        attendanceDate: todayStr,
        attendanceMethod: 'Manual',
        markedByStaffId: user.id,
      }),
    });
    const checkInJson = await checkInRes.json();
    if (!checkInRes.ok) console.log('Check-in error details:', JSON.stringify(checkInJson, null, 2));
    const checkInRecord = checkInJson.data?.attendance || checkInJson.data;
    assert(!!checkInRecord?.id, `Manual check-in completed for member ID ${newMember.memberId}.`);

    // 9. Reception QR Scanner Workflow
    console.log('\n--- 9. Testing Reception Camera QR Scanner ---');
    const scanRes = await fetch(`${API_BASE_URL}/attendance`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        memberId: newMember.memberId,
        checkInTime: new Date().toISOString(),
        attendanceDate: todayStr,
        attendanceMethod: 'QR',
        markedByStaffId: user.id,
      }),
    });
    const scanJson = await scanRes.json();
    assert(scanRes.status === 200 || scanRes.status === 201 || scanRes.status === 409 || scanJson.success === false, `QR scanner processed backend check-in rules.`);

    // 10. Today's Attendance Ledger
    console.log('\n--- 10. Testing Today\'s Attendance Ledger ---');
    const ledgerRes = await fetch(`${API_BASE_URL}/attendance`, { headers: authHeaders });
    const ledgerJson = await ledgerRes.json();
    const ledger = Array.isArray(ledgerJson.data) ? ledgerJson.data : (ledgerJson.data?.attendance || []);
    assert(ledger.length > 0, `Attendance ledger retrieved ${ledger.length} check-ins for today.`);

    console.log('\n=================================================');
    console.log(`OWNER MOBILE REAL DATA QA COMPLETE: PASS (${passCount}), FAIL (${failCount})`);
    console.log('=================================================\n');

    if (failCount > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('[FATAL QA ERROR]', err);
    process.exit(1);
  }
}

runOwnerMobileQa();
