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
  const [service, id, subid] = tr.dataset.id.split('.');
  const method = chrome.privacy[service][id];
  if (method) {
    return {
      tr,
      method,
      id,
      subid,
      service
    };
  }
  else {
    tr.dataset.available = false;
  }
}).filter(a => a);
methods = methods();

var toggle = (e, value, isTrusted) => {
  const [service, id, subid] = e.dataset.id.split('.');
  if (subid && typeof value === 'object') {
    value = value[subid];
  }
  e.dataset.mode = value;
  if (e.dataset.controllable === 'false') {
    return;
  }
  if (value !== true && value !== false) {
    const info = e.querySelector('[data-type="info"] select');
    info.value = value;
  }
  const arr = subid ? config[service][id][subid][value] : config[service][id][value];
  try {
    e.dataset.private = arr.indexOf('p') !== -1 ? true : (arr.indexOf('np') === -1 ? null : false);
    e.dataset.secure = arr.indexOf('s') !== -1 ? true : (arr.indexOf('ns') === -1 ? null : false);
  }
  catch (e) {
    console.log(service, id, subid, value, arr, e);
  }

  if (isTrusted) {
    const method = chrome.privacy[service][id];
    if (service === 'websites' && id === 'cookieConfig') {
      value = {
        behavior: document.querySelector('[data-id="websites.cookieConfig.behavior"] select').value,
        nonPersistentCookies: document.querySelector('[data-id="websites.cookieConfig.nonPersistentCookies"]').dataset.mode === 'true'
      };
    }
    method.set({
      value
    }, () => {
      chrome.runtime.sendMessage({
        method: 'update'
      });
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
    if (id && (mode === 'false' || mode === 'true')) {
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
    if (chrome.runtime.lastError) {
      return o.tr.dataset.controllable = false;
    }
    o.tr.dataset.controllable = d.levelOfControl !== 'controlled_by_other_extensions';
    toggle(o.tr, d.value);
  });
});
document.addEventListener('DOMContentLoaded', init);

document.addEventListener('click', ({target}) => {
  const cmd = target.dataset.cmd;
  if (cmd === 'defaults') {
    Promise.all(methods.map(o => new Promise(r => o.method.clear({}, r)))).then(init);
  }
  else if (cmd === 'private' || cmd === 'moderate') {
    const index = cmd === 'private' ? 0 : 1;
    methods.forEach(o => toggle(
      o.tr,
      o.subid ? config.values[o.service + '.' + o.id][index][o.subid] : config.values[o.service + '.' + o.id][index],
      true
    ));
  }
  else if (cmd === 'faqs') {
    chrome.tabs.create({
      url: chrome.runtime.getManifest().homepage_url
    }, () => window.close());
  }

  if (cmd === 'defaults' || cmd === 'private' || cmd === 'moderate') {
    chrome.runtime.sendMessage({
      method: 'update'
    });
  }
});
