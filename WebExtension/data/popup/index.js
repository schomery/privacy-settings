/* globals config */
'use strict';

var isOpera = navigator.userAgent.indexOf('OPR') !== -1;
if (isOpera) {
  document.querySelector('[data-id="services.hotwordSearchEnabled"]').remove();
}

var notify = msg => {
  const e = document.getElementById('msg');
  e.textContent = msg;
  window.clearTimeout(notify.id);
  notify.id = window.setTimeout(() => e.textContent = '', 2000);
};

var methods = () => [...document.querySelectorAll('[data-id]')].map(tr => {
  const [service, id] = tr.dataset.id.split('.');
  const method = chrome.privacy[service][id];
  if (method) {
    return {
      tr,
      method,
      id,
      service
    };
  }
  else {
    tr.dataset.available = false;
  }
}).filter(a => a);
methods = methods();

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

var init = () => methods.forEach(o => {
  o.method.get({}, d => {
    o.tr.dataset.controllable = d.levelOfControl !== 'controlled_by_other_extensions';
    toggle(o.tr, d.value);
  });
});
document.addEventListener('DOMContentLoaded', init);

document.addEventListener('click', ({target}) => {
  const cmd = target.dataset.cmd;
  if (cmd === 'reset') {
    Promise.all(methods.map(o => new Promise(r => o.method.clear({}, r)))).then(init);
  }
  else if (cmd === 'private') {
    methods.forEach(o => toggle(o.tr, config.values[o.service + '.' + o.id][0], true));
  }
  else if (cmd === 'moderate') {
    methods.forEach(o => toggle(o.tr, config.values[o.service + '.' + o.id][1], true));
  }
  else if (cmd === 'faqs') {
    chrome.tabs.create({
      url: chrome.runtime.getManifest().homepage_url
    });
  }
});
