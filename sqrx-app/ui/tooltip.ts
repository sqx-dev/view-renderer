/*
 * SquareX View Renderer
 * Copyright (C) 2023 SquareX
 */
import { $id, $queryAll } from '../util';

const tooltip_element = $id('tooltip') ?? document.createElement('div');

export function initTooltip() {
  const elementsWithTooltip = Array.from($queryAll('[data-tooltip]'));

  elementsWithTooltip.forEach((el) => {
    el.addEventListener('mouseenter', showTooltip(el));
    el.addEventListener('mouseleave', hideTooltip(el));
  });
}

export function forceTemporaryTooltipText(text: string) {
  tooltip_element.innerHTML = text;
}

function showTooltipForElement(el: Element) {
  const tooltip_text =
    el.getAttribute('title') ?? el.getAttribute('data-tooltip') ?? '';
  el.setAttribute('data-tooltip', tooltip_text);
  el.setAttribute('title', '');

  tooltip_element.innerHTML = tooltip_text;
  tooltip_element.classList.remove('hidden');

  adjustTooltipPositionForElement(el);
}

export function adjustTooltipPositionForElement(el: Element) {
  const box = el.getBoundingClientRect();
  const center = box.left + box.width / 2;
  const tt_box = tooltip_element.getBoundingClientRect();

  let left = center - tt_box.width / 2;
  let top = box.top - tt_box.height - 20;

  left =
    left < 20
      ? 20
      : window.innerWidth - (left + tt_box.width) < 20
      ? window.innerWidth - tt_box.width - 20
      : left;

  tooltip_element.style.left = `${left}px`;
  tooltip_element.style.top = `${top}px`;
}

function showTooltip(el: Element) {
  return () => showTooltipForElement(el);
}

function hideTooltip(el: Element) {
  return () => {
    el.setAttribute('title', el.getAttribute('data-tooltip') ?? '');
    el.setAttribute('data-tooltip', '');

    tooltip_element.classList.add('hidden');
  };
}
