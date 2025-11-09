document.addEventListener('DOMContentLoaded', () => {
  // Create tooltip element
  const tooltip = document.createElement('div');
  tooltip.id = 'map-tooltip';
  document.body.appendChild(tooltip);

  // Helper to show tooltip
  function showTooltip(e, text) {
    tooltip.textContent = text;
    tooltip.style.left = (e.pageX + 12) + 'px';
    tooltip.style.top = (e.pageY + 12) + 'px';
    tooltip.style.display = 'block';
  }

  function hideTooltip() {
    tooltip.style.display = 'none';
  }

  // Attach hover listeners to all country paths (works even before we know visited)
  const paths = document.querySelectorAll('.ag-canvas_svg path[id]');
  paths.forEach((p) => {
    p.addEventListener('mousemove', (e) => {
      const name = p.getAttribute('title') || p.id;
      showTooltip(e, name);
    });
    p.addEventListener('mouseleave', hideTooltip);
  });

  // Fetch visited countries from the API and mark them
  fetch('/api/visited')
    .then((res) => {
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    })
    .then((data) => {
      // API returns { countries: [ 'FR', 'US', ... ] }
      const codes = Array.isArray(data.countries) ? data.countries : (data.countries || []);
      codes.forEach((code) => {
        if (!code) return;
        // Trim and use as-is (IDs in SVG appear to be uppercase ISO codes)
        const id = String(code).trim();
        const el = document.getElementById(id);
        if (el) el.classList.add('visited');
      });

  // After marking, render labels and populate the side list
  renderVisitedLabels();
  populateVisitedList(codes);
    })
    .catch((err) => {
      // Fallback: try to read countries injected by server (if present)
      try {
        const injected = "<%= countries %>";
        if (injected && injected.length) {
          const fallback = injected.replace(/\[|\]|\s/g, '').split(',').filter(Boolean);
          fallback.forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.classList.add('visited');
          });
          renderVisitedLabels();
          populateVisitedList(fallback);
        }
      } catch (e) {
        // ignore
      }
      console.error('Failed to load visited countries', err);
    });

  // Create text labels in the SVG for visited countries large enough to show
  function renderVisitedLabels() {
    const svg = document.querySelector('.ag-canvas_svg');
    if (!svg) return;
    // Clear previous labels
    svg.querySelectorAll('text.country-label').forEach(n => n.remove());

    const ns = 'http://www.w3.org/2000/svg';
    const visited = svg.querySelectorAll('path.visited');
    visited.forEach((p) => {
      try {
        const bbox = p.getBBox();
        const area = bbox.width * bbox.height;
        // Skip very small shapes (tiny islands, microstates)
        if (area < 200) return;
        const name = p.getAttribute('title') || p.id;
        const x = bbox.x + bbox.width / 2;
        const y = bbox.y + bbox.height / 2;
        const label = document.createElementNS(ns, 'text');
        label.setAttribute('x', String(x));
        label.setAttribute('y', String(y));
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('dominant-baseline', 'middle');
        label.setAttribute('class', 'country-label');
        // Scale font size slightly by area, bounded
        const fontSize = Math.max(8, Math.min(16, Math.sqrt(area) / 3));
        label.style.fontSize = fontSize + 'px';
        label.textContent = name;
        svg.appendChild(label);
      } catch (_) {
        // getBBox can throw if element not in DOM
      }
    });
  }

  // Build the visited list sidebar and wire interactions
  function populateVisitedList(codes) {
    const list = document.getElementById('visited-list');
    const count = document.getElementById('visited-count');
    if (!list) return;
    list.innerHTML = '';
    const svg = document.querySelector('.ag-canvas_svg');
    const uniq = Array.from(new Set(codes));
    if (count) count.textContent = String(uniq.length);

    uniq
      .map((code) => {
        const el = svg ? svg.getElementById ? svg.getElementById(code) : document.getElementById(code) : document.getElementById(code);
        const name = el ? (el.getAttribute('title') || code) : code;
        return { code, name };
      })
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach(({ code, name }) => {
        const li = document.createElement('li');
        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.textContent = code;
        const text = document.createElement('span');
        text.textContent = name;
        li.appendChild(badge);
        li.appendChild(text);
        li.addEventListener('click', () => focusCountry(code));
        list.appendChild(li);
      });
  }

  function focusCountry(code) {
    const el = document.getElementById(code);
    if (!el) return;
    // Add a quick pulse effect
    el.classList.add('pulse');
    setTimeout(() => el.classList.remove('pulse'), 900);
    // Center tooltip on country
    const bbox = el.getBBox();
    const name = el.getAttribute('title') || code;
    const svg = document.querySelector('.ag-canvas_svg');
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = bbox.x + bbox.width / 2;
    pt.y = bbox.y + bbox.height / 2;
    const ctm = svg.getScreenCTM();
    if (ctm) {
      const screen = pt.matrixTransform(ctm);
      showTooltip({ pageX: screen.x, pageY: screen.y }, name);
      setTimeout(hideTooltip, 1200);
    }
  }
});
