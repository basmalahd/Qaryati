const sourceRepository = require('../repositories/source.repository');

const getSources = async ({
  status,
  limit = 20,
  offset = 0,
} = {}) => {
  const parsedLimit = Number(limit);
  const parsedOffset = Number(offset);

  if (
    !Number.isInteger(parsedLimit) ||
    parsedLimit < 1 ||
    parsedLimit > 100
  ) {
    const error = new Error('Limit must be an integer between 1 and 100');
    error.status = 400;
    throw error;
  }

  if (!Number.isInteger(parsedOffset) || parsedOffset < 0) {
    const error = new Error('Offset must be a non-negative integer');
    error.status = 400;
    throw error;
  }

  if (
    status !== undefined &&
    !['ACTIVE', 'ARCHIVED'].includes(status)
  ) {
    const error = new Error('Status must be ACTIVE or ARCHIVED');
    error.status = 400;
    throw error;
  }

  return sourceRepository.findAll({
    status,
    limit: parsedLimit,
    offset: parsedOffset,
  });
};

const getSourceById = async (id) => {
  if (!/^[1-9]\d*$/.test(String(id))) {
    const error = new Error('Source ID must be a positive integer');
    error.status = 400;
    throw error;
  }

  const source = await sourceRepository.findById(id);

  if (!source) {
    const error = new Error('Source not found');
    error.status = 404;
    throw error;
  }

  return source;
};

const createSource = async (data) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    const error = new Error('Source data is required');
    error.status = 400;
    throw error;
  }

  const title = typeof data.title === 'string' ? data.title.trim() : '';

  if (!title || title.length > 255) {
    const error = new Error(
      'Title is required and must not exceed 255 characters'
    );
    error.status = 400;
    throw error;
  }

  const publisher =
    typeof data.publisher === 'string'
      ? data.publisher.trim()
      : data.publisher;

  if (publisher && publisher.length > 200) {
    const error = new Error('Publisher must not exceed 200 characters');
    error.status = 400;
    throw error;
  }

  const url = typeof data.url === 'string' ? data.url.trim() : data.url;

  if (url && url.length > 1000) {
    const error = new Error('URL must not exceed 1000 characters');
    error.status = 400;
    throw error;
  }

  const description =
    typeof data.description === 'string'
      ? data.description.trim()
      : data.description;

  let publicationDate = null;

  if (data.publication_date) {
    publicationDate = new Date(data.publication_date);

    if (Number.isNaN(publicationDate.getTime())) {
      const error = new Error('Publication date must be a valid date');
      error.status = 400;
      throw error;
    }
  }

  return sourceRepository.create({
    title,
    publisher: publisher || null,
    url: url || null,
    description: description || null,
    publication_date: publicationDate,
    status: 'ACTIVE',
  });
};

const changeSourceStatus = async (id, status) => {
  if (!/^[1-9]\d*$/.test(String(id))) {
    const error = new Error('Source ID must be a positive integer');
    error.status = 400;
    throw error;
  }

  if (!['ACTIVE', 'ARCHIVED'].includes(status)) {
    const error = new Error('Status must be ACTIVE or ARCHIVED');
    error.status = 400;
    throw error;
  }

  const source = await sourceRepository.findById(id);

  if (!source) {
    const error = new Error('Source not found');
    error.status = 404;
    throw error;
  }

  return sourceRepository.updateStatus(id, status);
};

module.exports = {
  getSources,
  getSourceById,
  createSource,
  changeSourceStatus,
};


module.exports = {
  getSources,
  getSourceById,
  createSource,
  changeSourceStatus,
};