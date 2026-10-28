const DEFAULT_TIMEOUT_MS = 5000;

const geocodeAddress = async (
  address,
  {
    baseUrl = process.env.GEOCODING_API_URL,
    apiKey = process.env.GEOCODING_API_KEY,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    fetchImpl = globalThis.fetch,
  } = {}
) => {
  if (typeof address !== 'string' || !address.trim()) {
    const error = new Error('Address is required');
    error.status = 400;
    throw error;
  }

  if (!baseUrl) {
    const error = new Error('Geocoding API URL is not configured');
    error.status = 503;
    throw error;
  }

  let endpoint;

  try {
    endpoint = new URL(baseUrl);
  } catch {
    const error = new Error('Geocoding API URL is invalid');
    error.status = 500;
    throw error;
  }

  if (!['http:', 'https:'].includes(endpoint.protocol)) {
    const error = new Error('Geocoding API URL must use HTTP or HTTPS');
    error.status = 500;
    throw error;
  }

  if (typeof fetchImpl !== 'function') {
    const error = new Error('Fetch implementation is unavailable');
    error.status = 500;
    throw error;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    endpoint.searchParams.set('q', address.trim());

    const headers = { Accept: 'application/json' };
    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }

    const response = await fetchImpl(endpoint, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = new Error('Geocoding provider request failed');
      error.status = 502;
      throw error;
    }

    let data;

    try {
      data = await response.json();
    } catch {
      const error = new Error('Geocoding provider returned invalid JSON');
      error.status = 502;
      throw error;
    }

    if (
      !data ||
      typeof data.latitude !== 'number' ||
      typeof data.longitude !== 'number' ||
      !Number.isFinite(data.latitude) ||
      !Number.isFinite(data.longitude) ||
      data.latitude < -90 ||
      data.latitude > 90 ||
      data.longitude < -180 ||
      data.longitude > 180
    ) {
      const error = new Error('Geocoding provider returned invalid coordinates');
      error.status = 502;
      throw error;
    }

    return {
      latitude: data.latitude,
      longitude: data.longitude,
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Geocoding provider request timed out');
      timeoutError.status = 504;
      throw timeoutError;
    }

    if (error.status) {
      throw error;
    }

    const networkError = new Error('Unable to reach geocoding provider');
    networkError.status = 502;
    throw networkError;
  } finally {
    clearTimeout(timeout);
  }
};

module.exports = { geocodeAddress };
