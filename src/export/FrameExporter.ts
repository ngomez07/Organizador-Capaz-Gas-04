import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

export class FrameExporter {
  static async exportFrame(
    pixels: Buffer,
    width: number,
    height: number,
    outputDir: string,
    frameIndex: number
  ): Promise<string> {
    fs.mkdirSync(outputDir, { recursive: true });

    const filename = `frame_${String(frameIndex).padStart(3, '0')}.png`;
    const filepath = path.join(outputDir, filename);

    await sharp(pixels, { raw: { width, height, channels: 4 } })
      .png()
      .toFile(filepath);

    return filepath;
  }
}
