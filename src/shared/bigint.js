'use strict';

// PostgreSQL BIGINT ids come back from Prisma as JavaScript BigInt, which
// JSON.stringify cannot serialise (it throws, which surfaced as HTTP 500).
// Serialise them as strings so no response can crash on an id.
if (!BigInt.prototype.toJSON) {
  Object.defineProperty(BigInt.prototype, 'toJSON', {
    value() { return this.toString(); },
    configurable: true,
    writable: true,
  });
}
