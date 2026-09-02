const reportService = require('../services/report.service');
const { buildPagination } = require('../utils/pagination');

const summary = (value) => ({
  totalMembers: value.total_members,
  activeMembers: value.active_members,
  expiredMembers: value.expired_members,
  renewalsDue: value.renewals_due,
  totalRevenue: Number(value.total_revenue),
  monthRevenue: Number(value.month_revenue)
});

const list = async (request, response) => {
  const report = await reportService.getReport(request.user.gymId, request.validated.query);
  response.status(200).json({
    success: true,
    data: { summary: summary(report.summary), rows: report.items },
    pagination: buildPagination({ ...request.validated.query, total: report.total })
  });
};

const exportData = async (request, response) => {
  const report = await reportService.getExportReport(request.user.gymId, request.validated.query);
  const type = request.validated.query.type || 'member';

  if (request.query.format === 'csv') {
    const rows = report.rows;
    let csvHeader = '';
    let csvRows = [];

    if (type === 'payment' || type === 'revenue') {
      csvHeader = 'Payment ID,Member ID,First Name,Last Name,Phone,Plan Name,Payment Date,Payment Method,Payment Status,Total Amount (INR)';
      csvRows = rows.map((r) =>
        `"${r.id}","${r.member_id}","${r.first_name}","${r.last_name}","${r.phone}","${r.plan_name || ''}","${r.payment_date || ''}","${r.payment_method || ''}","${r.payment_status || ''}","${r.total_amount || 0}"`
      );
    } else if (type === 'attendance') {
      csvHeader = 'Attendance ID,Member ID,First Name,Last Name,Phone,Plan Name,Attendance Date,Check In Time,Check Out Time,Method';
      csvRows = rows.map((r) =>
        `"${r.id}","${r.member_id}","${r.first_name}","${r.last_name}","${r.phone}","${r.plan_name || ''}","${r.attendance_date || ''}","${r.check_in_time || ''}","${r.check_out_time || ''}","${r.attendance_method || ''}"`
      );
    } else {
      csvHeader = 'Member ID,First Name,Last Name,Phone,Plan Name,Join Date,Expiry Date,Is Active,Total Paid (INR),Last Payment Date';
      csvRows = rows.map((r) =>
        `"${r.member_id}","${r.first_name}","${r.last_name}","${r.phone}","${r.plan_name || ''}","${r.join_date || ''}","${r.expiry_date || ''}","${r.is_active ? 'Active' : 'Inactive'}","${r.total_paid || 0}","${r.last_payment_date || ''}"`
      );
    }

    const csvContent = [csvHeader, ...csvRows].join('\n');

    response.setHeader('Content-Type', 'text/csv');
    response.setHeader('Content-Disposition', `attachment; filename="GymPulse_${type}_report.csv"`);
    return response.status(200).send(csvContent);
  }

  response.status(200).json({
    success: true,
    data: {
      summary: summary(report.summary),
      rows: report.rows,
      total: report.total
    }
  });
};

module.exports = { list, exportData };
