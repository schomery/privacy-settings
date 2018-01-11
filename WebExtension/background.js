/* globals config */
'use strict';

{
  const callback = () => {
    const get = ([service, id]) => new Promise(resolve => chrome.privacy[service][id].get({}, d => {
      if (d.levelOfControl !== 'controlled_by_other_extensions') {
        resolve(d.value);
      }
      else {
        resolve(null);
      }
    }));

    const ar = Object.keys(config.values).map(name => name.split('.'))
      .filter(([service, id]) => chrome.privacy[service][id]);

    Promise.all(
      ar.map(get)).then(a => {
        const isPrivate = a.filter((v, i) => v === null || v === config.values[ar[i].join('.')][0]).length === a.length;
        const isModerate = a.filter((v, i) => v === null || v === config.values[ar[i].join('.')][1]).length === a.length;
        const isDefaults = isPrivate === false && isModerate === false;

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

// FAQs & Feedback
chrome.storage.local.get({
  'version': null,
  'faqs': navigator.userAgent.indexOf('Firefox') === -1,
  'last-update': 0,
}, prefs => {
  const version = chrome.runtime.getManifest().version;

  if (prefs.version ? (prefs.faqs && prefs.version !== version) : true) {
    const now = Date.now();
    const doUpdate = (now - prefs['last-update']) / 1000 / 60 / 60 / 24 > 30;
    chrome.storage.local.set({
      version,
      'last-update': doUpdate ? Date.now() : prefs['last-update']
    }, () => {
      // do not display the FAQs page if last-update occurred less than 30 days ago.
      if (doUpdate) {
        const p = Boolean(prefs.version);
        chrome.tabs.create({
          url: chrome.runtime.getManifest().homepage_url + '?version=' + version +
            '&type=' + (p ? ('upgrade&p=' + prefs.version) : 'install'),
          active: p === false
        });
      }
    });
  }
});

{
  const {name, version} = chrome.runtime.getManifest();
  chrome.runtime.setUninstallURL(
    chrome.runtime.getManifest().homepage_url + '?rd=feedback&name=' + name + '&version=' + version
  );
}
