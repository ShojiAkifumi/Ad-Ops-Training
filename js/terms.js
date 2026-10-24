// 用語辞書（ヒント・単語カード用）と、計算式の穴埋め問題
// 指標（METRICS）に加えて、問題文に出てくる運用用語をまとめる
const EXTRA_TERMS = [
  { key: 'CV', full: 'Conversion', ja: 'コンバージョン（成果）', desc: '購入・申込・資料請求など、広告で達成したい成果のこと。', alias: ['コンバージョン'] },
  { key: 'インプレッション', full: 'Impression', ja: '表示回数', desc: '広告が画面に表示された延べ回数。imp と略されることもある。', alias: ['表示回数'] },
  { key: 'リーチ', full: 'Reach', ja: '到達人数', desc: '広告を1回以上見たユーザーの人数（重複なし）。' },
  { key: 'LP', full: 'Landing Page', ja: 'ランディングページ', desc: '広告をクリックしたユーザーが最初に訪れるページ。' },
  { key: 'KPI', full: 'Key Performance Indicator', ja: '重要業績評価指標', desc: '最終目標（KGI）の達成に向けて追いかける中間指標。' },
  { key: 'KGI', full: 'Key Goal Indicator', ja: '重要目標達成指標', desc: '売上や利益など、最終的に達成したい目標を数値で表したもの。' },
  { key: 'A/Bテスト', full: 'A/B Testing', ja: '比較テスト', desc: '2つ以上のパターンを同条件で配信し、成果の良い方を見つける検証方法。' },
  { key: 'リターゲティング', full: 'Retargeting', ja: '再訪問者向け配信', desc: '一度サイトを訪れたユーザーに再び広告を配信する手法。Google広告ではリマーケティングと呼ぶ。', alias: ['リマーケティング'] },
  { key: '品質スコア', full: 'Quality Score', ja: '広告の品質評価', desc: '広告の関連性・推定CTR・LPの利便性などから決まる評価。高いほど低いCPCで上位表示されやすい。', alias: ['広告の品質'] },
  { key: 'ビュースルーコンバージョン', full: 'View-Through Conversion', ja: '表示経由の成果', desc: '広告を見たがクリックせず、後で別の経路からCVしたもの。' },
  { key: 'フリークエンシーキャップ', full: 'Frequency Cap', ja: '表示回数の上限設定', desc: '1人のユーザーに広告を表示する回数の上限。広告疲れを防ぐ。' },
  { key: '広告疲れ', full: 'Ad Fatigue', ja: '広告への飽き', desc: '同じ広告を何度も見せることで反応が鈍くなり、CTRなどが下がる現象。' },
  { key: 'クリエイティブ', full: 'Creative', ja: '広告素材', desc: 'バナー画像・動画・広告文など、ユーザーが目にする広告の中身。' },
  { key: '粗利', full: 'Gross Profit', ja: '売上総利益', desc: '売上から原価を引いた利益。粗利 ÷ 売上 を粗利率（Gross Margin）という。', alias: ['粗利率'] },
  { key: '原価率', full: 'Cost of Goods Ratio', ja: '売上に占める原価の割合', desc: '原価 ÷ 販売価格。1 − 原価率 ＝ 粗利率。' },
  { key: '入札単価', full: 'Bid', ja: '入札価格', desc: '広告オークションで「1クリック（または1,000表示）に最大いくら払うか」を決めた金額。' },
  { key: 'リスティング広告', full: 'Listing Ads（Search Ads）', ja: '検索連動型広告', desc: '検索キーワードに連動して検索結果に表示される広告。', alias: ['検索広告'] },
  { key: 'ディスプレイ広告', full: 'Display Ads', ja: '画像・バナー広告', desc: 'Webサイトやアプリの広告枠に表示される画像・動画の広告。' },
  { key: 'CPM課金', full: 'Cost Per Mille Billing', ja: 'インプレッション課金', desc: '広告が1,000回表示されるごとに費用が発生する課金方式。', alias: ['インプレッション課金'] },
  { key: 'CPC課金', full: 'Cost Per Click Billing', ja: 'クリック課金', desc: '広告がクリックされたときだけ費用が発生する課金方式。', alias: ['クリック課金'] },
  { key: '目標CPA', full: 'Target CPA', ja: '目標顧客獲得単価', desc: '利益を残すために設定するCPAの目標値。限界CPAより低く設定する。' },
  { key: '損益分岐ROAS', full: 'Break-even ROAS', ja: '赤字にならない最低ROAS', desc: '1 ÷ 粗利率 × 100。これを下回ると広告は赤字。' },
  { key: 'サブスク', full: 'Subscription', ja: '定額継続課金', desc: '月額などで継続的に料金を支払ってもらうビジネスモデル。LTVが重要になる。', alias: ['定期通販'] },
  { key: '配信面', full: 'Placement', ja: '広告の掲載場所', desc: '広告が表示されるサイト・アプリ・枠のこと。' },
  { key: 'アトリビューション', full: 'Attribution', ja: '成果の貢献度配分', desc: 'CVに至るまでに接触した複数の広告に、成果の貢献度を割り振る考え方。' },
];

const TERMS = [
  ...METRICS.map((m) => ({ key: m.key, full: m.full, note: m.note, ja: m.ja, desc: m.desc, formula: m.formula, metric: true })),
  ...EXTRA_TERMS,
];
// 英字の略語は前後が英字でないときだけマッチ（CVR の中の CV などを拾わない）
TERMS.forEach((t) => {
  t.patterns = [t.key, ...(t.alias || [])].map((w) => {
    const esc = w.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
    return /^[A-Za-z]/.test(w) ? new RegExp(`(?<![A-Za-z])${esc}(?![A-Za-z])`) : new RegExp(esc);
  });
});

// テキストに含まれる用語を、出てくる順に返す
function findTerms(text) {
  const plain = text.replace(/<[^>]+>/g, ' ');
  const hits = [];
  TERMS.forEach((t) => {
    let pos = Infinity;
    t.patterns.forEach((re) => { const m = plain.match(re); if (m && m.index < pos) pos = m.index; });
    if (pos !== Infinity) hits.push({ t, pos });
  });
  return hits.sort((a, b) => a.pos - b.pos).map((h) => h.t);
}

// 用語解説のHTML。nameOnly に含まれる用語は正式名称だけ見せる（答えそのものになるため）
function termsHtml(terms, nameOnly = new Set()) {
  if (!terms.length) return '';
  return `<dl class="terms">${terms.map((t) => {
    const name = t.full ? `<span class="term-full">${t.full}</span>` : '';
    if (nameOnly.has(t.key)) return `<div class="term"><dt>${t.key}${name}</dt><dd class="muted">意味は回答後に表示されます</dd></div>`;
    return `<div class="term"><dt>${t.key}${name}</dt><dd><b>${t.ja}</b>　${t.desc}${t.formula ? `<br><span class="term-formula">${t.formula}</span>` : ''}${t.note ? `<br><small>※${t.note}</small>` : ''}</dd></div>`;
  }).join('')}</dl>`;
}

// ---------- 単語クイズ（4択） ----------
// 用語 → 意味 / 意味 → 用語 / 略語 → 正式名称 の3パターン
function makeWordQuestion() {
  const kind = pick(['meaning', 'meaning', 'reverse', 'full']);
  const pool = kind === 'reverse' ? TERMS.filter((x) => x.metric)
    : kind === 'full' ? TERMS.filter((x) => /^[A-Z]{2,}$/.test(x.key)) : TERMS;
  const t = pick(pool);
  const field = kind === 'meaning' ? 'ja' : kind === 'reverse' ? 'key' : 'full';
  const seen = new Set([t[field]]);
  const others = shuffle(pool.filter((x) => x !== t)).filter((x) => !seen.has(x[field]) && seen.add(x[field])).slice(0, 3);
  // 略語の下には正式名称を添える（正式名称を問う問題では回答後に表示）
  const abbr = /^[A-Z]{2,}$/.test(t.key) && t.full;
  const card = kind === 'reverse'
    ? `<div class="word-card"><span class="word-card-tag">MEANING</span><div class="word-card-ja">${t.ja}</div><p>${t.desc}</p></div>`
    : `<div class="word-card"><span class="word-card-tag">WORD</span><div class="word-card-term">${t.key}</div>${abbr ? `<div class="word-card-full${kind === 'full' ? ' after' : ''}">${t.full}</div>` : ''}</div>`;
  const ask = { meaning: 'この用語の意味は？', reverse: 'この説明に当てはまる指標は？', full: 'この略語の正式名称は？' }[kind];
  return {
    sub: 'word', id: `w-${kind}-${t.key}`, cid: `term:${t.key}`, noHint: true,
    q: `${card}${ask}`,
    choices: [t[field], ...others.map((o) => o[field])], answer: 0,
    exp: `<b>${t.key}</b>${t.full ? `（${t.full}）` : ''} ＝ ${t.ja}<br>${t.desc}${t.formula ? `<br>計算式：${t.formula}` : ''}${t.note ? `<br>※${t.note}` : ''}`,
    terms: [t, ...others],
  };
}

// ---------- 計算式の穴埋め ----------
// 式をトークンに分けて持つ。v: 変数（穴にできる）、o: 演算子、n: 定数
const FORMULAS = [
  { left: 'CPC', parts: ['v:広告費', 'o:÷', 'v:クリック数'] },
  { left: 'CTR', parts: ['v:クリック数', 'o:÷', 'v:表示回数', 'o:×', 'n:100'] },
  { left: 'CVR', parts: ['v:CV数', 'o:÷', 'v:クリック数', 'o:×', 'n:100'] },
  { left: 'CPA', parts: ['v:広告費', 'o:÷', 'v:CV数'] },
  { left: 'CPM', parts: ['v:広告費', 'o:÷', 'v:表示回数', 'o:×', 'n:1,000'] },
  { left: 'ROAS', parts: ['v:売上', 'o:÷', 'v:広告費', 'o:×', 'n:100'] },
  { left: 'ROI', parts: ['o:(', 'v:粗利', 'o:−', 'v:広告費', 'o:)', 'o:÷', 'v:広告費', 'o:×', 'n:100'] },
  { left: 'CPO', parts: ['v:広告費', 'o:÷', 'v:注文数'] },
  { left: 'フリークエンシー', parts: ['v:表示回数', 'o:÷', 'v:リーチ数'] },
  { left: 'CPV', parts: ['v:広告費', 'o:÷', 'v:視聴回数'] },
  { left: 'CPI', parts: ['v:広告費', 'o:÷', 'v:インストール数'] },
  { left: '客単価', parts: ['v:売上', 'o:÷', 'v:注文数'] },
  { left: 'CPA', parts: ['v:CPC', 'o:÷', 'v:CVR'], rel: true },
  { left: 'CPM', parts: ['v:CPC', 'o:×', 'v:CTR', 'o:×', 'n:1,000'], rel: true },
  { left: 'クリック数', parts: ['v:表示回数', 'o:×', 'v:CTR'], rel: true },
  { left: 'CV数', parts: ['v:クリック数', 'o:×', 'v:CVR'], rel: true },
  { left: '売上', parts: ['v:広告費', 'o:×', 'v:ROAS'], rel: true },
  { left: '損益分岐ROAS', parts: ['n:1', 'o:÷', 'v:粗利率'], rel: true },
];
const VAR_POOL = ['広告費', 'クリック数', '表示回数', 'CV数', '売上', '注文数', 'リーチ数', '視聴回数', 'インストール数', '粗利'];
const RATE_POOL = ['CPC', 'CTR', 'CVR', 'CPA', 'CPM', 'ROAS', '粗利率'];
const LEFT_POOL = ['CPC', 'CTR', 'CVR', 'CPA', 'CPM', 'ROAS', 'ROI', 'CPO', 'CPV', 'CPI', 'フリークエンシー', '客単価'];

function makeFormulaQuestion() {
  const f = pick(FORMULAS);
  const tokens = f.parts.map((p) => ({ type: p[0], text: p.slice(2) }));
  // 穴にする位置：左辺（-1）、変数、演算子（× ÷ のみ）、定数
  const slots = [-1, -1];
  tokens.forEach((tk, i) => {
    if (tk.type === 'v') slots.push(i, i);
    if (tk.type === 'o' && (tk.text === '÷' || tk.text === '×')) slots.push(i);
    if (tk.type === 'n' && tk.text !== '1') slots.push(i);
  });
  let blank = pick(slots);
  if (f.rel && blank === -1) blank = slots.find((s) => s !== -1); // 関係式は右辺を穴に
  let answer, pool;
  if (blank === -1) { answer = f.left; pool = LEFT_POOL; }
  else {
    const tk = tokens[blank];
    answer = tk.text;
    if (tk.type === 'o') pool = ['÷', '×', '+', '−'];
    else if (tk.type === 'n') pool = ['100', '1,000', '10', '10,000'];
    else pool = RATE_POOL.includes(answer) ? RATE_POOL : VAR_POOL;
  }
  // 式の中に既に出てくる語は選択肢から外す（どちらも正解に見えるのを防ぐ）
  const inFormula = new Set([f.left, ...tokens.filter((t, i) => i !== blank).map((t) => t.text)]);
  const isVar = blank === -1 || tokens[blank].type === 'v';
  const others = shuffle(pool.filter((x) => x !== answer && !(isVar && inFormula.has(x)))).slice(0, 3);
  const chip = (text, isBlank) => isBlank ? '<span class="chip blank">？</span>' : `<span class="chip${/^[÷×+−()=]$/.test(text) ? ' op' : ''}">${text}</span>`;
  const formula = `<div class="formula">${chip(f.left, blank === -1)} ${chip('=')} ${tokens.map((t, i) => chip(t.text, i === blank)).join(' ')}</div>`;
  const full = `${f.left} = ${tokens.map((t) => t.text).join(' ')}`.replace(/\( /g, '(').replace(/ \)/g, ')');
  const m = METRICS.find((x) => x.key === f.left);
  return {
    kind: 'quiz', sub: 'formula', type: 'choice', id: `fill-${f.left}-${f.parts.join()}-${blank}`, cid: `fill:${FORMULAS.indexOf(f)}`,
    question: `${formula}空欄「？」に入るものはどれ？`,
    choices: [answer, ...others], answer: 0,
    exp: `正しい式は <b>${full}</b>。${m ? `<br>${m.key}（${m.ja}）：${m.desc}` : ''}${f.rel ? '<br>指標どうしの関係式は、分解すると基本の式から導けます。' : ''}`,
    nameOnly: new Set([f.left, ...others, answer].filter((k) => TERMS.some((t) => t.key === k && t.metric))),
  };
}
