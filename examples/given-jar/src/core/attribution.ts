// Who dropped this item? The Script API gives no dropper on an item entity, so the adapter keeps a snapshot of how
// many mission items each player carries and credits the nearby player whose count went down.

export interface DropCandidate {
  id: string;
  /** Mission items the player carried before (the larger of the last two snapshots). */
  before: number;
  /** Mission items the player carries now. */
  now: number;
  /** Blocks from the player to where the item entity appeared. */
  distance: number;
}

export function chooseDropper(candidates: readonly DropCandidate[], radius: number): string | null {
  const lost = candidates.filter((c) => c.now < c.before && c.distance <= radius);
  lost.sort((a, b) => a.distance - b.distance || a.id.localeCompare(b.id));
  return lost[0]?.id ?? null;
}

/** Keep the last two counts per player so a snapshot taken in the same tick as the drop does not hide it. */
export class InventorySnapshots {
  private older = new Map<string, number>();
  private newer = new Map<string, number>();

  record(counts: ReadonlyMap<string, number>): void {
    this.older = this.newer;
    this.newer = new Map(counts);
  }

  before(id: string): number {
    return Math.max(this.older.get(id) ?? 0, this.newer.get(id) ?? 0);
  }

  /** After a drop is credited, the new lower count is the baseline so the same loss is not credited twice. */
  settle(id: string, now: number): void {
    this.older.set(id, now);
    this.newer.set(id, now);
  }

  clear(): void {
    this.older.clear();
    this.newer.clear();
  }
}
