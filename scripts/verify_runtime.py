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
        page.goto(BASE_URL, wait_until="networkidle")
        page.evaluate("localStorage.setItem('hyperspace-onboarding-done','true')")
        page.reload(wait_until="networkidle")
        page.wait_for_selector("#dock")

        def clean():
            page.evaluate("""async () => { const {default: wm}=await import('/src/wm/WindowManager.js'); const {default: ws}=await import('/src/wm/Workspaces.js'); await wm.closeAll(); ws.reset(); }""")
            page.wait_for_function("document.querySelectorAll('.hyper-window').length === 0")

        def all_apps():
            clean()
            ids = page.evaluate("""async () => { const {default:r}=await import('/src/core/Registry.js'); return r.all().map(x=>x.id); }""")
            assert len(ids) == 22, f"Expected 22 registered apps, got {len(ids)}: {ids}"
            for app_id in ids:
                page.evaluate("""async id => { const {default:r}=await import('/src/core/Registry.js'); await r.launch(id); }""", app_id)
                page.wait_for_function("document.querySelectorAll('.hyper-window').length > 0")
                clean()
            return {"registered": ids, "launched": len(ids)}
        check("all_registered_apps_launch", all_apps)

        def camera_race():
            clean(); page.evaluate("""Object.defineProperty(navigator, 'mediaDevices', {configurable:true,value:{getUserMedia:()=>new Promise(r=>setTimeout(()=>r({getTracks:()=>[{stop(){window.__trackStopped=true}}]}),300))}})""")
            page.evaluate("""async()=>{const {default:r}=await import('/src/core/Registry.js');await r.launch('camera')}""")
            page.evaluate("""async()=>{const {default:w}=await import('/src/wm/WindowManager.js');await w.closeAll()}""")
            page.wait_for_function("window.__trackStopped === true")
            return "delayed camera stream stopped after close"
        check("camera_close_during_permission", camera_race)

        def video_cleanup():
            clean(); page.evaluate("""async()=>{const {default:r}=await import('/src/core/Registry.js');await r.launch('video')}"""); page.wait_for_selector("video")
            page.evaluate("document.querySelector('video').src='data:video/mp4;base64,AAAA'")
            clean(); assert page.locator("video").count() == 0
            return "video element removed after app destruction"
        check("video_close_cleanup", video_cleanup)

        def mail_contacts():
            clean(); page.evaluate("""async()=>{const {default:r}=await import('/src/core/Registry.js');await r.launch('mail')}"""); page.get_by_role("button", name="Compose").click(); page.locator('input[name="to"]').fill("local@example.test"); page.locator('input[name="subject"]').fill("Local test"); page.locator('textarea[name="body"]').fill("<svg/onload=alert(1)>"); page.get_by_role("button", name="Save to Sent").click(); page.get_by_text("No email was delivered.").wait_for()
            clean(); page.evaluate("""async()=>{const {default:r}=await import('/src/core/Registry.js');await r.launch('contacts')}"""); page.locator('input[placeholder="Name"]').fill('<img src=x onerror=1>'); page.get_by_role("button", name="Add").click(); assert page.locator("img").count() == 0
            return "local mail semantics and hostile contact text exercised"
        check("mail_contacts_behavior", mail_contacts)

        def keyboard_accessibility():
            clean(); page.keyboard.press("Control+Space"); page.wait_for_selector(".spotlight-overlay", state="visible"); assert page.locator(":focus").count() == 1; page.keyboard.press("Escape"); page.wait_for_selector(".spotlight-overlay", state="hidden")
            page.evaluate("""async()=>{const {default:r}=await import('/src/core/Registry.js');await r.launch('clock')}"""); tabs=page.get_by_role("tab"); assert tabs.count()==3; tabs.nth(0).focus(); page.keyboard.press("Tab")
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
            page.evaluate("""async()=>{const {default:f}=await import('/src/core/FileSystem.js');f.writeFile('/home/root/repair-persistence.txt','persisted')}"""); page.reload(wait_until="networkidle"); value=page.evaluate("""async()=>{const {default:f}=await import('/src/core/FileSystem.js');return f.readFile('/home/root/repair-persistence.txt')}"""); assert value=="persisted"; return "virtual file persisted across reload"
        check("persistence_reload", persistence)
        check("no_unhandled_page_errors", lambda: (_ for _ in ()).throw(AssertionError(results["page_errors"])) if results["page_errors"] else "none")
        browser.close()
    results["finished_at"] = datetime.now(timezone.utc).isoformat()
    OUT.parent.mkdir(parents=True, exist_ok=True); OUT.write_text(json.dumps(results, indent=2), encoding="utf-8")
    if failures: raise SystemExit(1)

if __name__ == "__main__": main()
