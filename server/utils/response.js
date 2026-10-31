const sendSuccess = (res, data, { status = 200, message } = {}) => {
  const body = { success: true, data };
  if (message) body.message = message;
  return res.status(status).json(body);
};

const sendList = (res, data, { page, limit, total }) =>
  res.json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    },
  });

/** Parses page/limit query params with a hard maximum. */
const parsePagination = (query, { defaultLimit = 12, maxLimit = 60 } = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(
    maxLimit,
    Math.max(1, parseInt(query.limit, 10) || defaultLimit),
  );
  return { page, limit, skip: (page - 1) * limit };
};

module.exports = { sendSuccess, sendList, parsePagination };
