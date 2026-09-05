import {test, expect} from "@playwright/test";

async function boot(page) {
  const errors=[];
  page.on("console", msg => { if (msg.type() === "error") errors.push(`console: ${msg.text()}`); });
  page.on("pageerror", error => errors.push(`pageerror: ${error.message}`));
  page.on("requestfailed", request => errors.push(`request: ${request.url()} ${request.failure()?.errorText}`));
  await page.goto("/?e2e=1");
  await page.waitForFunction(() => Boolean(globalThis.__candyQuestGame?.player));
  await expect(page.locator("#game")).toBeVisible();
  await page.waitForTimeout(100);
  return errors;
}

async function assertHealthy(page, errors) {
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => {
    const data=__candyQuestGame.canvas.getContext("2d").getImageData(0,0,1280,720).data;
    return data.some((value,index) => index % 4 !== 3 && value !== 0);
  })).toBe(true);
}

test.describe("Candy Quest browser smoke", () => {
  test("boots without errors and leaves loading state", async ({page}) => {
    const errors=await boot(page);
    await assertHealthy(page, errors);
    await expect.poll(() => page.evaluate(() => Boolean(
      globalThis.__candyQuestGame.assets && globalThis.__candyQuestGame.player
    ))).toBe(true);
  });

  test("moves right and performs a real jump", async ({page}) => {
    const errors=await boot(page);
    await page.evaluate(() => { const g=__candyQuestGame; g.player.y=528; g.player.onGround=true; });
    const before=await page.evaluate(() => __candyQuestGame.player.x);
    await page.keyboard.down("ArrowRight"); await page.waitForTimeout(250); await page.keyboard.up("ArrowRight");
    expect(await page.evaluate(() => __candyQuestGame.player.x)).toBeGreaterThan(before);
    await page.keyboard.press("Space");
    await expect.poll(() => page.evaluate(() => __candyQuestGame.player.vy)).toBeLessThan(0);
    await assertHealthy(page, errors);
  });

  test("blocks a solid wall and supports one-way passage/landing", async ({page}) => {
    const errors=await boot(page);
    const result=await page.evaluate(() => {
      const g=__candyQuestGame;
      g.player.x=770; g.player.y=520; g.player.vx=365; g.player.vy=0; g.player.onGround=false;
      g.input={left:false,right:true,jump:false,consumeJump(){return false;}};
      g.updatePlayer(1/30);
      const blocked=g.player.colliderRect.x+g.player.colliderRect.w;
      g.player.x=560; g.player.y=430; g.player.vy=-500; g.player.onGround=false;
      const before=g.player.y; g.updatePlayer(1/30); const rose=g.player.y < before;
      g.player.y=310; g.player.vy=200; g.player.onGround=false; g.updatePlayer(1/30);
      const landed=g.player.colliderRect.y + g.player.colliderRect.h === 390;
      return {blocked, rose, landed};
    });
    expect(result.blocked).toBeLessThanOrEqual(830.001);
    expect(result.rose).toBe(true);
    expect(result.landed).toBe(true);
    await assertHealthy(page, errors);
  });

  test("restart invalidates delayed respawn", async ({page}) => {
    const errors=await boot(page);
    const spawn=await page.evaluate(() => { const g=__candyQuestGame; g.killPlayer("test"); g.restart(true); return {x:g.player.x,y:g.player.y}; });
    await page.waitForTimeout(750);
    await expect.poll(() => page.evaluate(() => ({x:__candyQuestGame.player.x,pending:__candyQuestGame.respawnPending}))).toEqual({x:spawn.x,pending:false});
    await assertHealthy(page, errors);
  });

  test("collects candy, respawns at checkpoint, and enforces goal stars", async ({page}) => {
    const errors=await boot(page);
    const state=await page.evaluate(() => {
      const g=__candyQuestGame;
      g.player.x=240; g.player.y=525; g.updateCollectibles(0);
      const candy=g.candyCount;
      g.player.x=2600; g.player.y=245; g.updateCheckpoint();
      const checkpoint={...g.checkpoint}; g.killPlayer("test"); g.updateRespawn(1);
      const respawn={x:g.player.x,y:g.player.y};
      g.player.x=5020; g.player.y=270; g.updateGoal(); const incomplete=g.completed;
      g.starCount=3; g.updateGoal();
      return {candy,checkpoint,respawn,incomplete,completed:g.completed};
    });
    expect(state.candy).toBeGreaterThan(0); expect(state.checkpoint.x).toBe(2600);
    expect(state.respawn).toEqual({x:2600,y:245}); expect(state.incomplete).toBe(false); expect(state.completed).toBe(true);
    await assertHealthy(page, errors);
  });

  test("captures desktop view", async ({page}, testInfo) => {
    const errors=await boot(page); await assertHealthy(page, errors);
    await page.screenshot({path:`test-output/${testInfo.project.name}/candy-quest-desktop.png`,fullPage:true});
  });
  test("captures mobile view", async ({page}, testInfo) => {
    const errors=await boot(page); await assertHealthy(page, errors);
    await page.screenshot({path:`test-output/${testInfo.project.name}/candy-quest-mobile.png`,fullPage:true});
  });
});
