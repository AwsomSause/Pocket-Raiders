import { expect, test } from '@playwright/test';
import { confirmToMenu } from './battleInput';

// A Pokémon with a Hyper slot, a Mega signature move and extra moves (up to 8 rows of buttons): every move button must stay on screen.
for (const style of ['original', 'classic', 'cyber']) {
  test(`move menu with 8 moves stays on screen (${style})`, async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto(`/?seed=move-overflow-${style}&campaign=dev&debug=1`);
    await page.waitForFunction(() => (window as any).__pkr?.activeScene() === 'MainMenu', null, { timeout: 20_000 });
    await page.evaluate((id) => { const { session } = (window as any).__pkr; session.saveSettings({ ...session.settings, screenStyles: { battle: id } }); }, style);
    for (const next of ['Hub', 'TrainerSelect', 'RunPrep', 'StarterSelect', 'Briefing', 'Map']) {
      await page.keyboard.press('Enter');
      await page.waitForFunction((n) => (window as any).__pkr.activeScene() === n, next, { timeout: 20_000 });
      await page.waitForTimeout(250);
    }
    await page.waitForFunction(() => (window as any).__pkr.game.scene.getScene('Map').busy === false);
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => (window as any).__pkr.activeScene() === 'Battle', null, { timeout: 20_000 });
    await confirmToMenu(page, 30_000);
    const bottom = await page.evaluate(() => {
      const p = (window as any).__pkr;
      const mon = p.session.run.party[0];
      for (const id of ['earth-power', 'double-edge', 'dynamic-punch', 'hydro-pump', 'close-combat', 'tackle', 'growl', 'scratch']) if (mon.moves.length < 8 && !mon.moves.some((m: any) => m.id === id)) mon.moves.push({ id, pp: 10 });
      const scene = p.game.scene.getScene('Battle');
      scene.showMoveMenu();
      const texts = scene.children.list.flatMap((c: any) => (c.list ?? [c])).filter((o: any) => o.getData?.('menuLabel'));
      return Math.max(...texts.map((t: any) => { const m = t.getWorldTransformMatrix(); return m.ty + t.height; }));
    });
    expect(bottom).toBeLessThanOrEqual(540);
  });
}
