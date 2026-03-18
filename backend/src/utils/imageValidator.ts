import sharp from "sharp";

export interface ImageDimensions {
  width: number;
  height: number;
}

export async function validateImageDimensions(
  buffer: Buffer
): Promise<ImageDimensions> {
  const metadata = await sharp(buffer).metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;

  if (width <= 0 || height <= 0) {
    throw new Error("無法讀取圖片尺寸，請更換檔案後再試");
  }

  return { width, height };
}
