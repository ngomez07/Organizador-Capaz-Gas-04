export const AnimationConfig = {
  /** Final exported frame count */
  outputFrames: 24,
  /** Internal oversampling resolution for smoother pose selection */
  internalSamples: 48,

  /** Max horizontal translation per layer (pixels) */
  maxHorizontalOffset: 4,
  /** Max vertical translation per layer (pixels) */
  maxVerticalOffset: 6,
  /** Max rotation per layer (degrees) */
  maxRotation: 1.5,

  /** Depth scale range: bottom layer → top layer */
  depthScaleMin: 1.0,
  depthScaleMax: 1.45,

  /** GIF frame delay in centiseconds (8 = 80ms ≈ 12fps, 3-second loop at 24 frames) */
  gifDelayCentisecs: 8,

  /** Paths */
  inputDir: 'Capas',
  outputDir: 'output',
} as const;
