// The hidden Key-Card vault (Dominion slice D18; Kice 2026-11-18 4:27 PM PT: Settings, press 9 eight times; mockup a2).
// The player picks a card (Diamond, Pearl, Platinum, Ruby, Sapphire), pastes the key Kice sent them privately, and the
// game checks its `sk-ant-` shape and makes one tiny test call before the card lights up. The key stays in this browser
// (src/ai/keyStore.ts); the field is cleared once sealed and the key is never drawn back on screen.
// Drawn in the New look's layer (`#rx`) over whatever screen is open; in the Old look it brings its own layer.
// While open, every key press belongs to the vault (a window capture listener), so nothing reaches the game behind it.

import { AI_DATA, keyShapeOk, usedUp } from '../core/ai/rules';
import { testKey } from '../ai/ask';
import { aiFake, aiRuntime } from '../ai/runtime';
import { vaultCards, vaultHtml, type VaultCard } from './redux/screens/dominion/claudeViews';

let open: { close: () => void } | null = null;

export const keyVaultOpen = (): boolean => !!open;

/** A layer of our own over the canvas when the New look's isn't there (Old look). */
function ownHost(): { host: HTMLElement; done: () => void } {
  const host = document.createElement('div');
  host.id = 'rx';
  host.className = 'rx';
  const place = (): void => {
    const c = document.querySelector('#game canvas') ?? document.querySelector('canvas');
    const r = c?.getBoundingClientRect() ?? { left: 0, top: 0, width: window.innerWidth };
    host.style.left = `${r.left}px`;
    host.style.top = `${r.top}px`;
    host.style.setProperty('--s', String(r.width / 960));
  };
  place();
  window.addEventListener('resize', place);
  document.body.append(host);
  return { host, done: () => { window.removeEventListener('resize', place); host.remove(); } };
}

export function openKeyVault(opts: { calm?: boolean; onClose?: () => void } = {}): void {
  if (open) return;
  const { keys, transport } = aiRuntime();
  const cards = AI_DATA.keyCards;
  const existing = document.getElementById('rx');
  const layer = existing ? { host: existing, done: () => {} } : ownHost();
  const el = document.createElement('div');
  el.className = 'stage' + (opts.calm ? ' calm' : '');
  el.style.zIndex = '60';
  el.style.background = 'none';
  el.dataset.testid = 'key-card-vault';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', 'Key-Card Vault');
  el.innerHTML = vaultHtml(aiFake());
  if (opts.calm) el.querySelectorAll<HTMLElement>('.rays,.embers,.float,.twinkle').forEach((n) => { n.style.animation = 'none'; });
  const q = <E extends Element>(sel: string): E => el.querySelector(sel) as E;
  const input = q<HTMLInputElement>('[data-testid="vault-key"]');
  const remember = q<HTMLInputElement>('[data-testid="vault-remember"]');
  const msg = q<HTMLElement>('[data-vault="msg"]');
  const note = msg.textContent ?? '';
  const active = keys.active();
  let pick = Math.max(0, cards.findIndex((c) => c.id === active?.card));
  let busy = false;
  let test: 'idle' | 'testing' | 'ok' | 'bad' = 'idle';
  remember.checked = !!active?.remembered;

  const say = (text: string, kind: '' | 'ok' | 'bad' = ''): void => {
    msg.textContent = text || note;
    msg.style.color = kind === 'ok' ? '#9bffb0' : kind === 'bad' ? '#ff9b9b' : '';
    msg.style.fontSize = text ? '14px' : '';
  };
  const draw = (): void => {
    const now = keys.active();
    const faces: VaultCard[] = cards.map((c) => {
      const spent = keys.cardSpent(c.id);
      return { ...c, spent, usedUp: spent !== null && usedUp(spent), inUse: now?.card === c.id };
    });
    q<HTMLElement>('#vault-cards').innerHTML = vaultCards(faces, pick, AI_DATA.spendCapUsd);
    q<HTMLElement>('[data-vault="name"]').textContent = cards[pick]!.name;
    const shape = q<HTMLElement>('[data-vault="shape"]');
    const v = input.value.trim();
    shape.textContent = !v ? '○' : keyShapeOk(v) ? '✓' : '✗';
    shape.className = !v ? 'mu' : keyShapeOk(v) ? 'gn' : 'rd';
    q<HTMLElement>('[data-vault="test"]').innerHTML = test === 'testing' ? '<span class="dots"><i></i><i></i><i></i></span>' : test === 'ok' ? '<b class="gn">✓</b>' : test === 'bad' ? '<b class="rd">✗</b>' : '<b class="mu">○</b>';
  };
  const seal = (): void => {
    if (busy) return;
    busy = true;
    test = 'testing';
    say('Testing the key with one tiny call...');
    draw();
    const card = cards[pick]!;
    void testKey(input.value, keys, transport)
      .then(async (r) => {
        if (!r.ok) { test = r.why === 'shape' ? 'idle' : 'bad'; return say(r.message, 'bad'); }
        try {
          await keys.set(card.id, input.value, remember.checked);
          input.value = '';
          test = 'ok';
          say(`Key-Card ${card.name} is sealed and ready.`, 'ok');
        } catch (err) {
          test = 'bad';
          say((err as Error).message, 'bad');
        }
      })
      .finally(() => { busy = false; draw(); });
  };
  const close = (): void => {
    input.value = '';
    window.removeEventListener('keydown', onKey, true);
    window.removeEventListener('keyup', swallow, true);
    el.remove();
    layer.done();
    open = null;
    opts.onClose?.();
  };
  const move = (d: number): void => { pick = (pick + d + cards.length) % cards.length; test = 'idle'; say(''); draw(); };
  // Capture on the window: the vault sees every key first and the game behind it sees none.
  // Typing still reaches the field (stopping propagation doesn't stop the browser putting the letter in).
  function swallow(e: KeyboardEvent): void { e.stopPropagation(); }
  function onKey(e: KeyboardEvent): void {
    e.stopPropagation();
    const inField = e.target === input;
    if (e.key === 'Escape') { e.preventDefault(); return close(); }
    if (e.key === 'Enter' || e.key === 'NumpadEnter') { e.preventDefault(); return seal(); }
    if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !(inField && input.value)) { e.preventDefault(); move(e.key === 'ArrowLeft' ? -1 : 1); }
  }
  window.addEventListener('keydown', onKey, true);
  window.addEventListener('keyup', swallow, true);
  input.addEventListener('input', () => { if (test !== 'testing') test = 'idle'; draw(); });
  el.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const card = t.closest<HTMLElement>('[data-act="card"]');
    if (card) { pick = Number(card.dataset.arg ?? card.getAttribute('data-k') ?? pick); test = 'idle'; say(''); draw(); input.focus(); return; }
    const v = t.closest<HTMLElement>('[data-vault]')?.dataset.vault;
    if (v === 'close') return close();
    if (v === 'seal') return seal();
  });

  layer.host.append(el);
  open = { close };
  draw();
  input.focus();
}

export function closeKeyVault(): void {
  open?.close();
}
