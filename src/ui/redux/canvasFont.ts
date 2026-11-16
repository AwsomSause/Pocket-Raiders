// New look: the few screens that are still drawn on the canvas (they have no page in the mock-ups: the Legendary Blessing
// opening, the two walkable towns, the Legacy Gallery) write their text in the chosen skin's font, the mock-ups' own,
// instead of the old game fonts. Call `useLookFont(this)` first thing in such a scene's create(). The Old look, and a
// canvas style the player picked for a screen, keep the game fonts. Presentation only.

import type Phaser from 'phaser';
import { REDUX_SKINS, reduxSkinIndex } from '../../core/presentation/redux';
import { services } from '../../game/services';
import { setLookFont } from '../theme';
import { reduxOn } from './stage';

/** Every Text in the scene, inside containers too. */
function texts(list: Phaser.GameObjects.GameObject[], into: Phaser.GameObjects.Text[] = []): Phaser.GameObjects.Text[] {
  for (const o of list) {
    if (o.type === 'Text') into.push(o as Phaser.GameObjects.Text);
    const inner = (o as unknown as { list?: Phaser.GameObjects.GameObject[] }).list;
    if (Array.isArray(inner)) texts(inner, into);
  }
  return into;
}

/** Text made by this scene from now until it shuts down uses the skin's font (New look only). */
export function useLookFont(scene: Phaser.Scene): void {
  if (!reduxOn()) return;
  const skin = REDUX_SKINS[reduxSkinIndex(services().session.settings.reduxSkin)]!;
  setLookFont({ family: skin.font, weight: skin.fw ?? 400, scale: (skin.fs ?? 18) / 18 });
  scene.events.once('shutdown', () => setLookFont(null));
  // The font file may still be on its way (the HTML pages before this one normally loaded it): draw the text again when it lands.
  const spec = `${skin.fw ?? 400} 16px "${skin.font}"`;
  const fonts = typeof document === 'undefined' ? undefined : document.fonts;
  if (!fonts || fonts.check(spec)) return;
  void fonts.load(spec).then(() => {
    if (!scene.sys.isActive()) return;
    for (const t of texts(scene.children.list)) if (t.active) t.setFontFamily(t.style.fontFamily);
  }).catch(() => undefined);
}
