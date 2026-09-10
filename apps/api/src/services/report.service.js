const reportRepository = require('../repositories/report.repository');

const getReport = async (gymId, query) => {
  const isPaymentLike = query.type === 'payment' || query.type === 'revenue' || query.type === 'business';
  const isAttendance = query.type === 'attendance';
  const [summary, result] = await Promise.all([
    reportRepository.getSummary(gymId, query),
    isPaymentLike
      ? reportRepository.listPayments(gymId, query)
      : isAttendance
        ? reportRepository.listAttendance(gymId, query)
        : reportRepository.listMembers(gymId, query)
  ]);
  return { summary, rows: result.items, items: result.items, total: result.total };
};

const getExportReport = async (gymId, query) => {
  const exportQuery = { ...query, page: 1, limit: 5000 };
  const isPaymentLike = exportQuery.type === 'payment' || exportQuery.type === 'revenue' || exportQuery.type === 'business';
  const isAttendance = exportQuery.type === 'attendance';
  const [summary, result] = await Promise.all([
    reportRepository.getSummary(gymId, exportQuery),
    isPaymentLike
      ? reportRepository.listPayments(gymId, exportQuery)
      : isAttendance
        ? reportRepository.listAttendance(gymId, exportQuery)
        : reportRepository.listMembers(gymId, exportQuery)
  ]);
  return { summary, rows: result.items, items: result.items, total: result.total };
};

module.exports = { getReport, getExportReport, getExportData: getExportReport };
