/* Pass 25 · Master Cut: the final frames. Showtime finish on the main screens (ray burst behind the ball, type auras and a vignette in battle, a holo card in the party, the ball's two halves as the backdrop of party and phone), every page header joins the morph, and the hand-over pages: Master Cut, Style Guide, Page Map, Motion Rules, Build Order. */
const arena24 = pick(PR.comps.arena, 24).fn;
comp(25, 'arena', (o = {}) => o.dim ? arena24(o) : arena24(o).replace('<i class="court24"', '<i class="rays25 ar" data-nocheck></i><i class="cone25 a" data-nocheck></i><i class="cone25 b" data-nocheck></i><i class="court24"') + '<i class="vig25" data-nocheck></i>');
decor(25, 'title', { cls: 'tt25', add: '<i class="spk25" data-nocheck></i>', fn: h => h.replace('<i class="sun21"', '<i class="rays25" data-nocheck></i><i class="sun21"') });
decor(25, 'hub', { cls: 'hb25', add: '<i class="spk25 hb" data-nocheck></i>' });
decor(25, 'party', { cls: 'pk25', add: '<i class="belt25" data-nocheck></i>' });
decor(25, 'menu', { cls: 'mn25', add: '<i class="rays25 mn" data-nocheck></i><i class="belt25 mn" data-nocheck></i>' });
/* every page header joins the morph, so each page change grows out of the last one */
const _p25 = PR.P; PR.P = 24;
for (const id of Object.keys(PR.defs)) { let h = ''; try { h = pick(PR.defs[id], 24).fn(24); } catch (e) { continue; }
  const m = !/data-m="hdr"/.test(h) && h.match(/<div class="(sz-h|gp-h|pz-top|rf-top|hw-top|nbar|ev-where)"/);
  if (m && !['title', 'hub', 'party', 'menu'].includes(id)) decor(25, id, { fn: x => x.replace(`<div class="${m[1]}"`, `<div class="${m[1]}" data-m="hdr"`) }); }
PR.P = _p25;

const JOUR = [[1, 'Clean Slate'], [5, 'Arcade'], [10, 'World Tour'], [15, 'The Journey'], [20, 'Any Screen']];
def(25, 'finale', { t: 'Master Cut', g: 'Guide' }, () => `<div class="scr sz20 fin25"><i class="rays25 f" data-nocheck></i>
  <div class="fin-h">${em24(96)}<div><b>Master Cut</b><span>Pocket Raiders · UI redesign · design 25</span></div></div>
  <div class="fin-n"><p><b>25</b>passes</p><p><b>${screensAt(PR.P).length}</b>pages</p><p><b>0</b>cut-off or covered text</p><p><b>2</b>modes: Hero and Evil</p></div>
  <div class="fin-j">${JOUR.map(j => `<div><img src="sprites/ss-title-${String(j[0]).padStart(2, '0')}.png" alt=""><em>Pass ${j[0]} · ${j[1]}</em></div>`).join('')}<div class="now">${emb('title', .14375)}<em>Pass 25 · Master Cut</em></div></div>
  <div class="fin-b"><div class="btn on" ${go('style')}><b>Style Guide</b></div><div class="btn" ${go('pagemap')}><b>Page Map</b></div><div class="btn" ${go('motion2')}><b>Motion Rules</b></div><div class="btn" ${go('build')}><b>Build Order</b></div></div>
  ${C('keys', [['←→', 'move'], ['Enter', 'open'], ['Esc', 'title']])}</div>`);

const TSC = [['fd', 42, 'FIGHT', 'Display 42 · the one big action'], ['fd', 28, 'Party', 'Display 28 · page and card titles'], ['fd', 20, 'Next Gym', 'Display 20 · labels on panels'], ['fb', 15, 'What will Charizard do?', 'Body 15 · sentences'], ['fb', 13, 'Water moves hit harder.', 'Body 13 · details'], ['fb', 12, 'Stage 12 of 30', 'Body 12 · smallest size allowed']];
def(25, 'style', { t: 'Style Guide', g: 'Guide' }, () => `<div class="scr sz20 sg25">${szh('Style guide', 'The rules every one of these pages follows.').replace('<div class="sz-h"', '<div class="sz-h" data-m="hdr"')}
  <div class="sg-c c1"><b>Colour</b><div class="sg-sw">${SW.map(s => `<p><i style="background:${s[1]}"></i>${s[0]}<u>${s[1]}</u></p>`).join('')}</div><b>Types</b><div class="sg-ty">${TYPES18.map(t => C('ty', t)).join('')}</div></div>
  <div class="sg-c c2"><b>Type sizes</b>${TSC.map(t => `<p><span style="font:${t[0] === 'fd' ? 400 : 700} ${t[1]}px/1.1 var(--${t[0]})${t[0] === 'fd' ? ';text-transform:uppercase' : ''}">${t[2]}</span><u>${t[3]}</u></p>`).join('')}</div>
  <div class="sg-c c3"><b>Buttons</b><div class="sg-bt"><div class="btn on"><b>Chosen</b></div><div class="btn"><b>Normal</b></div><div class="btn off"><b>Locked</b></div></div>
  <b>HP bar</b><div class="sg-hp"><p>${C('hp', 82)}<u>Healthy</u></p><p>${C('hp', 38)}<u>Hurt</u></p><p>${C('hp', 12)}<u>Danger</u></p></div>
  <b>Rules</b><p class="r">No text under 12. Nothing cut off or covered. One job per screen. Colour never carries meaning alone.</p></div>
  ${C('keys', [['Enter', 'page map'], ['Esc', 'back']])}</div>`);

def(25, 'pagemap', { t: 'Page Map', g: 'Guide' }, () => { const all = screensAt(PR.P), gs = {}; all.forEach(s => (gs[s.meta.g] = gs[s.meta.g] || []).push(s));
  return `<div class="scr sz20 pm25">${szh('Page map', all.length + ' pages in ' + Object.keys(gs).length + ' groups. Pick a group to open its first page.').replace('<div class="sz-h"', '<div class="sz-h" data-m="hdr"')}
  <div class="pm-g">${Object.keys(gs).map((g, i) => `<div class="${i === 0 ? 'on' : ''}" ${go(gs[g][0].id)}><b>${g}</b><u>${gs[g].length}</u><span>${gs[g].slice(0, 2).map(s => s.meta.t.replace(/^.* · /, '')).join(', ')}${gs[g].length > 2 ? ' and ' + (gs[g].length - 2) + ' more' : ''}</span></div>`).join('')}</div>
  ${C('keys', [['←→↑↓', 'move'], ['Enter', 'open'], ['Esc', 'back']])}</div>`; });

const MO = [['Morph', 'Any page to any page', .28, 'Shared pieces (header, button bar, cards, the mark) glide and reshape into their new place.'], ['Slide', 'Menus, tabs, lists', .2, 'The new panel slides in from the side it lives on.'], ['Pop', 'Buttons, chips, badges', .36, 'Springs in a little too big, then settles.'], ['Wipe', 'A change of place', .5, 'The tilted ball shuts and opens on the new screen.'], ['Cut-in', 'Gimmicks, bosses, legends', 1.3, 'Background drops, the star slides in, the name slams.'], ['Count', 'Money, Exp, score', .6, 'Numbers roll up to their new value. Skippable.']];
def(25, 'motion2', { t: 'Motion Rules', g: 'Guide' }, () => `<div class="scr sz20 mo25">${szh('Motion rules', 'Six kinds of movement. Every animation in the game is one of them.').replace('<div class="sz-h"', '<div class="sz-h" data-m="hdr"')}
  <div class="mo-r">${MO.map(m => `<p><b>${m[0]}</b><span>${m[1]}</span><i><s style="width:${Math.round(m[2] / 1.3 * 100)}%"></s></i><em>${m[2].toFixed(2)}s</em><u>${m[3]}</u></p>`).join('')}</div>
  <div class="sz-n n25"><span><i>Always</i>outcomes never wait for an animation</span><span><i>Skip</i>Enter skips any of them</span><span><i>Reduced motion</i>all six become a fade</span></div>
  ${C('keys', [['Enter', 'see the motion sheet'], ['Esc', 'back']])}</div>`);

const BO = [['The shell', 'Capsule buttons, page headers, the button bar and the mark. Touches every screen once.', 'All pages'], ['Battle', 'One status bar, thumb pad, court, weather. The screen players spend most time on.', '31 pages'], ['Title and Hub Town', 'Button pad, face-off, News, Notice board.', '9 pages'], ['Party, Summary, Bag', 'Capped cards, one detail panel, This Run.', '14 pages'], ['Events and side roads', 'Four-beat events, the Door, side-road map and prize.', '13 pages'], ['Evil Mode', 'The same parts in Team Nova colours.', '12 pages']];
def(25, 'build', { t: 'Build Order', g: 'Guide' }, () => `<div class="scr sz20 bo25">${szh('Build order', 'A suggested order for turning these mockups into the game. Each step is playable on its own.').replace('<div class="sz-h"', '<div class="sz-h" data-m="hdr"')}
  <div class="bo-r">${BO.map((b, i) => `<p><i>${i + 1}</i><b>${b[0]}</b><span>${b[1]}</span><u>${b[2]}</u></p>`).join('')}</div>
  <div class="sz-n n25"><span><i>Kept</i>the New / Old UI setting, so players can switch back</span><span><i>Never</i>changes battle results or saves: this is looks only</span></div>
  ${C('keys', [['Enter', 'style guide'], ['Esc', 'back']])}</div>`);
