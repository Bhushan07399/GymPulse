const getHealth = (_request, response) => {
  response.status(200).json({
    status: 'ok',
    service: 'obo API'
  });
};

module.exports = { getHealth };
