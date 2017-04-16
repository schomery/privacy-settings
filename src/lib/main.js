'use strict';

var self = require('sdk/self');
var sp = require('sdk/simple-prefs');
var timers = require('sdk/timers');
var tabs = require('sdk/tabs');
var unload = require('sdk/system/unload');
var {Cc, Ci} = require('chrome');
var array = require('sdk/util/array');
var _ = require('sdk/l10n').get;
var pageMod = require('sdk/page-mod');
var platform = require('sdk/system').platform;
var prefService = Cc['@mozilla.org/preferences-service;1']
  .getService(Ci.nsIPrefService);
var desktop = platform !== 'android';
var panel = desktop ? require('./desktop') : require('./android');

var prefs = (function () {
  let p = require('sdk/preferences/service');
  return {
    get: function (name) {
      try {
        return p.get(name);
      }
      catch (e) {
        console.error(e);
      }
      return false;
    },
    set: function (name, val) {
      try {
        p.set(name, val);
      }
      catch (e) {
        console.error(e);
      }
    },
    reset: (name) => p.reset(name)
  };
})();

function close () {
  for (let tab of tabs) {
    if (tab && tab.url && tab.url.startsWith(self.data.url(''))) {
      tab.close();
    }
  }
}
unload.when(e => e !== 'shutdown' && close(e));

var suggestions = {
  'general': {
    'webgl.disabled': true,
    'security.ssl.treat_unsafe_negotiation_as_broken': true,
    'privacy.donottrackheader.enabled': true,
    'privacy.trackingprotection.enabled': true,
    'media.peerconnection.ice.default_address_only': true,
    'media.peerconnection.ice.no_host': true,
    'network.IDN_show_punycode': true
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
    'layout.css.visited_links_enabled': true,
    'dom.indexedDB.enabled': true,
    'media.peerconnection.enabled': true
  },
  'ps-compatible': {
    'dom.storage.enabled': true,
    'dom.event.clipboardevents.enabled': true,
    'browser.safebrowsing.phishing.enabled': true,
    'browser.safebrowsing.downloads.remote.enabled': true,
    'browser.safebrowsing.malware.enabled': true,
    'layout.css.visited_links_enabled': true,
    'dom.indexedDB.enabled': true,
    'media.peerconnection.enabled': true
  }
};

function proxy () {
  let description;
  let type = prefs.get('network.proxy.type');
  if (type === 1) {
    description = `
${_('network.proxy.type')}: ${_('network.proxy.type.1')}

network.proxy.http: ${prefs.get('network.proxy.http') || '-'}:${prefs.get('network.proxy.http_port')}
network.proxy.ssl: ${prefs.get('network.proxy.ssl') || '-'}:${prefs.get('network.proxy.ssl_port')}
network.proxy.ftp: ${prefs.get('network.proxy.ftp') || '-'}:${prefs.get('network.proxy.ftp_port')}
network.proxy.socks: ${prefs.get('network.proxy.socks') || '-'}:${prefs.get('network.proxy.socks_port')}
-
${_('network.proxy.socks_remote_dns')} ${prefs.get('network.proxy.socks_remote_dns')}
    `;
  }
  else if (type === 2) {
    description = `
${_('network.proxy.type')}: ${_('network.proxy.type.2')}

network.proxy.autoconfig_url: ${prefs.get('network.proxy.autoconfig_url')}
    `;
  }
  else {
    description = `${_('network.proxy.type')}: ${_('network.proxy.type.' + type)}`;
  }
  return description;
}

// 1,2: private only
// 3,4: secure only
// 5,6: secure and private
// 7,8: secure but not private

var ui = {
  'network': {
    'network.websocket.enabled': {true: 'nsp', false: 'sp'},
    'network.proxy.type': {true: 'nsp', false: 'sp'},
    'network.IDN_show_punycode': {true: 'sp', false: 'nsp'},
  },
  'browser': {
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
  },
  'tracking': {
    'privacy.donottrackheader.enabled': {true: 'p', false: 'np'},
    'privacy.trackingprotection.enabled': {true: 'sp', false: 'nsp'}
  },
  'stats-collection': {
    'dom.enable_performance': {true: 'np', false: 'p'},
    'datareporting.healthreport.service.enabled': {true: 'np', false: 'p'},
    'datareporting.healthreport.uploadEnabled': {true: 'np', false: 'p'},
    'toolkit.telemetry.enabled': {true: 'np', false: 'p'},
    'toolkit.telemetry.unified': {true: 'np', false: 'p'},
  },
  'media': {
    'media.peerconnection.enabled': {true: 'nsp', false: 'sp'},
    'media.peerconnection.ice.default_address_only': {true: 'sp', false: 'nsp'},
    'media.peerconnection.ice.no_host': {true: 'sp', false: 'nsp'},
    'media.eme.enabled': {true: 'nsp', false: 'sp'},
    'media.gmp-eme-adobe.enabled': {true: 'nsp', false: 'sp'},
    'webgl.disabled': {true: 'sp', false: 'nsp'}
  },
  'geolocation': {
    'geo.enabled': {true: 'np', false: 'p'}
  },
  'devices': {
    'camera.control.face_detection.enabled': {true: 'np', false: 'p'},
    'device.sensors.enabled': {true: 'np', false: 'p'}
  },
  'encryption': {
    'security.tls.unrestricted_rc4_fallback': {true: 'ns', false: 's'},
    'security.tls.insecure_fallback_hosts.use_static_list': {true: 'ns', false: 's'},
    'security.ssl.require_safe_negotiation': {true: 's', false: 'ns'},
    'security.ssl.treat_unsafe_negotiation_as_broken': {true: 's', false: 'ns'},
    ////'accessibility.force_disabled': {min:0, max: 3, '1': 's', '2': 'ns', '3': 'np', '4': 'p', '5': 'sp'}
  }
};

var names = [].concat.apply([],Object.keys(ui).map(n => ui[n]).map(o => Object.keys(o)));
var inject = panel.panel({
  contentURL: self.data.url('popover/index.html'),
  contentScriptFile: self.data.url('popover/index.js')
});

function sendPref (pref) {
  inject.port.emit('pref', {
    pref,
    value: prefs.get(pref),
    locked: prefService.getBranch(pref).prefIsLocked('')
  });
}
inject.port.on('options', () => inject.port.emit('options', {
  ui: ui,
  get font () {
    return sp.prefs.font;
  },
  get locales () {
    let tmp = {};
    names.forEach(n => tmp[n] = _(n));
    Object.keys(ui).forEach(n => tmp[n] = _(n));
    return tmp;
  },
  get values () {
    return names.reduce((p, c) => {
      p[c] = prefs.get(c);
      return p;
    }, {});
  },
  get locked () {
    return names.reduce((p, c) => {
      p[c] = prefService.getBranch(c).prefIsLocked('');
      return p;
    }, {});
  },
  get types () {
    return Object.keys(ui).map(n => ui[n]).reduce((p, c) => Object.assign(p, c), {});
  },
  proxy: proxy()
}));
inject.port.on('pref', function (obj) {
  prefs.set(obj.pref, obj.value);
  sendPref(obj.pref);
  if (obj.pref === 'network.proxy.type') {
    inject.port.emit('proxy', proxy());
  }
});
inject.port.on('command', function (obj) {
  if (obj.cmd === 'reset') {
    obj.prefs.forEach(function (pref) {
      // do not change user's proxy setting
      if (pref !== 'network.proxy.type') {
        prefs.reset(pref);
        sendPref(pref);
      }
    });
  }
  else if (obj.cmd === 'privacy' || obj.cmd === 'security' || obj.cmd === 'p-compatible' || obj.cmd === 'ps-compatible') {
    let list = Object.assign({}, suggestions.general, suggestions[obj.cmd]);
    obj.prefs.forEach(function (pref) {
      if (pref in list) {
        prefs.set(pref, list[pref]);
      }
      else {
        prefs.set(pref, false);
      }
      sendPref(pref);
    });
  }
  else if (obj.cmd === 'advanced-settings') {
    close();
    tabs.open(self.data.url('advanced-settings/index.html'));
    inject.hide();
  }
  else if (obj.cmd === 'open-proxy') {
    tabs.open('about:preferences#advanced');
    inject.hide();
  }
});
sp.on('font', () => sp.prefs.font = Math.min(14, Math.max(sp.prefs.font, 10)));

// advanced settings
(function (workers) {
  function report (name) {
    workers.forEach(w => w.port.emit('changed', {
      name,
      value: prefs.get(name)
    }));
  }
  function changed (obj) {
    prefs.set(obj.name, obj.value);
    report(obj.name);
  }
  function command (obj) {
    if (obj.command === 'reset') {
      prefs.reset(obj.name);
      report(obj.name);
    }
  }

  pageMod.PageMod({
    include: self.data.url('advanced-settings/index.html'),
    contentScriptFile: self.data.url('advanced-settings/index.js'),
    attachTo: ['top'],
    onAttach: function (worker) {
      worker.on('pageshow', () => array.add(workers, worker));
      worker.on('pagehide', () => array.remove(workers, worker));
      worker.on('detach', () => array.remove(workers, worker));
      worker.port.on('register', report);
      worker.port.on('changed', changed);
      worker.port.on('cmd', command);
    }
  });
})([]);

exports.main = function (options) {
  if (options.loadReason === 'install' || options.loadReason === 'startup') {
    var version = sp.prefs.version;
    if (self.version !== version) {
      if (sp.prefs.welcome) {
        timers.setTimeout(function () {
          tabs.open(
            'http://firefox.add0n.com/privacy-settings.html?v=' + self.version +
            (version ? '&p=' + version + '&type=upgrade' : '&type=install')
          );
        }, 3000);
      }
      sp.prefs.version = self.version;
    }
  }
};
