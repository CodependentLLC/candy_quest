import {existsSync, readFileSync} from "node:fs";
import {inflateSync} from "node:zlib";
import {validateContent} from "../src/content-validation.js";
import {worlds, levels} from "../src/levels.js";

const root = new URL("../", import.meta.url);
const runtimeFiles = ["assets/backgrounds/candy-world.png", "assets/platforms/candy-platforms.png", "assets/goals/checkpoint-flag.png", "assets/goals/individual/goal.png", "assets/enemies/individual/gummy.png", "assets/enemies/individual/chocolate.png", "assets/enemies/individual/cupcake.png", "assets/collectibles/individual/pink.png", "assets/collectibles/individual/lemon.png", "assets/collectibles/individual/mint.png", "assets/collectibles/individual/star.png", "assets/hazards/individual/spikes.png", "assets/hazards/individual/spring.png"];
for (const state of ["idle", "run", "jumpfall"]) {
  const count = state === "run" ? 6 : 4;
  for (let i = 0; i < count; i++) runtimeFiles.push(`assets/player/frames/${state}-${i}.png`);
}

function pngInfo(relativePath) {
  const buffer = readFileSync(new URL(relativePath, root));
  if (buffer.readUInt32BE(0) !== 0x89504e47) throw new Error(`${relativePath}: not a PNG`);
  const width = buffer.readUInt32BE(16), height = buffer.readUInt32BE(20), colorType = buffer[25];
  const chunks = [];
  let offset = 8;
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset), type = buffer.toString("ascii", offset + 4, offset + 8);
    if (type === "IDAT") chunks.push(buffer.subarray(offset + 8, offset + 8 + length));
    offset += 12 + length;
  }
  if (colorType !== 6) return {width, height, colorType, pixels: null};
  const raw = inflateSync(Buffer.concat(chunks));
  const stride = width * 4, pixels = Buffer.alloc(height * stride), bpp = 4;
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)], start = y * (stride + 1) + 1;
    for (let x = 0; x < stride; x++) {
      const value = raw[start + x], left = x >= bpp ? pixels[y * stride + x - bpp] : 0;
      const above = y ? pixels[(y - 1) * stride + x] : 0;
      const upperLeft = y && x >= bpp ? pixels[(y - 1) * stride + x - bpp] : 0;
      const predictor = filter === 1 ? left : filter === 2 ? above : filter === 3 ? Math.floor((left + above) / 2) : filter === 4 ? paeth(left, above, upperLeft) : 0;
      pixels[y * stride + x] = (value + predictor) & 255;
    }
  }
  return {width, height, colorType, pixels};
}

function paeth(a, b, c) {
  const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

for (const relativePath of runtimeFiles) {
  if (!existsSync(new URL(relativePath, root))) throw new Error(`${relativePath}: missing runtime asset`);
  const info = pngInfo(relativePath);
  if (relativePath.includes("player/frames")) {
    if (info.colorType !== 6 || info.width !== 384 || info.height !== 384) throw new Error(`${relativePath}: expected 384x384 RGBA PNG`);
    const rowBytes = info.width * 4;
    let lowest = -1;
    for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) if (info.pixels[y * rowBytes + x * 4 + 3] > 0) lowest = y;
    if (lowest !== 360) throw new Error(`${relativePath}: expected feet baseline y=360, got ${lowest}`);
  }
}
validateContent(worlds, levels);
console.log(`Validated ${runtimeFiles.length} runtime PNG assets.`);
