import * as path from 'path';
import { LayerLoader } from './loader/LayerLoader';
import { VisualCentroidAnalyzer } from './analysis/VisualCentroid';
import { LayerMotionProfileFactory } from './animation/LayerMotionProfile';
import { HarmonicAnimator } from './animation/HarmonicAnimator';
import { CompositionRenderer } from './compositor/CompositionRenderer';
import { FrameExporter } from './export/FrameExporter';
import { GifExporter } from './export/GifExporter';
import { LoopValidator } from './validation/LoopValidator';
import { AnimationConfig } from './config/AnimationConfig';

async function main(): Promise<void> {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   Food Layer Animation Generator  v1.0   ║');
  console.log('╚══════════════════════════════════════════╝\n');

  const {
    outputFrames,
    internalSamples,
    inputDir,
    outputDir,
    gifFilename,
    gifDelayCentisecs,
  } = AnimationConfig;

  // ── 1. Load layers ──────────────────────────────────────────────────────────
  console.log('① Loading layers...');
  const layers = await LayerLoader.loadLayers(inputDir);
  const { width, height } = layers[0];
  console.log(`   Canvas: ${width}×${height}  |  Layers: ${layers.length}\n`);

  // ── 2. Visual centroids ─────────────────────────────────────────────────────
  console.log('② Computing visual centroids...');
  const centroids = layers.map((layer) => {
    const c = VisualCentroidAnalyzer.compute(layer.pixels, layer.width, layer.height);
    console.log(`   [${layer.index}] ${layer.filename}: (${c.x.toFixed(1)}, ${c.y.toFixed(1)})`);
    return c;
  });
  console.log();

  // ── 3. Motion profiles ──────────────────────────────────────────────────────
  console.log('③ Building harmonic motion profiles...');
  const profiles = layers.map((layer, i) => {
    const p = LayerMotionProfileFactory.create(i, layers.length, centroids[i]);
    console.log(
      `   [${i}] depthScale=${p.depthScale.toFixed(2)}  ` +
      `ampY=±${p.ampY.toFixed(2)}px  ampX=±${p.ampX.toFixed(2)}px  ampR=±${p.ampR.toFixed(2)}°`
    );
    return p;
  });
  console.log();

  // ── 4. Loop validation ──────────────────────────────────────────────────────
  console.log('④ Validating loop...');
  LoopValidator.validate(profiles);
  LoopValidator.reportLastFrameGap(profiles, outputFrames);

  // ── 5. Render frames ────────────────────────────────────────────────────────
  const frameTs = HarmonicAnimator.generateFrameTs(internalSamples, outputFrames);
  console.log(
    `⑤ Rendering ${outputFrames} frames` +
    ` (sampled from ${internalSamples} internal poses)...`
  );

  const renderer = new CompositionRenderer(width, height);
  const framesDir = path.join(outputDir, 'frames');
  const renderedFrames: Buffer[] = [];

  for (let f = 0; f < outputFrames; f++) {
    const t = frameTs[f];
    const transforms = profiles.map((p) => HarmonicAnimator.computeTransform(p, t));
    const pixels = renderer.renderFrame(layers, transforms);
    renderedFrames.push(pixels);

    const framePath = await FrameExporter.exportFrame(pixels, width, height, framesDir, f);
    process.stdout.write(
      `\r   Frame ${String(f + 1).padStart(2)}/${outputFrames}  →  ${path.basename(framePath)}`
    );
  }
  console.log('\n');

  // ── 6. Export GIF ───────────────────────────────────────────────────────────
  console.log('⑥ Encoding animated GIF...');
  const gifPath = path.join(outputDir, 'gif', gifFilename);
  await GifExporter.exportGif(renderedFrames, width, height, gifDelayCentisecs, gifPath);

  // ── Done ────────────────────────────────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║                 Complete!                ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`  Frames : ${framesDir}`);
  console.log(`  GIF    : ${gifPath}`);
}

main().catch((err: unknown) => {
  console.error('\n[FATAL]', err instanceof Error ? err.message : err);
  process.exit(1);
});
