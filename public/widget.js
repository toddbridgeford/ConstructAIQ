(function () {
  var config = window.ConstructAIQConfig || {};
  var variant = config.variant || 'compact';
  var theme = config.theme || 'dark';
  var BASE = 'https://constructaiq.trade';

  var colors = theme === 'light' ? {
    bg: '#ffffff', text: '#000000', border: '#e0e0e0', sub: '#666666'
  } : {
    bg: '#1a1a1a', text: '#ffffff', border: '#383838', sub: '#6e6e73'
  };
  var amber = '#f5a623', green = '#30d158', red = '#ff453a';

  function el(tag, styles, content) {
    var d = document.createElement(tag);
    Object.assign(d.style, styles);
    if (content) d.innerHTML = content;
    return d;
  }

  function render(data) {
    var root = document.getElementById('constructaiq-widget');
    if (!root) return;

    var cshi = data.cshi || { value: '--', classification: '--', change: 0 };
    var mats = data.materials || [];
    var states = (data.topStates || []).slice(0, 3);

    var wrap = el('div', {
      background: colors.bg,
      border: '1px solid ' + colors.border,
      borderRadius: '8px',
      fontFamily: 'ui-monospace, SF Mono, Consolas, monospace',
      overflow: 'hidden',
      width: '300px'
    });

    var header = el('div', {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 14px', borderBottom: '1px solid ' + colors.border
    }, '<span style="font-size:10px;color:' + amber + '">ConstructAIQ&#8482;</span>' +
       '<span style="font-size:9px;color:' + green + '">&#9679; LIVE</span>');
    wrap.appendChild(header);

    var body = el('div', { padding: variant === 'compact' ? '10px 14px' : '14px' });

    if (variant === 'compact') {
      body.innerHTML =
        '<div style="font-size:13px;color:' + colors.text + ';margin-bottom:4px">SECTOR HEALTH: ' + cshi.value + ' \u2014 ' + cshi.classification + '</div>' +
        '<div style="font-size:9px;color:' + colors.sub + '">Updated 4hrs ago \u00b7 <a href="' + BASE + '" target="_blank" style="color:' + amber + ';text-decoration:none">constructaiq.trade \u2192</a></div>';
    } else {
      var matsHtml = mats.slice(0, 3).map(function (m) {
        var c = m.signal === 'BUY' ? green : m.signal === 'SELL' ? red : amber;
        return '<div style="display:flex;justify-content:space-between;font-size:11px;padding:4px 0;border-top:1px solid ' + colors.border + '">' +
          '<span style="color:' + colors.text + '">' + m.name + '</span>' +
          '<span style="color:' + c + '">' + m.signal + '</span></div>';
      }).join('');

      var statesHtml = variant === 'full'
        ? '<div style="font-size:10px;color:' + colors.sub + ';margin:8px 0 4px">TOP MARKETS</div>' +
          states.map(function (s) {
            return '<span style="display:inline-block;padding:2px 8px;margin:2px;border-radius:4px;font-size:10px;color:' + amber + ';border:1px solid ' + amber + '44">' + s + '</span>';
          }).join('')
        : '';

      var foreHtml = variant === 'full'
        ? '<div style="margin-top:10px;padding-top:10px;border-top:1px solid ' + colors.border + '">' +
          '<div style="font-size:10px;color:' + colors.sub + ';margin-bottom:2px">12-MO FORECAST</div>' +
          '<div style="font-size:16px;color:' + green + '">+' + (data.forecast12mo || 4.2) + '%</div></div>'
        : '';

      body.innerHTML =
        '<div style="font-size:10px;color:' + colors.sub + ';margin-bottom:3px">SECTOR HEALTH INDEX</div>' +
        '<div style="font-size:24px;color:' + amber + ';font-weight:700;margin-bottom:6px">' + cshi.value + ' <span style="font-size:12px;color:' + green + '">\u25b2 ' + cshi.classification + '</span></div>' +
        matsHtml + statesHtml + foreHtml +
        '<a href="' + BASE + '/dashboard" target="_blank" style="display:block;text-align:center;margin-top:12px;padding:8px;background:' + amber + ';color:#000;border-radius:6px;font-size:11px;text-decoration:none">View Full Dashboard \u2192</a>' +
        '<div style="text-align:center;font-size:9px;color:' + colors.sub + ';margin-top:6px">Powered by constructaiq.trade</div>';
    }

    wrap.appendChild(body);
    root.innerHTML = '';
    root.appendChild(wrap);

    // Click tracking
    wrap.addEventListener('click', function () {
      try { fetch(BASE + '/api/widget-data?click=1&domain=' + encodeURIComponent(location.hostname)); } catch (e) {}
    });
  }

  fetch(BASE + '/api/widget-data')
    .then(function (r) { return r.json(); })
    .then(function (d) { render(d); })
    .catch(function () { render({}); });
})();
