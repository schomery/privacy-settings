/* globals config */
'use strict';

var update = (mode, init = false) => {
  if (init === false) {
    chrome.contextMenus.update(mode, {
      checked: true
    });
  }
  const path = {
    path: {
      '16': `data/icons/${mode}/16.png`.replace('/defaults', ''),
      '32': `data/icons/${mode}/32.png`.replace('/defaults', ''),
      '48': `data/icons/${mode}/48.png`.replace('/defaults', ''),
      '64': `data/icons/${mode}/64.png`.replace('/defaults', '')
    }
  };
  chrome.browserAction.setIcon(path);
};

{
  const callback = () => {
    const get = ([service, id]) => new Promise(resolve => chrome.privacy[service][id].get({}, d => {
      if (chrome.runtime.lastError || !d) {
        resolve(null);
      }
      else if (d.levelOfControl !== 'controlled_by_other_extensions') {
        resolve(d.value);
      }
      else {
        resolve(null);
      }
    }));

    const ar = Object.keys(config.values)
      .map(name => name.split('.').slice(0, 2).join('.'))
      // remove duplicates (when there is subid)
      .filter((s, i, l) => l.indexOf(s) === i)
      .map(name => name.split('.'))
      .filter(([service, id]) => chrome.privacy[service][id]);

    Promise.all(ar.map(get)).then(a => {
      const compare = index => a.filter((v, i) => {
        if (v === null) {
          return true;
        }
        if (typeof v === 'object') {
          for (const [key, value] of Object.entries(v)) {
            if (config.values[[...ar[i], key].join('.')][index] !== value) {
              return false;
            }
          }
          return true;
        }
        return v === config.values[ar[i].join('.')][index];
      }).length === a.length;

      const isPrivate = compare(0);
      const isModerate = compare(1);
      const isDefaults = isPrivate === false && isModerate === false;


      if (isPrivate) {
        update('private', true);
      }
      else if (isModerate) {
        update('moderate', true);
      }

      chrome.contextMenus.create({
        id: 'defaults',
        title: chrome.i18n.getMessage('contextDefault'),
        contexts: ['browser_action'],
        type: 'radio',
        checked: isDefaults
      });
      chrome.contextMenus.create({
        id: 'moderate',
        title: chrome.i18n.getMessage('contextModerate'),
        contexts: ['browser_action'],
        type: 'radio',
        checked: isModerate
      });
      chrome.contextMenus.create({
        id: 'private',
        title: chrome.i18n.getMessage('contextPrivate'),
        contexts: ['browser_action'],
        type: 'radio',
        checked: isPrivate
      });
    });
  };

  chrome.runtime.onInstalled.addListener(callback);
  chrome.runtime.onStartup.addListener(callback);
}
chrome.contextMenus.onClicked.addListener(({menuItemId}) => {
  update(menuItemId, true);

  Object.keys(config.values).forEach(name => {
    const [service, id] = name.split('.');
    const method = chrome.privacy[service][id];
    if (method) {
      switch (menuItemId) {
      case 'defaults':
        method.clear({});
        break;
      default:
        method.set({
          value: config.values[name][menuItemId === 'private' ? 0 : 1]
        });
      }
    }
  });
});

chrome.runtime.onMessage.addListener(request => {
  if (request.method === 'change-mode') {
    update(request.mode);
  }
});

{
  const {onStartup, onInstalled, setUninstallURL, getManifest} = chrome.runtime;
  const {name, version} = getManifest();
  const page = getManifest().homepage_url;
  onInstalled.addListener(({reason, previousVersion}) => {
    chrome.storage.local.get({
      'faqs': /Firefox/.test(navigator.userAgent) === false,
      'last-update': 0
    }, prefs => {
      if (reason === 'install' || (prefs.faqs && reason === 'update')) {
        const doUpdate = (Date.now() - prefs['last-update']) / 1000 / 60 / 60 / 24 > 45;
        if (doUpdate && previousVersion !== version) {
          chrome.tabs.create({
            url: page + '?version=' + version +
              (previousVersion ? '&p=' + previousVersion : '') +
              '&type=' + reason,
            active: reason === 'install'
          });
          chrome.storage.local.set({'last-update': Date.now()});
        }
      }
    });
  });
  onStartup.addListener(() => {
    setUninstallURL(page + '?rd=feedback&name=' + encodeURIComponent(name) + '&version=' + version);
  });
}
