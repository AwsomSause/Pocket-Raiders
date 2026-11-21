// One-time "Evil Mode is VERY EARLY ACCESS" screen. DOM overlay over the canvas; no Phaser import.
// Shown once per browser (localStorage). No skip prompt for the first 10 seconds; the button appears after.

export const EARLY_ACCESS_KEY = 'pkr.evilEarlyAccessSeen';
export const EARLY_ACCESS_LOCK_MS = 10000;

interface Env {
  seen: string | null;
  webdriver: boolean;
  search: string;
}

/** Pure: should the screen show? Automated browsers skip it unless ?earlyaccess=1; ?earlyaccess=0 always hides it. */
export function earlyAccessDue(env: Env): boolean {
  if (env.search.includes('earlyaccess=0')) return false;
  if (env.search.includes('earlyaccess=1')) return true;
  if (env.webdriver) return false;
  return env.seen !== '1';
}

export function readEarlyAccessEnv(): Env {
  let seen: string | null = null;
  try {
    seen = localStorage.getItem(EARLY_ACCESS_KEY);
  } catch {
    /* storage unavailable: show it once per page load */
  }
  return { seen, webdriver: typeof navigator !== 'undefined' && Boolean(navigator.webdriver), search: typeof location !== 'undefined' ? location.search : '' };
}

const CSS = `
#ea-notice{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(8,6,14,.96);color:#f2ece0;font-family:system-ui,sans-serif;overflow:auto}
#ea-notice .box{max-width:640px;width:100%;border:2px solid #c0392b;border-radius:10px;background:#15101c;padding:20px 22px;box-shadow:0 0 40px rgba(192,57,43,.35)}
#ea-notice h1{margin:0 0 4px;font-size:26px;letter-spacing:2px;color:#e74c3c}
#ea-notice .warn{margin:8px 0 14px;padding:8px 10px;background:#c0392b;color:#fff;font-weight:800;text-align:center;letter-spacing:1px;border-radius:6px;font-size:15px}
#ea-notice h2{margin:14px 0 4px;font-size:14px;color:#f1c40f;text-transform:uppercase;letter-spacing:1px}
#ea-notice p,#ea-notice li{margin:4px 0;font-size:14px;line-height:1.45}
#ea-notice ul{margin:4px 0;padding-left:20px}
#ea-notice .foot{margin-top:16px;text-align:center;min-height:42px}
#ea-notice .wait{font-size:13px;opacity:.75}
#ea-notice button{font:inherit;font-weight:700;padding:10px 26px;border-radius:6px;border:2px solid #f1c40f;background:#f1c40f;color:#15101c;cursor:pointer}
`;

/** Shows the screen. Resolves when the player closes it (after the lock). Marks it seen at once. */
export function showEarlyAccessNotice(lockMs: number = EARLY_ACCESS_LOCK_MS): Promise<void> {
  try {
    localStorage.setItem(EARLY_ACCESS_KEY, '1');
  } catch {
    /* ignore */
  }
  return new Promise((resolve) => {
    const root = document.createElement('div');
    root.id = 'ea-notice';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.innerHTML = `<style>${CSS}</style><div class="box">
<h1>EVIL MODE</h1>
<div class="warn">VERY EARLY ACCESS AND SUBJECT TO IMMENSE CHANGES</div>
<h2>What it is</h2>
<p>A new way to play: instead of the hero, you found and run a criminal team. You pick a team, then play it day by day. You spend money, grow the team, and take over a region while a kid comes to stop you. A run crosses three regions (Kanto, Johto, Hoenn first).</p>
<h2>Where you are</h2>
<p>This is the first, original build of Evil Mode. It has the core loop and a lot of systems, but it is not finished or balanced. The whole mode is being reworked, so expect it to change a lot, or be replaced.</p>
<h2>Where to find it</h2>
<ul><li>Main menu, then <b>Run Setup</b>, then pick <b>Evil Mode</b> as the mode.</li><li>It can be turned off in <b>Settings &gt; Gameplay &gt; Evil Mode</b>.</li></ul>
<h2>What to expect</h2>
<ul><li>Bugs, rough screens and missing parts.</li><li>Balance and rules will change.</li><li>Evil Mode runs may not carry over to later versions.</li></ul>
<div class="foot"><span class="wait" aria-live="off">Please read this screen.</span></div></div>`;
    document.body.appendChild(root);
    // Swallow keys while the screen is up so Enter/Space/Escape can't reach the game behind it.
    const swallow = (e: KeyboardEvent): void => {
      e.stopPropagation();
      e.preventDefault();
    };
    window.addEventListener('keydown', swallow, true);
    window.addEventListener('keyup', swallow, true);
    window.setTimeout(() => {
      const foot = root.querySelector('.foot');
      if (!foot) return;
      foot.innerHTML = '<button type="button">I understand</button>';
      const btn = foot.querySelector('button') as HTMLButtonElement;
      const done = (): void => {
        window.removeEventListener('keydown', swallow, true);
        window.removeEventListener('keyup', swallow, true);
        root.remove();
        resolve();
      };
      btn.addEventListener('click', done);
      btn.focus();
    }, lockMs);
  });
}
