/*
 * SquareX View Renderer
 * Copyright (C) 2023 SquareX
 */

import UI from './ui';

UI.addPropertyListener('sessionDisposed', updatedDisposedInfo);

const state = {
  timer: null,
  count: 6,
};

function updatedDisposedInfo() {
  const el = document.getElementById('redirect-countdown');

  if (!UI.sessionDisposed) {
    state.timer && window.clearTimeout(state.timer);
    return;
  }

  state.count--;

  if (state.count === 0) {
    el && (el.innerHTML = `Redirecting...`);
  } else {
    el && (el.innerHTML = `Redirecting in... ${state.count}`);
  }

  // THIS CODE IS ALL JUST TO CENTER THE SVG TEXT :(

  const translation = Array.from(el.transform.baseVal).find(
    (a) => a.type === SVGTransform.SVG_TRANSFORM_TRANSLATE
  );

  const current_x = translation?.matrix?.e ?? 0;
  const current_y = translation?.matrix?.f ?? 0;

  const svg = el.parentNode;

  const el_width = el.getBoundingClientRect().width;

  if (el_width < 1) {
    el.setAttribute(
      'transform',
      `translate(${Math.round(current_x)}, ${Math.round(current_y)})`
    );
  } else {
    const svg_dom_width = svg.getBoundingClientRect().width;
    const svg_actual_width = svg.viewBox.baseVal.width;
    const svg_ratio = svg_actual_width / svg_dom_width;

    const el_dom_position_left = (svg_dom_width - el_width) / 2;
    const el_svg_position_left = el_dom_position_left * svg_ratio;

    el.setAttribute(
      'transform',
      `translate(${Math.round(el_svg_position_left)}, ${Math.round(current_y)})`
    );
  }

  // Redirect when the timer is reached.

  if (state.count === 0) {
    if (!process.env.NO_REDIRECT) {
      window.location.href = process.env.DEMO_ORIGIN ?? 'https://malware.rip';
    }
    return;
  }

  state.timer = window.setTimeout(updatedDisposedInfo, 1000);
}
