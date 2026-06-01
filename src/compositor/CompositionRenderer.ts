import { LayerData } from '../loader/LayerLoader';
import { LayerTransform } from '../animation/HarmonicAnimator';

export class CompositionRenderer {
  private readonly width: number;
  private readonly height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  /**
   * Bilinear sample from a raw RGBA buffer.
   * Returns [r, g, b, a] — (0,0,0,0) for out-of-bounds.
   */
  private sample(
    pixels: Buffer,
    w: number,
    h: number,
    sx: number,
    sy: number
  ): [number, number, number, number] {
    const x0 = Math.floor(sx);
    const y0 = Math.floor(sy);
    const xf = sx - x0;
    const yf = sy - y0;

    const get = (x: number, y: number): [number, number, number, number] => {
      if (x < 0 || y < 0 || x >= w || y >= h) return [0, 0, 0, 0];
      const i = (y * w + x) * 4;
      return [pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]];
    };

    const [r00, g00, b00, a00] = get(x0, y0);
    const [r10, g10, b10, a10] = get(x0 + 1, y0);
    const [r01, g01, b01, a01] = get(x0, y0 + 1);
    const [r11, g11, b11, a11] = get(x0 + 1, y0 + 1);

    const blerp = (v00: number, v10: number, v01: number, v11: number): number =>
      Math.max(0, Math.min(255, Math.round(
        (1 - xf) * (1 - yf) * v00 +
        xf       * (1 - yf) * v10 +
        (1 - xf) * yf       * v01 +
        xf       * yf       * v11
      )));

    return [blerp(r00, r10, r01, r11), blerp(g00, g10, g01, g11), blerp(b00, b10, b01, b11), blerp(a00, a10, a01, a11)];
  }

  /**
   * Alpha-composite one transformed layer over the output buffer (Porter-Duff "source over").
   *
   * Inverse transform (output → input):
   *   Given output pixel (ox, oy), find source pixel (sx, sy).
   *
   *   Forward:  dst = pivot + R(θ) · (src - pivot) + (dx, dy)
   *   Inverse:  src = pivot + R(-θ) · (dst - pivot - (dx, dy))
   */
  private compositeLayer(output: Buffer, layer: LayerData, tf: LayerTransform): void {
    const { pixels, width, height } = layer;
    const { dx, dy, rotationRad, pivotX, pivotY } = tf;

    const cosA = Math.cos(rotationRad);
    const sinA = Math.sin(rotationRad);

    for (let oy = 0; oy < this.height; oy++) {
      for (let ox = 0; ox < this.width; ox++) {
        // Offset from pivot in output space (after translation)
        const fx = ox - pivotX - dx;
        const fy = oy - pivotY - dy;

        // Apply inverse rotation to get source coordinate
        const sx = pivotX + cosA * fx + sinA * fy;
        const sy = pivotY - sinA * fx + cosA * fy;

        const [sr, sg, sb, sa] = this.sample(pixels, width, height, sx, sy);
        if (sa === 0) continue;

        const oi = (oy * this.width + ox) * 4;
        const da = output[oi + 3];

        if (da === 0) {
          // Output pixel is fully transparent: just write source
          output[oi]     = sr;
          output[oi + 1] = sg;
          output[oi + 2] = sb;
          output[oi + 3] = sa;
        } else {
          // Porter-Duff "source over"
          const saF = sa / 255;
          const daF = da / 255;
          const outAF = saF + daF * (1 - saF);
          output[oi]     = Math.round((sr * saF + output[oi]     * daF * (1 - saF)) / outAF);
          output[oi + 1] = Math.round((sg * saF + output[oi + 1] * daF * (1 - saF)) / outAF);
          output[oi + 2] = Math.round((sb * saF + output[oi + 2] * daF * (1 - saF)) / outAF);
          output[oi + 3] = Math.round(outAF * 255);
        }
      }
    }
  }

  /**
   * Renders one composite frame. Layers are drawn bottom-to-top (index order preserved).
   */
  renderFrame(layers: LayerData[], transforms: LayerTransform[]): Buffer {
    const output = Buffer.alloc(this.width * this.height * 4, 0);

    for (let i = 0; i < layers.length; i++) {
      this.compositeLayer(output, layers[i], transforms[i]);
    }

    return output;
  }
}
