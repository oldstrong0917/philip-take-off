import { validateImageDimensions } from "../utils/imageValidator";
import sharp from "sharp";

describe("Image validator", () => {
  test("accepts image within valid dimensions", async () => {
    const buffer = await sharp({
      create: {
        width: 1024,
        height: 768,
        channels: 3,
        background: { r: 128, g: 128, b: 128 },
      },
    })
      .jpeg()
      .toBuffer();

    const result = await validateImageDimensions(buffer);
    expect(result.width).toBe(1024);
    expect(result.height).toBe(768);
  });

  test("rejects image that is too small", async () => {
    const buffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 128, g: 128, b: 128 },
      },
    })
      .jpeg()
      .toBuffer();

    await expect(validateImageDimensions(buffer)).rejects.toThrow(
      "圖片尺寸過小"
    );
  });

  test("rejects image that is too large", async () => {
    const buffer = await sharp({
      create: {
        width: 5000,
        height: 5000,
        channels: 3,
        background: { r: 128, g: 128, b: 128 },
      },
    })
      .jpeg()
      .toBuffer();

    await expect(validateImageDimensions(buffer)).rejects.toThrow(
      "圖片尺寸過大"
    );
  });
});
