import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

export interface LayerData {
  index: number;
  filename: string;
  width: number;
  height: number;
  /** Raw RGBA pixels, row-major, 4 bytes per pixel (R G B A) */
  pixels: Buffer;
}

export class LayerLoader {
  static async loadLayers(dir: string): Promise<LayerData[]> {
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.toLowerCase().endsWith('.png') && !f.startsWith('.'))
      .sort();

    if (files.length === 0) {
      throw new Error(`No PNG files found in directory: ${dir}`);
    }

    console.log(`Found ${files.length} layer(s): ${files.join(', ')}`);

    const layers: LayerData[] = [];

    for (let i = 0; i < files.length; i++) {
      const filename = files[i];
      const filepath = path.join(dir, filename);

      const { data, info } = await sharp(filepath)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      layers.push({
        index: i,
        filename,
        width: info.width,
        height: info.height,
        pixels: data,
      });

      console.log(`  [${i}] ${filename} — ${info.width}×${info.height}`);
    }

    // Validate all layers share the same canvas
    const { width, height } = layers[0];
    for (const layer of layers) {
      if (layer.width !== width || layer.height !== height) {
        throw new Error(
          `Canvas mismatch: ${layer.filename} is ${layer.width}×${layer.height}, expected ${width}×${height}`
        );
      }
    }

    return layers;
  }
}
