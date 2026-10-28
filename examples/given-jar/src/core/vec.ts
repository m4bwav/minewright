export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export function add(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function sub(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function scale(a: Vec3, k: number): Vec3 {
  return { x: a.x * k, y: a.y * k, z: a.z * k };
}

export function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function length(a: Vec3): number {
  return Math.sqrt(dot(a, a));
}

export function distance(a: Vec3, b: Vec3): number {
  return length(sub(a, b));
}

export function normalize(a: Vec3): Vec3 {
  const len = length(a);
  return len === 0 ? { x: 0, y: 0, z: 0 } : scale(a, 1 / len);
}

export function up(a: Vec3, dy: number): Vec3 {
  return { x: a.x, y: a.y + dy, z: a.z };
}

/** Move from `from` toward `to` by at most `step`. Returns the new point and whether `to` was reached. */
export function stepToward(from: Vec3, to: Vec3, step: number): { point: Vec3; arrived: boolean } {
  const d = sub(to, from);
  const len = length(d);
  if (len <= step || len === 0) return { point: { ...to }, arrived: true };
  return { point: add(from, scale(d, step / len)), arrived: false };
}

/** Horizontal unit direction (y = 0). Falls back to +z when the input has no horizontal part. */
export function flatDirection(a: Vec3): Vec3 {
  const flat = normalize({ x: a.x, y: 0, z: a.z });
  return length(flat) === 0 ? { x: 0, y: 0, z: 1 } : flat;
}
