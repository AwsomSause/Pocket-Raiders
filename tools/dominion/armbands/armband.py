import colorsys, json, sys
from PIL import Image
from collections import defaultdict

def hls(c): return colorsys.rgb_to_hls(*[v/255 for v in c[:3]])
def chroma(c): return (max(c[:3])-min(c[:3]))/255

def family(c):
  h,l,s=hls(c)
  if l<0.06: return 'outline'
  if chroma(c)<0.12: return 'neutral-light' if l>=0.55 else 'neutral-dark'
  return 'hue-%d'%(int(((h*360)+15)%360//30))

def analyse(im):
  W,H=im.size; px=im.load()
  opq=[(x,y) for y in range(H) for x in range(W) if px[x,y][3]>0]
  ys=[p[1] for p in opq]; top,bot=min(ys),max(ys)
  headY=top+int(0.28*(bot-top))
  # outline set: colours that sit on the silhouette edge
  edge=defaultdict(int); cnt=defaultdict(int); head=defaultdict(int)
  for x,y in opq:
    c=px[x,y][:3]; cnt[c]+=1
    if y<=headY: head[c]+=1
    if any(not(0<=x+dx<W and 0<=y+dy<H) or px[x+dx,y+dy][3]==0 for dx,dy in ((1,0),(-1,0),(0,1),(0,-1))): edge[c]+=1
  nedge=sum(edge.values())
  outline={c for c in cnt if hls(c)[1]<0.08 or (edge[c]>=0.12*nedge and hls(c)[1]<0.25)}
  def skin(c):
    h,l,s=hls(c); return 8<=h*360<=45 and s>=0.2 and l>=0.4
  fam=defaultdict(lambda:{'body':0,'head':0,'colours':defaultdict(int)})
  for c,n in cnt.items():
    if c in outline: f='outline'
    elif skin(c): f='skin'
    elif head[c]>0.5*n: f='head'
    else: f=family(c)
    fam[f]['colours'][c]+=n
    fam[f]['body']+=n-head[c]; fam[f]['head']+=head[c]
  def isskin(f,info):
    # skin: warm hue, light, mostly small; detect via colour average
    if not f.startswith('hue-'): return False
    tot=sum(info['colours'].values())
    l=sum(hls(c)[1]*n for c,n in info['colours'].items())/tot
    h=sum(hls(c)[0]*n for c,n in info['colours'].items())/tot*360
    return 5<=h<=45 and l>0.5
  cand=[]
  for f,info in fam.items():
    if f in ('outline','skin','head'): continue
    cand.append((info['body'],f))
  cand.sort(reverse=True)
  roles={}
  if cand: roles['primary']=cand[0][1]
  if len(cand)>1: roles['secondary']=cand[1][1]
  return {'outline':['#%02x%02x%02x'%c for c in outline],'top':top,'bot':bot,'headY':headY,'families':{f:{'body':i['body'],'head':i['head'],'colours':['#%02x%02x%02x'%c for c,_ in sorted(i['colours'].items(),key=lambda t:-t[1])]} for f,i in fam.items()},'roles':roles}

def hex2rgb(h): h=h.lstrip('#'); return tuple(int(h[i:i+2],16) for i in (0,2,4))

def swap(im,an,team):
  im=im.copy(); px=im.load(); W,H=im.size
  maps={}
  for role in ('primary','secondary'):
    f=an['roles'].get(role)
    if not f: continue
    cols=[hex2rgb(c) for c in an['families'][f]['colours']]
    ls=[hls(c)[1] for c in cols]; ref=sum(ls)/len(ls)
    th,tl,ts=hls(hex2rgb(team[role]))
    for c,l in zip(cols,ls):
      nl=min(0.95,max(0.07,tl+(l-ref)*0.9))
      r,g,b=colorsys.hls_to_rgb(th,nl,ts)
      maps[c]=(round(r*255),round(g*255),round(b*255))
  # keep head-zone components (hair, hats-as-hair): a 4-connected blob of swappable
  # colours whose centre sits above the shoulder line stays as drawn.
  src=im.copy().load(); seen=set(); headY=an['headY']
  for y in range(H):
    for x in range(W):
      if (x,y) in seen or not src[x,y][3] or src[x,y][:3] not in maps: continue
      comp=[(x,y)]; seen.add((x,y)); i=0
      while i<len(comp):
        cx,cy=comp[i]; i+=1
        for nx,ny in ((cx+1,cy),(cx-1,cy),(cx,cy+1),(cx,cy-1)):
          if 0<=nx<W and 0<=ny<H and (nx,ny) not in seen and src[nx,ny][3] and src[nx,ny][:3] in maps:
            seen.add((nx,ny)); comp.append((nx,ny))
      if sum(p[1] for p in comp)/len(comp) < headY: continue
      for cx,cy in comp: px[cx,cy]=maps[src[cx,cy][:3]]+(src[cx,cy][3],)
  return im,maps

FONT={ # 3x5
'A':['010','101','111','101','101'],'B':['110','101','110','101','110'],'C':['011','100','100','100','011'],
'D':['110','101','101','101','110'],'E':['111','100','110','100','111'],'F':['111','100','110','100','100'],
'G':['011','100','101','101','011'],'H':['101','101','111','101','101'],'I':['111','010','010','010','111'],
'J':['001','001','001','101','010'],'K':['101','101','110','101','101'],'L':['100','100','100','100','111'],
'M':['101','111','111','101','101'],'N':['101','111','111','111','101'],'O':['010','101','101','101','010'],
'P':['110','101','110','100','100'],'Q':['010','101','101','111','011'],'R':['110','101','110','101','101'],
'S':['011','100','010','001','110'],'T':['111','010','010','010','010'],'U':['101','101','101','101','111'],
'V':['101','101','101','101','010'],'W':['101','101','111','111','101'],'X':['101','101','010','101','101'],
'Y':['101','101','010','010','010'],'Z':['111','001','010','100','111']}

OUT=set()
def is_outline(p): return p[3]>0 and (p[:3] in OUT or hls(p)[1]<0.08)

def arm_section(px,W,y,side,cx):
  """from the outer silhouette edge on `side`, walk inward: outline run, then fill run until next outline. Returns (x0,x1) of fill."""
  xs=range(0,W) if side<0 else range(W-1,-1,-1)
  xs=[x for x in xs if (x<cx if side<0 else x>cx)]
  i=0
  while i<len(xs) and px[xs[i],y][3]==0: i+=1
  if i>=len(xs): return None
  while i<len(xs) and is_outline(px[xs[i],y]): i+=1
  s=i
  while i<len(xs) and px[xs[i],y][3]>0 and not is_outline(px[xs[i],y]): i+=1
  if i==s or i>=len(xs) or px[xs[i],y][3]==0: return None
  a,b=xs[s],xs[i-1]
  return (min(a,b),max(a,b))

def find_anchor(im,an,prefer=+1,override=None):
  global OUT; OUT={hex2rgb(c) for c in an['outline']}
  W,H=im.size; px=im.load()
  # shoulder row: first row below head where silhouette is wide
  def width(y):
    xs=[x for x in range(W) if px[x,y][3]>0]; return (min(xs),max(xs)) if xs else None
  top,bot=an['top'],an['bot']; h=bot-top
  # shoulder row: first row under the face where the silhouette reaches 80% of
  # its widest point across the chest band
  ws={y:width(y)[1]-width(y)[0] for y in range(top,bot) if width(y)}
  chest=max(ws.get(y,0) for y in range(top+int(.2*h),top+int(.45*h)))
  sy=next((y for y in range(top+int(.15*h),top+int(.45*h)) if ws.get(y,0)>=0.8*chest),top+int(.3*h))
  cx=sum(width(y)[0]+width(y)[1] for y in range(sy,sy+6))/12
  best=None
  if override:
    side=1 if override['side']=='right' else -1; y0=override['y']; n=override.get('h',7)
    rows=[arm_section(px,W,y,side,override.get('cx',cx)) for y in range(y0,y0+n)]
    return ({'side':override['side'],'y':y0,'rows':rows} if all(rows) else None),sy
  for side in (prefer,-prefer):
    for y0 in range(sy+2,sy+int(.22*h)):
      rows=[arm_section(px,W,y,side,cx) for y in range(y0,y0+7)]
      if all(r and 3<=r[1]-r[0]+1<=10 for r in rows):
        w=[r[1]-r[0]+1 for r in rows]
        if max(w)-min(w)<=3:
          best={'side':'right' if side>0 else 'left','y':y0,'rows':rows}; break
    if best: break
  return best,sy

def draw_band(im,anchor,team,letter):
  im=im.copy(); px=im.load()
  # band takes whichever team colour stands out more from the sleeve it sits on
  sleeve=[px[x,anchor['y']+i][:3] for i,(a,b) in enumerate(anchor['rows']) for x in range(a,b+1)]
  sl=tuple(sum(c[k] for c in sleeve)/len(sleeve) for k in range(3))
  dist=lambda c:sum((c[k]-sl[k])**2 for k in range(3))
  band=max((hex2rgb(team['secondary']),hex2rgb(team['primary'])),key=dist)
  lum=lambda c:0.299*c[0]+0.587*c[1]+0.114*c[2]
  ink=(255,255,255) if lum(band)<150 else (24,20,32)
  bh,bl,bs=hls(band)
  dark=tuple(round(v*255) for v in colorsys.hls_to_rgb(bh,max(0.05,bl*0.6),bs))
  rows=anchor['rows']
  for i,(x0,x1) in enumerate(rows):
    y=anchor['y']+i
    for x in range(x0,x1+1):
      # edge rows and the shaded side get the dark tone: reads as a wrapped cylinder
      shade = i in (0,len(rows)-1) or (x==x0 if anchor['side']=='left' else x==x1)
      px[x,y]=(dark if shade else band)+(255,)
  g=FONT.get(letter.upper())
  if g:
    # centre a 3x5 glyph in rows 1..5
    for gy in range(5):
      x0,x1=rows[gy+1]; inner=x1-x0+1
      gx0=x0+(inner-3)//2 + (0 if anchor['side']=='right' else 1 if inner>=5 else 0)
      for gx in range(3):
        if g[gy][gx]=='1' and x0<=gx0+gx<=x1: px[gx0+gx,anchor['y']+gy+1]=ink+(255,)
  return im

if __name__=='__main__':
  pass
