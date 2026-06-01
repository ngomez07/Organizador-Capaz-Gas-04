export interface Centroid {
  x: number;
  y: number;
}

/**
 * Computes the alpha-weighted visual centroid of a layer.
 * Uses only visible pixels (alpha > 0) as mass points.
 * Falls back to geometric center if the layer is fully transparent.
 */
export class VisualCentroidAnalyzer {
  static compute(pixels: Buffer, width: number, height: number): Centroid {
    let sumX = 0;
    let sumY = 0;
    let totalWeight = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const alpha = pixels[(y * width + x) * 4 + 3];
        if (alpha > 0) {
          sumX += x * alpha;
          sumY += y * alpha;
          totalWeight += alpha;
        }
      }
    }

    if (totalWeight === 0) {
      return { x: width / 2, y: height / 2 };
    }

    return {
      x: sumX / totalWeight,
      y: sumY / totalWeight,
    };
  }
}
