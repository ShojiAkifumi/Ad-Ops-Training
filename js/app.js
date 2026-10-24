// ゲーム本体
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

const TIME = { quiz: 20, calc: 120 };
const LEVEL_NAME = { 1: '初級', 2: '中級', 3: '上級' };
const SUB_NAME = { word: '単語クイズ', quiz: '用語クイズ', formula: '穴埋め' };
const RANKS = [
  { min: 90, icon: 'LEGEND', name: '伝説の運用者', msg: '完璧な数字感覚！クライアントの信頼も厚いはず。' },
  { min: 75, icon: 'ACE', name: 'エース運用者', msg: '実務で十分通用するレベル。上級問題にも挑戦しよう。' },
  { min: 55, icon: 'PRO', name: '一人前マーケター', msg: '基本は押さえています。ふりかえりで苦手な指標を確認しよう。' },
  { min: 30, icon: 'ROOKIE', name: '駆け出し運用者', msg: '早見表で式を確認してから、もう一度チャレンジ！' },
  { min: 0, icon: 'BEGINNER', name: '見習いマーケター', msg: 'まずは用語クイズでCPC・CTR・CVR・CPAから覚えよう。' },
];

const store = {
  get(k) { try { return JSON.parse(localStorage.getItem('adops-game:' + k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem('adops-game:' + k, JSON.stringify(v)); } catch { /* 保存できなくても続行 */ } },
};

const settings = { level: 0, count: 10, timer: true };
let G = null; // 現在のゲーム状態
let timerId = null;

// ---------- 画面切り替え ----------
function show(id) {
  $$('.screen').forEach((s) => s.classList.toggle('active', s.id === 'screen-' + id));
  window.scrollTo(0, 0);
  if (id !== 'game') closeCalc();
  if (id === 'home') renderStats();
}

// ---------- 用語クイズの生成 ----------
// 指標の計算式を選ぶ4択（指標の意味を問う問題は単語クイズで出題）
function makeMetricQuiz() {
  const m = pick(METRICS);
  const others = shuffle(METRICS.filter((x) => x !== m)).slice(0, 3);
  return { q: `${m.key}（${m.ja}）の計算式として正しいものは？`, choices: [m.formula, ...others.map((o) => o.formula)], exp: `${m.key} ＝ ${m.formula}<br>${m.desc}`, id: 'f-' + m.key, nameOnly: new Set([m.key]) };
}

// 用語クイズの出題タイプ：考え方 / 計算式（4択）/ 計算式の穴埋め
// 単語クイズ：用語⇔意味・正式名称の4択
function makeQuizQuestion(used, word = false) {
  for (let i = 0; i < 50; i++) {
    let base;
    const r = Math.random();
    if (word) base = makeWordQuestion();
    else if (r < 0.45) {
      const idx = Math.floor(Math.random() * CONCEPT_QUIZ.length);
      base = { ...CONCEPT_QUIZ[idx], id: 'c-' + idx };
    } else if (r < 0.65) {
      base = { ...makeMetricQuiz(), answer: 0 };
    } else {
      base = makeFormulaQuestion();
      base.q = base.question;
    }
    if (used.has(base.id) && i < 49) continue;
    used.add(base.id);
    const order = shuffle(base.choices.map((c, i2) => i2));
    const choices = order.map((i2) => base.choices[i2]);
    return {
      kind: 'quiz', sub: base.sub || 'quiz', type: 'choice', question: base.q, cid: base.cid || base.id,
      choices, answer: order.indexOf(base.answer), exp: base.exp, noHint: !!base.noHint,
      terms: base.terms || findTerms([base.q, ...choices].join(' ')), nameOnly: base.nameOnly || new Set(),
    };
  }
}

function buildQuestions(mode) {
  const used = new Set(), usedCalc = new Set();
  const qs = [];
  for (let i = 0; i < settings.count; i++) {
    const isCalc = mode === 'calc';
    if (isCalc) {
      const q = generateCalc(settings.level, usedCalc);
      if (q.type === 'choice') { // 選択肢をシャッフル
        const order = shuffle(q.choices.map((c, j) => j));
        q.answer = order.indexOf(q.answer);
        q.choices = order.map((j) => q.choices[j]);
      }
      qs.push(q);
    } else {
      qs.push(makeQuizQuestion(used, mode === 'word'));
    }
  }
  return qs;
}

// ---------- ゲーム進行 ----------
function startGame(mode) {
  G = { mode, questions: buildQuestions(mode), idx: 0, score: 0, correct: 0, combo: 0, maxCombo: 0, history: [] };
  $('#hud-total').textContent = G.questions.length;
  show('game');
  renderQuestion();
}

function renderQuestion() {
  const q = G.questions[G.idx];
  G.answered = false;
  G.hintUsed = false;
  $('#hud-num').textContent = G.idx + 1;
  $('#hud-score').textContent = G.score.toLocaleString();
  $('#progress-bar').style.width = (G.idx / G.questions.length * 100) + '%';
  renderCombo();

  const tags = [];
  if (q.kind === 'quiz') tags.push(`<span class="tag quiz">${SUB_NAME[q.sub]}</span>`);
  else tags.push('<span class="tag calc">計算</span>', `<span class="tag lv${q.level}">${LEVEL_NAME[q.level]}</span>`, `<span class="tag">${q.metric}</span>`);
  $('#q-tags').innerHTML = tags.join('');
  $('#q-scenario').innerHTML = q.scenario || '';
  $('#q-scenario').style.display = q.scenario ? '' : 'none';
  $('#q-text').innerHTML = q.question;

  const choices = $('#q-choices');
  choices.innerHTML = '';
  if (q.type === 'choice') {
    q.choices.forEach((c, i) => {
      const b = document.createElement('button');
      b.className = 'choice';
      b.innerHTML = `<span class="choice-key">${i + 1}</span><span>${c}</span>`;
      b.onclick = () => answer(i);
      choices.appendChild(b);
    });
  }
  choices.style.display = q.type === 'choice' ? '' : 'none';
  $('#q-answer').style.display = q.type === 'number' ? '' : 'none';
  $('#q-unit').textContent = q.unit || '';
  $('#q-input').value = '';
  $('#q-input').classList.remove('shake');
  $('#q-tools').style.display = q.kind === 'quiz' && (q.noHint || !q.terms.length) ? 'none' : '';
  $('#btn-calc').style.display = q.kind === 'calc' ? '' : 'none';
  $('#btn-hint-label').textContent = q.kind === 'calc' ? 'ヒント（得点半分）' : '用語ヒント（得点半分）';
  $('#btn-hint').disabled = false;
  $('#q-hint').style.display = 'none';
  $('#q-feedback').style.display = 'none';
  $('#q-card').classList.remove('is-correct', 'is-wrong');
  $('#q-card').classList.remove('enter'); void $('#q-card').offsetWidth; $('#q-card').classList.add('enter');
  if (q.type === 'number') setTimeout(() => $('#q-input').focus(), 50);

  startTimer(q.kind === 'calc' ? TIME.calc : TIME.quiz);
}

function startTimer(sec) {
  clearInterval(timerId);
  const bar = $('#timer-bar');
  const on = settings.timer;
  $('.timer').style.visibility = on ? '' : 'hidden';
  G.timeLimit = sec;
  G.started = Date.now();
  G.timed = on;
  if (!on) return;
  bar.style.width = '100%';
  bar.classList.remove('warn');
  timerId = setInterval(() => {
    const left = Math.max(0, sec - (Date.now() - G.started) / 1000);
    bar.style.width = (left / sec * 100) + '%';
    bar.classList.toggle('warn', left / sec < 0.25);
    if (left <= 0) { clearInterval(timerId); answer(null, true); }
  }, 100);
}

function parseNumber(str) {
  const s = str.replace(/[０-９．－ー−]/g, (c) => ({ '．': '.', '－': '-', 'ー': '-', '−': '-' }[c] || String.fromCharCode(c.charCodeAt(0) - 0xFEE0)))
    .replace(/[,，\s円%％件回人]/g, '');
  if (!/^-?\d*\.?\d+$/.test(s)) return null;
  return parseFloat(s);
}

function isCorrect(q, val) {
  if (q.type === 'choice') return val === q.answer;
  const tol = 0.5 * 10 ** -q.d + 1e-9;
  return Math.abs(val - q.answer) <= tol;
}

function answer(val, timeout = false) {
  if (G.answered) return;
  const q = G.questions[G.idx];
  if (!timeout && q.type === 'number') {
    val = parseNumber($('#q-input').value);
    if (val === null) { const inp = $('#q-input'); inp.classList.remove('shake'); void inp.offsetWidth; inp.classList.add('shake'); inp.focus(); return; }
  }
  G.answered = true;
  clearInterval(timerId);

  const ok = !timeout && isCorrect(q, val);
  let gained = 0;
  if (ok) {
    G.combo++; G.correct++;
    G.maxCombo = Math.max(G.maxCombo, G.combo);
    const base = q.kind === 'calc' ? 100 + q.level * 50 : 100;
    const left = Math.max(0, G.timeLimit - (Date.now() - G.started) / 1000);
    const timeBonus = G.timed ? Math.round(left / G.timeLimit * 50) : 0;
    const comboMul = 1 + Math.min(G.combo - 1, 5) * 0.1;
    gained = Math.round((base + timeBonus) * comboMul * (G.hintUsed ? 0.5 : 1));
    G.score += gained;
  } else {
    G.combo = 0;
  }
  G.history.push({ q, val, ok, timeout });
  recordAnswer(q, ok, (Date.now() - G.started) / 1000);

  // 選択肢の表示
  if (q.type === 'choice') {
    $$('#q-choices .choice').forEach((b, i) => {
      b.disabled = true;
      if (i === q.answer) b.classList.add('correct');
      else if (i === val) b.classList.add('wrong');
    });
  }

  $('#q-card').classList.add(ok ? 'is-correct' : 'is-wrong');
  const head = ok ? `<span class="fb-en">CORRECT!</span>正解！ <span class="gain">+${gained} pt</span>${G.combo >= 2 ? ` <span class="combo-pop">${G.combo} COMBO</span>` : ''}`
    : timeout ? '<span class="fb-en">TIME UP</span>時間切れ…' : '<span class="fb-en">MISS</span>不正解…';
  $('#fb-head').innerHTML = head;
  $('#fb-head').className = 'feedback-head ' + (ok ? 'ok' : 'ng');
  $('#fb-body').innerHTML = explain(q, val, ok);
  $('#q-feedback').style.display = '';
  $('#q-tools').style.display = 'none';
  $('#hud-score').textContent = G.score.toLocaleString();
  renderCombo();
  $('#btn-next').textContent = G.idx + 1 >= G.questions.length ? '結果を見る ▶' : '次へ ▶';
  setTimeout(() => { $('#btn-next').focus(); $('#q-feedback').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 50);
}

function answerText(q) {
  if (q.type === 'choice') return q.choices[q.answer];
  return `${fmt(q.answer, q.d)} ${q.unit}`;
}

function explain(q, val, ok) {
  let html = '';
  if (q.type === 'number') {
    html += `<div class="fb-answer">正解：<b>${answerText(q)}</b>`;
    if (!ok && val !== null && val !== undefined) html += `<span class="yours">（あなたの回答：${fmt(val, Math.max(q.d, (String(val).split('.')[1] || '').length))} ${q.unit}）</span>`;
    html += '</div>';
  } else if (!ok) {
    html += `<div class="fb-answer">正解：<b>${answerText(q)}</b></div>`;
  }
  if (q.kind === 'calc') html += `<div class="steps">${q.steps.map((s) => `<div>${s}</div>`).join('')}</div>`;
  else html += `<p class="exp">${q.exp}</p>`;
  if (q.terms && q.terms.length) html += `<div class="terms-box"><div class="terms-title">${q.sub === 'word' ? '関連用語' : '用語解説'}</div>${termsHtml(q.terms)}</div>`;
  return html;
}

function renderCombo() {
  const el = $('#hud-combo');
  el.textContent = G.combo >= 2 ? `${G.combo} COMBO` : '';
}

function next() {
  G.idx++;
  if (G.idx >= G.questions.length) finish();
  else renderQuestion();
}

function finish() {
  clearInterval(timerId);
  const total = G.questions.length;
  const rate = Math.round(G.correct / total * 100);
  const rank = RANKS.find((r) => rate >= r.min);
  const key = `best-${G.mode}`;
  const best = store.get(key);
  const isNew = !best || G.score > best.score;
  if (isNew) store.set(key, { score: G.score, rate });

  $('#r-icon').textContent = rank.icon;
  $('#r-rank').textContent = rank.name;
  $('#r-score').textContent = G.score.toLocaleString();
  $('#r-new').style.display = isNew && G.score > 0 ? '' : 'none';
  $('#r-correct').textContent = `${G.correct}/${total}`;
  $('#r-rate').textContent = rate + '%';
  $('#r-combo').textContent = G.maxCombo;
  $('#r-msg').textContent = rank.msg;

  const review = $('#r-review');
  review.innerHTML = G.history.map((h, i) => `
    <details class="review ${h.ok ? 'ok' : 'ng'}" ${h.ok ? '' : 'open'}>
      <summary><span class="review-mark">${h.ok ? '○' : '×'}</span><span class="review-num">Q${i + 1}</span><span class="review-q">${stripTags(h.q.question)}</span></summary>
      <div class="review-body">
        ${h.q.scenario ? `<div class="q-scenario">${h.q.scenario}</div>` : ''}
        ${explain(h.q, h.timeout ? null : h.val, h.ok)}
      </div>
    </details>`).join('');
  recordRound();
  const nb = G.newBadges || [];
  $('#r-badges').innerHTML = nb.length ? `<div class="new-badges-title">新しい実績を獲得！</div><div class="badge-row">${nb.map((b) => badgeHtml(b, true)).join('')}</div>` : '';
  show('result');
  renderBest();
}

const stripTags = (s) => s.replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '');

function renderBest() {
  $$('[data-best]').forEach((el) => {
    const b = store.get('best-' + el.dataset.best);
    el.textContent = b ? `ベスト ${b.score.toLocaleString()} pt` : '';
  });
}

// ---------- 早見表 ----------
function renderSheet() {
  $('#sheet-list').innerHTML = METRICS.map((m) => `
    <div class="sheet-item">
      <div class="sheet-key">${m.key}<small>${m.full}</small></div>
      <div class="sheet-ja">${m.ja}</div>
      <div class="sheet-formula">${m.formula}</div>
      <div class="sheet-desc">${m.desc}</div>
    </div>`).join('');
}

// 早見表はモーダルで開く（ゲーム中でも確認できる）
function openSheet() {
  $('#sheet-modal').classList.add('open');
  document.body.classList.add('modal-open');
  $('#sheet-close').focus();
}
function closeSheet() {
  $('#sheet-modal').classList.remove('open');
  document.body.classList.remove('modal-open');
}

// ---------- 電卓 ----------
function openCalc() { $('#calc').classList.add('open'); $('#calc-display').focus(); }
function closeCalc() { $('#calc').classList.remove('open'); }
function calcEval(expr) {
  const s = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/[−ー]/g, '-').replace(/,/g, '');
  if (!/^[\d+\-*/().\s]+$/.test(s)) return null;
  try {
    const v = Function('"use strict";return (' + s + ')')();
    return Number.isFinite(v) ? Math.round(v * 1e8) / 1e8 : null;
  } catch { return null; }
}
function calcPress(k) {
  const d = $('#calc-display');
  if (k === 'C') d.value = '';
  else if (k === '⌫') d.value = d.value.slice(0, -1);
  else if (k === '=') { const v = calcEval(d.value); d.value = v === null ? 'エラー' : String(v); }
  else { if (d.value === 'エラー') d.value = ''; d.value += k; }
}

// ---------- イベント ----------
function bindSeg(id, key, conv) {
  $$(`#${id} button`).forEach((b) => b.addEventListener('click', () => {
    $$(`#${id} button`).forEach((x) => x.classList.toggle('on', x === b));
    settings[key] = conv(b.dataset.v);
    store.set('settings', settings);
  }));
}

function init() {
  const saved = store.get('settings');
  if (saved) Object.assign(settings, saved);
  [['opt-level', 'level', settings.level], ['opt-count', 'count', settings.count], ['opt-timer', 'timer', settings.timer ? 1 : 0]].forEach(([id, , v]) => {
    $$(`#${id} button`).forEach((b) => b.classList.toggle('on', b.dataset.v === String(v)));
  });
  bindSeg('opt-level', 'level', Number);
  bindSeg('opt-count', 'count', Number);
  bindSeg('opt-timer', 'timer', (v) => v === '1');

  $$('.mode-card').forEach((b) => b.addEventListener('click', () => startGame(b.dataset.mode)));
  $('#q-answer').addEventListener('submit', (e) => { e.preventDefault(); answer(); });
  $('#btn-next').addEventListener('click', next);
  $('#btn-quit').addEventListener('click', () => { if (confirmQuit()) { clearInterval(timerId); show('home'); } });
  $('#btn-hint').addEventListener('click', () => {
    const q = G.questions[G.idx];
    G.hintUsed = true;
    $('#q-hint').innerHTML = q.kind === 'calc' ? q.hint : `<div class="terms-title">用語ヒント</div>${termsHtml(q.terms, q.nameOnly)}`;
    $('#q-hint').classList.toggle('terms-hint', q.kind !== 'calc');
    $('#q-hint').style.display = '';
    $('#btn-hint').disabled = true;
  });
  $('#btn-calc').addEventListener('click', openCalc);
  $('#calc-close').addEventListener('click', closeCalc);
  $('#calc-keys').addEventListener('click', (e) => { if (e.target.tagName === 'BUTTON') calcPress(e.target.textContent); });
  $('#calc-display').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); calcPress('='); } });
  $('#calc-use').addEventListener('click', () => {
    const v = calcEval($('#calc-display').value);
    if (v !== null) { $('#q-input').value = v; closeCalc(); $('#q-input').focus(); }
  });
  $('#btn-retry').addEventListener('click', () => startGame(G.mode));
  $('#btn-home').addEventListener('click', () => show('home'));
  $$('[data-go-sheet]').forEach((b) => b.addEventListener('click', openSheet));
  $('#sheet-close').addEventListener('click', closeSheet);
  $('#sheet-modal').addEventListener('click', (e) => { if (e.target.id === 'sheet-modal') closeSheet(); });
  $('#btn-start').addEventListener('click', () => $('#modes').scrollIntoView({ behavior: 'smooth' }));
  $('#btn-brand').addEventListener('click', () => { if (!$('#screen-game').classList.contains('active') || confirmQuit()) { clearInterval(timerId); show('home'); } });

  document.addEventListener('keydown', (e) => {
    if ($('#sheet-modal').classList.contains('open')) { if (e.key === 'Escape') closeSheet(); return; }
    if (!$('#screen-game').classList.contains('active') || e.target.id === 'calc-display') return;
    const q = G && G.questions[G.idx];
    if (!q) return;
    if (!G.answered && q.type === 'choice' && /^[1-4]$/.test(e.key)) answer(Number(e.key) - 1);
    else if (G.answered && e.key === 'Enter' && document.activeElement !== $('#btn-next')) { e.preventDefault(); next(); }
  });

  renderSheet();
  renderBest();
}

// ゲーム途中で戻るときは確認する（回答済みの問題がある場合のみ）
function confirmQuit() {
  if (!G || G.history.length === 0) return true;
  return window.confirm('ゲームを中断してホームに戻りますか？');
}

init();
