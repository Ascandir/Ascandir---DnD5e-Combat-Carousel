/**
 * Ascandir - DnD5e Combat Carousel
 * Zeigt allen am Tisch, wer im Kampf dran ist, wer als Nächstes kommt und welche Initiative jeder hat.
 * Foundry VTT v14 (14.368) · dnd5e 6.0.6
 */

const ID = "ascandir-dnd5e-combat-carousel";
const VERSION = "__VERSION__";
const ASSET = (f) => `modules/${ID}/assets/${f}?v=${VERSION}`;
const T = (k, data) => (data ? game.i18n.format(`ACC.${k}`, data) : game.i18n.localize(`ACC.${k}`));
const setting = (k) => game.settings.get(ID, k);
const MYSTERY = "icons/svg/mystery-man.svg";
const NOTIFY_SOUND = "sounds/notify.wav";
const BASE_UNIT = 38; // Durchmesser einer Initiative-Plakette in px bei 100 %

/* ------------------------------------------------------------------ */
/*  Einstellungen                                                      */
/* ------------------------------------------------------------------ */

function registerSettings() {
  const rerender = () => Carousel.render();
  const reg = (key, data) => game.settings.register(ID, key, data);

  // --- Welt (nur SL) ---
  reg("timerEnabled", {
    name: "ACC.Settings.TimerEnabled.Name", hint: "ACC.Settings.TimerEnabled.Hint",
    scope: "world", config: true, type: Boolean, default: false, onChange: rerender
  });
  reg("timerSeconds", {
    name: "ACC.Settings.TimerSeconds.Name", hint: "ACC.Settings.TimerSeconds.Hint",
    scope: "world", config: true, type: Number, range: { min: 10, max: 600, step: 5 }, default: 60, onChange: rerender
  });
  reg("timerScope", {
    name: "ACC.Settings.TimerScope.Name", hint: "ACC.Settings.TimerScope.Hint",
    scope: "world", config: true, type: String, default: "players",
    choices: { players: "ACC.Settings.TimerScope.Players", all: "ACC.Settings.TimerScope.All" }, onChange: rerender
  });
  reg("timerExpire", {
    name: "ACC.Settings.TimerExpire.Name", hint: "ACC.Settings.TimerExpire.Hint",
    scope: "world", config: true, type: String, default: "none",
    choices: { none: "ACC.Settings.TimerExpire.None", advance: "ACC.Settings.TimerExpire.Advance" }
  });
  reg("allowPlayerMove", {
    name: "ACC.Settings.AllowPlayerMove.Name", hint: "ACC.Settings.AllowPlayerMove.Hint",
    scope: "world", config: true, type: Boolean, default: false, onChange: rerender
  });
  reg("maxSlots", {
    name: "ACC.Settings.MaxSlots.Name", hint: "ACC.Settings.MaxSlots.Hint",
    scope: "world", config: true, type: Number, range: { min: 3, max: 15, step: 1 }, default: 7, onChange: rerender
  });
  reg("prevCount", {
    name: "ACC.Settings.PrevCount.Name", hint: "ACC.Settings.PrevCount.Hint",
    scope: "world", config: true, type: Number, range: { min: 0, max: 5, step: 1 }, default: 2, onChange: rerender
  });
  reg("imageSource", {
    name: "ACC.Settings.ImageSource.Name", hint: "ACC.Settings.ImageSource.Hint",
    scope: "world", config: true, type: String, default: "portrait",
    choices: { portrait: "ACC.Settings.ImageSource.Portrait", token: "ACC.Settings.ImageSource.Token" }, onChange: rerender
  });
  reg("announceTurn", {
    name: "ACC.Settings.AnnounceTurn.Name", hint: "ACC.Settings.AnnounceTurn.Hint",
    scope: "world", config: true, type: Boolean, default: true
  });
  reg("announceText", {
    name: "ACC.Settings.AnnounceText.Name", hint: "ACC.Settings.AnnounceText.Hint",
    scope: "world", config: true, type: String, default: "{name}'s Turn"
  });
  reg("position", { scope: "world", config: false, type: Object, default: {}, onChange: () => Carousel.applyPosition() });

  // --- Pro Person ---
  reg("show", {
    name: "ACC.Settings.Show.Name", hint: "ACC.Settings.Show.Hint",
    scope: "client", config: true, type: Boolean, default: true, onChange: rerender
  });
  reg("scale", {
    name: "ACC.Settings.Scale.Name", hint: "ACC.Settings.Scale.Hint",
    scope: "client", config: true, type: Number, range: { min: 50, max: 160, step: 5 }, default: 100, onChange: rerender
  });
  reg("nextBanner", {
    name: "ACC.Settings.NextBanner.Name", hint: "ACC.Settings.NextBanner.Hint",
    scope: "client", config: true, type: Boolean, default: true
  });
  reg("showAnnounce", {
    name: "ACC.Settings.ShowAnnounce.Name", hint: "ACC.Settings.ShowAnnounce.Hint",
    scope: "client", config: true, type: Boolean, default: true
  });
  reg("sound", {
    name: "ACC.Settings.Sound.Name", hint: "ACC.Settings.Sound.Hint",
    scope: "client", config: true, type: Boolean, default: true
  });
  reg("playerPosition", { scope: "client", config: false, type: Object, default: {} });
}

/* ------------------------------------------------------------------ */
/*  Hilfsfunktionen                                                    */
/* ------------------------------------------------------------------ */

const now = () => {
  try { const t = game.time?.serverTime; if (Number.isFinite(t) && t > 0) return t; } catch (e) { /* ignorieren */ }
  return Date.now();
};

const escapeHTML = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]));
const isVideo = (src) => /\.(webm|mp4|m4v|ogv)(\?|$)/i.test(src ?? "");
const unit = () => Math.round(BASE_UNIT * setting("scale") / 100);

function activeCombat() {
  const c = game.combat;
  return c?.started && c.turns?.length ? c : null;
}

function turnKey(combat) {
  return `${combat.id}:${combat.round}:${combat.turn}:${combat.combatant?.id ?? ""}`;
}

function skipDefeated(combat) {
  try { return !!combat.settings?.skipDefeated; } catch (e) { return false; }
}

/** Der Kämpfer, der nach dem aktuellen tatsächlich dran ist (so wie Foundry weiterschaltet). */
function nextCombatant(combat) {
  const turns = combat.turns ?? [];
  const n = turns.length;
  if (!n || combat.turn == null) return null;
  const skip = skipDefeated(combat);
  for (let i = 1; i <= n; i++) {
    const c = turns[(combat.turn + i) % n];
    if (skip && c.isDefeated && c !== combat.combatant) continue;
    return c;
  }
  return null;
}

/** Darf der aktuelle Nutzer diesen Kämpfer sehen? */
function canSee(c) {
  if (game.user.isGM || c.isOwner) return true;
  if (c.hidden) return false;
  if (c.token?.hidden) return false;
  return true;
}

/** Bild für das Karussell: eigenes Karussell-Bild → Porträt bzw. Token-Bild (je nach Einstellung). */
function imageOf(c) {
  const custom = c.actor?.getFlag?.(ID, "image");
  if (custom) return custom;
  const tokenImg = c.token?.texture?.src;
  const actorImg = c.actor?.img;
  const generic = (src) => !src || src.includes("mystery-man");
  let src;
  if (setting("imageSource") === "token") src = !generic(tokenImg) ? tokenImg : actorImg;
  else src = !generic(actorImg) ? actorImg : tokenImg;
  return src || c.img || MYSTERY;
}

function nameVisible(c) {
  if (game.user.isGM || c.isOwner) return true;
  const modes = CONST.TOKEN_DISPLAY_MODES ?? {};
  const mode = c.token?.displayName;
  return mode === modes.ALWAYS || mode === modes.HOVER;
}

function initiativeText(c) {
  if (c.initiative == null || !Number.isFinite(Number(c.initiative))) return "–";
  return String(Math.trunc(Number(c.initiative)));
}

function timerApplies(c) {
  if (!setting("timerEnabled") || !c) return false;
  if (setting("timerScope") === "all") return true;
  return !!c.hasPlayerOwner;
}

function playSound() {
  if (!setting("sound")) return;
  try {
    const helper = foundry.audio?.AudioHelper ?? globalThis.AudioHelper;
    helper?.play({ src: NOTIFY_SOUND, volume: 0.7, autoplay: true, loop: false }, false);
  } catch (e) { /* kein Ton */ }
}

/* ------------------------------------------------------------------ */
/*  Freigestellte Bilder erkennen                                      */
/*  Bilder mit transparentem Rand stehen frei auf dem Balken,          */
/*  eckige Porträts werden zu den Rändern hin weich ausgeblendet.      */
/* ------------------------------------------------------------------ */

const Cutout = {
  cache: new Map(),

  /** true = freigestellt, false = eckig, undefined = wird noch geprüft */
  get(src) {
    if (!src || isVideo(src)) return src?.endsWith(".webm") ? true : false;
    if (this.cache.has(src)) {
      const v = this.cache.get(src);
      return v instanceof Promise ? undefined : v;
    }
    const p = this.detect(src).then((v) => {
      this.cache.set(src, v);
      Carousel.render();
      return v;
    });
    this.cache.set(src, p);
    return undefined;
  },

  detect(src) {
    if (/\.(jpe?g)(\?|$)/i.test(src)) return Promise.resolve(false);
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const S = 48;
          const cv = document.createElement("canvas");
          cv.width = S; cv.height = S;
          const ctx = cv.getContext("2d", { willReadFrequently: true });
          ctx.drawImage(img, 0, 0, S, S);
          const d = ctx.getImageData(0, 0, S, S).data;
          let clear = 0, total = 0;
          const check = (x, y) => { total++; if (d[(y * S + x) * 4 + 3] < 40) clear++; };
          for (let i = 0; i < S; i++) { check(i, 0); check(0, i); check(S - 1, i); }
          resolve(clear / total > 0.5);
        } catch (e) { resolve(false); }
      };
      img.onerror = () => resolve(false);
      img.src = src;
    });
  }
};

/* ------------------------------------------------------------------ */
/*  Zugtimer (wird vom aktiven SL in einem Kampf-Flag geführt)        */
/* ------------------------------------------------------------------ */

const Timer = {
  advancedFor: new Set(),
  _syncing: new Set(),

  state(combat) {
    return combat?.getFlag?.(ID, "timer") ?? null;
  },

  isLeadGM() {
    return game.user.isGM && (game.users.activeGM ?? game.user) === game.user;
  },

  /** Restzeit in Millisekunden. */
  remaining(combat) {
    const dur = setting("timerSeconds") * 1000;
    const st = this.state(combat);
    if (!st || st.key !== turnKey(combat)) return dur;
    const used = (st.elapsed ?? 0) + (st.running ? Math.max(0, now() - st.start) : 0);
    return Math.max(0, dur - used);
  },

  running(combat) {
    const st = this.state(combat);
    if (!st || st.key !== turnKey(combat)) return !game.paused;
    return !!st.running;
  },

  manuallyPaused(combat) {
    const st = this.state(combat);
    return !!(st && st.key === turnKey(combat) && st.manual);
  },

  /** Nur der führende SL schreibt: neuen Zug starten bzw. Pause angleichen. */
  async sync(combat, { manual } = {}) {
    if (!this.isLeadGM() || !combat?.started) return;
    if (!timerApplies(combat.combatant)) return;
    const key = turnKey(combat);
    if (this._syncing.has(key) && manual === undefined) return;
    const st = this.state(combat);
    const t = now();
    let next;
    if (!st || st.key !== key) {
      const isManual = manual ?? false;
      next = { key, start: t, elapsed: 0, running: !isManual && !game.paused, manual: isManual };
    } else {
      const isManual = manual ?? !!st.manual;
      const run = !isManual && !game.paused;
      if (run === !!st.running && isManual === !!st.manual) return;
      next = { ...st, manual: isManual, running: run };
      if (st.running && !run) next.elapsed = (st.elapsed ?? 0) + Math.max(0, t - st.start);
      if (!st.running && run) next.start = t;
    }
    this._syncing.add(key);
    try { await combat.setFlag(ID, "timer", next); } catch (e) { console.warn(`${ID} | Timer`, e); }
    finally { this._syncing.delete(key); }
  },

  async togglePause(combat) {
    if (!game.user.isGM || !combat) return;
    await this.sync(combat, { manual: !this.manuallyPaused(combat) });
  },

  /** Läuft alle 250 ms: Anzeige aktualisieren und ggf. automatisch weiterschalten. */
  tick() {
    const combat = activeCombat();
    const plate = Carousel.root?.querySelector(".acc-plate");
    if (!combat || !plate) return;
    const dur = setting("timerSeconds") * 1000;
    const rem = this.remaining(combat);
    Carousel.drawTimer(plate, dur ? rem / dur : 0, rem, this.running(combat));

    if (rem <= 0 && this.isLeadGM() && setting("timerExpire") === "advance" && this.running(combat)) {
      const key = turnKey(combat);
      if (!this.advancedFor.has(key)) {
        this.advancedFor.add(key);
        combat.nextTurn().catch((e) => console.warn(`${ID} | nextTurn`, e));
      }
    }
  }
};

/* ------------------------------------------------------------------ */
/*  Karussell                                                          */
/* ------------------------------------------------------------------ */

const Carousel = {
  root: null,
  lastKey: null,
  interval: null,

  get canDrag() {
    return game.user.isGM || setting("allowPlayerMove");
  },

  ensureRoot() {
    if (this.root?.isConnected) return this.root;
    const root = document.createElement("section");
    root.id = "acc-carousel";
    root.className = "acc-root";
    root.innerHTML = `
      <div class="acc-stage">
        <div class="acc-bar"><div class="acc-bar-glow"></div></div>
        <div class="acc-end acc-left" style="background-image:url('${ASSET("end.svg")}')"></div>
        <div class="acc-end acc-right" style="background-image:url('${ASSET("end.svg")}')"></div>
        <div class="acc-track"></div>
        <div class="acc-round"></div>
        <button type="button" class="acc-gm-timer" style="background-image:url('${ASSET("hourglass.svg")}')"></button>
      </div>`;
    document.body.append(root);
    this.root = root;
    this.bindEvents(root);
    return root;
  },

  /* ---------------- Daten ---------------- */

  buildEntries(combat) {
    const current = combat.combatant;
    const list = [];
    for (const c of combat.turns) {
      if (canSee(c)) list.push({ c, hiddenForPlayers: !!(c.hidden || c.token?.hidden), mystery: false });
      else if (c === current) list.push({ c, mystery: true });
    }
    return { list, curIdx: list.findIndex((e) => e.c === current) };
  },

  windowed(list, curIdx, round) {
    const n = list.length;
    const count = Math.min(n, Math.max(3, setting("maxSlots")));
    const before = Math.min(setting("prevCount"), Math.floor((count - 1) / 2));
    const start = ((curIdx - before) % n + n) % n;
    const out = [];
    for (let i = 0; i < count; i++) {
      const idx = (start + i) % n;
      if (i > 0 && idx === 0) out.push({ divider: true, round: i <= before ? round : round + 1 });
      out.push({ ...list[idx], idx, active: idx === curIdx, past: i < before });
    }
    const activePos = out.findIndex((e) => e.active);
    for (let j = activePos + 1; j < out.length; j++) if (!out[j].divider) { out[j].next = true; break; }
    return { items: out, edges: n > count };
  },

  /* ---------------- Rendern ---------------- */

  render() {
    clearTimeout(this._deb);
    this._deb = setTimeout(() => this._render(), 30);
  },

  _render() {
    if (!game.ready) return;
    const combat = activeCombat();
    this.handleTurnChange(combat);

    if (!setting("show") || !combat) {
      this.root?.classList.add("acc-hidden");
      this.stopTicker();
      return;
    }
    const root = this.ensureRoot();
    root.classList.toggle("acc-gm", game.user.isGM);
    root.classList.toggle("acc-can-drag", this.canDrag);
    root.classList.toggle("acc-timer-on", timerApplies(combat.combatant));
    root.style.setProperty("--u", `${unit()}px`);

    if (game.user.isGM) Timer.sync(combat);

    const { list, curIdx } = this.buildEntries(combat);
    if (!list.length || curIdx < 0) { root.classList.add("acc-hidden"); return; }
    root.classList.remove("acc-hidden");
    const { items, edges } = this.windowed(list, curIdx, combat.round);

    const track = root.querySelector(".acc-track");
    // FLIP: alte Positionen merken (pro Kind-Element, damit die Ebenen erhalten bleiben)
    const before = new Map();
    for (const el of track.children) before.set(el.dataset.key, el.offsetLeft + el.offsetWidth / 2);

    const existing = new Map([...track.children].map((el) => [el.dataset.key, el]));
    const slotItems = items.filter((i) => !i.divider);
    const nodes = items.map((item, i) => {
      const key = item.divider ? "acc-divider" : (item.mystery ? "acc-mystery" : item.c.id);
      let el = existing.get(key);
      existing.delete(key);
      if (!el) { el = document.createElement("div"); el.dataset.key = key; el.dataset.fresh = "1"; }
      if (item.divider) this.fillDivider(el, item);
      else this.fillSlot(el, item, {
        first: i === 0 || !!items[i - 1]?.divider,
        edge: edges && (item === slotItems[0] || item === slotItems[slotItems.length - 1])
      });
      return el;
    });
    track.replaceChildren(...nodes);

    this.layoutChrome(combat);
    this.applyPosition();

    for (const el of track.children) {
      const parts = [...el.children];
      if (el.dataset.fresh) {
        delete el.dataset.fresh;
        for (const p of parts) p.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, easing: "ease-out" });
        continue;
      }
      const old = before.get(el.dataset.key);
      if (old === undefined) continue;
      const dx = old - (el.offsetLeft + el.offsetWidth / 2);
      if (Math.abs(dx) < 1) continue;
      for (const p of parts) {
        p.animate([{ translate: `${dx}px 0` }, { translate: "0 0" }], { duration: 560, easing: "cubic-bezier(.25,.8,.3,1)", composite: "add" });
      }
    }

    this.startTicker();
    Timer.tick();
  },

  fillDivider(el, item) {
    el.className = "acc-divider";
    el.dataset.tooltip = T("RoundStart", { round: item.round });
    el.innerHTML = `<div class="acc-div-star" style="background-image:url('${ASSET("star.svg")}')"></div>
      <div class="acc-div-label">${escapeHTML(T("RoundShort", { round: item.round }))}</div>`;
  },

  fillSlot(el, item, { first, edge }) {
    const { c, mystery } = item;
    const wasActive = el.classList.contains("acc-active");
    el.className = "acc-slot";
    const flags = {
      "acc-active": item.active, "acc-next": item.next, "acc-past": item.past, "acc-first": first, "acc-edge": edge,
      "acc-mystery": mystery, "acc-defeated": !mystery && c.isDefeated,
      "acc-hidden-c": !mystery && game.user.isGM && item.hiddenForPlayers,
      "acc-mine": !mystery && !game.user.isGM && c.isOwner
    };
    for (const [k, v] of Object.entries(flags)) el.classList.toggle(k, !!v);
    el.dataset.combatantId = mystery ? "" : c.id;

    const src = mystery ? ASSET("unknown.svg") : imageOf(c);
    const cut = mystery ? true : Cutout.get(src);
    const init = mystery ? "?" : initiativeText(c);
    const name = !mystery && nameVisible(c) ? (c.token?.name ?? c.name) : "";
    const tip = [name, item.next ? T("NextUp") : ""].filter(Boolean).join(" · ");
    if (tip) el.dataset.tooltip = tip; else delete el.dataset.tooltip;

    const plate = item.active && !mystery && timerApplies(c);
    const sig = [src, cut, init, !!item.active, plate, first].join("|");
    if (el.dataset.sig === sig) return;
    el.dataset.sig = sig;

    const media = isVideo(src)
      ? `<video src="${escapeHTML(src)}" autoplay muted loop playsinline></video>`
      : `<img src="${escapeHTML(src)}" alt="" draggable="false">`;
    const figClass = cut === undefined ? "acc-loading" : (cut ? "acc-cut" : "acc-framed");
    const badge = item.active ? "badge-active.svg" : "badge.svg";

    el.innerHTML = `
      ${first ? "" : `<div class="acc-sep" style="background-image:url('${ASSET("star.svg")}')"></div>`}
      <div class="acc-fig ${figClass}">${media}</div>
      <div class="acc-badge" style="background-image:url('${ASSET(badge)}')"><span>${escapeHTML(init)}</span><i class="acc-state"></i></div>
      ${plate ? `<div class="acc-plate" style="background-image:url('${ASSET("plate.svg")}')">
          <span class="acc-hg" style="background-image:url('${ASSET("hourglass.svg")}')"></span>
          <span class="acc-secs"></span>
          <div class="acc-prog"><div class="acc-prog-fill"></div></div>
        </div>` : ""}`;

    const plateEl = el.querySelector(".acc-plate");
    if (plateEl) plateEl.dataset.tooltip = game.user.isGM ? T("Timer.PauseToggle") : T("Timer.Label");
    if (item.active && !wasActive) {
      el.querySelector(".acc-fig")?.animate(
        [{ opacity: .4 }, { opacity: 1 }],
        { duration: 500, easing: "ease-out" }
      );
    }
  },

  drawTimer(plate, frac, remMs, running) {
    const secs = Math.ceil(remMs / 1000);
    plate.querySelector(".acc-secs").textContent = `${secs}s`;
    plate.querySelector(".acc-prog-fill").style.width = `${(Math.max(0, Math.min(1, frac)) * 100).toFixed(2)}%`;
    plate.classList.toggle("acc-low", frac <= 0.25 && remMs > 0);
    plate.classList.toggle("acc-urgent", secs <= 10 && secs > 0 && running);
    plate.classList.toggle("acc-expired", remMs <= 0);
    plate.classList.toggle("acc-paused", !running);
  },

  /** Balken-Schein unter dem aktiven Charakter, Runde, Pfeile, SL-Knopf. */
  layoutChrome(combat) {
    const root = this.root;
    const active = root.querySelector(".acc-track > .acc-active");
    if (active) {
      const glow = root.querySelector(".acc-bar-glow");
      const target = `${(active.offsetLeft + active.offsetWidth / 2).toFixed(1)}px`;
      if (glow.style.left && glow.style.left !== target) {
        glow.animate([{ left: glow.style.left }, { left: target }], { duration: 560, easing: "cubic-bezier(.25,.8,.3,1)" });
      }
      glow.style.left = target;
    }
    root.querySelector(".acc-round").textContent = T("Round", { round: combat.round });

    const gmBtn = root.querySelector(".acc-gm-timer");
    gmBtn.classList.toggle("acc-on", setting("timerEnabled"));
    gmBtn.dataset.tooltip = setting("timerEnabled") ? T("Timer.TurnOff") : T("Timer.TurnOn");

    const left = root.querySelector(".acc-left");
    const right = root.querySelector(".acc-right");
    const canNext = game.user.isGM || !!combat.combatant?.isOwner;
    left.classList.toggle("acc-clickable", game.user.isGM);
    right.classList.toggle("acc-clickable", canNext);
    if (game.user.isGM) left.dataset.tooltip = T("PrevTurn"); else delete left.dataset.tooltip;
    if (canNext) right.dataset.tooltip = game.user.isGM ? T("NextTurn") : T("EndTurn"); else delete right.dataset.tooltip;
  },

  startTicker() {
    if (!this.interval) this.interval = setInterval(() => Timer.tick(), 250);
  },
  stopTicker() {
    clearInterval(this.interval);
    this.interval = null;
  },

  /* ---------------- Zugwechsel & großer Hinweis ---------------- */

  handleTurnChange(combat) {
    const key = combat ? turnKey(combat) : "none";
    const prev = this.lastKey;
    this.lastKey = key;
    if (prev === null || prev === key || !combat) return;
    const current = combat.combatant;
    // 1) Große Zug-Anzeige für alle
    if (current && setting("announceTurn") && setting("showAnnounce") && canSee(current)) {
      const name = nameVisible(current) ? (current.token?.name ?? current.name) : "???";
      const text = String(setting("announceText") || "{name}'s Turn").replaceAll("{name}", name);
      Banner.queue({ kind: "turn", combatant: current, title: text });
    }
    // 2) Persönlicher Hinweis an den Spieler, der als Nächstes dran ist
    if (game.user.isGM || !setting("nextBanner")) return;
    const next = nextCombatant(combat);
    if (next && next !== current && next.isOwner) {
      Banner.queue({ kind: "next", combatant: next, title: T("Banner.Next"), sub: next.token?.name ?? next.name, sound: true });
    }
  },

  /* ---------------- Position & Ziehen ---------------- */

  storedPosition() {
    if (!game.user.isGM && setting("allowPlayerMove")) {
      const own = setting("playerPosition");
      if (Number.isFinite(own?.x)) return own;
    }
    const world = setting("position");
    return Number.isFinite(world?.x) ? world : null;
  },

  /** Standard: oben mittig, unterhalb des dnd5e-Kalenders (falls sichtbar). */
  defaultTop() {
    const cal = document.getElementById("calendar-hud");
    let bottom = 0;
    if (cal && cal.offsetParent !== null) bottom = cal.getBoundingClientRect().bottom;
    return Math.max(10, bottom + 6);
  },

  applyPosition(pos) {
    const root = this.root;
    if (!root) return;
    const p = pos ?? this.storedPosition();
    const vw = window.innerWidth, vh = window.innerHeight;
    const w = root.offsetWidth || 600, h = root.offsetHeight || 200;
    let cx = p ? p.x * vw : vw / 2;
    let top = p ? p.y * vh : this.defaultTop();
    cx = Math.min(Math.max(cx, Math.min(w / 2, vw / 2)), Math.max(vw - w / 2, vw / 2));
    top = Math.min(Math.max(top, 0), Math.max(0, vh - h));
    root.style.left = `${cx}px`;
    root.style.top = `${top}px`;
  },

  async savePosition() {
    const r = this.root.getBoundingClientRect();
    const pos = { x: (r.left + r.width / 2) / window.innerWidth, y: r.top / window.innerHeight };
    if (game.user.isGM) await game.settings.set(ID, "position", pos);
    else await game.settings.set(ID, "playerPosition", pos);
  },

  async resetPosition() {
    if (game.user.isGM) await game.settings.set(ID, "position", {});
    else await game.settings.set(ID, "playerPosition", {});
    this.applyPosition();
  },

  bindEvents(root) {
    let drag = null;
    root.addEventListener("pointerdown", (ev) => {
      if (ev.button !== 0) return;
      drag = { x: ev.clientX, y: ev.clientY, left: parseFloat(root.style.left), top: parseFloat(root.style.top), moved: false, id: ev.pointerId };
    });
    window.addEventListener("pointermove", (ev) => {
      if (!drag || ev.pointerId !== drag.id) return;
      const dx = ev.clientX - drag.x, dy = ev.clientY - drag.y;
      if (!drag.moved) {
        if (Math.hypot(dx, dy) < 5 || !this.canDrag) return;
        drag.moved = true;
        root.classList.add("acc-dragging");
      }
      const h = root.offsetHeight;
      this.applyPosition({ x: (drag.left + dx) / window.innerWidth, y: Math.min(drag.top + dy, window.innerHeight - h) / window.innerHeight });
    });
    window.addEventListener("pointerup", (ev) => {
      if (!drag || ev.pointerId !== drag.id) return;
      const d = drag;
      drag = null;
      if (!d.moved) return;
      root.classList.remove("acc-dragging");
      this.savePosition();
      root.addEventListener("click", (e) => e.stopPropagation(), { capture: true, once: true });
    });
    root.addEventListener("click", (ev) => this.onClick(ev));
    root.addEventListener("contextmenu", (ev) => this.onContext(ev));
    root.addEventListener("dblclick", (ev) => {
      if (ev.target.closest(".acc-slot, .acc-end, button")) return;
      if (this.canDrag) this.resetPosition();
    });
  },

  async onClick(ev) {
    const combat = activeCombat();
    if (!combat) return;
    const t = ev.target;
    if (t.closest(".acc-gm-timer")) {
      if (game.user.isGM) await game.settings.set(ID, "timerEnabled", !setting("timerEnabled"));
      return;
    }
    if (t.closest(".acc-plate")) {
      if (game.user.isGM) await Timer.togglePause(combat);
      return;
    }
    if (t.closest(".acc-left")) {
      if (game.user.isGM) await combat.previousTurn();
      return;
    }
    if (t.closest(".acc-right")) {
      if (game.user.isGM || combat.combatant?.isOwner) await combat.nextTurn();
      return;
    }
    const slot = t.closest(".acc-slot");
    if (!slot?.dataset.combatantId) return;
    const token = combat.combatants.get(slot.dataset.combatantId)?.token?.object;
    if (!token || !token.visible) return;
    if (token.isOwner) token.control({ releaseOthers: true });
    canvas.animatePan({ x: token.center.x, y: token.center.y, duration: 250 });
  },

  /** Rechtsklick auf eine Figur: eigenes Karussell-Bild festlegen (SL oder Besitzer). */
  async onContext(ev) {
    const slot = ev.target.closest(".acc-slot");
    const combat = activeCombat();
    if (!slot?.dataset.combatantId || !combat) return;
    const c = combat.combatants.get(slot.dataset.combatantId);
    if (!c?.actor || !(game.user.isGM || c.isOwner)) return;
    ev.preventDefault();
    // Unverknüpfte NSC-Token: Bild beim Akteur im Verzeichnis speichern, damit alle Kopien es bekommen.
    const target = (c.actor.isToken && game.user.isGM) ? (game.actors.get(c.actorId) ?? c.actor) : c.actor;
    const current = target.getFlag(ID, "image") ?? "";
    const Dialog = foundry.applications.api.DialogV2;
    const choice = await Dialog.wait({
      window: { title: T("Image.Title") },
      content: `<p>${escapeHTML(T("Image.Hint", { name: target.name }))}</p>`,
      buttons: [
        { action: "pick", label: T("Image.Pick"), icon: "fa-solid fa-image", default: true },
        ...(current ? [{ action: "reset", label: T("Image.Reset"), icon: "fa-solid fa-rotate-left" }] : []),
        { action: "cancel", label: T("Image.Cancel"), icon: "fa-solid fa-xmark" }
      ],
      rejectClose: false
    }).catch(() => null);
    if (choice === "reset") return target.unsetFlag(ID, "image");
    if (choice !== "pick") return;
    const FP = foundry.applications.apps?.FilePicker?.implementation ?? globalThis.FilePicker;
    new FP({
      type: "image",
      current: current || target.img,
      callback: (path) => target.setFlag(ID, "image", path)
    }).render(true);
  }
};

/* ------------------------------------------------------------------ */
/*  Große Anzeigen: Zug-Anzeige (alle) und „Als Nächstes“ (Spieler)  */
/* ------------------------------------------------------------------ */

const Banner = {
  items: [],
  busy: false,

  /** Hinweise nacheinander zeigen, damit sich Zug-Anzeige und „Als Nächstes“ nicht überlagern. */
  queue(item) {
    // Bei schnellen Zugwechseln veraltete Zug-Anzeigen verwerfen
    if (item.kind === "turn") this.items = this.items.filter((i) => i.kind !== "turn");
    this.items.push(item);
    if (!this.busy) this.nextItem();
  },

  async nextItem() {
    const item = this.items.shift();
    if (!item) { this.busy = false; return; }
    this.busy = true;
    try { await this.play(item); } catch (e) { console.warn(`${ID} | Anzeige`, e); }
    this.nextItem();
  },

  play({ kind, combatant: c, title, sub, sound }) {
    return new Promise((resolve) => {
      const src = imageOf(c);
      const cut = Cutout.get(src);
      const media = isVideo(src)
        ? `<video src="${escapeHTML(src)}" autoplay muted loop playsinline></video>`
        : `<img src="${escapeHTML(src)}" alt="">`;
      const el = document.createElement("div");
      el.className = `acc-announce acc-${kind}`;
      el.style.setProperty("--u", `${unit()}px`);
      el.innerHTML = `
        <div class="acc-announce-text">
          <div class="acc-announce-title">${escapeHTML(title)}</div>
          ${sub ? `<div class="acc-announce-sub">${escapeHTML(sub)}</div>` : ""}
          <div class="acc-announce-line"><span style="background-image:url('${ASSET("star.svg")}')"></span></div>
        </div>
        <div class="acc-announce-fig ${cut === false ? "acc-framed" : "acc-cut"}">${media}</div>`;
      document.body.append(el);
      if (sound) playSound();
      const hold = kind === "turn" ? 2600 : 3800;
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        el.classList.add("acc-out");
        setTimeout(() => { el.remove(); resolve(); }, 550);
      };
      el.addEventListener("click", finish);
      setTimeout(finish, hold);
    });
  }
};

/* ------------------------------------------------------------------ */
/*  Hooks                                                              */
/* ------------------------------------------------------------------ */

Hooks.once("init", () => {
  registerSettings();
});

Hooks.once("ready", () => {
  const mod = game.modules.get(ID);
  if (mod) mod.api = {
    render: () => Carousel.render(),
    resetPosition: () => Carousel.resetPosition(),
    showTurn: () => {
      const c = game.combat?.combatant;
      if (c) Banner.queue({ kind: "turn", combatant: c, title: String(setting("announceText")).replaceAll("{name}", c.token?.name ?? c.name) });
    }
  };
  Carousel.render();
  window.addEventListener("resize", () => Carousel.applyPosition());
  // Der dnd5e-Kalender kann nachträglich erscheinen → Standardposition neu berechnen.
  Hooks.on("renderCalendarHUD", () => setTimeout(() => Carousel.applyPosition(), 50));
});

for (const hook of [
  "createCombat", "updateCombat", "deleteCombat", "combatStart", "combatTurnChange",
  "createCombatant", "updateCombatant", "deleteCombatant", "canvasReady",
  "updateToken", "updateActor"
]) {
  Hooks.on(hook, () => Carousel.render());
}

Hooks.on("pauseGame", () => {
  const combat = activeCombat();
  if (combat) Timer.sync(combat);
  Carousel.render();
});
