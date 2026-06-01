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
  console.log('║   Food Layer Animation Generator  v2.0   ║');
  console.log('╚══════════════════════════════════════════╝\n');

  const {
    outputFrames,
    internalSamples,
    inputDir,
    outputDir,
    gifDelayCentisecs,
  } = AnimationConfig;

  const framesDir = path.join(outputDir, 'frames');
  const gifDir    = path.join(outputDir, 'gif');

  // ── 1. Detect layer groups ──────────────────────────────────────────────────
  console.log('① Detecting layer groups...');
  const layerGroups = await LayerLoader.loadLayerGroups(inputDir);
  console.log(`\n   Found ${layerGroups.size} group(s): ${[...layerGroups.keys()].join(', ')}\n`);

  // ── 2. Process each group ───────────────────────────────────────────────────
  const gifPaths: string[] = [];

  for (const [groupName, layers] of layerGroups) {
    const bar = '─'.repeat(42);
    console.log(`\n┌${bar}┐`);
    console.log(`│  Group: ${groupName.padEnd(35)}│`);
    console.log(`└${bar}┘\n`);

    const { width, height } = layers[0];
    console.log(`   Canvas: ${width}×${height}  |  Layers: ${layers.length}\n`);

    // Centroids
    console.log('   Computing centroids...');
    const centroids = layers.map((layer) => {
      const c = VisualCentroidAnalyzer.compute(layer.pixels, layer.width, layer.height);
      console.log(`   [${layer.index}] ${layer.filename}: (${c.x.toFixed(1)}, ${c.y.toFixed(1)})`);
      return c;
    });
    console.log();

    // Motion profiles
    console.log('   Building motion profiles...');
    const profiles = layers.map((layer, i) => {
      const p = LayerMotionProfileFactory.create(i, layers.length, centroids[i]);
      console.log(
        `   [${i}] depthScale=${p.depthScale.toFixed(2)}  ` +
        `ampY=±${p.ampY.toFixed(2)}px  ampX=±${p.ampX.toFixed(2)}px  ampR=±${p.ampR.toFixed(2)}°`
      );
      return p;
    });
    console.log();

    // Loop validation
    LoopValidator.validate(profiles);
    LoopValidator.reportLastFrameGap(profiles, outputFrames);

    // Render frames
    const frameTs = HarmonicAnimator.generateFrameTs(internalSamples, outputFrames);
    console.log(`   Rendering ${outputFrames} frames...`);

    const renderer      = new CompositionRenderer(width, height);
    const framePrefix   = groupName.toLowerCase();
    const renderedFrames: Buffer[] = [];

    for (let f = 0; f < outputFrames; f++) {
      const t          = frameTs[f];
      const transforms = profiles.map((p) => HarmonicAnimator.computeTransform(p, t));
      const pixels     = renderer.renderFrame(layers, transforms);
      renderedFrames.push(pixels);

      await FrameExporter.exportFrame(pixels, width, height, framesDir, f, framePrefix);
      process.stdout.write(`\r   Frame ${String(f + 1).padStart(2)}/${outputFrames}`);
    }
    console.log('\n');

    // Export GIF
    const gifFilename = `${framePrefix}_animado.gif`;
    const gifPath     = path.join(gifDir, gifFilename);
    console.log(`   Encoding GIF → ${gifFilename}`);
    await GifExporter.exportGif(renderedFrames, width, height, gifDelayCentisecs, gifPath);
    console.log(`   ✓ Done\n`);
    gifPaths.push(gifPath);
  }

  // ── Done ────────────────────────────────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║                 Complete!                ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`  Frames : ${framesDir}`);
  for (const p of gifPaths) console.log(`  GIF    : ${p}`);
}

main().catch((err: unknown) => {
  console.error('\n[FATAL]', err instanceof Error ? err.message : err);
  process.exit(1);
});
