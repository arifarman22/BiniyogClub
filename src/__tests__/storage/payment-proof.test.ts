import { describe, it, expect, beforeAll } from "vitest";
import { parseProofUrl, proofViewPath, secureProof } from "@/lib/storage/payment-proof";

beforeAll(() => {
  process.env.CLOUDINARY_CLOUD_NAME = "ourcloud";
});

describe("parseProofUrl", () => {
  it("reads a legacy public image (extension in the name and as format)", () => {
    expect(parseProofUrl("https://res.cloudinary.com/ourcloud/image/upload/v1792318003/payments/proofs/1_shot.png.png"))
      .toEqual({ resourceType: "image", type: "upload", publicId: "payments/proofs/1_shot.png", format: "png" });
  });

  it("reads a private raw file, keeping its extension in the public_id", () => {
    expect(parseProofUrl("https://res.cloudinary.com/ourcloud/raw/authenticated/v1/payments/proofs/r.pdf"))
      .toEqual({ resourceType: "raw", type: "authenticated", publicId: "payments/proofs/r.pdf" });
  });

  it("ignores a signature segment", () => {
    expect(parseProofUrl("https://res.cloudinary.com/ourcloud/image/authenticated/s--abc123--/v1/p/x.jpg")?.publicId).toBe("p/x");
  });

  it("rejects anything that isn't our Cloudinary account", () => {
    expect(parseProofUrl("https://evil.example.com/ourcloud/image/upload/v1/x.png")).toBeNull();
    expect(parseProofUrl("https://res.cloudinary.com/othercloud/image/upload/v1/x.png")).toBeNull();
    expect(parseProofUrl("http://res.cloudinary.com/ourcloud/image/upload/v1/x.png")).toBeNull();
    expect(parseProofUrl("https://res.cloudinary.com/ourcloud/video/upload/v1/x.mp4")).toBeNull();
    expect(parseProofUrl("not a url")).toBeNull();
  });
});

describe("secureProof", () => {
  it("replaces the stored URL with the guarded view path", () => {
    const row = { id: "11111111-1111-1111-1111-111111111111", proofFileUrl: "https://res.cloudinary.com/ourcloud/image/upload/v1/x.png" };
    expect(secureProof("manual", row).proofFileUrl).toBe("/api/payment-proofs/manual/11111111-1111-1111-1111-111111111111");
  });

  it("keeps an empty proof empty (cash payments)", () => {
    expect(proofViewPath("group", "id", "")).toBe("");
  });
});
