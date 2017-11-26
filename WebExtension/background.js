'use strict';

// FAQs & Feedback
chrome.storage.local.get({
  'version': null,
  'faqs': navigator.userAgent.indexOf('Firefox') === -1
}, prefs => {
  const version = chrome.runtime.getManifest().version;

  if (prefs.version ? (prefs.faqs && prefs.version !== version) : true) {
    chrome.storage.local.set({version}, () => {
      const p = Boolean(prefs.version);
      chrome.tabs.create({
        url: chrome.runtime.getManifest().homepage_url + '?version=' + version +
          '&type=' + (p ? ('upgrade&p=' + prefs.version) : 'install'),
        active: p === false
      });
    });
  }
});

{
  const {name, version} = chrome.runtime.getManifest();
  chrome.runtime.setUninstallURL('http://add0n.com/feedback.html?name=' + name + '&version=' + version);
}
