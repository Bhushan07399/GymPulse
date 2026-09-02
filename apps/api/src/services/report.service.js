const reportRepository = require('../repositories/report.repository');

const getReport = async (gymId, query) => {
  const [summary, result] = await Promise.all([
    reportRepository.getSummary(gymId, query),
    query.type === 'payment' || query.type === 'revenue'
      ? reportRepository.listPayments(gymId, query)
      : query.type === 'attendance'
        ? reportRepository.listAttendance(gymId, query)
        : reportRepository.listMembers(gymId, query)
  ]);
  return { summary, ...result };
};

const getExportReport = async (gymId, query) => {
  const exportQuery = { ...query, page: 1, limit: 5000 };
  const [summary, result] = await Promise.all([
    reportRepository.getSummary(gymId, exportQuery),
    exportQuery.type === 'payment' || exportQuery.type === 'revenue'
      ? reportRepository.listPayments(gymId, exportQuery)
      : exportQuery.type === 'attendance'
        ? reportRepository.listAttendance(gymId, exportQuery)
        : reportRepository.listMembers(gymId, exportQuery)
  ]);
  return { summary, rows: result.items, total: result.total };
};

module.exports = { getReport, getExportReport };
