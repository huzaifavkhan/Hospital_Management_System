const parseId = (id) => {
  const num = Number(id);
  if (!Number.isFinite(num) || !Number.isInteger(num) || num < 1) {
    const err = new Error('Invalid ID: must be a positive integer');
    err.status = 400;
    throw err;
  }
  return num;
};

module.exports = { parseId };
