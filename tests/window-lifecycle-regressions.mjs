import { chromium } from 'playwright';

const baseUrl = process.env.HYPERSPACE_URL || 'http://127.0.0.1:5173/';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const page = await context.newPage();
const pageErrors = [];
page.on('pageerror', (error) => pageErrors.push(String(error)));

const waitForBoot = async () => {
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('hyperspace-onboarding-done', 'true');
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.HyperOS?.Store?.get('os.booted') === true, null, { timeout: 60_000 });
  await page.waitForFunction(() => window.HyperOS?.WindowManager && window.HyperOS?.FileSystem, null, { timeout: 10_000 });
};

try {
  await waitForBoot();
  const result = await page.evaluate(async () => {
    const waitFor = async (predicate, label, timeout = 10_000) => {
      const started = performance.now();
      while (performance.now() - started < timeout) {
        if (predicate()) return;
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
      throw new Error(`${label}: timeout; windows=${JSON.stringify(window.HyperOS.WindowManager.getAllWindows().map((win) => ({ id: win.id, appId: win.appId, hasApp: Boolean(win.app) })))}; dom=${document.querySelectorAll('.hyper-window').length}`);
    };
    const wm = window.HyperOS.WindowManager;
    let resolveStream;
    let stopped = 0;
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: () => new Promise((resolve) => { resolveStream = () => resolve({ getTracks: () => [{ stop: () => { stopped += 1; } }] }); }) },
    });

    await wm.closeAll().catch(() => {});
    window.HyperOS.Registry.launch('camera');
    await waitFor(() => wm.getAllWindows().some((win) => win.appId === 'camera' && win.app), 'camera launch');
    await waitFor(() => typeof resolveStream === 'function', 'camera media request');
    const cameraWindow = wm.getAllWindows().find((win) => win.appId === 'camera');
    const cameraApp = cameraWindow.app;
    const cameraClose = wm.close(cameraWindow.id);
    resolveStream();
    await cameraClose;
    await new Promise((resolve) => setTimeout(resolve, 50));
    const camera = { stopped, destroyed: cameraApp.destroyed, windows: wm.getAllWindows().length, dom: document.querySelectorAll('.hyper-window').length };

    window.HyperOS.Registry.launch('terminal');
    await waitFor(() => wm.getAllWindows().some((win) => win.appId === 'terminal' && win.app), 'throwing window launch');
    const failingWindow = wm.getAllWindows().find((win) => win.appId === 'terminal');
    const failingId = failingWindow.id;
    failingWindow.app.destroy = () => { throw new Error('synthetic cleanup failure'); };
    let singleCloseRejected = false;
    try { await wm.close(failingId); } catch (error) { singleCloseRejected = error.message === 'synthetic cleanup failure'; }
    const singleFailure = { rejected: singleCloseRejected, map: wm.getAllWindows().length, dom: document.querySelectorAll('.hyper-window').length };

    await wm.closeAll().catch(() => {});
    window.HyperOS.Registry.launch('terminal');
    window.HyperOS.Registry.launch('clock');
    await waitFor(() => wm.getAllWindows().some((win) => win.appId === 'terminal' && win.app) && wm.getAllWindows().some((win) => win.appId === 'clock' && win.app), 'aggregate window launch');
    const windows = wm.getAllWindows().filter((win) => win.appId === 'terminal' || win.appId === 'clock');
    let attempted = 0;
    for (const win of windows) {
      const original = win.app?.destroy;
      win.app.destroy = () => { attempted += 1; if (win.appId === 'terminal') throw new Error('aggregate cleanup failure'); original?.(); };
    }
    let aggregateRejected = false;
    let aggregateError = null;
    try { await wm.closeAll(); } catch (error) {
      aggregateError = { name: error.name, message: error.message, count: error.errors?.length ?? null };
      aggregateRejected = error.name === 'AggregateError' && (error.errors?.length ?? 0) >= 1;
    }
    const aggregate = { rejected: aggregateRejected, error: aggregateError, attempted, map: wm.getAllWindows().length, dom: document.querySelectorAll('.hyper-window').length };

    window.HyperOS.Registry.launch('clock');
    await waitFor(() => wm.getAllWindows().some((win) => win.appId === 'clock' && win.app), 'repeated close launch');
    const repeatedWindow = wm.getAllWindows().find((win) => win.appId === 'clock');
    await wm.close(repeatedWindow.id);
    await wm.close(repeatedWindow.id);
    const repeated = { map: wm.getAllWindows().length, dom: document.querySelectorAll('.hyper-window').length };
    return { camera, singleFailure, aggregate, repeated, pageErrors: [] };
  });
  result.pageErrors = pageErrors;
  console.log(JSON.stringify(result, null, 2));
  const checks = [
    result.camera.stopped === 1,
    result.camera.destroyed === true,
    result.camera.windows === 0,
    result.camera.dom === 0,
    result.singleFailure.rejected === true,
    result.singleFailure.map === 0,
    result.singleFailure.dom === 0,
    result.aggregate.rejected === true,
    result.aggregate.attempted === 2,
    result.aggregate.map === 0,
    result.aggregate.dom === 0,
    result.repeated.map === 0,
    result.repeated.dom === 0,
    result.pageErrors.length === 0,
  ];
  if (checks.some((check) => !check)) process.exitCode = 1;
} finally {
  await context.close();
  await browser.close();
}
