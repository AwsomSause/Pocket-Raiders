import { expect, test, type Page } from "@playwright/test";

// Minigames: a stop on the map opens the rules, the game screen takes choices, and a reload mid-game keeps the state.

const scene = (page: Page) =>
  page.evaluate(() => (window as any).__pkr?.activeScene() ?? null);

async function waitForScene(page: Page, key: string, timeout = 20_000) {
  await expect.poll(() => scene(page), { timeout }).toBe(key);
  await page.waitForTimeout(250);
}

async function toMap(page: Page) {
  await page.keyboard.press("Enter");
  await waitForScene(page, "Hub");
  await page.keyboard.press("Enter");
  await waitForScene(page, "TrainerSelect");
  await page.keyboard.press("Enter");
  await waitForScene(page, "RunPrep");
  await page.keyboard.press("Enter");
  await waitForScene(page, "StarterSelect");
  await page.keyboard.press("Enter");
  await waitForScene(page, "Briefing");
  await page.keyboard.press("Enter");
  await waitForScene(page, "Map");
  await expect
    .poll(
      () =>
        page.evaluate(
          () => (window as any).__pkr.game.scene.getScene("Map").busy,
        ),
      { timeout: 10_000 },
    )
    .toBe(false);
}

for (const id of ["sled-run", "psyduck-migration", "stealth-escape"]) {
  test(`${id} draws its picture board and still plays with the controls`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.goto("/?seed=minigame-board-e2e");
    await waitForScene(page, "MainMenu");
    await toMap(page);
    await page.evaluate((gameId) => {
      const run = (window as any).__pkr.session.run;
      const node = run.stage.map.nodes.find((n: any) => n.column === 1);
      node.sides.push({
        id: "mg-board",
        kind: "minigame",
        minigameId: gameId,
        used: false,
      });
      run.stage.current = node.id;
      (window as any).__pkr.game.scene
        .getScene("Map")
        .scene.restart({ focus: 0 });
    }, id);
    await waitForScene(page, "Map");
    await expect
      .poll(
        () =>
          page.evaluate(
            () => (window as any).__pkr.game.scene.getScene("Map").busy,
          ),
        { timeout: 10_000 },
      )
      .toBe(false);
    await page.evaluate(() =>
      (window as any).__pkr.game.scene.getScene("Map").openMinigame("mg-board"),
    );
    await page.waitForTimeout(300);
    await page.keyboard.press("Enter");
    await waitForScene(page, "Minigame");
    await page.keyboard.press("Enter"); // first control
    await page.waitForTimeout(400);
    expect(await scene(page)).toBe("Minigame");
    await page.screenshot({ path: `test-results/board-${id}.png` });
    expect(errors).toEqual([]);
  });
}
