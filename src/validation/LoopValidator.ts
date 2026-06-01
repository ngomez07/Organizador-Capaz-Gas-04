import { MotionProfile } from '../animation/LayerMotionProfile';
import { HarmonicAnimator, LayerTransform } from '../animation/HarmonicAnimator';

const TWO_PI = 2 * Math.PI;

function maxDiff(a: LayerTransform, b: LayerTransform): number {
  return Math.max(
    Math.abs(a.dx - b.dx),
    Math.abs(a.dy - b.dy),
    Math.abs(a.rotationRad - b.rotationRad) * (180 / Math.PI)
  );
}

/**
 * Verifies that the animation forms a seamless loop.
 *
 * The loop closes because all sinusoids have integer frequencies:
 *   f(t + 2π) = f(t)  ∀ integer freq
 *
 * We confirm this numerically: transform at t=0 must equal transform
 * at t=2π within floating-point precision.
 */
export class LoopValidator {
  static validate(profiles: MotionProfile[]): void {
    console.log('  Checking loop continuity (t=0 vs t=2π)...');

    let passed = true;

    for (const profile of profiles) {
      const tfStart = HarmonicAnimator.computeTransform(profile, 0);
      const tfEnd   = HarmonicAnimator.computeTransform(profile, TWO_PI);
      const diff    = maxDiff(tfStart, tfEnd);

      const status = diff < 1e-9 ? '✓' : '✗';
      console.log(
        `  ${status} Layer ${profile.layerIndex}: max Δ = ${diff.toExponential(2)}`
      );

      if (diff >= 1e-9) passed = false;
    }

    if (!passed) {
      throw new Error('Loop validation failed: first and last frames do not match.');
    }

    console.log('  Loop is mathematically perfect.\n');
  }

  /**
   * Verifies the gap between the last output frame and the implicit "frame 24" (≡ frame 0).
   * With 24 evenly-spaced frames in [0, 2π), frame 23 is at t = 23/24 * 2π.
   * The next frame would be at t = 24/24 * 2π = 2π ≡ 0 → same as frame 0.
   * So the gap is: transform(t=23/24*2π) back to transform(t=0) at 1/24 of a cycle.
   */
  static reportLastFrameGap(profiles: MotionProfile[], outputFrames: number): void {
    const tLast = ((outputFrames - 1) / outputFrames) * TWO_PI;
    console.log('  Last-frame gap (visual continuity):');

    for (const profile of profiles) {
      const tfFirst = HarmonicAnimator.computeTransform(profile, 0);
      const tfLast  = HarmonicAnimator.computeTransform(profile, tLast);
      const diff    = maxDiff(tfFirst, tfLast);
      console.log(
        `    Layer ${profile.layerIndex}: |frame_23 → frame_0| gap = ${diff.toFixed(4)}`
      );
    }

    console.log();
  }
}
