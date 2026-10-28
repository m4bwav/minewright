// Text sent to the screen. The resource pack's ui/hud_screen.json looks for TITLE_MARKER at the start of a title:
// it hides the vanilla title text and shows the image whose path follows the marker, which then drops to the
// bottom of the screen. Without that UI layer (or if a game update breaks JSON UI) the vanilla title shows the
// raw marker text, while the subtitle, chat line and action bar still say the item name in plain words.

import { findItem } from '../items.ts';

export const TITLE_MARKER = 'gj_item:';
/** Transparent image shipped in the resource pack; a title with it clears the HUD item icon. */
export const BLANK_TEXTURE = 'textures/given_jar/blank';

export interface TitleText {
  title: string;
  subtitle: string;
}

export function missionTitle(itemId: string): TitleText {
  const item = findItem(itemId);
  const texture = item?.texture ?? BLANK_TEXTURE;
  return { title: `${TITLE_MARKER}${texture}`, subtitle: `Bring me: ${item?.name ?? itemId}` };
}

export function clearTitle(): TitleText {
  return { title: `${TITLE_MARKER}${BLANK_TEXTURE}`, subtitle: '' };
}
