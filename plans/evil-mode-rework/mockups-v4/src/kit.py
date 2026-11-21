# Shared pieces for round-4 pages (960x540 stages, same classes as rounds 2-3).

def top(nm='TEAM NOVA', sub='THE HIDEOUT · LV. 2', day='DAY 18', when='MORNING', funds='₽4,310', heat='22%', roster='4/5', last=('REGION:', 'KANTO')):
    return ('<div class="top">'
            '<div class="team"><div class="emb" style="color:#e8e2ff;background:linear-gradient(180deg,#8a4cc0,#5a2a88)">N</div><div><div class="nm">%s</div><div class="s">%s</div></div></div>'
            '<div><img class="ic l" src="sprites/g-calendar.png" alt=""><div><span class="l">%s</span><span class="v y">%s</span></div></div>'
            '<div><img class="ic l" src="sprites/g-amulet-coin.png" alt=""><div><span class="l">FUNDS</span><span class="v y">%s</span></div></div>'
            '<div><img class="ic l" src="sprites/g-fire-stone.png" alt=""><div><span class="l">HEAT</span><span class="v rd">%s</span></div></div>'
            '<div><img class="ic l" src="sprites/g-fame-checker.png" alt=""><div><span class="l">ROSTER</span><span class="v">%s</span></div></div>'
            '<div style="flex:1"><img class="ic l" src="sprites/g-town-map.png" alt=""><div><span class="l">%s</span><span class="v cy">%s</span></div></div>'
            '</div>') % (nm, sub, day, when, funds, heat, roster, last[0], last[1])


TABS = [('g-card-key', 'HQ'), ('g-town-map', 'REGION MAP'), ('g-fame-checker', 'ROSTER'), ('g-ball', 'POKÉMON'), ('g-machine-part', 'OPERATIONS'), ('g-journal', 'LEDGER')]


def tabs(on):
    return '<div class="tabs">' + ''.join('<div%s><img class="ic" src="sprites/%s.png" alt="">%s<span class="k">%d</span></div>' % (
        ' class="on"' if i == on else '', ic, nm, i + 1) for i, (ic, nm) in enumerate(TABS)) + '</div>'


def fx(k, a):
    """Round-3 overlay set (haze, grade, edge glow, frame) so new pages match the old ones."""
    return ('<div class="haze" aria-hidden="true" style="--hz:%s;--hz2:%s"></div>'
            '<div class="grade" aria-hidden="true" style="--g1:%s;--g2:%s"></div>'
            '<div class="edgeglow" aria-hidden="true" style="--eg:%s"></div><div class="orn" aria-hidden="true"></div>') % (k, a, k, a, k)


def fig(fid, title, desc, body, cls='st vign grain', style=''):
    st = ' style="%s"' % style if style else ''
    return ('<figure id="%s"><div class="frame"><div class="%s"%s>\n%s\n</div></div>\n'
            '<figcaption><b>%s</b><span>%s</span><!--R4:%s--></figcaption></figure>\n') % (fid, cls, st, body, title, desc, fid)


def blade(icon, label, key='', on=False, dim=False, sub=''):
    c = 'blade' + (' on' if on else '') + (' dim' if dim else '')
    s = '<small>%s</small>' % sub if sub else ''
    k = '<span class="kc">%s</span>' % key if key else ''
    return '<div class="%s"><span class="bi"><img class="ic" src="sprites/%s.png" alt=""></span><span class="bl">%s%s</span>%s</div>' % (c, icon, label, s, k)
