'use strict';

var prefs = {
  network: [
    'network.websocket.enabled',
    'network.http.sendSecureXSiteReferrer',
    'network.proxy.type'
  ],
  browser: [
    'dom.event.clipboardevents.enabled',
    'dom.storage.enabled',
    'dom.indexedDB.enabled',
    'dom.battery.enabled',
    'dom.enable_user_timing',
    'dom.enable_resource_timing',
    'dom.netinfo.enabled',
    'layout.css.visited_links_enabled',
    'browser.safebrowsing.phishing.enabled',
    'browser.safebrowsing.downloads.remote.enabled',
    'browser.safebrowsing.malware.enabled',
    'browser.send_pings',
    'beacon.enabled'
  ],
  tracking: [
    'privacy.donottrackheader.enabled',
    'privacy.trackingprotection.enabled'
  ],
  stats: [
    'dom.enable_performance',
    'datareporting.healthreport.service.enabled',
    'datareporting.healthreport.uploadEnabled',
    'toolkit.telemetry.enabled',
    'toolkit.telemetry.unified'
  ],
  media: [
    'media.peerconnection.enabled',
    'media.peerconnection.ice.no_host',
    'media.peerconnection.ice.default_address_only',
    'media.eme.enabled',
    'media.gmp-eme-adobe.enabled',
    'webgl.disabled'
  ],
  geo: [
    'geo.enabled'
  ],
  devices: [
    'camera.control.face_detection.enabled',
    'device.sensors.enabled'
  ],
  encryption: [
    'security.tls.unrestricted_rc4_fallback',
    'security.tls.insecure_fallback_hosts.use_static_list',
    'security.ssl.require_safe_negotiation',
    'security.ssl.treat_unsafe_negotiation_as_broken'
  ]
};

var info = {
  'network.websocket.enabled': {true: 'nsp', false: 'sp'},
  'network.http.sendSecureXSiteReferrer': {true: 'nsp', false: 'sp'},
  'network.proxy.type': {true: 'nsp', false: 'sp'},
  'dom.event.clipboardevents.enabled': {true: 'np', false: 'p'},
  'dom.storage.enabled': {true: 'nsp', false: 'sp'},
  'dom.indexedDB.enabled': {true: 'nsp', false: 'sp'},
  'dom.battery.enabled': {true: 'np', false: 'p'},
  'dom.enable_user_timing': {true: 'np', false: 'p'},
  'dom.enable_resource_timing': {true: 'np', false: 'p'},
  'dom.netinfo.enabled': {true: 'np', false: 'p'},
  'layout.css.visited_links_enabled': {true: 'np', false: 'p'},
  'browser.safebrowsing.phishing.enabled': {true: 'snp', false: 'pns'},
  'browser.safebrowsing.downloads.remote.enabled': {true: 'snp', false: 'pns'},
  'browser.safebrowsing.malware.enabled': {true: 'snp', false: 'pns'},
  'browser.send_pings': {true: 'np', false: 'p'},
  'beacon.enabled': {true: 'np', false: 'p'},
  'privacy.donottrackheader.enabled': {true: 'p', false: 'np'},
  'privacy.trackingprotection.enabled': {true: 'sp', false: 'nsp'},
  'dom.enable_performance': {true: 'np', false: 'p'},
  'datareporting.healthreport.service.enabled': {true: 'np', false: 'p'},
  'datareporting.healthreport.uploadEnabled': {true: 'np', false: 'p'},
  'toolkit.telemetry.enabled': {true: 'np', false: 'p'},
  'toolkit.telemetry.unified': {true: 'np', false: 'p'},
  'media.peerconnection.enabled': {true: 'nsp', false: 'sp'},
  'media.peerconnection.ice.no_host': {true: 'p', false: 'np'},
  'media.peerconnection.ice.default_address_only': {true: 'sp', false: 'nsp'},
  'media.eme.enabled': {true: 'nsp', false: 'sp'},
  'media.gmp-eme-adobe.enabled': {true: 'nsp', false: 'sp'},
  'webgl.disabled': {true: 'sp', false: 'nsp'},
  'geo.enabled': {true: 'np', false: 'p'},
  'camera.control.face_detection.enabled': {true: 'np', false: 'p'},
  'device.sensors.enabled': {true: 'np', false: 'p'},
  'security.tls.unrestricted_rc4_fallback': {true: 'ns', false: 's'},
  'security.tls.insecure_fallback_hosts.use_static_list': {true: 'ns', false: 's'},
  'security.ssl.require_safe_negotiation': {true: 's', false: 'ns'},
  'security.ssl.treat_unsafe_negotiation_as_broken': {true: 's', false: 'ns'}
};

function adjust (obj) {
  let tr = document.querySelector(`[data-pref="${obj.pref}"]`);
  if (tr) {
    // pref value
    if (tr.dataset.type === 'boolean') {
      let toggle = tr.querySelector('td:last-child');
      toggle.setAttribute('class', 'icon-toggle-' + (obj.value ? 'on' : 'off'));
      toggle.textContent = obj.value ? 'on' : 'off';
    }
    else if (tr.dataset.type === 'integer') {
      let input = tr.querySelector('input[type=number]');
      input.value = obj.value;
    }
    else {
      console.error('this type is not supported');
    }
    tr.dataset.initialized = obj.locked ? false : true;
    if (obj.locked) {
      tr.querySelector('td:nth-child(1)').textContent += ' (locked)';
    }
    // default value
    tr.querySelector('td:nth-child(3)').textContent = obj.default ? 'on' : 'off';
    tr.querySelector('td:nth-child(3)').dataset.same = obj.default === obj.value;
    // privacy and security icons
    let privacy = 'icon-dot';
    let status = info[obj.pref][obj.value];
    if (status === 'np' || status === 'nsp' || status === 'snp') {
      privacy = 'icon-privacy-off';
    }
    else if (status === 'p' || status === 'sp' || status === 'pns') {
      privacy = 'icon-privacy-on';
    }
    let security = 'icon-dot';
    if (status === 'ns' || status === 'nsp' || status === 'pns') {
      security = 'icon-security-off';
    }
    else if (status === 's' || status === 'sp' || status === 'snp') {
      security = 'icon-security-on';
    }
    tr.querySelector('td:nth-child(4)').setAttribute('class', privacy);
    tr.querySelector('td:nth-child(5)').setAttribute('class', security);
  }
  else {
    console.error('pref not found', obj.pref);
  }
}

// restore states
chrome.storage.local.get({
  persist: []
}, prefs => {
  prefs.persist.forEach(obj => {
    document.querySelector(`[data-persist="${obj.persist}"]`).dataset.collapsed = obj.collapsed;
  });
});

// get preferences
Object.keys(prefs).forEach(branch => {
  let table = document.querySelector(`[data-id="${branch}"]`);
  prefs[branch].forEach(pref => {
    let tempate = document.getElementById(pref === 'network.proxy.type' ? 'integer' : 'boolean');
    let clone = document.importNode(tempate.content, true);
    clone.querySelector('td:nth-child(1)').textContent = pref;
    clone.querySelector('td:nth-child(1)').title = chrome.i18n.getMessage(pref);
    clone.querySelector('tr').dataset.pref = pref;
    table.appendChild(clone);
    chrome.runtime.sendMessage({
      method: 'get-pref',
      pref
    }, r => adjust(r));
  });
});

var suggestions = {
  'general': {
    'media.peerconnection.ice.no_host': true,
    'webgl.disabled': true,
    'security.ssl.treat_unsafe_negotiation_as_broken': true,
    'privacy.donottrackheader.enabled': true,
    'privacy.trackingprotection.enabled': true,
    'media.peerconnection.ice.default_address_only': true
  },
  'privacy': {
    'security.ssl.require_safe_negotiation': true
  },
  'security': {
    'security.ssl.require_safe_negotiation': true,
    'browser.safebrowsing.phishing.enabled': true,
    'browser.safebrowsing.downloads.remote.enabled': true,
    'browser.safebrowsing.malware.enabled': true
  },
  'p-compatible': {
    'dom.storage.enabled': true,
    'dom.event.clipboardevents.enabled': true,
    'network.http.sendSecureXSiteReferrer': true,
    'layout.css.visited_links_enabled': true,
    'dom.indexedDB.enabled': true,
    'media.peerconnection.enabled': true
  },
  'ps-compatible': {
    'dom.storage.enabled': true,
    'dom.event.clipboardevents.enabled': true,
    'network.http.sendSecureXSiteReferrer': true,
    'browser.safebrowsing.phishing.enabled': true,
    'browser.safebrowsing.downloads.remote.enabled': true,
    'browser.safebrowsing.malware.enabled': true,
    'layout.css.visited_links_enabled': true,
    'dom.indexedDB.enabled': true,
    'media.peerconnection.enabled': true
  }
};

function getPrefs () {
  let tmp = [];
  Object.keys(prefs).forEach(branch => {
    prefs[branch].forEach(pref => tmp.push(pref));
  });
  return tmp.filter(p => p !== 'network.proxy.type');
}

document.addEventListener('click', e => {
  let target = e.target;
  if (target.dataset.toggle) {
    target.parentNode.dataset.collapsed = target.parentNode.dataset.collapsed === 'true' ? 'false' : 'true';
    let persist = [...document.querySelectorAll('[data-persist]')].map(e => ({
      persist: e.dataset.persist,
      collapsed: e.dataset.collapsed
    }));
    chrome.storage.local.set({persist});
  }
  else if (target.dataset.cmd === 'change-pref') {
    let pref = target.parentNode.dataset.pref;
    let value = target.classList.contains('icon-toggle-off');
    chrome.runtime.sendMessage({
      method: 'change-pref',
      pref,
      value
    }, r => adjust(r));
  }
  else if (target.dataset.cmd === 'reset') {
    getPrefs().forEach(pref => {
      chrome.runtime.sendMessage({
        method: 'reset-pref',
        pref
      }, r => adjust(r));
    });
  }
  else if (target.dataset.cmd === 'switch-private') {
    getPrefs().forEach(pref => {
      chrome.runtime.sendMessage({
        method: 'change-pref',
        pref,
        value: suggestions.general[pref] || suggestions.privacy[pref] || false
      }, r => adjust(r));
    });
  }
  else if (target.dataset.cmd === 'switch-security') {
    getPrefs().forEach(pref => {
      chrome.runtime.sendMessage({
        method: 'change-pref',
        pref,
        value: suggestions.general[pref] || suggestions.security[pref] || false
      }, r => adjust(r));
    });
  }
  else if (target.dataset.cmd === 'switch-ps-compatible') {
    getPrefs().forEach(pref => {
      chrome.runtime.sendMessage({
        method: 'change-pref',
        pref,
        value: suggestions.general[pref] || suggestions['ps-compatible'][pref] || false
      }, r => adjust(r));
    });
  }
  else if (target.dataset.cmd === 'switch-p-compatible') {
    getPrefs().forEach(pref => {
      chrome.runtime.sendMessage({
        method: 'change-pref',
        pref,
        value: suggestions.general[pref] || suggestions['p-compatible'][pref] || false
      }, r => adjust(r));
    });
  }
});
