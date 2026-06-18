/**
 * MT Logo — animazione lettere M/T lungo il tracciato esagonale.
 * Percorso da lo.svg (anello esterno), adattato al viewBox del logo.
 */
(function () {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var INITIAL_DELAY_MS = 700;
  var INTRO_LAP_MS = 1500;

  var ORIGINAL_M_REF = { x: 503.5, y: 176.5 };
  var ORIGINAL_T_REF = { x: 977, y: 554.5 };

  // Anello esterno da lo.svg (solo il perimetro, senza buco interno e linea centrale)
  var LO_TRACCIATO_D =
    'M0.001,0l278.794,111.519l268.931,-107.573c3.683,-1.476 7.87,0.32 9.342,4.003' +
    'c0.37,0.915 0.531,1.864 0.516,2.794l0,439.305l-276.12,110.449c-0.877,0.351 -1.784,0.516 -2.669,0.512' +
    'c-0.893,0.004 -1.796,-0.161 -2.67,-0.512l-271.605,-108.642c-2.851,-1.141 -4.572,-3.908 -4.519,-6.808l0,-445.047Z';

  var LO_VIEWBOX = { w: 558, h: 562 };

  function splitPathD(d) {
    return (d.match(/M[^M]*/g) || []).map(function (part) {
      return part.trim();
    });
  }

  function pathBBox(svg, d) {
    var probe = document.createElementNS(SVG_NS, 'path');
    probe.setAttribute('d', d);
    svg.appendChild(probe);
    var box = probe.getBBox();
    svg.removeChild(probe);
    return box;
  }

  function getViewBoxSize(svg) {
    var viewBox = svg.getAttribute('viewBox');
    if (viewBox) {
      var parts = viewBox.trim().split(/[\s,]+/);
      if (parts.length === 4) {
        return { w: parseFloat(parts[2]), h: parseFloat(parts[3]) };
      }
    }
    return {
      w: parseFloat(svg.getAttribute('width')) || 157.56,
      h: parseFloat(svg.getAttribute('height')) || 137.11,
    };
  }

  function fitLoPathToSvg(svg) {
    var target = getViewBoxSize(svg);
    var scale = Math.min(target.w / LO_VIEWBOX.w, target.h / LO_VIEWBOX.h);
    return {
      scale: scale,
      offsetX: (target.w - LO_VIEWBOX.w * scale) / 2,
      offsetY: (target.h - LO_VIEWBOX.h * scale) / 2,
    };
  }

  function mapLoPoint(point, fit) {
    return {
      x: point.x * fit.scale + fit.offsetX,
      y: point.y * fit.scale + fit.offsetY,
    };
  }

  function nearestOnPath(path, pathLength, target, fit) {
    var best = null;
    var i;

    for (i = 0; i <= 500; i++) {
      var t = i / 500;
      var local = path.getPointAtLength(t * pathLength);
      var mapped = mapLoPoint(local, fit);
      var dist = Math.pow(mapped.x - target.x, 2) + Math.pow(mapped.y - target.y, 2);

      if (!best || dist < best.dist) {
        best = { offset: t, point: mapped, dist: dist };
      }
    }

    return best;
  }

  function letterSlotTarget(box, corner) {
    if (corner === 'tl') {
      return { x: box.x + box.width * 0.35, y: box.y + box.height * 0.35 };
    }
    return { x: box.x + box.width * 0.65, y: box.y + box.height * 0.65 };
  }

  function createLetterGroup(id, pathD, ref, letterBox, maskFill) {
    var group = document.createElementNS(SVG_NS, 'g');
    var inner = document.createElementNS(SVG_NS, 'g');
    var pad = 2;
    var mask = document.createElementNS(SVG_NS, 'rect');
    var letter = document.createElementNS(SVG_NS, 'path');

    group.id = id;
    group.dataset.mtRefX = String(ref.x);
    group.dataset.mtRefY = String(ref.y);

    inner.setAttribute('transform', 'translate(' + (-ref.x) + ' ' + (-ref.y) + ')');

    mask.setAttribute('x', String(letterBox.x - pad));
    mask.setAttribute('y', String(letterBox.y - pad));
    mask.setAttribute('width', String(letterBox.width + pad * 2));
    mask.setAttribute('height', String(letterBox.height + pad * 2));
    mask.setAttribute('rx', '4');
    mask.setAttribute('fill', maskFill);

    letter.setAttribute('d', pathD);
    letter.setAttribute('class', 'cls-1');
    letter.setAttribute('fill', 'currentColor');
    letter.setAttribute('fill-rule', 'evenodd');

    inner.appendChild(mask);
    inner.appendChild(letter);
    group.appendChild(inner);

    return group;
  }

  function resolveMaskFill(root) {
    var value = getComputedStyle(root).getPropertyValue('--mt-header-bg').trim();
    if (value) {
      return value;
    }

    var header = root.closest('.elementor-location-header');
    if (header) {
      var bg = getComputedStyle(header).backgroundColor;
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
        return bg;
      }
    }

    return '#0a0a0f';
  }

  function readPathFit(svg) {
    return {
      scale: parseFloat(svg.dataset.mtPathScale),
      offsetX: parseFloat(svg.dataset.mtPathOffsetX),
      offsetY: parseFloat(svg.dataset.mtPathOffsetY),
    };
  }

  function prepareElementorSvg(root) {
    var svg = root.querySelector('svg');
    if (!svg || svg.dataset.mtLogoPrepared === 'true') {
      return svg;
    }

    if (svg.querySelector('#tracciato')) {
      return svg;
    }

    if (svg.id !== 'Livello_2' && !root.hasAttribute('data-mt-logo-animation')) {
      return null;
    }

    var paths = svg.querySelectorAll('path');
    if (paths.length < 2) {
      return null;
    }

    var letterParts = splitPathD(paths[0].getAttribute('d') || '');
    if (letterParts.length < 2) {
      return null;
    }

    var parent = paths[0].parentNode;
    var maskFill = resolveMaskFill(root);
    var mBox = pathBBox(svg, letterParts[0]);
    var tBox = pathBBox(svg, letterParts[1]);
    var fit = fitLoPathToSvg(svg);

    svg.dataset.mtPathScale = String(fit.scale);
    svg.dataset.mtPathOffsetX = String(fit.offsetX);
    svg.dataset.mtPathOffsetY = String(fit.offsetY);

    var tracciato = document.createElementNS(SVG_NS, 'path');
    tracciato.id = 'tracciato';
    tracciato.setAttribute('d', LO_TRACCIATO_D);
    tracciato.setAttribute('fill', 'none');
    tracciato.setAttribute('stroke', 'none');
    tracciato.setAttribute('pointer-events', 'none');
    tracciato.setAttribute('visibility', 'hidden');
    parent.appendChild(tracciato);

    var pathLength = tracciato.getTotalLength();
    var mSlot = nearestOnPath(tracciato, pathLength, letterSlotTarget(mBox, 'tl'), fit);
    var tSlot = nearestOnPath(tracciato, pathLength, letterSlotTarget(tBox, 'br'), fit);

    if (!mSlot || !tSlot) {
      return null;
    }

    var letterM = createLetterGroup('m', letterParts[0], mSlot.point, mBox, maskFill);
    var letterT = createLetterGroup('t', letterParts[1], tSlot.point, tBox, maskFill);

    letterM.dataset.mtStart = String(mSlot.offset);
    letterT.dataset.mtStart = String(tSlot.offset);

    paths[0].setAttribute('visibility', 'hidden');
    paths[0].setAttribute('aria-hidden', 'true');

    var animLayer = document.createElementNS(SVG_NS, 'g');
    animLayer.id = 'mt-animated-letters';
    animLayer.appendChild(letterM);
    animLayer.appendChild(letterT);
    parent.appendChild(animLayer);

    svg.dataset.mtLogoPrepared = 'true';
    root.classList.add('mt-logo-animated');
    return svg;
  }

  function pathOffsetAt(path, pathLength, x, y, fit) {
    var best = 0;
    var bestDist = Infinity;
    var i;

    for (i = 0; i <= 500; i++) {
      var t = (i / 500) * pathLength;
      var mapped = mapLoPoint(path.getPointAtLength(t), fit);
      var dist = Math.pow(mapped.x - x, 2) + Math.pow(mapped.y - y, 2);
      if (dist < bestDist) {
        bestDist = dist;
        best = t / pathLength;
      }
    }

    return best;
  }

  function normalizeOffset(offset) {
    return ((offset % 1) + 1) % 1;
  }

  function placeOnPath(path, pathLength, letterEl, offset, fit) {
    var local = path.getPointAtLength(normalizeOffset(offset) * pathLength);
    var point = mapLoPoint(local, fit);
    letterEl.setAttribute('transform', 'translate(' + point.x + ' ' + point.y + ')');
  }

  function easeInOut(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function interpolateFullLap(startOffset, forward, progress) {
    return normalizeOffset(startOffset + (forward ? progress : -progress));
  }

  function animateFullLap(path, pathLength, letterEl, startOffset, forward, duration, fit) {
    return new Promise(function (resolve) {
      var startTime = performance.now();

      function frame(now) {
        var t = Math.min((now - startTime) / duration, 1);
        var offset = interpolateFullLap(startOffset, forward, easeInOut(t));
        placeOnPath(path, pathLength, letterEl, offset, fit);

        if (t < 1) {
          requestAnimationFrame(frame);
        } else {
          placeOnPath(path, pathLength, letterEl, startOffset, fit);
          resolve();
        }
      }

      requestAnimationFrame(frame);
    });
  }

  function wait(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  function resolveAnchors(path, pathLength, letterM, letterT, fit) {
    var mStart = parseFloat(letterM.dataset.mtStart);
    var tStart = parseFloat(letterT.dataset.mtStart);

    if (!isNaN(mStart) && !isNaN(tStart)) {
      return { mStart: mStart, tStart: tStart };
    }

    return {
      mStart: pathOffsetAt(path, pathLength, ORIGINAL_M_REF.x, ORIGINAL_M_REF.y, fit),
      tStart: pathOffsetAt(path, pathLength, ORIGINAL_T_REF.x, ORIGINAL_T_REF.y, fit),
    };
  }

  function initLogoAnimation(root) {
    if (root.dataset.mtLogoInitialized === 'true') {
      return;
    }

    var svg = prepareElementorSvg(root) || root.querySelector('svg');
    if (!svg) {
      return;
    }

    var path = svg.querySelector('#tracciato');
    var letterM = svg.querySelector('#m');
    var letterT = svg.querySelector('#t');

    if (!path || !letterM || !letterT) {
      return;
    }

    root.dataset.mtLogoInitialized = 'true';

    var fit = readPathFit(svg);
    var pathLength = path.getTotalLength();
    var anchors = resolveAnchors(path, pathLength, letterM, letterT, fit);

    placeOnPath(path, pathLength, letterM, anchors.mStart, fit);
    placeOnPath(path, pathLength, letterT, anchors.tStart, fit);

    async function start() {
      await wait(INITIAL_DELAY_MS);
      await Promise.all([
        animateFullLap(path, pathLength, letterM, anchors.mStart, true, INTRO_LAP_MS, fit),
        animateFullLap(path, pathLength, letterT, anchors.tStart, true, INTRO_LAP_MS, fit),
      ]);
    }

    start();
  }

  function boot() {
    document.querySelectorAll('[data-mt-logo-animation]').forEach(initLogoAnimation);

    document.querySelectorAll('.elementor-location-header svg#Livello_2').forEach(function (svg) {
      var root = svg.closest('[data-mt-logo-animation]') || svg.parentElement;
      if (root && root.dataset.mtLogoInitialized !== 'true') {
        initLogoAnimation(root);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
