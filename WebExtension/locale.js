'use strict';

// localization
[...document.querySelectorAll('[data-i18n]')].forEach(e => {
  const value = e.dataset.i18nValue;
  const message = chrome.i18n.getMessage(e.dataset.i18n);
  if (value) {
    e.setAttribute(value, message);
  }
  else {
    e.textContent = message;
  }
});
