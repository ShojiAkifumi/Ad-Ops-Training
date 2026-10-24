// 実践ユースケースの計算問題ジェネレーター
// 毎回ランダムな数値で問題を作る
const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const rstep = (min, max, step) => min + rnd(0, Math.floor((max - min) / step)) * step;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const fmt = (n, d = 0) => Number(n).toLocaleString('ja-JP', { minimumFractionDigits: d, maximumFractionDigits: d });
const round = (n, d = 0) => { const p = 10 ** d; return Math.round((n + Number.EPSILON) * p) / p; };

const BIZ = {
  ec: ['アパレルECサイト', 'コスメ通販', 'オーガニック食品の通販', 'ガジェット系ECショップ', 'ペット用品の通販'],
  lead: ['英会話スクールの無料体験', '注文住宅の資料請求', '転職エージェントの会員登録', 'BtoB SaaSの無料トライアル', '美容クリニックのカウンセリング予約'],
  app: ['家計簿アプリ', 'フィットネスアプリ', 'パズルゲームアプリ'],
  any: ['アパレルECサイト', '英会話スクール', '地域の美容サロン', 'BtoB SaaS', 'コスメ通販', '不動産会社', 'フードデリバリー'],
};
const MEDIA = ['リスティング広告', 'ディスプレイ広告', 'SNS広告', '動画広告'];

const RULE = (d, unit) => d === 0 ? `${unit === '%' ? '小数点以下' : '1' + unit + '未満'}は四捨五入` : `小数第${d + 1}位を四捨五入して小数第${d}位まで`;

const GENERATORS = [
  // ===== 初級 =====
  { level: 1, metric: 'CPC', make() {
    const biz = pick(BIZ.any), clicks = rstep(400, 6000, 20), cpc = rnd(35, 280), cost = clicks * cpc;
    return {
      scenario: `${biz}の${pick(['リスティング広告', 'SNS広告'])}を先月配信しました。<br>広告費は<b>${fmt(cost)}円</b>、クリック数は<b>${fmt(clicks)}回</b>でした。`,
      question: 'このキャンペーンのCPC（クリック単価）はいくら？', unit: '円', d: 0, answer: cpc,
      hint: 'CPC = 広告費 ÷ クリック数',
      steps: [`CPC = 広告費 ÷ クリック数`, `= ${fmt(cost)} ÷ ${fmt(clicks)}`, `= <b>${fmt(cpc)}円</b>`],
    };
  } },
  { level: 1, metric: 'CTR', make() {
    const biz = pick(BIZ.any), imp = rstep(20000, 600000, 1000), clicks = Math.round(imp * rstep(3, 60, 1) / 1000);
    const ans = round(clicks / imp * 100, 2);
    return {
      scenario: `${biz}のディスプレイ広告のレポートです。<br>表示回数 <b>${fmt(imp)}回</b>、クリック数 <b>${fmt(clicks)}回</b>。`,
      question: `CTR（クリック率）は何%？（${RULE(2)}）`, unit: '%', d: 2, answer: ans,
      hint: 'CTR = クリック数 ÷ 表示回数 × 100',
      steps: [`CTR = クリック数 ÷ 表示回数 × 100`, `= ${fmt(clicks)} ÷ ${fmt(imp)} × 100`, `≒ <b>${fmt(ans, 2)}%</b>`],
    };
  } },
  { level: 1, metric: 'CVR', make() {
    const biz = pick(BIZ.lead), clicks = rstep(800, 12000, 10), cv = Math.max(3, Math.round(clicks * rstep(5, 90, 1) / 1000));
    const ans = round(cv / clicks * 100, 2);
    return {
      scenario: `${biz}を獲得するための広告を配信。<br>広告のクリック数は <b>${fmt(clicks)}回</b>、そのうち申込（CV）は <b>${fmt(cv)}件</b> でした。`,
      question: `CVR（コンバージョン率）は何%？（${RULE(2)}）`, unit: '%', d: 2, answer: ans,
      hint: 'CVR = CV数 ÷ クリック数 × 100',
      steps: [`CVR = CV数 ÷ クリック数 × 100`, `= ${fmt(cv)} ÷ ${fmt(clicks)} × 100`, `≒ <b>${fmt(ans, 2)}%</b>`],
    };
  } },
  { level: 1, metric: 'CPA', make() {
    const biz = pick(BIZ.lead), cv = rnd(12, 300), cpa = rstep(1500, 30000, 100), cost = cv * cpa;
    return {
      scenario: `${biz}の月次レポートです。<br>広告費 <b>${fmt(cost)}円</b> で、CV（申込）は <b>${fmt(cv)}件</b> 獲得できました。`,
      question: 'CPA（顧客獲得単価）はいくら？', unit: '円', d: 0, answer: cpa,
      hint: 'CPA = 広告費 ÷ CV数',
      steps: [`CPA = 広告費 ÷ CV数`, `= ${fmt(cost)} ÷ ${fmt(cv)}`, `= <b>${fmt(cpa)}円</b>`],
    };
  } },
  { level: 1, metric: 'CPM', make() {
    const biz = pick(BIZ.any), imp = rstep(50000, 3000000, 1000), cpm = rstep(80, 1500, 10), cost = imp / 1000 * cpm;
    return {
      scenario: `${biz}の認知拡大のためにSNS広告を配信しました。<br>広告費 <b>${fmt(cost)}円</b>、表示回数（インプレッション）は <b>${fmt(imp)}回</b>。`,
      question: 'CPM（1,000回表示あたりの費用）はいくら？', unit: '円', d: 0, answer: cpm,
      hint: 'CPM = 広告費 ÷ 表示回数 × 1,000',
      steps: [`CPM = 広告費 ÷ 表示回数 × 1,000`, `= ${fmt(cost)} ÷ ${fmt(imp)} × 1,000`, `= <b>${fmt(cpm)}円</b>`],
    };
  } },
  { level: 1, metric: 'ROAS', make() {
    const biz = pick(BIZ.ec), cost = rstep(100000, 3000000, 10000), roas = rstep(120, 900, 10), rev = cost * roas / 100;
    return {
      scenario: `${biz}のショッピング広告。<br>広告費 <b>${fmt(cost)}円</b> に対し、広告経由の売上は <b>${fmt(rev)}円</b> でした。`,
      question: 'ROAS（広告費用対効果）は何%？', unit: '%', d: 0, answer: roas,
      hint: 'ROAS = 広告経由の売上 ÷ 広告費 × 100',
      steps: [`ROAS = 売上 ÷ 広告費 × 100`, `= ${fmt(rev)} ÷ ${fmt(cost)} × 100`, `= <b>${fmt(roas)}%</b>`],
    };
  } },
  { level: 1, metric: 'フリークエンシー', make() {
    const reach = rstep(10000, 400000, 1000), imp = Math.round(reach * rstep(110, 600, 1) / 100);
    const ans = round(imp / reach, 2);
    return {
      scenario: `${pick(BIZ.any)}のSNS広告。<br>表示回数 <b>${fmt(imp)}回</b>、リーチ（広告を見たユーザー数）は <b>${fmt(reach)}人</b>。`,
      question: `フリークエンシー（1人あたりの平均表示回数）は何回？（${RULE(2)}）`, unit: '回', d: 2, answer: ans,
      hint: 'フリークエンシー = 表示回数 ÷ リーチ数',
      steps: [`フリークエンシー = 表示回数 ÷ リーチ`, `= ${fmt(imp)} ÷ ${fmt(reach)}`, `≒ <b>${fmt(ans, 2)}回</b>`],
    };
  } },
  { level: 1, metric: 'CPI', make() {
    const app = pick(BIZ.app), inst = rnd(300, 8000), cpi = rnd(80, 600), cost = inst * cpi;
    return {
      scenario: `${app}のインストール獲得広告。<br>広告費 <b>${fmt(cost)}円</b> で <b>${fmt(inst)}件</b> インストールされました。`,
      question: 'CPI（インストール単価）はいくら？', unit: '円', d: 0, answer: cpi,
      hint: 'CPI = 広告費 ÷ インストール数',
      steps: [`CPI = 広告費 ÷ インストール数`, `= ${fmt(cost)} ÷ ${fmt(inst)}`, `= <b>${fmt(cpi)}円</b>`],
    };
  } },

  // ===== 中級 =====
  { level: 2, metric: 'CPA', make() {
    const cvr = pick([0.5, 1, 1.25, 2, 2.5, 4, 5, 8]), cpc = rstep(40, 400, 10), cpa = round(cpc / (cvr / 100));
    return {
      scenario: `${pick(BIZ.lead)}のリスティング広告。<br>平均CPCは <b>${fmt(cpc)}円</b>、CVRは <b>${cvr}%</b> です。`,
      question: 'このときのCPAはいくら？', unit: '円', d: 0, answer: cpa,
      hint: 'CPA = CPC ÷ CVR（CVRは小数に直す）',
      steps: [`CPA = CPC ÷ CVR`, `= ${fmt(cpc)} ÷ ${cvr / 100}`, `= <b>${fmt(cpa)}円</b>`, `（1件獲得に ${fmt(100 / cvr, 0)} クリック必要 → ${fmt(100 / cvr, 0)} × ${fmt(cpc)}円 と考えてもOK）`],
    };
  } },
  { level: 2, metric: 'CV', make() {
    const imp = rstep(100000, 2000000, 10000), ctr = pick([0.5, 0.8, 1, 1.2, 1.5, 2, 2.5, 3]), cvr = pick([1, 1.5, 2, 2.5, 3, 4, 5]);
    const clicks = imp * ctr / 100, ans = round(clicks * cvr / 100);
    return {
      scenario: `来月の${pick(MEDIA)}の配信計画を立てています。<br>想定表示回数 <b>${fmt(imp)}回</b>、想定CTR <b>${ctr}%</b>、想定CVR <b>${cvr}%</b>。`,
      question: '見込めるCV数は何件？（小数点以下は四捨五入）', unit: '件', d: 0, answer: ans,
      hint: 'クリック数 = 表示回数 × CTR、CV数 = クリック数 × CVR',
      steps: [`クリック数 = ${fmt(imp)} × ${ctr}% = ${fmt(clicks, clicks % 1 ? 1 : 0)}回`, `CV数 = ${fmt(clicks, clicks % 1 ? 1 : 0)} × ${cvr}% ≒ <b>${fmt(ans)}件</b>`],
    };
  } },
  { level: 2, metric: '予算', make() {
    const cv = rstep(20, 400, 10), cvr = pick([1, 2, 2.5, 4, 5]), cpc = rstep(50, 300, 10);
    const clicks = cv / (cvr / 100), budget = round(clicks * cpc);
    return {
      scenario: `クライアント（${pick(BIZ.lead)}）から「来月は <b>${fmt(cv)}件</b> のCVが欲しい」と依頼されました。<br>過去実績は CPC <b>${fmt(cpc)}円</b>、CVR <b>${cvr}%</b> です。`,
      question: '実績どおりに推移する場合、必要な広告予算はいくら？', unit: '円', d: 0, answer: budget,
      hint: '必要クリック数 = 目標CV ÷ CVR、予算 = 必要クリック数 × CPC',
      steps: [`必要クリック数 = ${fmt(cv)} ÷ ${cvr / 100} = ${fmt(clicks)}回`, `予算 = ${fmt(clicks)} × ${fmt(cpc)}円 = <b>${fmt(budget)}円</b>`, `（目標CV × CPA でもOK：CPA = ${fmt(cpc / (cvr / 100))}円）`],
    };
  } },
  { level: 2, metric: '限界CPA', make() {
    const price = rstep(3000, 40000, 100), costRate = pick([20, 25, 30, 35, 40, 45, 50]), fee = rstep(300, 1500, 50);
    const genka = round(price * costRate / 100), ans = price - genka - fee;
    return {
      scenario: `${pick(BIZ.ec)}で、販売価格 <b>${fmt(price)}円</b> の商品を広告で売ります。<br>原価率は <b>${costRate}%</b>、1件あたりの送料・決済手数料は <b>${fmt(fee)}円</b> かかります。`,
      question: '限界CPA（これを超えると赤字になるCPA）はいくら？', unit: '円', d: 0, answer: ans,
      hint: '限界CPA = 販売価格 − 原価 − 諸経費',
      steps: [`原価 = ${fmt(price)} × ${costRate}% = ${fmt(genka)}円`, `限界CPA = ${fmt(price)} − ${fmt(genka)} − ${fmt(fee)}`, `= <b>${fmt(ans)}円</b>`],
    };
  } },
  { level: 2, metric: 'CPA', make() {
    const aov = rstep(3000, 30000, 500), roas = pick([200, 250, 300, 400, 500, 800]), ans = round(aov / (roas / 100));
    return {
      scenario: `${pick(BIZ.ec)}の客単価（平均注文単価）は <b>${fmt(aov)}円</b>。<br>クライアントの目標は <b>ROAS ${roas}%</b> です。`,
      question: '目標ROASを守るために許容できるCPA（1注文あたりの広告費）の上限は？', unit: '円', d: 0, answer: ans,
      hint: 'ROAS = 売上 ÷ 広告費 → 1注文あたりで考えると 客単価 ÷ CPA',
      steps: [`ROAS = 客単価 ÷ CPA なので、CPA = 客単価 ÷ ROAS`, `= ${fmt(aov)} ÷ ${roas / 100}`, `= <b>${fmt(ans)}円</b>`],
    };
  } },
  { level: 2, metric: 'CV', make() {
    const cpa = rstep(2000, 20000, 500), cv = rnd(10, 200), budget = cpa * cv;
    return {
      scenario: `${pick(BIZ.lead)}の月間予算は <b>${fmt(budget)}円</b>。<br>現在のCPAは <b>${fmt(cpa)}円</b> で安定しています。`,
      question: 'このCPAのまま予算を使い切ると、CVは何件獲得できる？', unit: '件', d: 0, answer: cv,
      hint: 'CV数 = 広告費 ÷ CPA',
      steps: [`CV数 = 予算 ÷ CPA`, `= ${fmt(budget)} ÷ ${fmt(cpa)}`, `= <b>${fmt(cv)}件</b>`],
    };
  } },
  { level: 2, metric: 'CPM', make() {
    const cpc = rstep(30, 300, 5), ctr = pick([0.2, 0.4, 0.5, 0.8, 1, 1.5, 2]), ans = round(cpc * ctr / 100 * 1000);
    return {
      scenario: `${pick(BIZ.any)}のディスプレイ広告。<br>CPC <b>${fmt(cpc)}円</b>、CTR <b>${ctr}%</b> でした。`,
      question: 'このときのCPMはいくら？（1円未満は四捨五入）', unit: '円', d: 0, answer: ans,
      hint: 'CPM = CPC × CTR × 1,000（CTRは小数に直す）',
      steps: [`CPM = CPC × CTR × 1,000`, `= ${fmt(cpc)} × ${ctr / 100} × 1,000`, `= <b>${fmt(ans)}円</b>`],
    };
  } },
  { level: 2, metric: 'CPV', make() {
    const imp = rstep(50000, 1000000, 1000), vtr = pick([10, 15, 20, 25, 30, 40]), views = imp * vtr / 100, cpv = rnd(3, 25), cost = views * cpv;
    return {
      scenario: `${pick(BIZ.any)}の動画広告。<br>広告費 <b>${fmt(cost)}円</b>、表示回数 <b>${fmt(imp)}回</b>、視聴率（VTR）は <b>${vtr}%</b>。`,
      question: 'CPV（1視聴あたりの費用）はいくら？', unit: '円', d: 0, answer: cpv,
      hint: '視聴回数 = 表示回数 × VTR、CPV = 広告費 ÷ 視聴回数',
      steps: [`視聴回数 = ${fmt(imp)} × ${vtr}% = ${fmt(views)}回`, `CPV = ${fmt(cost)} ÷ ${fmt(views)} = <b>${fmt(cpv)}円</b>`],
    };
  } },

  // ===== 上級 =====
  { level: 3, metric: 'ROI', make() {
    const cost = rstep(200000, 3000000, 10000), roas = rstep(200, 700, 10), rev = cost * roas / 100, gm = pick([30, 40, 50, 60]);
    const gross = rev * gm / 100, ans = round((gross - cost) / cost * 100, 1);
    return {
      scenario: `${pick(BIZ.ec)}の四半期実績。<br>広告費 <b>${fmt(cost)}円</b>、広告経由の売上 <b>${fmt(rev)}円</b>、商品の粗利率は <b>${gm}%</b>。`,
      question: `ROI（投資対効果）は何%？（${RULE(1)}）`, unit: '%', d: 1, answer: ans,
      hint: 'ROI = (粗利 − 広告費) ÷ 広告費 × 100',
      steps: [`粗利 = ${fmt(rev)} × ${gm}% = ${fmt(gross)}円`, `ROI = (${fmt(gross)} − ${fmt(cost)}) ÷ ${fmt(cost)} × 100`, `≒ <b>${fmt(ans, 1)}%</b>`, ans < 0 ? '→ ROASは100%を超えていても、利益ベースでは赤字です！' : '→ 利益ベースでも黒字です。'],
    };
  } },
  { level: 3, metric: 'ROAS', make() {
    const gm = pick([20, 25, 30, 40, 50, 60]), ans = round(100 / gm * 100, 1);
    return {
      scenario: `${pick(BIZ.ec)}で取り扱う商品の粗利率は <b>${gm}%</b> です。<br>広告費以外のコストは考えないものとします。`,
      question: `赤字にならないために最低限必要なROAS（損益分岐ROAS）は何%？（${RULE(1)}）`, unit: '%', d: 1, answer: ans,
      hint: '損益分岐ROAS = 1 ÷ 粗利率 × 100',
      steps: [`売上 × 粗利率 = 広告費 となる点が損益分岐`, `ROAS = 売上 ÷ 広告費 = 1 ÷ ${gm / 100}`, `≒ <b>${fmt(ans, 1)}%</b>`],
    };
  } },
  { level: 3, metric: 'CPA', make() {
    const clicks = rstep(2000, 10000, 100), cpc = rstep(60, 250, 10), cvrA = pick([1, 1.5, 2, 2.5]), cvrB = round(cvrA * pick([1.25, 1.5, 2]), 2);
    const cost = clicks * cpc, cvA = clicks * cvrA / 100, cvB = clicks * cvrB / 100, cpaA = round(cost / cvA), cpaB = round(cost / cvB);
    return {
      scenario: `${pick(BIZ.lead)}のLPを改善しました。<br>月間クリック数 <b>${fmt(clicks)}回</b>・CPC <b>${fmt(cpc)}円</b> は変わらず、CVRが <b>${cvrA}% → ${cvrB}%</b> に改善。`,
      question: '改善後のCPAはいくら？（1円未満は四捨五入）', unit: '円', d: 0, answer: cpaB,
      hint: 'CPA = CPC ÷ CVR。または 広告費 ÷ 改善後のCV数',
      steps: [`広告費 = ${fmt(clicks)} × ${fmt(cpc)} = ${fmt(cost)}円`, `改善後CV = ${fmt(clicks)} × ${cvrB}% = ${fmt(cvB, cvB % 1 ? 1 : 0)}件`, `CPA = ${fmt(cost)} ÷ ${fmt(cvB, cvB % 1 ? 1 : 0)} ≒ <b>${fmt(cpaB)}円</b>`, `（改善前 ${fmt(cpaA)}円 から ${fmt(cpaA - cpaB)}円 ダウン）`],
    };
  } },
  { level: 3, metric: 'LTV', make() {
    const price = rstep(2000, 8000, 100), times = pick([3, 4, 5, 6, 8, 10, 12]), gm = pick([40, 50, 60, 70]);
    const ltv = price * times, ans = round(ltv * gm / 100);
    return {
      scenario: `定期購入型の${pick(['サプリメント', 'スキンケア', 'プロテイン', 'コーヒー豆'])}通販。<br>1回の購入単価 <b>${fmt(price)}円</b>、平均継続回数 <b>${times}回</b>、粗利率 <b>${gm}%</b>。`,
      question: 'LTV（粗利ベース）から考えた、1顧客獲得あたりの限界CPAはいくら？', unit: '円', d: 0, answer: ans,
      hint: 'LTV(粗利) = 購入単価 × 継続回数 × 粗利率',
      steps: [`LTV(売上) = ${fmt(price)} × ${times} = ${fmt(ltv)}円`, `LTV(粗利) = ${fmt(ltv)} × ${gm}% = <b>${fmt(ans)}円</b>`, `→ 初回購入だけなら限界CPAは ${fmt(round(price * gm / 100))}円。LTVで考えると大きく投資できます。`],
    };
  } },
  { level: 3, metric: '予算', make() {
    const target = rstep(1000000, 20000000, 100000), roas = pick([250, 300, 400, 500, 800]), ans = round(target / (roas / 100));
    return {
      scenario: `${pick(BIZ.ec)}で来月の広告経由売上 <b>${fmt(target)}円</b> を目指します。<br>現状のROASは <b>${roas}%</b> で、来月も同水準と見込んでいます。`,
      question: '必要な広告費はいくら？', unit: '円', d: 0, answer: ans,
      hint: '広告費 = 目標売上 ÷ ROAS',
      steps: [`広告費 = 目標売上 ÷ ROAS`, `= ${fmt(target)} ÷ ${roas / 100}`, `= <b>${fmt(ans)}円</b>`],
    };
  } },
  { level: 3, metric: '表示回数', make() {
    const cv = rstep(20, 300, 10), cvr = pick([1, 2, 2.5, 4, 5]), ctr = pick([0.5, 1, 2, 2.5]);
    const clicks = cv / (cvr / 100), ans = round(clicks / (ctr / 100));
    return {
      scenario: `${pick(BIZ.lead)}で月間 <b>${fmt(cv)}件</b> のCVを目標にしています。<br>想定CVRは <b>${cvr}%</b>、想定CTRは <b>${ctr}%</b>。`,
      question: '目標達成に必要な表示回数は何回？', unit: '回', d: 0, answer: ans,
      hint: 'ファネルを逆算：必要クリック = CV ÷ CVR、必要表示 = クリック ÷ CTR',
      steps: [`必要クリック数 = ${fmt(cv)} ÷ ${cvr / 100} = ${fmt(clicks)}回`, `必要表示回数 = ${fmt(clicks)} ÷ ${ctr / 100} = <b>${fmt(ans)}回</b>`],
    };
  } },
  { level: 3, metric: '利益', make() {
    const cost = rstep(300000, 2000000, 10000), cv = rnd(50, 400), aov = rstep(5000, 20000, 500), gm = pick([30, 40, 50]);
    const rev = cv * aov, gross = round(rev * gm / 100), ans = gross - cost;
    return {
      scenario: `${pick(BIZ.ec)}の今月の結果です。<br>広告費 <b>${fmt(cost)}円</b>、注文数 <b>${fmt(cv)}件</b>、客単価 <b>${fmt(aov)}円</b>、粗利率 <b>${gm}%</b>。`,
      question: '広告費を差し引いた利益（粗利 − 広告費）はいくら？（赤字ならマイナスで入力）', unit: '円', d: 0, answer: ans,
      hint: '売上 = 注文数 × 客単価、粗利 = 売上 × 粗利率',
      steps: [`売上 = ${fmt(cv)} × ${fmt(aov)} = ${fmt(rev)}円`, `粗利 = ${fmt(rev)} × ${gm}% = ${fmt(gross)}円`, `利益 = ${fmt(gross)} − ${fmt(cost)} = <b>${fmt(ans)}円</b>`],
    };
  } },
  { level: 3, metric: '比較', make() {
    // 3キャンペーンからCPAが最も良いものを選ぶ
    const names = ['A：検索広告', 'B：SNS広告', 'C：ディスプレイ広告'];
    const rows = names.map((n) => { const cost = rstep(200000, 900000, 10000), cv = rnd(15, 120); return { n, cost, cv, cpa: cost / cv }; });
    if (new Set(rows.map((r) => Math.round(r.cpa))).size < 3) return null;
    const best = rows.reduce((a, b) => (a.cpa < b.cpa ? a : b));
    return {
      type: 'choice',
      scenario: `${pick(BIZ.lead)}で3つの媒体を配信中。来月は最もCPAが良い媒体に予算を寄せたいです。<table class="data"><tr><th>キャンペーン</th><th>広告費</th><th>CV</th></tr>${rows.map((r) => `<tr><td>${r.n}</td><td>${fmt(r.cost)}円</td><td>${r.cv}件</td></tr>`).join('')}</table>`,
      question: 'CPAが最も低い（効率が良い）キャンペーンはどれ？',
      choices: names, answer: names.indexOf(best.n),
      hint: '各キャンペーンのCPA = 広告費 ÷ CV を計算して比べる',
      steps: rows.map((r) => `${r.n}：${fmt(r.cost)} ÷ ${r.cv} ≒ ${fmt(r.cpa)}円${r === best ? ' ← <b>最安</b>' : ''}`),
    };
  } },
];

// used: 同じラウンドで出題済みのジェネレーター（重複を避ける）
function generateCalc(level, used = new Set()) {
  const all = GENERATORS.filter((g) => level === 0 || g.level === level);
  let pool = all.filter((g) => !used.has(g));
  if (!pool.length) { all.forEach((g) => used.delete(g)); pool = all; }
  for (;;) {
    const g = pick(pool), p = g.make();
    used.add(g);
    if (p) return { kind: 'calc', type: p.type || 'number', level: g.level, metric: g.metric, cid: `calc:${GENERATORS.indexOf(g)}`, ...p };
  }
}
