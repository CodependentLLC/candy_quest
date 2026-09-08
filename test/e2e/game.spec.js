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

  test("renders an accessible responsive HUD that updates with game state", async ({page}) => {
    const errors=await boot(page);
    const initial=await page.locator("#hud").evaluate(hud => ({
      label:hud.getAttribute("aria-label"),
      values:["hud-lives","hud-score","hud-candy","hud-stars","hud-time"].map(id => document.getElementById(id).textContent),
      bounds:hud.getBoundingClientRect().toJSON(),
      viewport:document.documentElement.clientWidth
    }));
    expect(initial.label).toBe("Game status");
    expect(initial.values.every(value => value !== "-" && value !== "")).toBe(true);
    expect(initial.bounds.left).toBeGreaterThanOrEqual(0);
    expect(initial.bounds.right).toBeLessThanOrEqual(initial.viewport);
    await page.evaluate(() => { const g=__candyQuestGame; g.player.x=240; g.player.y=525; g.updateCollectibles(0); });
    await expect(page.locator("#hud-candy")).toHaveText("1");
    await assertHealthy(page, errors);
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

  test("respects reduced-motion preferences without changing physics", async ({page}) => {
    await page.emulateMedia({reducedMotion:"reduce"});
    const errors=await boot(page);
    const result=await page.evaluate(() => {
      const g=__candyQuestGame;
      const before={x:g.player.x, y:g.player.y, vy:g.player.vy};
      g.screenShake=1;
      g.burst(200, 200, 8, "#fff");
      g.update(1 / 60);
      return {reduced:g.reducedMotion, particles:g.particles.length, shake:g.screenShake, moved:g.player.x !== before.x || g.player.y !== before.y};
    });
    expect(result.reduced).toBe(true);
    expect(result.particles).toBe(0);
    expect(result.shake).toBeLessThan(1);
    expect(result.moved).toBe(true);
  });
  test("pauses and resumes gameplay without advancing simulation", async ({page}) => {
    const errors=await boot(page);
    const before=await page.evaluate(() => ({
      x:__candyQuestGame.player.x,
      time:__candyQuestGame.timeRemaining
    }));
    await page.keyboard.press("Escape");
    await expect(page.locator("#pause-overlay")).toBeVisible();
    await page.waitForTimeout(250);
    const paused=await page.evaluate(() => ({
      paused:__candyQuestGame.paused,
      x:__candyQuestGame.player.x,
      time:__candyQuestGame.timeRemaining
    }));
    expect(paused.paused).toBe(true);
    expect(paused.x).toBe(before.x);
    expect(paused.time).toBeCloseTo(before.time, 3);
    await page.locator("#resume").click();
    await expect(page.locator("#pause-overlay")).toBeHidden();
    await expect.poll(() => page.evaluate(() => __candyQuestGame.paused)).toBe(false);
    await assertHealthy(page, errors);
  });

  test("blocks a solid wall and supports one-way passage/landing", async ({page}) => {
    const errors=await boot(page);
    const result=await page.evaluate(() => {
      const g=__candyQuestGame;
      g.player.x=770; g.player.y=520; g.player.vx=365; g.player.vy=0; g.player.onGround=false;
      g.input={left:false,right:true,jump:false,consumeJump(){return false;},consumeDebug(){return false;},consumeRestart(){return false;}};
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

  test("map isolates gameplay and Back returns to play", async ({page}) => {
    const errors=await boot(page);
    const before=await page.evaluate(() => ({x:__candyQuestGame.player.x,time:__candyQuestGame.timeRemaining}));
    await page.locator("#open-map").click();
    await expect(page.locator("#world-map")).toBeVisible();
    await page.keyboard.press("Escape");
    await page.waitForTimeout(150);
    const mapped=await page.evaluate(() => ({mode:__candyQuestGame.appMode,paused:__candyQuestGame.paused,x:__candyQuestGame.player.x,time:__candyQuestGame.timeRemaining}));
    await page.waitForTimeout(150);
    const stable=await page.evaluate(() => ({x:__candyQuestGame.player.x,time:__candyQuestGame.timeRemaining}));
    expect(mapped.mode).toBe("map"); expect(mapped.paused).toBe(true); expect(mapped.x).toBe(before.x); expect(stable).toEqual({x:mapped.x,time:mapped.time});
    await page.getByRole("button", {name:"Back", exact:true}).click();
    await expect(page.locator("#world-map")).toBeHidden();
    await expect.poll(() => page.evaluate(() => ({mode:__candyQuestGame.appMode,paused:__candyQuestGame.paused}))).toEqual({mode:"playing",paused:false});
    await assertHealthy(page, errors);
  });

  test("map locks unavailable nodes and launches World 1-1", async ({page}) => {
    const errors=await boot(page);
    await page.locator("#open-map").click();
    await expect(page.locator("#world-map")).toBeVisible();
    await expect(page.locator('[data-level-id="world-01-01"]')).toBeEnabled();
    await expect(page.locator('[data-level-id="world-01-02"]')).toBeDisabled();
    await page.locator('[data-level-id="world-01-01"]').click();
    await expect(page.locator("#world-map")).toBeHidden();
    await expect.poll(() => page.evaluate(() => __candyQuestGame.levelId)).toBe("world-01-01");
    await assertHealthy(page, errors);
  });

  test("map uses profile progression and the final completion score", async ({page}) => {
    const errors=await boot(page);
    const finalScore=await page.evaluate(() => {
      const g=__candyQuestGame; g.score=100; g.starCount=3; g.player.x=5020; g.player.y=270; g.updateGoal(); return g.score;
    });
    await page.locator("#result-map").click();
    const node=page.locator('[data-level-id="world-01-01"]');
    await expect(node).toContainText(`Best ${finalScore}`);
    const state=await page.evaluate(() => ({mapProgress:__candyQuestGame.session.mapProgress, persisted:__candyQuestGame.session.profile.levels["world-01-01"]}));
    expect(state.mapProgress).toBeUndefined();
    expect(state.persisted.bestScore).toBe(finalScore);
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
