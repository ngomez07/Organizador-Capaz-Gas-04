import { MotionProfile } from './LayerMotionProfile';

export interface LayerTransform {
  /** Horizontal translation in pixels */
  dx: number;
  /** Vertical translation in pixels */
  dy: number;
  /** Rotation in radians */
  rotationRad: number;
  /** Rotation pivot X (visual centroid) */
  pivotX: number;
  /** Rotation pivot Y (visual centroid) */
  pivotY: number;
}

export class HarmonicAnimator {
  /**
   * Evaluates the harmonic functions at time t ∈ [0, 2π).
   * All sinusoids use integer frequencies → f(0) === f(2π) → perfect loop.
   */
  static computeTransform(profile: MotionProfile, t: number): LayerTransform {
    const { ampX, ampY, ampR, freqX, freqY, freqR, phaseX, phaseY, phaseR, centroid } = profile;

    const dx = ampX * Math.sin(freqX * t + phaseX);
    const dy = ampY * Math.sin(freqY * t + phaseY);
    const rotDeg = ampR * Math.sin(freqR * t + phaseR);

    return {
      dx,
      dy,
      rotationRad: (rotDeg * Math.PI) / 180,
      pivotX: centroid.x,
      pivotY: centroid.y,
    };
  }

  /**
   * Returns the 24 output t-values, sampled from 96 internal positions.
   *
   * The 96 internal positions span [0, 2π) uniformly.
   * We pick every 4th one, giving 24 evenly-spaced output frames.
   * t=0 maps to the start of the loop; "frame 24" would be t=2π ≡ t=0.
   */
  static generateFrameTs(internalSamples: number, outputFrames: number): number[] {
    const TWO_PI = 2 * Math.PI;
    const stride = internalSamples / outputFrames;

    return Array.from({ length: outputFrames }, (_, i) => {
      const internalIndex = Math.floor(i * stride);
      return (internalIndex / internalSamples) * TWO_PI;
    });
  }
}
