import * as fs from 'fs';
import * as path from 'path';
import GIFEncoder from 'gif-encoder-2';

export class GifExporter {
  /**
   * Encodes RGBA frames into an animated GIF.
   *
   * GIF supports only indexed 256-color palettes and single-bit transparency
   * (one palette entry = transparent). For fully transparent pixels we
   * pre-process each frame to replace alpha=0 with a "magic" color
   * (0, 1, 0 — near-black green) that is extremely unlikely to appear in
   * food imagery, then tell the encoder that color index is transparent.
   *
   * PNG frames retain full RGBA transparency and are the lossless reference.
   */
  static async exportGif(
    frames: Buffer[],
    width: number,
    height: number,
    delayCentisecs: number,
    outputPath: string
  ): Promise<void> {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    // Delay in ms for gif-encoder-2
    const delayMs = delayCentisecs * 10;

    const encoder = new GIFEncoder(width, height, 'octree', false, frames.length);
    encoder.setDelay(delayMs);
    encoder.setRepeat(0);
    encoder.setQuality(10);
    encoder.setTransparent(0x000100ff); // magic transparent: r=0, g=1, b=0, a=255

    encoder.start();

    for (const rawRgba of frames) {
      const processed = GifExporter.prepareFramePixels(rawRgba);
      encoder.addFrame(processed);
    }

    encoder.finish();
    const gifBuffer = encoder.out.getData();
    fs.writeFileSync(outputPath, gifBuffer);

    const kb = (gifBuffer.byteLength / 1024).toFixed(1);
    console.log(`  GIF written (${kb} KB): ${outputPath}`);
  }

  /**
   * Replaces fully-transparent pixels with the magic transparent color.
   * Semi-transparent pixels are flattened to fully opaque (GIF limitation).
   */
  private static prepareFramePixels(rgba: Buffer): Uint8ClampedArray {
    const len = rgba.length;
    const out = new Uint8ClampedArray(len);

    for (let i = 0; i < len; i += 4) {
      const alpha = rgba[i + 3];
      if (alpha === 0) {
        out[i]     = 0;   // R = magic transparent color
        out[i + 1] = 1;   // G
        out[i + 2] = 0;   // B
        out[i + 3] = 255;
      } else {
        out[i]     = rgba[i];
        out[i + 1] = rgba[i + 1];
        out[i + 2] = rgba[i + 2];
        out[i + 3] = 255;
      }
    }

    return out;
  }
}
