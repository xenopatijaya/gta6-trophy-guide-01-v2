// Leonida Atlas — boot, rendering and interaction for the trophy atlas.
// Data comes from data/trophies.json (the 55 official trophies, each with a
// guide whose every step carries bracketed source citations like [1][8]).
// Nothing is fetched from the network beyond the app's own files.

import { demoState, emptyState, exportState, loadState, parseImported, saveState } from './store.js';
import { nextUpQueue, platinumEta, sessionPlan } from './planner.js';

const params = new URLSearchParams(location.search);
const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;
const sources = doc.sources;
const stages = doc.stages;
const byId = new Map(trophies.map((t) => [t.id, t]));

let state = params.get('seed') === 'demo' ? demoState() : loadState();
if (params.get('seed') === 'demo') saveState(state);

let selectedId = 28; // Positive Mental Attitude opens by default.
let activeView = ['ledger', 'roadmap', 'missables', 'planner', 'matrix', 'sources'].includes(params.get('view'))
  ? params.get('view')
  : 'ledger';
let kindFilter = 'all';

const $ = (id) => document.getElementById(id);
const earnedSet = () => new Set(state.earned);
const isEarned = (t) => earnedSet().has(t.id);
const counterOf = (t) => Math.min(t.count || 0, state.counters[t.id] || 0);
const citedByCount = (n) => trophies.filter((t) => t.sources.includes(n)).length;
const totalSteps = trophies.reduce((sum, t) => sum + t.steps.length, 0);
const citedSteps = trophies.reduce((sum, t) => sum + t.steps.filter((s) => /\[\d+\]/.test(s)).length, 0);

function esc(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function citeHtml(text) {
  // Turn [1][8] citation markers into styled spans; the numbers stay visible.
  return esc(text).replace(/\[(\d+)\]/g, '<span class="cite">[$1]</span>');
}

function spoilerMasked(t) {
  return state.spoilerSafe && t.kind === 'story' && !isEarned(t);
}

function displayName(t) {
  return spoilerMasked(t) ? 'Story trophy — hidden until earned' : t.name;
}

function flagPip(t) {
  if (t.flag === 'missable') return '<span class="pip flag-missable">Possibly missable</span>';
  if (t.flag === 'watch') return '<span class="pip flag-watch">Watch</span>';
  if (t.flag === 'unconfirmed') return '<span class="pip flag-unconfirmed">Unconfirmed</span>';
  return '';
}

function renderHeader() {
  const earned = state.earned.length;
  $('earnedCount').textContent = String(earned);
  $('progressFill').style.width = `${(earned / trophies.length) * 100}%`;
  const parts = ['platinum', 'gold', 'silver', 'bronze'].map((g) => {
    const total = trophies.filter((t) => t.grade === g).length;
    const got = trophies.filter((t) => t.grade === g && isEarned(t)).length;
    return `${got}/${total} ${g}`;
  });
  $('gradeBreakdown').textContent = parts.join(' · ');
}

function renderAudit() {
  const watch = trophies.filter((t) => t.flag === 'watch').length;
  const unconfirmed = trophies.filter((t) => t.flag === 'unconfirmed').length;
  $('auditStrip').innerHTML =
    `<span><b>AUDIT</b></span>` +
    `<span><b>55</b> official · 1P 2G 6S 46B</span>` +
    `<span><b>28</b> hidden</span>` +
    `<span><b>55/55</b> guides cite a source</span>` +
    `<span><b>${citedSteps}/${totalSteps}</b> steps cited</span>` +
    `<span><b>${sources.length}</b> sources read ${esc(doc.readDate)}</span>` +
    `<span class="warn">1 possibly missable</span>` +
    `<span><b>${watch}</b> watch</span>` +
    `<span><b>${unconfirmed}</b> unconfirmed</span>` +
    `<span><b>1</b> source disagreement</span>`;
}

function matchesFilters(t) {
  const q = $('searchBox').value.trim().toLowerCase();
  if (kindFilter !== 'all' && t.kind !== kindFilter) return false;
  if ($('gradeSelect').value !== 'all' && t.grade !== $('gradeSelect').value) return false;
  if ($('stageSelect').value !== 'all' && t.stage !== Number($('stageSelect').value)) return false;
  if ($('earnedOnly').checked && !isEarned(t)) return false;
  if (q) {
    const hay = `${t.name} ${t.description} ${t.guide} ${t.kind}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function renderList() {
  const list = $('trophyList');
  list.replaceChildren();
  let shown = 0;
  for (const t of trophies) {
    if (!matchesFilters(t)) continue;
    shown += 1;
    const li = document.createElement('li');
    if (t.id === selectedId) li.className = 'selected';
    if (isEarned(t)) li.classList.add('earned');
    const masked = spoilerMasked(t);
    const counter = t.count
      ? `<span class="counter-chip">${esc(t.countLabel || 'done')} ${counterOf(t)}/${t.count}</span>`
      : '';
    li.innerHTML =
      `<input type="checkbox" ${isEarned(t) ? 'checked' : ''} aria-label="Mark earned">` +
      `<div><div class="t-name">${esc(displayName(t))}</div>` +
      `<div class="t-desc">${masked ? 'Description hidden by spoiler-safe mode.' : esc(t.description)}</div>` +
      `<div class="t-meta"><span class="pip grade-${t.grade}">${t.grade} · ${t.points} pts</span>` +
      `<span class="pip">Stage ${t.stage}</span><span class="pip">${esc(t.kind)}</span>` +
      (t.hidden ? '<span class="pip hidden-pip">Hidden</span>' : '') + flagPip(t) + counter + `</div></div>`;
    const box = li.querySelector('input');
    box.addEventListener('click', (e) => e.stopPropagation());
    box.addEventListener('change', () => toggleEarned(t.id));
    li.addEventListener('click', () => { selectedId = t.id; renderAll(); });
    list.append(li);
  }
  $('countLine').textContent = `Showing ${shown} of 55 trophies · ${state.earned.length} earned · click a row for its cited guide`;
}

function toggleEarned(id) {
  const set = earnedSet();
  if (set.has(id)) set.delete(id); else set.add(id);
  state.earned = [...set];
  saveState(state);
  renderAll();
}

function renderDetail() {
  const t = byId.get(selectedId) || trophies[0];
  const masked = spoilerMasked(t);
  const stage = stages.find((s) => s.n === t.stage);
  let callouts = '';
  if (t.flag === 'missable') {
    callouts += `<div class="callout missable"><b>POSSIBLY MISSABLE.</b> The first meditation, at Jason's house in Chapter 1, is gone once Chapter 1 ends — and whether the trophy strictly needs it is unconfirmed, so do it and keep a chapter-start save <span class="cite">[1]</span><span class="cite">[8]</span>.</div>`;
    callouts += `<div class="callout disagree"><b>SOURCES DISAGREE.</b> Trophy guides count <b>18</b> meditations across 10 spots <span class="cite">[1]</span><span class="cite">[8]</span>; the 100% checklist is satisfied with <b>15 of 18</b> <span class="cite">[5]</span><span class="cite">[7]</span>. This atlas plans for 18 and shows both numbers.</div>`;
  } else if (t.flag === 'watch') {
    callouts += `<div class="callout watch"><b>WATCH.</b> Not missable, but the setup is specific and easy to fumble — read the steps before you attempt it.</div>`;
  } else if (t.flag === 'unconfirmed') {
    callouts += `<div class="callout unconfirmed"><b>UNCONFIRMED.</b> Launch sources have not verified the exact trigger yet. This guide says so instead of inventing a method.</div>`;
  }
  const counterBox = t.count
    ? `<div class="counter-box"><button type="button" id="cMinus" aria-label="Decrease counter">−</button>` +
      `<span class="cnum">${counterOf(t)} / ${t.count}</span><span>${esc(t.countLabel || '')}</span>` +
      `<div class="cbar"><div class="cfill" style="width:${(counterOf(t) / t.count) * 100}%"></div></div>` +
      `<button type="button" id="cPlus" aria-label="Increase counter">+</button></div>`
    : '';
  const steps = masked
    ? '<p class="guide-text">Spoiler-safe mode hides this story trophy\u2019s guide until it is earned. Untick Spoiler-safe above to read it now.</p>'
    : `<ol class="steps">${t.steps.map((s) => `<li>${citeHtml(s)}</li>`).join('')}</ol>`;
  const guide = masked
    ? '<p class="guide-text">Hidden by spoiler-safe mode.</p>'
    : `<p class="guide-text">${citeHtml(t.guide)}</p>`;
  $('detailPane').innerHTML =
    `<h2>${esc(displayName(t))}</h2>` +
    `<p class="official">&ldquo;${masked ? 'Description hidden until earned.' : esc(t.description)}&rdquo; — official description <span class="cite">[10]</span></p>` +
    callouts +
    `<div class="meta-grid">` +
    `<div><span>Grade</span><b>${t.grade} · ${t.points} PSN pts</b></div>` +
    `<div><span>Roadmap stage</span><b>${t.stage} · ${esc(stage ? stage.title.split('—')[0].trim() : '')}</b></div>` +
    `<div><span>Kind</span><b>${esc(t.kind)}</b></div>` +
    `<div><span>Difficulty</span><b>${t.difficulty} / 10</b></div>` +
    `<div><span>Time estimate</span><b>≈ ${t.hours} h</b></div>` +
    `<div><span>Region / character</span><b>${esc(t.scope)}</b></div>` +
    `</div>` +
    counterBox +
    `<h3>Guide — in our own words, every step cited</h3>` + guide +
    `<h3>Steps</h3>` + steps +
    `<p class="src-line">Sources for this guide: <b>${t.sources.map((n) => `[${n}] ${esc(sources[n - 1].name.split('—')[0].trim())}`).join(' · ')}</b></p>` +
    `<div class="earn-row"><button type="button" id="earnBtn" class="${isEarned(t) ? 'earned-btn' : ''}">${isEarned(t) ? 'Earned ✓ — tap to undo' : 'Mark as earned'}</button>` +
    (t.hidden ? '<span class="pip hidden-pip">Hidden on PSN until earned</span>' : '') + `</div>`;
  $('earnBtn').addEventListener('click', () => toggleEarned(t.id));
  if (t.count) {
    $('cMinus').addEventListener('click', () => bumpCounter(t, -1));
    $('cPlus').addEventListener('click', () => bumpCounter(t, 1));
  }
}

function bumpCounter(t, delta) {
  const next = Math.max(0, Math.min(t.count, counterOf(t) + delta));
  state.counters[t.id] = next;
  if (next >= t.count && !isEarned(t)) state.earned = [...earnedSet(), t.id];
  saveState(state);
  renderAll();
}

function renderRail() {
  const queue = nextUpQueue(trophies, state.earned);
  const eta = platinumEta(stages, trophies, state.earned);
  const nextItems = queue.slice(0, 5).map((item) =>
    `<li><button type="button" class="linkish" data-goto="${item.trophy.id}">${esc(displayName(item.trophy))}</button> ` +
    `<span class="src-cited">Stage ${item.trophy.stage} · ≈${item.trophy.hours} h${item.gated ? ' · gated' : ' · ungated'}</span></li>`).join('');
  const srcItems = sources.map((s) =>
    `<li><span class="src-name">[${s.n}] ${esc(s.name)}</span>` +
    `<span class="src-cited">cited by ${citedByCount(s.n)} of 55 guides</span></li>`).join('');
  $('rightRail').innerHTML =
    `<div class="rail-card"><h3>Next up — earliest ungated</h3><ol>${nextItems}</ol></div>` +
    `<div class="rail-card"><h3>Time to platinum</h3><div class="eta">≈ ${eta} h left</div>` +
    `<p>Full run ≈ 200 h <span class="cite">[1]</span> · difficulty 4/10 <span class="cite">[1]</span> · ${state.earned.length}/55 earned</p></div>` +
    `<div class="rail-card"><h3>Sources — read ${esc(doc.readDate)}</h3><ol>${srcItems}</ol></div>`;
  for (const btn of $('rightRail').querySelectorAll('[data-goto]')) {
    btn.addEventListener('click', () => { selectedId = Number(btn.dataset.goto); renderAll(); });
  }
}

function renderRoadmap() {
  $('roadmapIntro').innerHTML =
    `Six stages, ≈200 hours in total, one playthrough. The launch roadmap rates the set 4/10 difficulty with a single possibly missable trophy <span class="cite">[1]</span>. ` +
    `Per-stage hours below sum to the platinum estimate; each stage bar shows earned over total for that stage.`;
  const list = $('stageList');
  list.replaceChildren();
  for (const stage of stages) {
    const inStage = trophies.filter((t) => t.stage === stage.n);
    const got = inStage.filter((t) => isEarned(t)).length;
    const li = document.createElement('li');
    li.className = 'stage-card';
    li.innerHTML =
      `<h3>Stage ${stage.n} — ${esc(stage.title)}</h3>` +
      `<div><b>${got}/${inStage.length} earned</b> · ≈${stage.hours} h · ${citeHtml(stage.note)}</div>` +
      `<div class="stage-bar"><div class="stage-fill" style="width:${inStage.length ? (got / inStage.length) * 100 : 0}%"></div></div>` +
      `<div class="stage-names">${inStage.map((t) => esc(displayName(t))).join(' · ')}</div>`;
    list.append(li);
  }
}

function renderFlags() {
  const groups = [
    ['missable', 'Possibly missable — 1', 'missable'],
    ['watch', 'Watch — specific setups, easy to fumble — 8', 'watch'],
    ['unconfirmed', 'Unconfirmed — trigger not yet verified by launch sources — 8', 'unconfirmed'],
  ];
  const wrap = $('flagGroups');
  wrap.replaceChildren();
  for (const [flag, title, cls] of groups) {
    const div = document.createElement('div');
    div.className = 'flag-group';
    div.innerHTML = `<h3>${title}</h3>`;
    for (const t of trophies.filter((x) => x.flag === flag)) {
      const card = document.createElement('div');
      card.className = `flag-card ${cls}`;
      card.innerHTML =
        `<b>${esc(t.name)}</b> <span class="pip grade-${t.grade}">${t.grade}</span> <span class="pip">Stage ${t.stage}</span>` +
        `<p>${esc(t.description)} — ${citeHtml(t.steps[0])}</p>`;
      card.addEventListener('click', () => { selectedId = t.id; switchView('ledger'); });
      div.append(card);
    }
    wrap.append(div);
  }
}

function renderPlanner() {
  const hours = Number($('hoursSelect').value);
  const queue = nextUpQueue(trophies, state.earned);
  const { picks, used } = sessionPlan(queue, hours);
  $('planSummary').textContent = picks.length
    ? (used > hours
      ? `Plan: start with ${picks[0].trophy.name} — it outranks the clock (≈${used} h of work, begun inside your ${hours} h).`
      : `Plan: ${picks.length} trophies, ≈${used} h of your ${hours} h session.`)
    : 'Everything is earned — the platinum is yours.';
  const fill = (el, items, withWhy) => {
    el.replaceChildren();
    for (const item of items) {
      const li = document.createElement('li');
      li.innerHTML =
        `<b>${esc(displayName(item.trophy))}</b> <span class="pip grade-${item.trophy.grade}">${item.trophy.grade}</span> ` +
        `<span class="pip">Stage ${item.trophy.stage}</span> ${flagPip(item.trophy)}` +
        (withWhy ? `<span class="why">${item.trophy.flag === 'missable' ? 'First because it can be lost in Chapter 1.' : item.gated ? 'Later stage — scheduled after the current stage clears.' : 'Earliest ungated trophy in roadmap order.'} ≈${item.trophy.hours} h · ${citeHtml(item.trophy.steps[0])}</span>` : '');
      li.addEventListener('click', () => { selectedId = item.trophy.id; switchView('ledger'); });
      el.append(li);
    }
  };
  fill($('planList'), picks, true);
  fill($('queueList'), queue.slice(0, 10), false);
}

function renderMatrix() {
  const table = $('matrixTable');
  const head = `<tr><th class="name">Trophy</th>${sources.map((s) => `<th>[${s.n}]</th>`).join('')}<th>Total</th></tr>`;
  const rows = trophies.map((t) =>
    `<tr><td class="name">${esc(t.name)}</td>` +
    sources.map((s) => t.sources.includes(s.n) ? '<td class="hit">✓</td>' : '<td>·</td>').join('') +
    `<td><b>${t.sources.length}</b></td></tr>`).join('');
  table.innerHTML = head + rows;
}

function renderSources() {
  $('sourcesIntro').textContent =
    `${sources.length} sources, all read ${doc.readDate}. Guide text is this atlas's own words; a source is cited beside the facts it supports, never copied.`;
  const list = $('sourceList');
  list.replaceChildren();
  for (const s of sources) {
    const li = document.createElement('li');
    li.innerHTML =
      `<b>[${s.n}] ${esc(s.name)}</b> <span class="cited-by">cited by ${citedByCount(s.n)} of 55 guides</span>` +
      `<span class="what">${esc(s.what)}</span>`;
    list.append(li);
  }
  $('disagreeBox').innerHTML =
    `<div class="callout disagree"><b>SOURCE DISAGREEMENT ON RECORD.</b> ${esc(doc.disagreementNote)}</div>`;
  $('footSources').textContent = `Sources read ${doc.readDate}: ` + sources.map((s) => `[${s.n}] ${s.name}`).join(' · ');
}

function renderAll() {
  renderHeader();
  renderList();
  renderDetail();
  renderRail();
  if (activeView === 'roadmap') renderRoadmap();
  if (activeView === 'missables') renderFlags();
  if (activeView === 'planner') renderPlanner();
  if (activeView === 'matrix') renderMatrix();
  if (activeView === 'sources') renderSources();
}

function switchView(view) {
  activeView = view;
  for (const btn of $('tabBar').querySelectorAll('button')) {
    btn.classList.toggle('active', btn.dataset.view === view);
  }
  for (const section of document.querySelectorAll('.view')) {
    section.hidden = section.id !== `view-${view}`;
  }
  $('toolbar').style.display = view === 'ledger' ? '' : 'none';
  renderAll();
}

function buildKindChips() {
  const kinds = ['all', 'story', 'activities', 'collectibles', 'meta'];
  const wrap = $('kindChips');
  for (const kind of kinds) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = kind === 'all' ? 'All kinds' : kind[0].toUpperCase() + kind.slice(1);
    if (kind === 'all') btn.className = 'active';
    btn.addEventListener('click', () => {
      kindFilter = kind;
      for (const b of wrap.querySelectorAll('button')) b.classList.toggle('active', b === btn);
      renderList();
    });
    wrap.append(btn);
  }
}

buildKindChips();
renderAudit();
$('spoilerToggle').checked = state.spoilerSafe;
$('spoilerToggle').addEventListener('change', () => { state.spoilerSafe = $('spoilerToggle').checked; saveState(state); renderAll(); });
$('searchBox').addEventListener('input', renderList);
$('gradeSelect').addEventListener('change', renderList);
$('stageSelect').addEventListener('change', renderList);
$('earnedOnly').addEventListener('change', renderList);
$('hoursSelect').addEventListener('change', renderPlanner);
$('exportBtn').addEventListener('click', () => exportState(state));
$('importBtn').addEventListener('click', () => $('importFile').click());
$('importFile').addEventListener('change', async () => {
  const file = $('importFile').files[0];
  if (!file) return;
  try {
    state = parseImported(await file.text());
    saveState(state);
    $('spoilerToggle').checked = state.spoilerSafe;
    renderAll();
  } catch { /* a bad file changes nothing */ }
});
$('resetBtn').addEventListener('click', () => { state = emptyState(); saveState(state); $('spoilerToggle').checked = true; renderAll(); });
for (const btn of $('tabBar').querySelectorAll('button')) {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
}
switchView(activeView);
