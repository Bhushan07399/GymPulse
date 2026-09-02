const getHealth = (_request, response) => {
  response.status(200).json({
    status: 'ok',
    service: 'GymPulse API'
  });
};

module.exports = { getHealth };
