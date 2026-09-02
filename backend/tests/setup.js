// Mocks the Prisma client for all tests. Validation-layer tests should
// never need a real database connection — they're testing that bad input
// gets rejected before it would reach Prisma at all. Tests that need to
// verify actual DB behavior should live in a separate integration suite
// run against a real (test) database, not this unit suite.
jest.mock("../src/config/prisma", () => ({
  user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  listing: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn() },
  booking: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
  smsVerification: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
  rating: { upsert: jest.fn(), aggregate: jest.fn(), findMany: jest.fn() },
  savedListing: { upsert: jest.fn(), findUnique: jest.fn(), delete: jest.fn(), findMany: jest.fn() },
  $transaction: jest.fn(),
}));
