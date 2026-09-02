const buildCorsOptions = require("../src/config/cors");

describe("CORS origin restriction", () => {
  const originalEnv = process.env.ALLOWED_ORIGINS;

  afterEach(() => {
    process.env.ALLOWED_ORIGINS = originalEnv;
  });

  it("allows a request from an origin in the allowlist", (done) => {
    process.env.ALLOWED_ORIGINS = "https://rooma.elpi.dev,https://app.rooma.com";
    const options = buildCorsOptions();

    options.origin("https://rooma.elpi.dev", (err, allowed) => {
      expect(err).toBeNull();
      expect(allowed).toBe(true);
      done();
    });
  });

  it("rejects a request from an origin not in the allowlist", (done) => {
    process.env.ALLOWED_ORIGINS = "https://rooma.elpi.dev";
    const options = buildCorsOptions();

    options.origin("https://evil-site.com", (err) => {
      expect(err).toBeInstanceOf(Error);
      done();
    });
  });

  it("allows requests with no origin header (curl, server-to-server, mobile apps)", (done) => {
    process.env.ALLOWED_ORIGINS = "https://rooma.elpi.dev";
    const options = buildCorsOptions();

    options.origin(undefined, (err, allowed) => {
      expect(err).toBeNull();
      expect(allowed).toBe(true);
      done();
    });
  });
});
