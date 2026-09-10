/**
 * business-document.ts
 * Unified document and branding engine for customer-facing documents:
 * - Payment Receipts (Modal, Print, Download)
 * - Business Reports (Member, Payment, Attendance, Revenue)
 *
 * Rules:
 * 1. Primary branding is always THE GYM (Logo, Name, Address, Phone, GSTIN).
 * 2. Uploaded gym logo is the single source of truth.
 * 3. Fallback: Clean geometric gym initials monogram.
 * 4. Never use GymPulse as the gym's main brand or logo.
 * 5. Timezone-safe local calendar dates (05 Sep 2026) and timestamps (05 Sep 2026, 12:23 PM).
 */

export interface GymBusinessProfile {
  name: string;
  logoUrl?: string | null;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  phone?: string;
  gstNumber?: string | null;
}

export interface ReportDocumentOptions {
  gymProfile?: GymBusinessProfile | null;
  reportTitle: string; // e.g. "Member Report", "Payment Report", "Attendance Report", "Revenue Report"
  reportPeriod: string; // e.g. "01 Sep 2026 – 05 Sep 2026" or "Today (05 Sep 2026)"
  generatedAt: string; // e.g. "05 Sep 2026, 12:23 PM"
  appliedFilters: { label: string; value: string }[];
  summaryCards?: { label: string; value: string | number }[];
  tableHeaders: string[];
  tableRows: (string | number)[][];
  footerNote?: string;
  autoPrint?: boolean;
}

export interface ReceiptDocumentOptions {
  gymProfile?: GymBusinessProfile | null;
  receiptNumber: string;
  transactionId?: string | null;
  paymentDate: string; // e.g. "05 Sep 2026"
  createdAt?: string | null; // e.g. "05 Sep 2026, 12:23 PM"
  member: {
    name: string;
    memberId: string;
    phone?: string | null;
  };
  membership: {
    planName: string;
    period?: string | null;
  };
  paymentMethod: string;
  paymentStatus: string;
  notes?: string | null;
  financials: {
    planAmount: number;
    discountAmount?: number;
    taxAmount?: number;
    paidAmount: number;
    remainingAmount?: number;
  };
  autoPrint?: boolean;
}

/**
 * Format local calendar date (e.g. "05 Sep 2026")
 * Safe against UTC midnight timezone shifting for Indian Standard Time (IST).
 */
export function formatBusinessDate(value: any): string {
  if (value === null || value === undefined || value === "") return "—";

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "—";
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(value);
  }

  const str = String(value).trim();
  if (!str || str === "null" || str === "undefined") return "—";

  // If date string in YYYY-MM-DD format (either standalone or start of ISO string)
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, y, m, d] = match;
    const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
    if (!Number.isNaN(dateObj.getTime())) {
      return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(dateObj);
    }
  }

  const parsed = new Date(str);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

/**
 * Format timestamp with time (e.g. "05 Sep 2026, 12:23 PM")
 */
export function formatDateTime(value: any): string {
  if (value === null || value === undefined || value === "") return "—";

  const parsed = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(parsed);
}

/**
 * Currency formatter with Indian Rupee symbol (₹)
 */
export function formatMoney(value: any): string {
  const num = Number(value ?? 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isNaN(num) ? 0 : num);
}

/**
 * Clean gym initials monogram (e.g. "CULTB" -> "CB", "Gold's Gym" -> "GG")
 */
export function getGymInitials(name?: any): string {
  if (!name) return "GYM";
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Shared CSS for all printable & downloadable business documents
 */
const sharedDocumentStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #0F172A;
    background-color: #FFFFFF;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }
  .doc-container {
    max-width: 820px;
    margin: 0 auto;
    padding: 32px 36px;
    background: #FFFFFF;
  }
  .doc-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    border-bottom: 2px solid #0F172A;
    padding-bottom: 20px;
    margin-bottom: 20px;
  }
  .gym-brand {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .gym-logo-img {
    max-height: 64px;
    max-width: 140px;
    object-fit: contain;
    border-radius: 8px;
  }
  .gym-logo-avatar {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    background: #0F172A;
    color: #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: 900;
    letter-spacing: 0.05em;
  }
  .gym-info h1 {
    font-size: 22px;
    font-weight: 900;
    color: #0F172A;
    letter-spacing: -0.02em;
    line-height: 1.2;
    margin-bottom: 4px;
  }
  .gym-meta {
    font-size: 12px;
    color: #64748B;
    line-height: 1.4;
  }
  .doc-badge-group {
    text-align: right;
  }
  .doc-title-badge {
    display: inline-block;
    background: #0F172A;
    color: #FFFFFF;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 6px 14px;
    border-radius: 6px;
    margin-bottom: 6px;
  }
  .doc-date-meta {
    font-size: 11px;
    color: #64748B;
    font-weight: 500;
  }
  .filters-banner {
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-radius: 8px;
    padding: 10px 14px;
    margin-bottom: 20px;
    font-size: 11px;
    color: #334155;
    display: flex;
    flex-wrap: wrap;
    gap: 12px 18px;
  }
  .filter-item strong {
    color: #0F172A;
    font-weight: 700;
  }
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 12px;
    margin-bottom: 24px;
  }
  .kpi-card {
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-radius: 10px;
    padding: 12px 14px;
  }
  .kpi-label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #64748B;
    margin-bottom: 4px;
  }
  .kpi-value {
    font-size: 18px;
    font-weight: 900;
    color: #0F172A;
  }
  table.doc-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 24px;
    font-size: 11px;
  }
  table.doc-table th {
    background: #0F172A;
    color: #FFFFFF;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 9px 10px;
    text-align: left;
  }
  table.doc-table td {
    padding: 8px 10px;
    border-bottom: 1px solid #E2E8F0;
    color: #334155;
  }
  table.doc-table tbody tr:nth-child(even) {
    background: #F8FAFC;
  }
  .text-right { text-align: right; }
  .text-center { text-align: center; }
  .font-bold { font-weight: 700; }
  .doc-footer {
    margin-top: 28px;
    padding-top: 16px;
    border-top: 1px solid #E2E8F0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 11px;
    color: #64748B;
  }
  .doc-attribution {
    font-size: 10px;
    color: #94A3B8;
  }

  @media print {
    @page {
      size: A4 portrait;
      margin: 12mm 14mm;
    }
    body {
      background: #FFFFFF !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .doc-container {
      max-width: 100% !important;
      padding: 0 !important;
      margin: 0 !important;
    }
    .no-print {
      display: none !important;
    }
  }
`;

/**
 * Generate full standalone HTML for Reports (PDF / Print / Export)
 */
export function renderReportDocumentHtml(options: ReportDocumentOptions): string {
  const {
    gymProfile,
    reportTitle,
    reportPeriod,
    generatedAt,
    appliedFilters,
    summaryCards = [],
    tableHeaders,
    tableRows,
    footerNote,
  } = options;

  const gymName = gymProfile?.name || "Fitness Center";
  const gymAddress = [gymProfile?.address, gymProfile?.city, gymProfile?.state, gymProfile?.pincode]
    .filter(Boolean)
    .join(", ") || "India";
  const gymPhone = gymProfile?.phone;
  const gymGst = gymProfile?.gstNumber;
  const initials = getGymInitials(gymName);

  const logoMarkup = gymProfile?.logoUrl
    ? `<img src="${gymProfile.logoUrl}" alt="${gymName}" class="gym-logo-img" />`
    : `<div class="gym-logo-avatar">${initials}</div>`;

  const filtersMarkup = appliedFilters.length
    ? `<div class="filters-banner">
        ${appliedFilters
          .map((f) => `<span class="filter-item"><strong>${f.label}:</strong> ${f.value}</span>`)
          .join("")}
      </div>`
    : "";

  const kpisMarkup = summaryCards.length
    ? `<div class="kpi-grid">
        ${summaryCards
          .map(
            (c) => `<div class="kpi-card">
              <div class="kpi-label">${c.label}</div>
              <div class="kpi-value">${c.value}</div>
            </div>`
          )
          .join("")}
      </div>`
    : "";

  const rowsMarkup = tableRows
    .map(
      (row) =>
        `<tr>${row
          .map((cell, idx) => {
            const isAmount = typeof cell === "string" && (cell.includes("₹") || cell.startsWith("INR"));
            const alignClass = isAmount ? ' class="text-right font-bold"' : idx === 0 ? ' class="font-bold"' : "";
            return `<td${alignClass}>${cell}</td>`;
          })
          .join("")}</tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${gymName} — ${reportTitle}</title>
  <style>
    ${sharedDocumentStyles}
  </style>
</head>
<body>
  <div class="doc-container">
    <div class="doc-header">
      <div class="gym-brand">
        ${logoMarkup}
        <div class="gym-info">
          <h1>${gymName}</h1>
          <div class="gym-meta">${gymAddress}</div>
          <div class="gym-meta">${gymPhone ? `Phone: ${gymPhone}` : ""}${gymPhone && gymGst ? " • " : ""}${gymGst ? `GSTIN: ${gymGst}` : ""}</div>
        </div>
      </div>
      <div class="doc-badge-group">
        <div class="doc-title-badge">${reportTitle}</div>
        <div class="doc-date-meta"><strong>Period:</strong> ${reportPeriod}</div>
        <div class="doc-date-meta"><strong>Generated:</strong> ${generatedAt}</div>
      </div>
    </div>

    ${filtersMarkup}
    ${kpisMarkup}

    <table class="doc-table">
      <thead>
        <tr>
          ${tableHeaders.map((h, idx) => {
            const isAmount = h.toLowerCase().includes("amount") || h.toLowerCase().includes("paid") || h.toLowerCase().includes("revenue");
            return `<th${isAmount ? ' class="text-right"' : ''}>${h}</th>`;
          }).join("")}
        </tr>
      </thead>
      <tbody>
        ${rowsMarkup || '<tr><td colspan="' + tableHeaders.length + '" class="text-center" style="padding: 24px; color: #64748B;">No records found for this period.</td></tr>'}
      </tbody>
    </table>

    <div class="doc-footer">
      <div>${footerNote || `Official business report issued by ${gymName}.`}</div>
      <div class="doc-attribution">Generated via GymPulse</div>
    </div>
  </div>
  ${options.autoPrint !== false ? `<script>
    window.onload = function() { window.print(); };
  </script>` : ""}
</body>
</html>`;
}

/**
 * Generate full standalone HTML for Payment Receipts (Modal, Print, Download)
 */
export function renderReceiptDocumentHtml(options: ReceiptDocumentOptions): string {
  const {
    gymProfile,
    receiptNumber,
    transactionId,
    paymentDate,
    createdAt,
    member,
    membership,
    paymentMethod,
    paymentStatus,
    notes,
    financials,
  } = options;

  const gymName = gymProfile?.name || "Fitness Center";
  const gymAddress = [gymProfile?.address, gymProfile?.city, gymProfile?.state, gymProfile?.pincode]
    .filter(Boolean)
    .join(", ") || "India";
  const gymPhone = gymProfile?.phone;
  const gymGst = gymProfile?.gstNumber;
  const initials = getGymInitials(gymName);

  const logoMarkup = gymProfile?.logoUrl
    ? `<img src="${gymProfile.logoUrl}" alt="${gymName}" style="max-height: 54px; max-width: 120px; object-fit: contain; margin-bottom: 6px;" />`
    : `<div style="width: 48px; height: 48px; border-radius: 10px; background: #0F172A; color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 900; margin: 0 auto 8px auto;">${initials}</div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Receipt - ${receiptNumber}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0F172A;
      background: #FFFFFF;
      padding: 24px;
      display: flex;
      justify-content: center;
      -webkit-font-smoothing: antialiased;
    }
    .receipt-card {
      width: 100%;
      max-width: 440px;
      border: 1px solid #E2E8F0;
      border-radius: 16px;
      padding: 28px 24px;
      background: #FFFFFF;
      box-shadow: 0 4px 20px rgba(15, 23, 42, 0.05);
    }
    .header {
      text-align: center;
      border-bottom: 2px dashed #E2E8F0;
      padding-bottom: 16px;
      margin-bottom: 16px;
    }
    .gym-name {
      font-size: 20px;
      font-weight: 900;
      color: #0F172A;
      margin-bottom: 3px;
      line-height: 1.2;
    }
    .gym-meta {
      font-size: 11px;
      color: #64748B;
      line-height: 1.4;
    }
    .title-banner {
      background: #0F172A;
      color: #FFFFFF;
      text-align: center;
      padding: 6px 0;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.08em;
      border-radius: 6px;
      margin-bottom: 16px;
    }
    .section-title {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #94A3B8;
      margin-top: 12px;
      margin-bottom: 6px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      margin-bottom: 7px;
    }
    .label {
      color: #64748B;
      font-weight: 500;
    }
    .value {
      font-weight: 700;
      color: #0F172A;
      text-align: right;
    }
    .divider {
      border-top: 1px dashed #E2E8F0;
      margin: 14px 0;
    }
    .total-box {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 14px;
      margin: 16px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .total-box .total-label {
      font-size: 13px;
      font-weight: 800;
      color: #0F172A;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .total-box .total-amount {
      font-size: 24px;
      font-weight: 900;
      color: #059669;
    }
    .status-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 800;
      background: #ECFDF5;
      color: #059669;
    }
    .footer {
      text-align: center;
      font-size: 11px;
      color: #64748B;
      border-top: 1px solid #E2E8F0;
      padding-top: 14px;
      margin-top: 18px;
      line-height: 1.5;
    }
    .footer .subtle {
      font-size: 9px;
      color: #94A3B8;
      margin-top: 4px;
    }
    @media print {
      body {
        padding: 0;
        background: transparent;
      }
      .receipt-card {
        border: none;
        box-shadow: none;
        padding: 0;
        max-width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="receipt-card">
    <div class="header">
      ${logoMarkup}
      <h1 class="gym-name">${gymName}</h1>
      <div class="gym-meta">${gymAddress}</div>
      <div class="gym-meta">${gymPhone ? `Phone: ${gymPhone}` : ""}${gymPhone && gymGst ? " • " : ""}${gymGst ? `GSTIN: ${gymGst}` : ""}</div>
    </div>

    <div class="title-banner">PAYMENT RECEIPT</div>

    <div class="row">
      <span class="label">Receipt Number:</span>
      <span class="value" style="font-family: monospace;">${receiptNumber}</span>
    </div>
    ${transactionId ? `
    <div class="row">
      <span class="label">Transaction ID:</span>
      <span class="value" style="font-family: monospace; font-size: 11px;">${transactionId}</span>
    </div>` : ""}
    <div class="row">
      <span class="label">Payment Date:</span>
      <span class="value">${paymentDate}</span>
    </div>
    ${createdAt ? `
    <div class="row">
      <span class="label">Created At:</span>
      <span class="value" style="color: #64748B; font-weight: 600;">${createdAt}</span>
    </div>` : ""}

    <div class="divider"></div>

    <div class="section-title">Member Details</div>
    <div class="row">
      <span class="label">Member Name:</span>
      <span class="value">${member.name}</span>
    </div>
    <div class="row">
      <span class="label">Member ID:</span>
      <span class="value" style="font-family: monospace;">${member.memberId}</span>
    </div>
    ${member.phone ? `
    <div class="row">
      <span class="label">Phone:</span>
      <span class="value">${member.phone}</span>
    </div>` : ""}

    <div class="divider"></div>

    <div class="section-title">Membership Details</div>
    <div class="row">
      <span class="label">Membership Plan:</span>
      <span class="value">${membership.planName}</span>
    </div>
    ${membership.period ? `
    <div class="row">
      <span class="label">Duration:</span>
      <span class="value">${membership.period}</span>
    </div>` : ""}
    <div class="row">
      <span class="label">Payment Method:</span>
      <span class="value">${paymentMethod}</span>
    </div>
    <div class="row">
      <span class="label">Payment Status:</span>
      <span class="value"><span class="status-badge">${paymentStatus}</span></span>
    </div>
    ${notes ? `
    <div class="row" style="align-items: flex-start;">
      <span class="label">Notes:</span>
      <span class="value" style="max-width: 60%;">${notes}</span>
    </div>` : ""}

    <div class="divider"></div>

    <div class="section-title">Financial Breakdown</div>
    <div class="row">
      <span class="label">Membership Amount:</span>
      <span class="value">${formatMoney(financials.planAmount)}</span>
    </div>
    ${financials.discountAmount ? `
    <div class="row">
      <span class="label">Discount:</span>
      <span class="value" style="color: #DC2626;">-${formatMoney(financials.discountAmount)}</span>
    </div>` : ""}
    ${financials.taxAmount ? `
    <div class="row">
      <span class="label">Tax / GST:</span>
      <span class="value">+${formatMoney(financials.taxAmount)}</span>
    </div>` : ""}

    <div class="total-box">
      <span class="total-label">Amount Paid</span>
      <span class="total-amount">${formatMoney(financials.paidAmount)}</span>
    </div>

    ${financials.remainingAmount && financials.remainingAmount > 0 ? `
    <div class="row">
      <span class="label" style="color: #DC2626; font-weight: 700;">Remaining Dues:</span>
      <span class="value" style="color: #DC2626; font-weight: 800;">${formatMoney(financials.remainingAmount)}</span>
    </div>` : ""}

    <div class="footer">
      <div>Thank you for training with ${gymName}!</div>
      <div class="subtle">Digital receipt issued by ${gymName}</div>
    </div>
  </div>
  ${options.autoPrint !== false ? `<script>
    window.onload = function() { window.print(); };
  </script>` : ""}
</body>
</html>`;
}
