import { CONFIG } from '../config.ts';
import { dot, flatDirection, length, scale, sub, type Vec3 } from './vec.ts';

export interface ZoneConfig {
  deliveryRadius: number;
  pathBoxLength: number;
  pathBoxHalfWidth: number;
}

/**
 * Is a dropped item close enough to count as given to the watcher?
 * Yes when it is within deliveryRadius of the eye, or inside the box in front of the eye (its path):
 * up to pathBoxLength past the radius along the horizontal look direction, pathBoxHalfWidth to each side,
 * and within deliveryRadius up or down.
 */
export function inDeliveryZone(
  eye: Vec3,
  lookDirection: Vec3,
  item: Vec3,
  cfg: ZoneConfig = CONFIG,
): boolean {
  const d = sub(item, eye);
  if (length(d) <= cfg.deliveryRadius) return true;
  if (Math.abs(d.y) > cfg.deliveryRadius) return false;
  const dir = flatDirection(lookDirection);
  const flat = { x: d.x, y: 0, z: d.z };
  const along = dot(flat, dir);
  if (along < 0 || along > cfg.deliveryRadius + cfg.pathBoxLength) return false;
  const side = length(sub(flat, scale(dir, along)));
  return side <= cfg.pathBoxHalfWidth;
}
