import { PNG } from "pngjs";

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

function parseHex(hex) {
  if (!HEX_PATTERN.test(hex)) {
    throw new Error(`Invalid hex color: "${hex}" (expected "#RRGGBB")`);
  }
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

function setPixel(png, size, x, y, color) {
  const idx = (size * y + x) << 2;
  png.data[idx] = color.r;
  png.data[idx + 1] = color.g;
  png.data[idx + 2] = color.b;
  png.data[idx + 3] = 255;
}

export function pngFromSolidColor(hex, size = 16) {
  const color = parseHex(hex);
  const png = new PNG({ width: size, height: size });
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      setPixel(png, size, x, y, color);
    }
  }
  return PNG.sync.write(png);
}

export function pngFromTwoTone(hexA, hexB, size = 16) {
  const colorA = parseHex(hexA);
  const colorB = parseHex(hexB);
  const png = new PNG({ width: size, height: size });
  for (let y = 0; y < size; y++) {
    const color = y % 2 === 0 ? colorA : colorB;
    for (let x = 0; x < size; x++) {
      setPixel(png, size, x, y, color);
    }
  }
  return PNG.sync.write(png);
}
