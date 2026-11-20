// Token Radar dashboard. Reads window.RADAR (written by main.ts), renders
// the board, a detail view for every protocol, a live-token view, and a
// model sandbox that re-scores the board in the page with the same formula.
(function () {
  var D = window.RADAR;
  var root = document.getElementById('board');
  if (!D || !D.rows) { root.textContent = 'No radar data.'; return; }
  root.removeAttribute('aria-busy');

  var state = { tab: 'pre', q: '', cat: '', chain: '', sort: 'rank', sel: null,
    base: D.model.base_multiple, up: D.model.growth_up_weight, down: D.model.growth_down_weight };

  function money(n) {
    if (n == null) return '—';
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
    return '$' + Math.round(n);
  }
  function pct(n) { return n == null ? '—' : (n > 0 ? '+' : '') + n.toFixed(1) + '%'; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function scored(row) {
    var growth = row.change_7d == null ? 0 : Math.min(100, Math.max(-50, row.change_7d));
    var w = growth >= 0 ? state.up : state.down;
    var gm = 1 + (growth / 100) * w;
    var age = row.age_days == null ? 180 : row.age_days;
    var mm = 0.55 + (Math.min(Math.max(age, 0), 730) / 730) * 0.45;
    var bm = 1 + Math.min(Math.max(row.chains.length - 1, 0), 7) * 0.03;
    var implied = Math.max(1, Math.round(row.tvl_usd * state.base * gm * mm * bm));
    return { implied: implied, gm: gm, mm: mm, bm: bm, growth: growth };
  }

  function cats() {
    var s = {};
    D.rows.forEach(function (r) { if (r.category) s[r.category] = 1; });
    return Object.keys(s).sort();
  }
  function chains() {
    var s = {};
    D.rows.forEach(function (r) { r.chains.forEach(function (c) { s[c] = 1; }); });
    return Object.keys(s).sort();
  }

  function filtered() {
    var list = state.tab === 'live' ? D.live : D.rows.map(function (r) {
      var s = scored(r); return Object.assign({}, r, { implied_value_usd: s.implied, growth_multiplier: s.gm, maturity_multiplier: s.mm, breadth_multiplier: s.bm });
    });
    if (state.tab === 'pre') {
      if (state.q) list = list.filter(function (r) { return (r.name + ' ' + r.slug + ' ' + (r.category || '')).toLowerCase().indexOf(state.q.toLowerCase()) >= 0; });
      if (state.cat) list = list.filter(function (r) { return r.category === state.cat; });
      if (state.chain) list = list.filter(function (r) { return r.chains.indexOf(state.chain) >= 0; });
    }
    var k = state.sort;
    list = list.slice();
    if (k === 'implied') list.sort(function (a, b) { return (b.implied_value_usd || b.mcap_usd || 0) - (a.implied_value_usd || a.mcap_usd || 0); });
    else if (k === 'tvl') list.sort(function (a, b) { return b.tvl_usd - a.tvl_usd; });
    else if (k === 'growth') list.sort(function (a, b) { return (b.change_7d || 0) - (a.change_7d || 0); });
    else if (k === 'age') list.sort(function (a, b) { return (b.age_days || 0) - (a.age_days || 0); });
    else list.sort(function (a, b) { return (a.rank || 9999) - (b.rank || 9999); });
    return list;
  }

  function render() {
    var list = filtered();
    var maxImplied = Math.max.apply(null, D.rows.map(function (r) { return r.implied_value_usd; }));
    var catOpts = cats().map(function (c) { return '<option' + (state.cat === c ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('');
    var chainOpts = chains().map(function (c) { return '<option' + (state.chain === c ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('');
    var rowsHtml = list.map(function (r) {
      var val = state.tab === 'live' ? r.mcap_usd : r.implied_value_usd;
      var pctW = state.tab === 'live' ? 0 : Math.max(4, Math.round((r.implied_value_usd / maxImplied) * 100));
      return '<tr data-slug="' + esc(r.slug) + '" data-selected="' + (state.sel === r.slug) + '">' +
        '<td class="num">' + (r.rank || '—') + '</td>' +
        '<td><span class="name"><b>' + esc(r.name) + '</b><span class="sub">' + esc(r.slug) + ' · ' + esc(r.category || 'No category') + '</span></span></td>' +
        '<td class="sub">' + esc(r.chains.slice(0, 3).join(', ')) + (r.chains.length > 3 ? ' +' + (r.chains.length - 3) : '') + '</td>' +
        '<td class="num">' + money(r.tvl_usd) + '</td>' +
        '<td class="num ' + ((r.change_7d || 0) >= 0 ? 'pos' : 'neg') + '">' + pct(r.change_7d) + '</td>' +
        '<td><span class="implied"><span class="num">' + money(val) + '</span>' + (state.tab === 'live' ? '' : '<span class="bar"><i style="width:' + pctW + '%"></i></span>') + '</span></td>' +
        '<td>' + (state.tab === 'live' ? '<span class="tag">already trades</span>' : '<span class="tag">pre-token</span>') + '</td></tr>';
    }).join('');
    root.innerHTML =
      '<div class="shell">' +
      '<div class="top"><div><div class="brand"><span class="mark"></span><span class="brand-name">TOKEN RADAR · ' + esc(D.model_version) + '</span></div>' +
      '<h1>Pre-token protocols, ranked by implied value</h1></div>' +
      '<div class="top-meta"><span>Snapshot ' + esc(D.as_of) + '</span><span>Watchlist floor ' + money(D.floor_usd) + '</span><span>' + D.board_size + ' ranked rows</span></div></div>' +
      '<div class="lede"><div><h2>What a token would be worth if the record stayed as it is</h2>' +
      '<p>Every protocol here records no token yet. Implied value follows only from the snapshot: TVL, seven-day growth, how long it has run with no token, and how many chains it runs on. It does not predict whether or when a token is issued. Each row carries the steps to farm it, with what they cost and how long they take.</p></div>' +
      '<div class="facts">' +
      '<div class="fact"><span>Watchlist protocols</span><b>' + D.watchlist_size + '</b></div>' +
      '<div class="fact"><span>Early rows below the floor</span><b>' + D.early_size + '</b></div>' +
      '<div class="fact"><span>Live-token protocols set aside</span><b>' + D.live_size + '</b></div>' +
      '<div class="fact"><span>Top implied value</span><b>' + money(maxImplied) + '</b></div>' +
      '</div></div>' +
      '<div class="controls">' +
      '<div class="tabs" role="group" aria-label="View"><button data-tab="pre" aria-pressed="' + (state.tab === 'pre') + '">Pre-token board</button><button data-tab="live" aria-pressed="' + (state.tab === 'live') + '">Live tokens</button></div>' +
      '<div class="field"><label for="q">Search</label><input id="q" type="search" value="' + esc(state.q) + '" placeholder="Name, slug or category"></div>' +
      '<div class="field"><label for="cat">Category</label><select id="cat"><option value="">All categories</option>' + catOpts + '</select></div>' +
      '<div class="field"><label for="chain">Chain</label><select id="chain"><option value="">All chains</option>' + chainOpts + '</select></div>' +
      '<div class="field"><label for="sort">Sort by</label><select id="sort">' +
      '<option value="rank"' + (state.sort === 'rank' ? ' selected' : '') + '>Rank</option>' +
      '<option value="implied"' + (state.sort === 'implied' ? ' selected' : '') + '>Implied value</option>' +
      '<option value="tvl"' + (state.sort === 'tvl' ? ' selected' : '') + '>TVL</option>' +
      '<option value="growth"' + (state.sort === 'growth' ? ' selected' : '') + '>7-day growth</option>' +
      '<option value="age"' + (state.sort === 'age' ? ' selected' : '') + '>Age</option></select></div>' +
      '<span class="count">' + list.length + ' shown</span></div>' +
      '<div class="panel"><div class="table-wrap"><table><thead><tr><th>Rank</th><th>Protocol</th><th>Chains</th><th>TVL</th><th>7d</th><th>' + (state.tab === 'live' ? 'Market cap' : 'Implied value') + '</th><th>Status</th></tr></thead>' +
      '<tbody>' + (rowsHtml || '<tr><td colspan="7">No protocols match this filter.</td></tr>') + '</tbody></table></div></div>' +
      '<div class="panel model"><h2>How the value is worked out — and how to test it</h2>' +
      '<p class="formula">implied = TVL × base (' + state.base.toFixed(2) + ') × growth (1 + clamped 7d change × ' + (state.up).toFixed(2) + ' up / ' + (state.down).toFixed(2) + ' down) × maturity (0.55 + age up to 730 days × 0.45) × breadth (1 + extra chains × 0.03, max 7). Falls hurt more than rises help. Unknown age counts as 180 days, so it gets little credit.</p>' +
      '<div class="sandbox">' +
      '<label>Base multiple <input id="sb-base" type="range" min="0.05" max="0.5" step="0.01" value="' + state.base + '"> <span>' + state.base.toFixed(2) + '</span></label>' +
      '<label>Growth up <input id="sb-up" type="range" min="0" max="1" step="0.05" value="' + state.up + '"> <span>' + state.up.toFixed(2) + '</span></label>' +
      '<label>Growth down <input id="sb-down" type="range" min="0" max="1" step="0.05" value="' + state.down + '"> <span>' + state.down.toFixed(2) + '</span></label>' +
      '<button class="button" id="sb-reset" type="button">Reset model</button></div>' +
      '<p class="note">Move a slider and the board re-scores live, with the same formula the program uses. The submitted board is the one at the stated constants above. Source: ' + esc(D.source) + '. A protocol records no token — that is not proof it has none.</p></div>' +
      '</div>' +
      '<div class="detail" id="detail" hidden></div>';

    root.querySelectorAll('[data-tab]').forEach(function (b) { b.addEventListener('click', function () { state.tab = b.getAttribute('data-tab'); state.sel = null; render(); }); });
    var q = root.querySelector('#q'); q.addEventListener('input', function () { state.q = q.value; render(); var nq = root.querySelector('#q'); nq.focus(); nq.setSelectionRange(nq.value.length, nq.value.length); });
    root.querySelector('#cat').addEventListener('change', function (e) { state.cat = e.target.value; render(); });
    root.querySelector('#chain').addEventListener('change', function (e) { state.chain = e.target.value; render(); });
    root.querySelector('#sort').addEventListener('change', function (e) { state.sort = e.target.value; render(); });
    root.querySelector('#sb-base').addEventListener('input', function (e) { state.base = parseFloat(e.target.value); render(); });
    root.querySelector('#sb-up').addEventListener('input', function (e) { state.up = parseFloat(e.target.value); render(); });
    root.querySelector('#sb-down').addEventListener('input', function (e) { state.down = parseFloat(e.target.value); render(); });
    root.querySelector('#sb-reset').addEventListener('click', function () { state.base = D.model.base_multiple; state.up = D.model.growth_up_weight; state.down = D.model.growth_down_weight; render(); });
    root.querySelectorAll('tbody tr[data-slug]').forEach(function (tr) { tr.addEventListener('click', function () { openDetail(tr.getAttribute('data-slug')); }); });
    if (state.sel) openDetail(state.sel, true);
  }

  function openDetail(slug, keep) {
    state.sel = slug;
    var r = null;
    D.rows.forEach(function (x) { if (x.slug === slug) r = x; });
    if (!r) { D.live.forEach(function (x) { if (x.slug === slug) r = x; }); }
    var d = document.getElementById('detail');
    if (!r) { d.hidden = true; return; }
    var s = r.rank ? scored(r) : null;
    var steps = r.farm_steps ? '<ol class="steps">' + r.farm_steps.map(function (st) { return '<li>' + esc(st) + '</li>'; }).join('') + '</ol>' : '<p class="note">This protocol already trades, so there is no farm plan for a token that does not exist yet. Its market cap is the market\u2019s own value.</p>';
    var eq = s ? '<div class="equation">' +
      '<div><span>TVL × ' + state.base.toFixed(2) + '</span><b>' + money(r.tvl_usd * state.base) + '</b></div>' +
      '<div><span>Growth ' + pct(r.change_7d) + ' → ×' + s.gm.toFixed(2) + '</span><b>×' + s.gm.toFixed(2) + '</b></div>' +
      '<div><span>Maturity, ' + (r.age_days == null ? 'age unknown' : r.age_days + ' days') + ' → ×' + s.mm.toFixed(2) + '</span><b>×' + s.mm.toFixed(2) + '</b></div>' +
      '<div><span>Breadth, ' + r.chains.length + ' chains → ×' + s.bm.toFixed(2) + '</span><b>×' + s.bm.toFixed(2) + '</b></div>' +
      '<div><span>Implied value</span><b>' + money(s.implied) + '</b></div></div>' : '';
    d.innerHTML = '<div class="detail-head"><div><span class="tag">' + (r.rank ? 'Rank ' + r.rank + ' · pre-token' : 'Live token') + '</span><h2>' + esc(r.name) + '</h2><p class="sub">' + esc(r.slug) + ' · ' + esc(r.category || 'No category') + ' · ' + esc(r.chains.join(', ')) + '</p></div><button class="close" type="button">Close</button></div>' +
      '<div class="detail-section"><h3>Value</h3><p>TVL <b class="num">' + money(r.tvl_usd) + '</b> · 7d <b class="num">' + pct(r.change_7d) + '</b> · Listed <b>' + esc(r.listed_at || 'unknown') + '</b></p>' + eq + '</div>' +
      '<div class="detail-section"><h3>How to farm it</h3>' + steps + '</div>' +
      '<div class="detail-section"><p class="note">Implied value is this radar\u2019s own claim, from the snapshot alone. It does not predict whether or when a token is issued.</p></div>';
    d.hidden = false;
    d.querySelector('.close').addEventListener('click', function () { state.sel = null; d.hidden = true; render(); });
    if (!keep) { var tr = root.querySelector('tr[data-slug="' + slug + '"]'); if (tr) tr.setAttribute('data-selected', 'true'); }
  }

  render();
})();
