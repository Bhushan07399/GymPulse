const { pool } = require('../db/pool');

const createBmiAssessment = async (gymId, data) => {
  const query = `
    INSERT INTO member_bmi_assessments (
      gym_id, member_id, assessment_type, price, paid_amount, remaining_amount,
      payment_method, payment_status, appointment_date, appointment_time,
      status, height, weight, bmi_score, report_url, notes, created_at, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
    RETURNING *
  `;
  const price = Number(data.price || 0);
  const paid = Number(data.paidAmount || data.paid_amount || (data.assessmentType === 'FREE' ? 0 : price));
  const remaining = Math.max(0, price - paid);
  const paymentStatus = data.assessmentType === 'FREE' ? 'Free' : remaining === 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid';

  const result = await pool.query(query, [
    gymId,
    data.memberId || data.member_id,
    data.assessmentType || data.assessment_type || 'FREE',
    price,
    paid,
    remaining,
    data.paymentMethod || data.payment_method || 'Cash',
    paymentStatus,
    data.appointmentDate || data.appointment_date,
    data.appointmentTime || data.appointment_time || null,
    data.status || 'Scheduled',
    data.height || null,
    data.weight || null,
    data.bmiScore || data.bmi_score || null,
    data.reportUrl || data.report_url || null,
    data.notes || null
  ]);
  return result.rows[0];
};

const updateBmiAssessment = async (gymId, id, data) => {
  let height = data.height !== undefined ? data.height : null;
  let weight = data.weight !== undefined ? data.weight : null;
  let bmiScore = data.bmiScore || data.bmi_score || null;

  if (height && weight && !bmiScore) {
    const heightInMeters = Number(height) / 100;
    if (heightInMeters > 0) {
      bmiScore = (Number(weight) / (heightInMeters * heightInMeters)).toFixed(2);
    }
  }

  const query = `
    UPDATE member_bmi_assessments SET
      status = COALESCE($3, status),
      height = COALESCE($4, height),
      weight = COALESCE($5, weight),
      bmi_score = COALESCE($6, bmi_score),
      report_url = COALESCE($7, report_url),
      notes = COALESCE($8, notes),
      appointment_date = COALESCE($9, appointment_date),
      appointment_time = COALESCE($10, appointment_time),
      updated_at = NOW()
    WHERE gym_id = $1 AND id = $2
    RETURNING *
  `;
  const result = await pool.query(query, [
    gymId,
    id,
    data.status || null,
    height,
    weight,
    bmiScore,
    data.reportUrl || data.report_url || null,
    data.notes || null,
    data.appointmentDate || data.appointment_date || null,
    data.appointmentTime || data.appointment_time || null
  ]);
  return result.rows[0];
};

const getBmiAssessmentById = async (gymId, id) => {
  const query = `
    SELECT b.*, m.first_name, m.last_name, m.phone, m.member_id AS member_code
    FROM member_bmi_assessments b
    JOIN members m ON m.id = b.member_id
    WHERE b.gym_id = $1 AND b.id = $2
  `;
  const result = await pool.query(query, [gymId, id]);
  return result.rows[0] || null;
};

const listBmiAssessmentsByMember = async (gymId, memberId) => {
  const query = `
    SELECT b.*, m.first_name, m.last_name, m.phone, m.member_id AS member_code
    FROM member_bmi_assessments b
    JOIN members m ON m.id = b.member_id
    WHERE b.gym_id = $1 AND b.member_id = $2
    ORDER BY b.appointment_date DESC, b.created_at DESC
  `;
  const result = await pool.query(query, [gymId, memberId]);
  return result.rows;
};

const listBmiAssessments = async (gymId, { date = null, status = null, limit = 50 } = {}) => {
  let query = `
    SELECT b.*, m.first_name, m.last_name, m.phone, m.member_id AS member_code
    FROM member_bmi_assessments b
    JOIN members m ON m.id = b.member_id
    WHERE b.gym_id = $1
  `;
  const params = [gymId];

  if (date) {
    query += ` AND b.appointment_date = $${params.length + 1}`;
    params.push(date);
  }
  if (status) {
    query += ` AND b.status = $${params.length + 1}`;
    params.push(status);
  }

  query += ` ORDER BY b.appointment_date DESC, b.created_at DESC LIMIT $${params.length + 1}`;
  params.push(limit);

  const result = await pool.query(query, params);
  return result.rows;
};

const deleteBmiAssessment = async (gymId, id) => {
  const query = `DELETE FROM member_bmi_assessments WHERE gym_id = $1 AND id = $2 RETURNING *`;
  const result = await pool.query(query, [gymId, id]);
  return result.rows[0];
};

module.exports = {
  createBmiAssessment,
  updateBmiAssessment,
  getBmiAssessmentById,
  listBmiAssessmentsByMember,
  listBmiAssessments,
  deleteBmiAssessment
};
