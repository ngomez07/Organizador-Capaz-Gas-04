declare module 'gif-encoder-2' {
  class GIFEncoder {
    constructor(
      width: number,
      height: number,
      algorithm?: 'neuquant' | 'octree',
      useOptimizer?: boolean,
      totalFrames?: number
    );
    setDelay(delay: number): void;
    setRepeat(repeat: number): void;
    /** Pass an RGBA integer (0xRRGGBBAA) or null to disable */
    setTransparent(color: number | null): void;
    setQuality(quality: number): void;
    setDither(dither: boolean): void;
    start(): void;
    addFrame(imageData: Uint8Array | Uint8ClampedArray | Buffer): void;
    finish(): void;
    out: { getData(): Buffer };
  }
  export = GIFEncoder;
}
