import { AnimationConfig } from '../config/AnimationConfig';
import { Centroid } from '../analysis/VisualCentroid';

export interface MotionProfile {
  layerIndex: number;
  centroid: Centroid;
  /** Multiplier applied to all amplitudes; increases toward top layers */
  depthScale: number;
  /** Vertical amplitude (pixels) */
  ampY: number;
  /** Horizontal amplitude (pixels) */
  ampX: number;
  /** Rotation amplitude (degrees) */
  ampR: number;
  /** Integer frequency multipliers — must be integers for perfect loop */
  freqY: number;
  freqX: number;
  freqR: number;
  /** Phase offsets (radians) */
  phaseY: number;
  phaseX: number;
  phaseR: number;
}

/**
 * Builds a unique harmonic motion profile for each layer.
 *
 * Depth scale grows from bottom (1.0) to top (1.45) so upper
 * layers feel lighter and more airborne.
 *
 * Each axis gets a different integer frequency so movements are
 * never perfectly synchronised, producing organic figure-eight
 * trajectories. All frequencies are integers → perfect loop at t=2π.
 */
export class LayerMotionProfileFactory {
  static create(
    layerIndex: number,
    totalLayers: number,
    centroid: Centroid
  ): MotionProfile {
    const {
      depthScaleMin,
      depthScaleMax,
      maxVerticalOffset,
      maxHorizontalOffset,
      maxRotation,
    } = AnimationConfig;

    const t = totalLayers > 1 ? layerIndex / (totalLayers - 1) : 0;
    const depthScale = depthScaleMin + t * (depthScaleMax - depthScaleMin);

    // Distribute phases evenly around the circle so layers never peak simultaneously
    const phaseBase = (layerIndex * 2 * Math.PI) / totalLayers;

    return {
      layerIndex,
      centroid,
      depthScale,
      ampY: maxVerticalOffset * depthScale,
      ampX: maxHorizontalOffset * depthScale,
      ampR: maxRotation * depthScale,
      // Integer frequencies: each axis on a different harmonic
      freqY: 1,
      freqX: 2,
      freqR: 3,
      // Stagger phases per axis so X/Y/R are never in sync
      phaseY: phaseBase,
      phaseX: phaseBase + Math.PI / 3,
      phaseR: phaseBase + Math.PI / 5,
    };
  }
}
