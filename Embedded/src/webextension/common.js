'use strict';

// FAQs & Feedback
chrome.storage.local.get({
  version: null,
  faqs: false
}, prefs => {
  let version = chrome.runtime.getManifest().version;
  if (prefs.version !== version && (prefs.version ? prefs.faqs : true)) {
    chrome.storage.local.set({version}, () => {
      chrome.tabs.create({
        url: 'http://firefox.add0n.com/privacy-settings.html?version=' + version +
          '&type=' + (prefs.version ? ('upgrade&p=' + prefs.version) : 'install')
      });
    });
  }
});
(function () {
  let {name, version} = chrome.runtime.getManifest();
  chrome.runtime.setUninstallURL('http://add0n.com/feedback.html?name=' + name + '&version=' + version);
})();
