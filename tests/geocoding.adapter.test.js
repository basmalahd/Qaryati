const { test } = require('node:test');
const assert = require('node:assert/strict');

const { geocodeAddress } = require('../src/adapters/geocoding.adapter');

test('geocodeAddress returns coordinates from the provider', async () => {
  let requestedUrl;

  const fetchImpl = async (url) => {
    requestedUrl = new URL(url);
    return {
      ok: true,
      json: async () => ({ latitude: 32.2211, longitude: 35.2544 }),
    };
  };

  const result = await geocodeAddress('Nablus, Palestine', {
    baseUrl: 'https://geo.example.test/search',
    fetchImpl,
  });

  assert.deepEqual(result, {
    latitude: 32.2211,
    longitude: 35.2544,
  });
  assert.equal(requestedUrl.searchParams.get('q'), 'Nablus, Palestine');
});

test('geocodeAddress rejects an empty address', async () => {
  await assert.rejects(
    geocodeAddress('   ', {
      baseUrl: 'https://geo.example.test/search',
      fetchImpl: async () => {
        throw new Error('Should not be called');
      },
    }),
    { status: 400, message: 'Address is required' }
  );
});

test('geocodeAddress rejects a missing API URL configuration', async () => {
  await assert.rejects(
    geocodeAddress('Nablus, Palestine', {
      baseUrl: '',
      fetchImpl: async () => {
        throw new Error('Should not be called');
      },
    }),
    { status: 503, message: 'Geocoding API URL is not configured' }
  );
});

test('geocodeAddress rejects invalid coordinates from the provider', async () => {
  await assert.rejects(
    geocodeAddress('Nablus, Palestine', {
      baseUrl: 'https://geo.example.test/search',
      fetchImpl: async () => ({
        ok: true,
        json: async () => ({ latitude: 200, longitude: 35 }),
      }),
    }),
    { status: 502, message: 'Geocoding provider returned invalid coordinates' }
  );
});

test('geocodeAddress maps provider HTTP errors to 502', async () => {
  await assert.rejects(
    geocodeAddress('Nablus, Palestine', {
      baseUrl: 'https://geo.example.test/search',
      fetchImpl: async () => ({ ok: false, status: 500 }),
    }),
    { status: 502, message: 'Geocoding provider request failed' }
  );
});
