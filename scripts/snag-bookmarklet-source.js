/**
 * BFC Snag Tool - bookmarklet source (readable version).
 * The minified form lives in /snag-tool.html as the draggable link.
 * If you edit this, re-minify and update the href there.
 *
 * What it does: click the bookmark on any page of the preview site,
 * press "+ Snag", click any element, type a note. Snags accumulate in
 * localStorage across pages on the same domain. "Export" downloads a
 * JSON file to drop into the Claude thread.
 */
(function () {
  var KEY = 'bfcSnags';
  if (document.getElementById('bfc-snag-panel')) {
    document.getElementById('bfc-snag-panel').remove();
    return;
  }
  var picking = false, lastEl = null;

  function load() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } }
  function save(a) { localStorage.setItem(KEY, JSON.stringify(a)); count.textContent = a.length; }

  // Build a stable, human-readable selector for the clicked element
  function selector(el) {
    if (el.id) return '#' + el.id;
    var parts = [];
    while (el && el.nodeType === 1 && parts.length < 5 && el.tagName !== 'BODY') {
      var p = el.tagName.toLowerCase();
      if (el.className && typeof el.className === 'string') {
        var c = el.className.trim().split(/\s+/).slice(0, 2).join('.');
        if (c) p += '.' + c;
      }
      var parent = el.parentElement;
      if (parent) {
        var same = [].filter.call(parent.children, function (x) { return x.tagName === el.tagName; });
        if (same.length > 1) p += ':nth-of-type(' + (same.indexOf(el) + 1) + ')';
      }
      parts.unshift(p);
      el = parent;
    }
    return parts.join(' > ');
  }

  function endPick() {
    picking = false;
    document.body.style.cursor = '';
    if (lastEl) { lastEl.style.outline = ''; lastEl = null; }
    btn.textContent = '+ Snag';
  }

  document.addEventListener('mouseover', function (e) {
    if (!picking || panel.contains(e.target)) return;
    if (lastEl) lastEl.style.outline = '';
    lastEl = e.target;
    lastEl.style.outline = '3px solid #E0472B';
  }, true);

  document.addEventListener('click', function (e) {
    if (!picking || panel.contains(e.target)) return;
    e.preventDefault(); e.stopPropagation();
    var el = e.target;
    var note = prompt('Snag note for this element:');
    endPick();
    if (!note) return;
    var a = load();
    a.push({
      page: location.pathname,
      selector: selector(el),
      note: note,
      viewport: innerWidth + 'x' + innerHeight,
      dpr: devicePixelRatio,
      text: (el.innerText || '').trim().slice(0, 90),
      when: new Date().toISOString()
    });
    save(a);
  }, true);

  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && picking) endPick(); }, true);

  // ---- panel UI ----
  var panel = document.createElement('div');
  panel.id = 'bfc-snag-panel';
  panel.style.cssText = 'position:fixed;top:14px;right:14px;z-index:2147483647;background:#000;color:#F6F6F4;font:13px/1.4 Arial,sans-serif;padding:10px 12px;border-radius:10px;box-shadow:0 6px 24px rgba(0,0,0,.35);display:flex;gap:8px;align-items:center';
  function mk(label, fn) {
    var b = document.createElement('button');
    b.textContent = label;
    b.style.cssText = 'background:#BEAD9D;border:0;color:#000;padding:5px 10px;border-radius:6px;cursor:pointer;font:inherit';
    b.onclick = fn; panel.appendChild(b); return b;
  }
  var count = document.createElement('b'); count.textContent = load().length; panel.appendChild(count);
  var btn = mk('+ Snag', function () {
    picking = !picking;
    document.body.style.cursor = picking ? 'crosshair' : '';
    btn.textContent = picking ? 'click element…' : '+ Snag';
  });
  mk('Export', function () {
    var blob = new Blob([JSON.stringify(load(), null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'bfc-snags-' + new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-') + '.json';
    a.click();
  });
  mk('Clear', function () { if (confirm('Delete all stored snags?')) save([]); });
  mk('×', function () { endPick(); panel.remove(); });
  document.body.appendChild(panel);
})();
