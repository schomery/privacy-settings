/* global config */

if (typeof importScripts !== 'undefined') {
  self.importScripts('/data/popup/config.js');
}

const mode = install => {
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
    .map(name => name.split('.'))
    .filter(([service, id]) => chrome.privacy[service][id]);

  Promise.all(ar.map(get)).then(a => {
    const compare = index => a.filter((v, i) => {
      if (v === null) {
        return true;
      }
      if (typeof v === 'object') {
        for (const [key, value] of Object.entries(config.values[ar[i].join('.')][index])) {
          if (value !== v[key]) {
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


    const type = isPrivate ? '/private' : (isModerate ? '/moderate' : '');
    chrome.action.setIcon({
      path: {
        '16': `data/icons${type}/16.png`.replace('/defaults', ''),
        '32': `data/icons${type}/32.png`.replace('/defaults', ''),
        '48': `data/icons${type}/48.png`.replace('/defaults', '')
      }
    });

    if (install) {
      chrome.contextMenus.create({
        id: 'defaults',
        title: chrome.i18n.getMessage('contextDefault'),
        contexts: ['action'],
        type: 'radio',
        checked: isDefaults
      });
      chrome.contextMenus.create({
        id: 'moderate',
        title: chrome.i18n.getMessage('contextModerate'),
        contexts: ['action'],
        type: 'radio',
        checked: isModerate
      });
      chrome.contextMenus.create({
        id: 'private',
        title: chrome.i18n.getMessage('contextPrivate'),
        contexts: ['action'],
        type: 'radio',
        checked: isPrivate
      });
    }
    else {
      chrome.contextMenus.update('defaults', {
        checked: isDefaults
      });
      chrome.contextMenus.update('moderate', {
        checked: isModerate
      });
      chrome.contextMenus.update('private', {
        checked: isPrivate
      });
    }
  });
};

{
  const once = () => {
    if (once.done) {
      return;
    }
    once.done = true;
    mode(true);
  };
  chrome.runtime.onInstalled.addListener(once);
  chrome.runtime.onStartup.addListener(once);
}
chrome.runtime.onMessage.addListener(request => {
  if (request.method === 'update') {
    mode(false);
  }
});

chrome.contextMenus.onClicked.addListener(async ({menuItemId}) => {
  const ops = Object.keys(config.values).map(name => {
    const [service, id] = name.split('.');
    const method = chrome.privacy[service][id];
    if (method) {
      switch (menuItemId) {
      case 'defaults':
        return method.clear({});
      default:
        return method.set({
          value: config.values[name][menuItemId === 'private' ? 0 : 1]
        });
      }
    }
  }).filter(op => op);
  await Promise.allSettled(ops);
  mode(false);
});

/* FAQs & Feedback */
{
  const {management, runtime: {onInstalled, setUninstallURL, getManifest}, storage, tabs} = chrome;
  if (navigator.webdriver !== true) {
    const page = getManifest().homepage_url;
    const {name, version} = getManifest();
    onInstalled.addListener(({reason, previousVersion}) => {
      management.getSelf(({installType}) => installType === 'normal' && storage.local.get({
        'faqs': true,
        'last-update': 0
      }, prefs => {
        if (reason === 'install' || (prefs.faqs && reason === 'update')) {
          const doUpdate = (Date.now() - prefs['last-update']) / 1000 / 60 / 60 / 24 > 45;
          if (doUpdate && previousVersion !== version) {
            tabs.query({active: true, currentWindow: true}, tbs => tabs.create({
              url: page + '?version=' + version + (previousVersion ? '&p=' + previousVersion : '') + '&type=' + reason,
              active: reason === 'install',
              ...(tbs && tbs.length && {index: tbs[0].index + 1})
            }));
            storage.local.set({'last-update': Date.now()});
          }
        }
      }));
    });
    setUninstallURL(page + '?rd=feedback&name=' + encodeURIComponent(name) + '&version=' + version);
  }
}
