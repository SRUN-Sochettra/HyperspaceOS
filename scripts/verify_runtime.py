import json, os, platform, subprocess, sys
from datetime import datetime, timezone
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE_URL = os.getenv("HYPERSPACE_URL", "http://127.0.0.1:5173/")
OUT = Path("verification/results.json")
VIEWPORTS = [(1440,900),(1024,768),(768,1024),(390,844),(360,640)]
results = {"started_at": datetime.now(timezone.utc).isoformat(), "environment": {}, "checks": {}, "console_errors": [], "page_errors": []}
failures = []

def version(cmd):
    if sys.platform.startswith("win") and cmd and cmd[0] == "npm":
        cmd = ["npm.cmd", *cmd[1:]]
    try: return subprocess.check_output(cmd, text=True, stderr=subprocess.STDOUT).strip()
    except Exception as e: return f"unavailable: {e}"

def check(name, fn):
    try:
        details = fn() or "passed"
        results["checks"][name] = {"pass": True, "details": details}
        print(f"[PASS] {name}", flush=True)
    except Exception as e:
        failures.append(name)
        results["checks"][name] = {"pass": False, "error": str(e)}
        print(f"[FAIL] {name}: {e}", flush=True)

def main():
    results["environment"] = {"os": platform.platform(), "python": sys.version.split()[0], "node": version(["node","--version"]), "npm": version(["npm","--version"]), "git_commit": version(["git","rev-parse","HEAD"]), "dependencies": version(["npm","ls","--depth=0","--json"])}
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        results["environment"]["browser"] = browser.version
        context = browser.new_context(viewport={"width":1440,"height":900})
        page = context.new_page()
        page.on("console", lambda msg: results["console_errors"].append(msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda err: results["page_errors"].append(str(err)))
        try:
            page.goto(BASE_URL, wait_until="networkidle")
            page.evaluate("localStorage.setItem('hyperspace-onboarding-done','true')")
            page.reload(wait_until="networkidle")
            page.wait_for_function("window.HyperOS?.Registry?.all?.().length === 22", timeout=60000)
            page.wait_for_selector("#dock")
            page.evaluate("""Object.defineProperty(navigator, 'mediaDevices', {configurable:true,value:{getUserMedia:async()=>({getTracks:()=>[{stop(){window.__trackStopped=true}}]})}})""")

            def clean():
                page.evaluate("""async () => { const wm=window.HyperOS.WindowManager; const {default: ws}=await import('/src/wm/Workspaces.js'); if (!wm) throw new Error('WindowManager runtime boundary unavailable'); await wm.closeAll(); ws.reset(); }""")
                page.wait_for_function("document.querySelectorAll('.hyper-window').length === 0", timeout=60000)

            def all_apps():
                clean()
                ids = page.evaluate("window.HyperOS.Registry.all().map(app => app.id)")
                assert len(ids) == 22, f"Expected 22 registered apps, got {len(ids)}: {ids}"
                for app_id in ids:
                    try:
                        page.evaluate("id => window.HyperOS.Registry.launch(id)", app_id)
                        page.wait_for_function("document.querySelectorAll('.hyper-window').length > 0", timeout=10000)
                        expected_title = page.evaluate("id => window.HyperOS.Registry.get(id).title", app_id)
                        actual_title = page.locator('.hyper-window .window-title-text').last.text_content()
                        assert actual_title == expected_title, f"Window title did not identify {app_id}: {actual_title!r} != {expected_title!r}"
                        clean()
                    except Exception as error:
                        state = page.evaluate("({ids: window.HyperOS.Registry.all().map(app => app.id), windows: window.HyperOS.Store.get('windows.all'), dom: document.querySelectorAll('.hyper-window').length, titles: [...document.querySelectorAll('.hyper-window .window-title-text')].map(node => node.textContent)})")
                        raise AssertionError(f"{app_id}: {error}; state={state}") from error
                return {"registered": ids, "launched": len(ids)}
            check("all_registered_apps_launch", all_apps)

            def camera_race():
                clean(); page.evaluate("""Object.defineProperty(navigator, 'mediaDevices', {configurable:true,value:{getUserMedia:()=>new Promise(r=>setTimeout(()=>r({getTracks:()=>[{stop(){window.__trackStopped=true}}]}),300))}})""")
                page.evaluate("window.HyperOS.Registry.launch('camera')")
                page.wait_for_function("window.HyperOS.WindowManager?.getAllWindows?.().some(w => w.appId === 'camera' && w.app)", timeout=10000)
                page.evaluate("""async()=>{const w=window.HyperOS.WindowManager; if (!w) throw new Error('WindowManager runtime boundary unavailable'); await w.closeAll()}""")
                page.wait_for_function("window.__trackStopped === true")
                page.wait_for_function("window.HyperOS.WindowManager.getAllWindows().length === 0")
                assert page.locator('.hyper-window').count() == 0
                return "delayed camera stream stopped after close; manager and DOM clean"
            check("camera_close_during_permission", camera_race)

            def video_cleanup():
                clean(); page.evaluate("window.HyperOS.Registry.launch('video')"); page.wait_for_selector("video")
                page.evaluate("document.querySelector('video').src='data:video/mp4;base64,AAAA'")
                clean(); assert page.locator("video").count() == 0
                return "video element removed after app destruction"
            check("video_close_cleanup", video_cleanup)

            def mail_contacts():
                clean(); page.evaluate("window.HyperOS.Registry.launch('mail')"); page.get_by_role("button", name="Compose").click(); page.locator('input[name="to"]').fill("local@example.test"); page.locator('input[name="subject"]').fill("Local test"); page.locator('textarea[name="body"]').fill("<svg/onload=alert(1)>"); page.get_by_role("button", name="Save to Sent").click(); page.get_by_text("No email was delivered.").wait_for()
                clean(); page.evaluate("window.HyperOS.Registry.launch('contacts')"); page.locator('input[placeholder="Name"]').fill('<img src=x onerror=1>'); page.get_by_role("button", name="Add").click(); assert page.locator("img").count() == 0
                return "local mail semantics and hostile contact text exercised"
            check("mail_contacts_behavior", mail_contacts)

            def keyboard_accessibility():
                clean(); page.keyboard.press("Control+Space"); page.wait_for_selector(".spotlight-overlay", state="visible"); assert page.locator(":focus").count() == 1; page.keyboard.press("Escape"); page.wait_for_selector(".spotlight-overlay", state="hidden")
                page.evaluate("window.HyperOS.Registry.launch('clock')"); tabs=page.get_by_role("tab"); assert tabs.count()==3; tabs.nth(0).focus(); page.keyboard.press("Tab")
                return "focus entry, Escape dismissal, named clock tabs exercised"
            check("keyboard_and_accessible_names", keyboard_accessibility)

            def responsive():
                for width,height in VIEWPORTS:
                    page.set_viewport_size({"width":width,"height":height})
                    overflow = page.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth + 1")
                    assert not overflow, f"horizontal page overflow at {width}x{height}"
                    for selector in ("#dock", "#statusbar"):
                        box=page.locator(selector).bounding_box(); assert box and box["x"] < width and box["y"] < height, f"{selector} unreachable at {width}x{height}"
                return {"viewports": [f"{w}x{h}" for w,h in VIEWPORTS]}
            check("responsive_overflow_and_reachability", responsive)

            def persistence():
                page.evaluate("""async()=>{const f=window.HyperOS.FileSystem;if (!f) throw new Error('FileSystem runtime boundary unavailable');const result=f.writeFile('/home/root/repair-persistence.txt','persisted');if (!result?.success) throw new Error(JSON.stringify(result));}"""); page.reload(wait_until="networkidle"); page.wait_for_function("window.HyperOS?.Store?.get('os.booted') === true", timeout=60000); value=page.evaluate("""async()=>{const f=window.HyperOS.FileSystem;if (!f) throw new Error('FileSystem runtime boundary unavailable');return f.readFile('/home/root/repair-persistence.txt')}"""); assert value=="persisted", f"expected persisted content, got {value!r}"; return "virtual file persisted across reload"
            check("persistence_reload", persistence)
            check("no_unhandled_page_errors", lambda: (_ for _ in ()).throw(AssertionError(results["page_errors"])) if results["page_errors"] else "none")
        finally:
            context.close()
            browser.close()
    results["finished_at"] = datetime.now(timezone.utc).isoformat()
    OUT.parent.mkdir(parents=True, exist_ok=True); OUT.write_text(json.dumps(results, indent=2), encoding="utf-8")
    if failures: raise SystemExit(1)

if __name__ == "__main__": main()
