import fs from 'node:fs';
import path from 'node:path';

const scenePath = path.resolve('examples/scene-spec.park-rain.sample.json');
const layoutPath = path.resolve('examples/layout-plan.park-rain.sample.json');

const scene = JSON.parse(fs.readFileSync(scenePath, 'utf8'));
const layout = JSON.parse(fs.readFileSync(layoutPath, 'utf8'));

const errors = [];

if (!scene.sceneId) errors.push('sceneId missing');
if (!Array.isArray(scene.zones) || scene.zones.length === 0) errors.push('zones missing');
if (!Array.isArray(layout.pathSegments) || layout.pathSegments.length === 0) errors.push('pathSegments missing');
if (!layout.navigation?.spawnCandidates?.length) errors.push('spawnCandidates missing');

if (errors.length > 0) {
  console.error('Validation failed');
  for (const err of errors) console.error('-', err);
  process.exit(1);
}

console.log('Validation passed');
