// 学習記録（正答数・正答率・コンプリート率）と実績
const BADGES = [
  { id: 'first', mark: '1st', name: 'はじめの一歩', desc: '初めて正解する' },
  { id: 'combo5', mark: '×5', name: '5コンボ', desc: '5問連続で正解する' },
  { id: 'combo10', mark: '×10', name: '10コンボ', desc: '10問連続で正解する' },
  { id: 'perfect', mark: '100', name: 'パーフェクト', desc: '5問以上のラウンドで全問正解' },
  { id: 'speed', mark: '3s', name: 'スピードスター', desc: '3秒以内に正解する' },
  { id: 'allmode', mark: 'ALL', name: 'オールラウンダー', desc: '3つのモードをすべてプレイ' },
  { id: 'q100', mark: '100Q', name: '100問チャレンジ', desc: '累計100問に回答する' },
  { id: 'nohint', mark: 'NO', name: '自力派', desc: 'ヒントなしで計算問題に20問正解' },
  { id: 'calcpro', mark: 'PRO', name: '計算の達人', desc: '上級の計算問題に10問正解' },
  { id: 'word', mark: 'ABC', name: '単語マスター', desc: '単語クイズで全用語に正解' },
  { id: 'comp50', mark: '50%', name: 'ハーフコンプ', desc: 'コンプリート率50%を達成' },
  { id: 'comp100', mark: 'MAX', name: 'フルコンプ', desc: 'コンプリート率100%を達成' },
];

const newStats = () => ({ answered: 0, correct: 0, done: {}, badges: {}, modes: {}, advCorrect: 0, calcNoHint: 0 });
let stats = Object.assign(newStats(), store.get('stats') || {});
const saveStats = () => store.set('stats', stats);

// コンプリート対象：用語・考え方の問題・指標の式・穴埋めの式・計算問題のパターン
const completeTotal = () => TERMS.length + CONCEPT_QUIZ.length + METRICS.length + FORMULAS.length + GENERATORS.length;
const completeCount = () => Object.keys(stats.done).length;
const completeRate = () => Math.floor(completeCount() / completeTotal() * 100);

function recordAnswer(q, ok, sec) {
  stats.answered++;
  if (ok) {
    stats.correct++;
    if (q.cid) stats.done[q.cid] = 1;
    if (q.kind === 'calc' && q.level === 3) stats.advCorrect++;
    if (q.kind === 'calc' && !G.hintUsed) stats.calcNoHint++;
  }
  checkBadges({ ok, sec });
  saveStats();
}

function recordRound() {
  stats.modes[G.mode] = 1;
  checkBadges({ perfect: G.questions.length >= 5 && G.correct === G.questions.length });
  saveStats();
}

function checkBadges(ctx = {}) {
  const termsDone = TERMS.every((t) => stats.done['term:' + t.key]);
  const cond = {
    first: stats.correct >= 1,
    combo5: G && G.combo >= 5,
    combo10: G && G.combo >= 10,
    perfect: ctx.perfect,
    speed: ctx.ok && ctx.sec <= 3,
    allmode: ['word', 'quiz', 'calc'].every((m) => stats.modes[m]),
    q100: stats.answered >= 100,
    nohint: stats.calcNoHint >= 20,
    calcpro: stats.advCorrect >= 10,
    word: termsDone,
    comp50: completeRate() >= 50,
    comp100: completeCount() >= completeTotal(),
  };
  BADGES.forEach((b) => {
    if (cond[b.id] && !stats.badges[b.id]) {
      stats.badges[b.id] = Date.now();
      if (G) (G.newBadges = G.newBadges || []).push(b);
    }
  });
}

function badgeHtml(b, got) {
  return `<div class="badge${got ? ' got' : ''}" title="${b.desc}">
    <svg viewBox="0 0 64 72" class="badge-medal" aria-hidden="true">
      <path d="M20 40l-8 28 12-6 6 10 6-22M44 40l8 28-12-6-6 10-6-22" class="ribbon"/>
      <circle cx="32" cy="30" r="24" class="disc"/>
      <circle cx="32" cy="30" r="18" class="ring"/>
      <text x="32" y="35" text-anchor="middle">${b.mark}</text>
    </svg>
    <div class="badge-name">${b.name}</div>
    <div class="badge-desc">${b.desc}</div>
  </div>`;
}

function renderStats() {
  const got = BADGES.filter((b) => stats.badges[b.id]).length;
  $('#st-correct').innerHTML = `${stats.correct.toLocaleString()}<small>/ ${stats.answered.toLocaleString()}</small>`;
  $('#st-complete').innerHTML = `${completeRate()}<small>%</small>`;
  $('#st-complete-bar').style.width = completeRate() + '%';
  $('#st-complete-sub').textContent = `${completeCount()} / ${completeTotal()} 問`;
  $('#st-badges').innerHTML = `${got}<small>/ ${BADGES.length}</small>`;
  $('#st-badges-bar').style.width = (got / BADGES.length * 100) + '%';
  $('#badge-list').innerHTML = BADGES.map((b) => badgeHtml(b, stats.badges[b.id])).join('');
}

renderStats();
// 実績一覧の開閉（高さをアニメーション）
$('#badges-toggle').addEventListener('click', () => {
  const box = $('#badges-toggle').closest('.badges-box');
  const open = !box.classList.contains('open');
  box.classList.toggle('open', open);
  $('#badges-toggle').setAttribute('aria-expanded', open);
});
