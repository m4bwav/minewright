// Generates resource_pack/models/entity/watcher.geo.json: a voxel sphere (stacked cubes) about two blocks across,
// an eye bone on its front (-Z, the way Bedrock models face) and an iris bone (iris + pupil) inside the eye.
// Run: npm run geo. Texture layout (128x128 UV units) is documented in ART.md.
import { writeFileSync } from 'node:fs';

const RADIUS = 16; // pixels; 16 px = 1 block, so the sphere is 2 blocks across
const STEP = 2; // voxel size in pixels
const CENTER_Y = 19; // sphere centre above the entity's feet, in pixels (CONFIG.eyeHeight is 1.2 blocks)
const round = (n) => Math.round(n * 100) / 100;

const bodyCubes = [];
for (let y = -RADIUS; y < RADIUS; y += STEP) {
  const yc = y + STEP / 2;
  const ry = Math.sqrt(Math.max(0, RADIUS * RADIUS - yc * yc));
  for (let x = -RADIUS; x < RADIUS; x += STEP) {
    const xc = x + STEP / 2;
    if (Math.abs(xc) > ry) continue;
    const hz = Math.round(Math.sqrt(Math.max(0, ry * ry - xc * xc)));
    if (hz < 1) continue;
    bodyCubes.push({ origin: [x, CENTER_Y + y, -hz], size: [STEP, STEP, hz * 2], uv: [0, 0] });
  }
}

const edge = { uv: [112, 112], uv_size: [16, 16] };
const faces = (north) => ({ north, south: edge, east: edge, west: edge, up: edge, down: edge });
const front = -RADIUS; // z of the sphere's front surface

const geo = {
  format_version: '1.21.0',
  'minecraft:geometry': [
    {
      description: {
        identifier: 'geometry.given_jar.watcher',
        texture_width: 128,
        texture_height: 128,
        visible_bounds_width: 3,
        visible_bounds_height: 3.5,
        visible_bounds_offset: [0, 1.25, 0],
      },
      bones: [
        { name: 'root', pivot: [0, CENTER_Y, 0] },
        { name: 'body', parent: 'root', pivot: [0, CENTER_Y, 0], cubes: bodyCubes },
        {
          name: 'eye',
          parent: 'root',
          pivot: [0, CENTER_Y, front],
          cubes: [
            {
              origin: [-7, CENTER_Y - 7, round(front - 1.5)],
              size: [14, 14, 2],
              uv: faces({ uv: [0, 64], uv_size: [64, 64] }),
            },
          ],
        },
        {
          name: 'iris',
          parent: 'eye',
          pivot: [0, CENTER_Y, front - 1.5],
          cubes: [
            {
              // Iris and pupil: a 9x9 cut-out of the same eye photo, so a small offset makes the eye look around.
              origin: [-4.5, CENTER_Y - 4.5, round(front - 2)],
              size: [9, 9, 0.5],
              uv: faces({ uv: [64, 64], uv_size: [32, 32] }),
            },
          ],
        },
      ],
    },
  ],
};

const out = new URL('../resource_pack/models/entity/watcher.geo.json', import.meta.url);
writeFileSync(out, JSON.stringify(geo, null, 1) + '\n');
console.log(`watcher.geo.json: ${bodyCubes.length} body cubes`);
