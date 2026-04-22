(function () {
  'use strict';

  var HEIGHTS = {
    forecast:          420,
    'federal-pipeline': 380,
    signals:           300,
    materials:         360,
  };

  var BASE = 'https://constructaiq.trade';

  var script = document.currentScript;
  if (!script) return;

  var chart  = script.getAttribute('data-chart')  || 'forecast';
  var geo    = script.getAttribute('data-geo')     || 'national';
  var theme  = script.getAttribute('data-theme')   || 'dark';
  var period = script.getAttribute('data-period')  || '12M';

  var height = HEIGHTS[chart] || 400;

  var src = BASE + '/embed/' + encodeURIComponent(chart) +
    '?geo='    + encodeURIComponent(geo) +
    '&theme='  + encodeURIComponent(theme) +
    '&period=' + encodeURIComponent(period);

  var wrapper = document.createElement('div');
  wrapper.style.cssText = 'display:block;width:100%;max-width:100%;';

  var iframe = document.createElement('iframe');
  iframe.src = src;
  iframe.height = String(height);
  iframe.frameBorder = '0';
  iframe.scrolling = 'no';
  iframe.style.cssText =
    'display:block;width:100%;height:' + height + 'px;' +
    'border:none;overflow:hidden;';
  iframe.setAttribute('loading', 'lazy');
  iframe.setAttribute('allowtransparency', 'true');
  iframe.setAttribute('title', 'ConstructAIQ — ' + chart);

  var bar = document.createElement('div');
  bar.style.cssText =
    'text-align:right;font-size:11px;color:#666;' +
    'font-family:sans-serif;padding:3px 0 0;line-height:1;';
  bar.innerHTML =
    'Powered by <a href="' + BASE + '" target="_blank" rel="noopener noreferrer" ' +
    'style="color:#f5a623;text-decoration:none;">ConstructAIQ</a>' +
    ' · constructaiq.trade';

  wrapper.appendChild(iframe);
  wrapper.appendChild(bar);

  if (script.parentNode) {
    script.parentNode.insertBefore(wrapper, script.nextSibling);
  }

  function fit() {
    var w = wrapper.offsetWidth;
    if (w > 0) iframe.style.width = w + 'px';
  }

  window.addEventListener('resize', fit, { passive: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fit, { once: true });
  } else {
    fit();
  }
})();
