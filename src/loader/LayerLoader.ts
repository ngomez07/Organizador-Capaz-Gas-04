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
  /** Groups all PNGs in `dir` by the prefix before `_CAPA_NN.png` and loads each group. */
  static async loadLayerGroups(dir: string): Promise<Map<string, LayerData[]>> {
    const allFiles = fs
      .readdirSync(dir)
      .filter((f) => f.toLowerCase().endsWith('.png') && !f.startsWith('.'))
      .sort();

    const groupMap = new Map<string, string[]>();
    for (const file of allFiles) {
      const match = file.match(/^(.+)_CAPA_\d+\.png$/i);
      if (!match) continue;
      const group = match[1];
      if (!groupMap.has(group)) groupMap.set(group, []);
      groupMap.get(group)!.push(file);
    }

    if (groupMap.size === 0) {
      throw new Error(
        `No grouped layers found in "${dir}". Files must match the pattern NAME_CAPA_NN.png`
      );
    }

    const result = new Map<string, LayerData[]>();
    for (const [groupName, files] of groupMap) {
      result.set(groupName, await LayerLoader.loadFiles(dir, files));
    }
    return result;
  }

  private static async loadFiles(dir: string, files: string[]): Promise<LayerData[]> {
    const layers: LayerData[] = [];

    for (let i = 0; i < files.length; i++) {
      const filename = files[i];
      const filepath = path.join(dir, filename);

      const { data, info } = await sharp(filepath)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      layers.push({ index: i, filename, width: info.width, height: info.height, pixels: data });
      console.log(`   [${i}] ${filename} — ${info.width}×${info.height}`);
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
