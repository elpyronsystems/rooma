const { fromBuffer: fileTypeFromBuffer } = require("file-type");

// A real PNG signature followed by enough bytes for file-type's parser to
// read the first chunk header without hitting end-of-stream. We don't need
// a fully valid image — just enough real structure to be identified.
const REAL_PNG_HEADER = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(24, 0),
]);
const FAKE_TEXT_DISGUISED_AS_IMAGE = Buffer.from("this is just plain text pretending to be a jpg");

describe("file-type detection (protects against MIME spoofing)", () => {
  it("correctly identifies a real PNG from its magic bytes", async () => {
    const result = await fileTypeFromBuffer(REAL_PNG_HEADER);
    expect(result.mime).toBe("image/png");
  });

  it("fails to detect a type for plain text, even if a client claims it's an image", async () => {
    const result = await fileTypeFromBuffer(FAKE_TEXT_DISGUISED_AS_IMAGE);
    // file-type returns undefined when it can't identify real magic bytes —
    // this is exactly the case our media controller rejects, regardless of
    // whatever Content-Type header the uploading client sent.
    expect(result).toBeUndefined();
  });
});
