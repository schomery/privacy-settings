/* globals config */
'use strict';

var notify = msg => {
  const e = document.getElementById('msg');
  e.textContent = msg;
  window.clearTimeout(notify.id);
  notify.id = window.setTimeout(() => e.textContent = '', 2000);
};

var toggle = (e, value, isTrusted) => {
  const [service, id] = e.dataset.id.split('.');
  e.dataset.mode = value;
  if (value !== true && value !== false) {
    const info = e.querySelector('[data-type="info"] select');
    info.value = value;
  }
  const arr = config[service][id][value];
  e.dataset.private = arr.indexOf('p') !== -1 ? true : (arr.indexOf('np') === -1 ? null : false);
  e.dataset.secure = arr.indexOf('s') !== -1 ? true : (arr.indexOf('ns') === -1 ? null : false);

  if (isTrusted) {
    const method = chrome.privacy[service][id];
    method.set({
      value
    }, () => {
      if (chrome.runtime.lastError) {
        notify(chrome.runtime.lastError.message);
        method.get({}, d => toggle(e, d.value));
      }
    });
  }
};

document.addEventListener('click', e => {
  const target = e.target;
  const tr = target.closest('tr');
  if (tr) {
    const {id, mode} = tr.dataset;
    if (id) {
      toggle(tr, mode === 'false', e.isTrusted);
    }
  }
});
document.addEventListener('change', e => {
  const target = e.target;
  const tr = target.closest('tr');
  if (tr) {
    const {id} = tr.dataset;
    if (id) {
      toggle(tr, target.value, e.isTrusted);
    }
  }
});

[...document.querySelectorAll('[data-id]')].forEach(e => {
  const [service, id] = e.dataset.id.split('.');
  const method = chrome.privacy[service][id];
  if (method) {
    method.get({}, d => {
      e.dataset.controllable = d.levelOfControl !== 'controlled_by_other_extensions';
      toggle(e, d.value);
    });
  }
  else {
    e.dataset.available = false;
  }
});

document.addEventListener('click', ({target}) => {
  const cmd = target.dataset.cmd;
  if (cmd === 'reset' || cmd === 'private') {
    [...document.querySelectorAll('[data-id]')].forEach(e => {
      const [service, id] = e.dataset.id.split('.');
      const method = chrome.privacy[service][id];
      if (method) {
        console.log(e.dataset.id)
        toggle(e, config.values[e.dataset.id][cmd === 'reset' ? 0 : 1], true);
      }
    });
  }
  else if (cmd === 'faqs') {
    chrome.tabs.create({
      url: chrome.runtime.getManifest().homepage_url
    });
  }
});
