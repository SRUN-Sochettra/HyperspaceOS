import { chromium } from 'playwright';

const baseUrl = process.env.HYPERSPACE_URL || 'http://127.0.0.1:5173/';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const pageErrors = [];
const consoleErrors = [];
page.on('pageerror', (error) => pageErrors.push(String(error)));
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});

try {
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('hyperspace-onboarding-done', 'true');
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.HyperOS?.Registry?.all?.().length === 22, null, { timeout: 60_000 });
  await page.waitForSelector('#dock');

  const state = await page.evaluate(async () => {
    let resolveStream;
    let getUserMediaCalls = 0;
    let stopped = 0;
    const delayedStream = {
      getTracks: () => [{ stop: () => { stopped += 1; window.__cameraTrackStopped = stopped; } }],
    };
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: () => {
          getUserMediaCalls += 1;
          window.__cameraGetUserMediaCalls = getUserMediaCalls;
          return new Promise((resolve) => { resolveStream = () => resolve(delayedStream); });
        },
      },
    });

    const wm = window.HyperOS.WindowManager;
    if (!wm) throw new Error('HyperOS.WindowManager runtime boundary was not initialized');
    window.HyperOS.Registry.launch('camera');
    const waitStart = performance.now();
    let managerRegistrationObserved = false;
    while (performance.now() - waitStart < 10_000) {
      if (wm.getAllWindows().filter((win) => win.appId === 'camera').length === 1) {
        managerRegistrationObserved = true;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    const mediaWaitStart = performance.now();
    while (performance.now() - mediaWaitStart < 10_000 && getUserMediaCalls === 0) {
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    if (getUserMediaCalls !== 1 || typeof resolveStream !== 'function') {
      throw new Error(`Camera media setup did not reach the controllable pending promise: calls=${getUserMediaCalls}`);
    }
    const beforeClose = {
      managerRegistrationObserved,
      windows: wm.getAllWindows().map((win) => ({ id: win.id, appId: win.appId, destroyed: win.destroyed, hasApp: Boolean(win.app), hasElement: Boolean(win.element) })),
      domWindows: [...document.querySelectorAll('.hyper-window')].map((node) => ({ id: node.id, windowId: node.dataset.windowId, title: node.querySelector('.window-title-text')?.textContent })),
      storeWindows: window.HyperOS.Store.get('windows.all'),
      domCount: document.querySelectorAll('.hyper-window').length,
      calls: getUserMediaCalls,
    };

    const closeResult = wm.closeAll();
    const closeState = { thenable: Boolean(closeResult && typeof closeResult.then === 'function') };
    let closeError = null;
    const closeSettled = Promise.resolve(closeResult).then(
      () => { closeState.status = 'fulfilled'; },
      (error) => { closeState.status = 'rejected'; closeError = String(error); },
    );

    await new Promise((resolve) => setTimeout(resolve, 50));
    const duringClose = {
      windows: wm.getAllWindows().map((win) => ({ id: win.id, appId: win.appId, destroyed: win.destroyed, hasApp: Boolean(win.app), hasElement: Boolean(win.element) })),
      domCount: document.querySelectorAll('.hyper-window').length,
      trackStopped: stopped,
    };

    resolveStream(delayedStream);
    await new Promise((resolve) => setTimeout(resolve, 100));
    await closeSettled;
    const afterClose = {
      windows: wm.getAllWindows().map((win) => ({ id: win.id, appId: win.appId, destroyed: win.destroyed, hasApp: Boolean(win.app), hasElement: Boolean(win.element) })),
      domCount: document.querySelectorAll('.hyper-window').length,
      trackStopped: stopped,
      closeState,
      closeError,
      cameraAppDestroyed: Boolean(window.__cameraAppDestroyed),
    };
    return { beforeClose, duringClose, afterClose };
  });

  state.afterClose.pageErrors = pageErrors;
  state.afterClose.consoleErrors = consoleErrors;
  console.log(JSON.stringify(state, null, 2));
  if (state.afterClose.closeState.status !== 'fulfilled' || state.afterClose.domCount !== 0 || state.afterClose.windows.length !== 0 || state.afterClose.trackStopped !== 1) {
    process.exitCode = 1;
  }
} finally {
  await context.close();
  await browser.close();
}
