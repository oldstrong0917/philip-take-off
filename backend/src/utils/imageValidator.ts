import sharp from "sharp";
import dotenv from "dotenv";

dotenv.config();

const MIN_WIDTH = parseInt(process.env.PHOTO_MIN_WIDTH || "800");
const MIN_HEIGHT = parseInt(process.env.PHOTO_MIN_HEIGHT || "600");
const MAX_WIDTH = parseInt(process.env.PHOTO_MAX_WIDTH || "4096");
const MAX_HEIGHT = parseInt(process.env.PHOTO_MAX_HEIGHT || "4096");

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

  if (width < MIN_WIDTH || height < MIN_HEIGHT) {
    throw new Error(
      `圖片尺寸過小。最小要求：${MIN_WIDTH}x${MIN_HEIGHT}px，您的圖片：${width}x${height}px`
    );
  }

  if (width > MAX_WIDTH || height > MAX_HEIGHT) {
    throw new Error(
      `圖片尺寸過大。最大限制：${MAX_WIDTH}x${MAX_HEIGHT}px，您的圖片：${width}x${height}px`
    );
  }

  return { width, height };
}
