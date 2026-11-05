"""Morceaux de la première page (Birdy + globe 3D + récit + chiffres + Pour qui).

Utilisé par tools/home.py. Les textes restent factuels : Birdy est un agent à règles
(il oriente vers nos destinations), un conseiller confirme ensuite les vrais tarifs.
"""

HERO = """<section class="hx" id="accueil" aria-label="Birdy, votre agent golf">
  <div class="hx-bg" aria-hidden="true"><i></i><i></i><i></i></div>
  <div class="in hx-grid">
    <div class="hx-left">
      <p class="hx-eyebrow"><span class="live"></span>Votre agent golf · %N% destinations</p>
      <h1 class="hx-title" aria-label="Le golf sur mesure"><span aria-hidden="true">%TITLE%</span></h1>
      <p class="hx-lead">Dites à Birdy ce dont vous rêvez. Il trouve la destination, prépare votre demande, et un conseiller obtient les vrais tarifs.</p>
      <div class="agent" id="agent">
        <div class="agent-head"><img src="logo.webp" alt="" width="38" height="38"><div><b>Birdy</b><small>Votre agent golf · répond tout de suite</small></div></div>
        <div class="agent-log" id="agent-log" aria-live="polite"></div>
        <div class="agent-sugg" id="agent-sugg">
          <button type="button">On est 8 potes, un week-end au soleil en mars</button>
          <button type="button">Un EVG golf en Espagne</button>
          <button type="button">Séminaire d’entreprise pour 20 personnes</button>
          <button type="button">Du golf au chaud cet hiver</button>
          <button type="button">Les links mythiques d’Écosse</button>
        </div>
        <form class="agent-form" id="agent-form" autocomplete="off">
          <label class="sr" for="agent-in">Votre message à Birdy</label>
          <input id="agent-in" maxlength="240" placeholder="Ex. : 6 amis, Portugal, avril, 1 200 € chacun">
          <button type="submit" aria-label="Envoyer">→</button>
        </form>
      </div>
    </div>
    <div class="hx-right">
      <div class="globe" id="globe">
        <div class="globe-tip" id="globe-tip" hidden></div>
        <div class="globe-hint" id="globe-hint">Faites tourner la Terre · touchez un point doré</div>
        <div class="globe-fallback">Chargement de la carte du monde…</div>
      </div>
      <article class="gcard" id="gcard" aria-live="polite">
        <div class="gcard-pic"><img id="gcard-img" alt=""></div>
        <div class="gcard-txt">
          <p class="gcard-tag" id="gcard-tag"></p>
          <h2 class="gcard-name" id="gcard-name"></h2>
          <p class="gcard-desc" id="gcard-desc"></p>
          <div class="gcard-btns"><button type="button" class="btn gold sm" id="gcard-go">Organiser ici</button><a class="btn glass sm" id="gcard-more" href="/golf/">Découvrir</a></div>
        </div>
      </article>
    </div>
  </div>
  <div class="in explore" id="carte">
    <div class="explore-bar">
      <label class="search"><span class="sr">Rechercher une destination</span><input id="ex-q" type="search" placeholder="Rechercher : Algarve, Maroc, Écosse…" autocomplete="off"></label>
      <div class="explore-regions" id="ex-regions" role="group" aria-label="Filtrer par région">%REGIONS%</div>
    </div>
    <div class="explore-list" id="ex-list" role="list" aria-label="Destinations"></div>
  </div>
</section>

<div class="ticker" aria-hidden="true"><div class="ticker-track">%TICKER%</div></div>
"""

STORY = """<section class="story" id="birdy">
  <div class="in">
    <div class="sec-head rv"><p class="eyebrow">Comment Birdy vous accompagne</p><h2>Du premier message au premier départ</h2></div>
    <div class="story-grid">
      <div class="story-art" aria-hidden="true">
        <svg viewBox="0 0 600 640" id="story-svg">
          <defs><linearGradient id="st-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0E3A31"/><stop offset="1" stop-color="#1F5A44"/></linearGradient></defs>
          <rect width="600" height="640" rx="28" fill="url(#st-sky)"/>
          <circle cx="470" cy="120" r="46" fill="#E8C870" opacity=".18"/><circle cx="470" cy="120" r="28" fill="#E8C870" opacity=".55"/>
          <path d="M0 520 C120 470 240 500 360 488 C460 478 540 450 600 460 V640 H0Z" fill="#2F7A55"/>
          <path d="M0 560 C160 530 320 556 600 530 V640 H0Z" fill="#245F44"/>
          <ellipse cx="520" cy="474" rx="58" ry="11" fill="#8ED07A"/>
          <path d="M524 474 V392" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round"/>
          <path d="M526 393 C540 398 552 394 566 402 C552 408 540 406 526 414Z" fill="#C9A24B"/>
          <ellipse cx="524" cy="475" rx="6" ry="2.4" fill="#0E3A31"/>
          <rect x="66" y="560" width="6" height="22" rx="2" fill="#F3EEE4"/>
          <path id="st-track" d="M70 556 C150 120 430 60 522 470" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="3" stroke-dasharray="4 10" stroke-linecap="round"/>
          <path id="st-path" d="M70 556 C150 120 430 60 522 470" fill="none" stroke="#E2B85C" stroke-width="4" stroke-linecap="round"/>
          <circle id="st-ball" cx="70" cy="556" r="11" fill="#FFFFFF"/>
          <g id="st-marks" fill="#E8D9A8" font-family="Instrument Sans, sans-serif" font-size="15" font-weight="600"></g>
        </svg>
      </div>
      <div class="story-steps">
        <article class="st"><span class="st-n">1</span><h3>Vous parlez à Birdy</h3><p>Une phrase suffit : combien vous êtes, quand vous voulez partir, plutôt soleil ou links mythiques, et votre budget.</p></article>
        <article class="st"><span class="st-n">2</span><h3>Birdy trouve la destination</h3><p>Parmi nos %N% destinations, il vous propose celles qui vous ressemblent, vous les montre sur la carte du monde et prépare votre demande.</p></article>
        <article class="st"><span class="st-n">3</span><h3>Un conseiller obtient les vrais tarifs</h3><p>Hôtel, green-fees, cours pour les débutants, transferts, dîners : un conseiller demande les prix réels et vous envoie une proposition, sans engagement.</p></article>
        <article class="st"><span class="st-n">4</span><h3>Vous partez jouer</h3><p>Votre conseiller reste votre contact jusqu’au départ. Vous n’avez plus qu’à profiter du parcours, entre amis, collègues ou membres du club.</p></article>
      </div>
    </div>
  </div>
</section>

<section class="nums" aria-label="Birdy Agent en chiffres"><div class="in nums-grid">
  <div class="num rv"><b data-count="%N%">%N%</b><span>destinations golf</span></div>
  <div class="num rv"><b data-count="8">8</b><span>régions du monde</span></div>
  <div class="num rv"><b data-count="4">4</b><span>questions pour faire sa demande</span></div>
  <div class="num rv"><b data-count="0" data-suffix=" €">0 €</b><span>pour recevoir une proposition</span></div>
</div></section>
"""

POURQUI = """<section class="who" id="pourqui"><div class="in">
  <div class="sec-head rv"><p class="eyebrow">Pour qui ?</p><h2>Un séjour pour chaque groupe</h2></div>
  <div class="who-grid">%CARDS%</div>
</div></section>
"""

WHO = [
    ("Entre amis", "Un week-end golf au soleil, entre potes, sans rien organiser.", "/guides/week-end-golf-entre-amis-portugal.html", 18141984),
    ("Enterrement de vie de garçon", "Compétition pour rire, grands dîners et soleil garanti.", "/guides/enterrement-de-vie-de-garcon-golf.html", 18489894),
    ("Séminaire d’entreprise", "Fédérer vos équipes autour du golf, débutants compris.", "/guides/seminaire-golf-entreprise.html", 10463590),
    ("Club ou association", "Le voyage annuel du club, compétition et dîner de clôture.", "/guides/voyage-golf-club-association.html", 3404361),
]

CSS = r"""
/* ===== Refonte : Birdy, globe 3D, récit ===== */
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.top{background:rgba(6,32,26,.72);border-bottom:1px solid rgba(255,255,255,.06)}
.top .links a{color:#DCEBE3}
.btn.glass{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.35);color:#FFFFFF;backdrop-filter:blur(6px)}
.btn.glass:hover{background:rgba(255,255,255,.16)}
.eyebrow{font:600 12.5px/1.2 var(--body);letter-spacing:.22em;text-transform:uppercase;color:var(--fairway);margin-bottom:10px}
.sec-head{text-align:center;margin-bottom:clamp(28px,4vw,48px)}
.sec-head h2{font-size:clamp(34px,5vw,58px);color:var(--pine)}

/* Héros */
.hx{position:relative;overflow:hidden;isolation:isolate;background:#06201A;color:#FFFFFF;padding-block:clamp(30px,4vw,56px) 28px}
.hx-bg{position:absolute;inset:0;z-index:-1;pointer-events:none}
.hx-bg i{position:absolute;border-radius:50%;filter:blur(70px);opacity:.55;animation:float 18s ease-in-out infinite alternate}
.hx-bg i:nth-child(1){width:46vw;height:46vw;left:-12vw;top:-16vw;background:#1D6B4E}
.hx-bg i:nth-child(2){width:36vw;height:36vw;right:-8vw;top:10vw;background:#3C8A63;animation-duration:22s}
.hx-bg i:nth-child(3){width:30vw;height:30vw;left:30vw;bottom:-18vw;background:#8A6B25;opacity:.35;animation-duration:26s}
@keyframes float{to{transform:translate3d(6vw,4vw,0) scale(1.15)}}
.hx-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.08fr);gap:clamp(20px,3vw,44px);align-items:center}
.hx-left,.hx-right{min-width:0}
.hx-eyebrow{display:flex;align-items:center;gap:10px;font:600 12.5px/1.2 var(--body);letter-spacing:.2em;text-transform:uppercase;color:#E8D9A8}
.live{width:9px;height:9px;border-radius:50%;background:#5BE08F;box-shadow:0 0 0 0 rgba(91,224,143,.6);animation:live 2s infinite}
@keyframes live{70%{box-shadow:0 0 0 10px rgba(91,224,143,0)}100%{box-shadow:0 0 0 0 rgba(91,224,143,0)}}
.hx-title{font-size:clamp(46px,6.6vw,92px);margin:12px 0 10px;perspective:600px}
.hx-title .w{display:inline-block;white-space:nowrap}
.hx-title .ch{display:inline-block;opacity:0;transform:translateY(.45em) rotateX(-75deg);transform-origin:50% 100%;animation:chIn .9s cubic-bezier(.2,.8,.2,1) forwards;animation-delay:calc(var(--i) * 38ms + 120ms)}
.hx-title .gold{background:linear-gradient(90deg,#E8C870,#C9A24B 40%,#F3E2A6 60%,#C9A24B);-webkit-background-clip:text;background-clip:text;color:transparent;background-size:200% 100%;animation:chIn .9s cubic-bezier(.2,.8,.2,1) forwards,shine 6s linear 1.5s infinite;animation-delay:calc(var(--i) * 38ms + 120ms),1.5s}
@keyframes shine{to{background-position:-200% 0}}
.hx-lead{color:#D7E7DE;font-size:clamp(16px,1.6vw,19px);max-width:46ch}

/* Agent Birdy */
.agent{margin-top:20px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);border-radius:24px;backdrop-filter:blur(14px);box-shadow:0 30px 60px rgba(0,0,0,.35);overflow:hidden}
.agent-head{display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.1)}
.agent-head img{border-radius:50%}
.agent-head b{display:block;font:700 16px/1.1 var(--body)}
.agent-head small{color:#9FC4B2;font-size:12.5px}
.agent-log{max-height:280px;min-height:120px;overflow-y:auto;padding:14px 16px;display:flex;flex-direction:column;gap:10px;scroll-behavior:smooth}
.msg-b,.msg-u{max-width:88%;padding:10px 14px;border-radius:16px;font-size:15px;line-height:1.45;animation:pop .35s cubic-bezier(.2,.8,.2,1)}
.msg-b{align-self:flex-start;background:rgba(255,255,255,.1);border-top-left-radius:6px}
.msg-u{align-self:flex-end;background:var(--gold);color:var(--pine);font-weight:600;border-top-right-radius:6px}
.typing{display:inline-flex;gap:4px}.typing i{width:6px;height:6px;border-radius:50%;background:#CFE2D8;animation:dot 1s infinite}.typing i:nth-child(2){animation-delay:.15s}.typing i:nth-child(3){animation-delay:.3s}
@keyframes dot{50%{opacity:.25;transform:translateY(-3px)}}
@keyframes pop{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}
.recos{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;width:100%;animation:pop .4s ease}
.reco{display:flex;flex-direction:column;border-radius:14px;overflow:hidden;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);cursor:pointer;text-align:left;padding:0;color:#FFFFFF;font:inherit;transition:transform .2s,border-color .2s}
.reco:hover{transform:translateY(-3px);border-color:var(--gold)}
.reco .p{height:62px;background:linear-gradient(135deg,#0E3A31,#2F7A55) center/cover}
.reco b{font:600 13.5px/1.2 var(--body);padding:8px 10px 2px}
.reco small{font-size:11.5px;color:#9FC4B2;padding:0 10px 9px}
.agent-cta{display:flex;flex-wrap:wrap;gap:8px}
.agent-sugg{display:flex;gap:8px;overflow-x:auto;padding:0 16px 12px;scrollbar-width:none}
.agent-sugg::-webkit-scrollbar{display:none}
.agent-sugg button{flex:none;font:500 13px/1 var(--body);color:#E8F1EC;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.18);border-radius:99px;padding:9px 13px;cursor:pointer}
.agent-sugg button:hover{border-color:var(--gold);color:#FFFFFF}
.agent-form{display:flex;gap:8px;padding:10px 12px 12px;border-top:1px solid rgba(255,255,255,.1)}
.agent-form input{flex:1;min-width:0;font:400 15.5px var(--body);color:#FFFFFF;background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.16);border-radius:14px;padding:12px 14px}
.agent-form input::placeholder{color:#8FB3A2}
.agent-form button{flex:none;width:48px;border-radius:14px;border:0;background:var(--gold);color:var(--pine);font-size:20px;font-weight:700;cursor:pointer}

/* Globe */
.hx-right{position:relative}
.globe{position:relative;width:100%;aspect-ratio:1/1;max-height:640px;margin:0 auto;cursor:grab;touch-action:pan-y}
.globe.drag{cursor:grabbing}
.globe canvas{display:block;width:100%!important;height:100%!important}
.globe-fallback{position:absolute;inset:0;display:grid;place-items:center;color:#9FC4B2;font-size:14px;pointer-events:none}
.globe.ready .globe-fallback{display:none}
.globe.noweb .globe-fallback{content:"";}
.globe-hint{position:absolute;left:50%;bottom:6%;transform:translateX(-50%);font-size:12.5px;color:#CFE2D8;background:rgba(0,0,0,.3);padding:7px 12px;border-radius:99px;backdrop-filter:blur(6px);white-space:nowrap;pointer-events:none;transition:opacity .6s}
.globe-tip{position:absolute;z-index:3;transform:translate(-50%,-140%);background:#FFFFFF;color:var(--pine);font:600 13px/1 var(--body);padding:8px 11px;border-radius:10px;box-shadow:0 10px 20px rgba(0,0,0,.3);pointer-events:none;white-space:nowrap}
.gcard{position:absolute;right:0;bottom:4%;width:min(330px,82%);display:flex;gap:12px;align-items:stretch;background:rgba(6,32,26,.78);border:1px solid rgba(255,255,255,.14);border-radius:20px;padding:10px;backdrop-filter:blur(14px);box-shadow:0 24px 50px rgba(0,0,0,.45);transition:transform .45s cubic-bezier(.2,.8,.2,1),opacity .45s}
.gcard.swap{transform:translateY(10px);opacity:0}
.gcard-pic{flex:none;width:96px;border-radius:14px;overflow:hidden;background:linear-gradient(135deg,#0E3A31,#2F7A55)}
.gcard-pic img{width:100%;height:100%;object-fit:cover;display:block}
.gcard-txt{display:flex;flex-direction:column;gap:4px;min-width:0}
.gcard-tag{font:600 10.5px/1.2 var(--body);letter-spacing:.14em;text-transform:uppercase;color:#E8D9A8}
.gcard-name{font:700 24px/1 var(--display);color:#FFFFFF}
.gcard-desc{font-size:13px;color:#CFE2D8;line-height:1.4}
.gcard-btns{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}
.btn.sm{padding:9px 13px;font-size:13px}

/* Exploration */
.explore{margin-top:clamp(20px,3vw,34px)}
.explore-bar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between}
.search input{width:min(340px,100%);font:400 15px var(--body);color:#FFFFFF;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.18);border-radius:99px;padding:11px 16px}
.search input::placeholder{color:#8FB3A2}
.search{flex:1 1 260px;max-width:340px}
.explore-regions{display:flex;flex-wrap:wrap;gap:6px}
.explore-regions button,.explore-list button{font:600 13px/1 var(--body);color:#E8F1EC;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.16);border-radius:99px;padding:9px 13px;cursor:pointer;transition:background .2s,border-color .2s,color .2s}
.explore-regions button:hover,.explore-list button:hover{border-color:var(--gold)}
.explore-regions button[aria-pressed="true"]{background:var(--gold);border-color:var(--gold);color:var(--pine)}
.explore-list{display:flex;gap:8px;overflow-x:auto;padding:14px 2px 6px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.25) transparent}
.explore-list button{flex:none;display:flex;align-items:center;gap:8px}
.explore-list button small{font-weight:400;color:#9FC4B2}
.explore-list button[aria-pressed="true"]{background:#FFFFFF;color:var(--pine);border-color:#FFFFFF}
.explore-list .none{color:#9FC4B2;font-size:14px;padding:8px 2px}

/* Bandeau défilant */
.ticker{background:var(--gold);color:var(--pine);overflow:hidden;white-space:nowrap;padding-block:12px}
.ticker-track{display:inline-flex;gap:34px;animation:tick 70s linear infinite;font:700 22px/1 var(--display)}
.ticker-track span{display:inline-flex;align-items:center;gap:34px}
.ticker-track span::after{content:"";width:7px;height:7px;background:var(--pine);transform:rotate(45deg)}
.ticker:hover .ticker-track{animation-play-state:paused}
@keyframes tick{to{transform:translateX(-50%)}}

/* Récit au défilement */
.story{padding-block:clamp(56px,8vw,110px)}
.story-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(24px,4vw,64px);align-items:start}
.story-art{position:sticky;top:96px}
.story-art svg{display:block;width:100%;height:auto;border-radius:28px;box-shadow:0 30px 60px rgba(14,58,49,.25)}
.story-steps{display:flex;flex-direction:column;gap:clamp(40px,14vh,140px);padding-block:8vh 18vh}
.st{position:relative;padding:22px 24px 22px 76px;border-radius:22px;border:1px solid var(--line);background:#FFFFFF;opacity:.38;transform:scale(.97);transition:opacity .5s,transform .5s,box-shadow .5s,border-color .5s}
.st.on{opacity:1;transform:none;border-color:var(--gold);box-shadow:0 20px 44px rgba(14,58,49,.14)}
.st-n{position:absolute;left:20px;top:20px;width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:var(--pine);color:var(--gold);font:700 21px/1 var(--display)}
.st h3{font:600 21px/1.25 var(--body);color:var(--pine);margin-bottom:6px}
.st p{color:var(--muted)}

/* Chiffres */
.nums{background:var(--pine);color:#FFFFFF;padding-block:clamp(40px,6vw,70px)}
.nums-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px;text-align:center}
.num b{display:block;font:700 clamp(46px,6vw,76px)/1 var(--display);color:var(--gold);font-variant-numeric:tabular-nums}
.num span{color:#CFE2D8;font-size:15px}

/* Pour qui */
.who{padding-block:clamp(56px,8vw,100px);background:var(--mist)}
.who-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px;perspective:1200px}
.wc{position:relative;display:block;aspect-ratio:3/4;border-radius:24px;overflow:hidden;text-decoration:none;color:#FFFFFF;background:linear-gradient(135deg,#0E3A31,#2F7A55);box-shadow:0 20px 40px rgba(14,58,49,.18);transform-style:preserve-3d;transition:transform .25s ease,box-shadow .25s}
.wc img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .8s cubic-bezier(.2,.8,.2,1)}
.wc:hover img{transform:scale(1.07)}
.wc::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 35%,rgba(4,24,19,.9))}
.wc .gl{position:absolute;inset:0;z-index:2;background:radial-gradient(circle at var(--gx,50%) var(--gy,0%),rgba(255,255,255,.35),transparent 50%);mix-blend-mode:overlay;opacity:0;transition:opacity .3s}
.wc:hover .gl{opacity:1}
.wc .t{position:absolute;z-index:3;left:0;right:0;bottom:0;padding:20px;display:flex;flex-direction:column;gap:6px;transform:translateZ(30px)}
.wc b{font:700 clamp(24px,2.2vw,30px)/1.05 var(--display)}
.wc small{color:#D7E7DE;font-size:14px;line-height:1.4}
.wc em{font-style:normal;font-weight:600;color:#E8D9A8;font-size:14px}

/* Carrousel déplacé : titre secondaire */
.cx .cx-title{font-size:clamp(38px,5.4vw,72px);perspective:600px}
.cx .cx-title .w{display:inline-block;white-space:nowrap}
.cx .cx-title .ch{display:inline-block}

/* Apparitions au défilement */
.rv.pre{opacity:0;transform:translateY(26px);filter:blur(6px)}
.rv{transition:opacity .8s cubic-bezier(.2,.8,.2,1),transform .8s cubic-bezier(.2,.8,.2,1),filter .8s}

@media (max-width:1000px){.who-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:900px){
  .hx-grid{grid-template-columns:minmax(0,1fr)}
  .hx-right{order:-1;max-width:560px;margin:0 auto;width:100%}
  .gcard{position:relative;right:auto;bottom:auto;width:100%;margin-top:-6%}
  .story-grid{grid-template-columns:1fr}
  .story-art{position:sticky;top:70px;z-index:1;max-width:420px;margin:0 auto}
  .story-steps{gap:28px;padding-block:20px}
  .nums-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media (max-width:560px){.recos{grid-template-columns:1fr 1fr 1fr}.reco .p{height:48px}.who-grid{grid-template-columns:1fr}.wc{aspect-ratio:4/3}.story-art{max-width:300px}}
@media (prefers-reduced-motion:reduce){
  .hx-bg i,.live,.ticker-track,.hx-title .gold{animation:none}
  .hx-title .ch{animation:none;opacity:1;transform:none}
  .rv.pre{opacity:1;transform:none;filter:none}
  .st{transition:none}
}
"""
