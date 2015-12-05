'use strict';

var self = require('sdk/self');
var sp = require('sdk/simple-prefs');
var timers = require('sdk/timers');
var tabs = require('sdk/tabs');
var unload = require('sdk/system/unload');
var {Cc, Ci} = require('chrome');
var _ = require('sdk/l10n').get;
var platform = require('sdk/system').platform;
var prefService = Cc['@mozilla.org/preferences-service;1']
  .getService(Ci.nsIPrefService);
var desktop = ['winnt', 'linux', 'darwin', 'openbsd'].indexOf(platform) !== -1;

var prefs = (function () {
  var p = require('sdk/preferences/service');
  return {
    get: function (name) {
      try {
        return p.get(name);
      } catch (e) {console.error(e);}
      return false;
    },
    set: function (name, val) {
      try {
        p.set(name, val);
      } catch (e) {console.error(e);}
    },
    reset: function (name) {
      p.reset(name);
    }
  };
})();

// observer
function observe (pref, callback) {
  var branch = prefService.getBranch(pref);
  var observer = {
    observe: function () {
      callback(pref);
    }
  };
  branch.addObserver('', observer, false);
  unload.when(function () {
    branch.removeObserver('', observer);
  });
}

var suggestions = {
  'privacy': {
    'security.ssl.require_safe_negotiation': true,
    'security.ssl.treat_unsafe_negotiation_as_broken': true,
    'privacy.trackingprotection.enabled': true,
    'webgl.disabled': true,
    'network.dns.disablePrefetch': true
  },
  'security': {
    'security.ssl.require_safe_negotiation': true,
    'security.ssl.treat_unsafe_negotiation_as_broken': true,
    'browser.safebrowsing.enabled': true,
    'browser.safebrowsing.downloads.enabled': true,
    'browser.safebrowsing.malware.enabled': true,
    'privacy.trackingprotection.enabled': true,
    'webgl.disabled': true,
    'network.dns.disablePrefetch': true
  },
  'compatible': {
    'privacy.trackingprotection.enabled': true,
    'security.ssl.treat_unsafe_negotiation_as_broken': true,
    'webgl.disabled': true,
    'dom.storage.enabled': true,
    'network.http.sendSecureXSiteReferrer': true,
    'network.dns.disablePrefetch': true
  }
};

// 1,2: private only
// 3,4: secure only
// 5,6: secure and private
// 7,8: secure but not private

var ui = {
  'network': {
    'network.websocket.enabled': {true: 'nsp', false: 'sp'},
    'network.http.sendSecureXSiteReferrer': {true: 'nsp', false: 'sp'},
    'network.dns.disablePrefetch': {true: 'p', false: 'np'},
    'network.prefetch-next': {true: 'np', false: 'p'},
  },
  'browser': {
    'dom.event.clipboardevents.enabled': {true: 'np', false: 'p'},
    'dom.battery.enabled': {true: 'np', false: 'p'},
    'dom.storage.enabled': {true: 'nsp', false: 'sp'},
    'browser.safebrowsing.enabled': {true: 'snp', false: 'pns'},
    'browser.safebrowsing.downloads.enabled': {true: 'snp', false: 'pns'},
    'browser.safebrowsing.malware.enabled': {true: 'snp', false: 'pns'},
    'browser.send_pings': {true: 'np', false: 'p'},
    'beacon.enabled': {true: 'np', false: 'p'},
  },
  'tracking': {
    'privacy.trackingprotection.enabled': {true: 'sp', false: 'nsp'}
  },
  'stats-collection': {
    'datareporting.healthreport.service.enabled': {true: 'np', false: 'p'},
    'datareporting.healthreport.uploadEnabled': {true: 'np', false: 'p'},
    'toolkit.telemetry.enabled': {true: 'np', false: 'p'},
    'toolkit.telemetry.unified': {true: 'np', false: 'p'},
  },
  'integration': {
    'loop.enabled': {true: 'nsp', false: 'sp'},
    'browser.pocket.enabled': {true: 'nsp', false: 'sp'}
  },
  'media': {
    'media.peerconnection.enabled': {true: 'nsp', false: 'sp'},
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
    'security.ssl.treat_unsafe_negotiation_as_broken': {true: 's', false: 'ns'}
  }
};

var module = desktop ? require('./desktop') : require('./android');

for (let category in ui) {
  for (let pref in ui[category]) {
    observe(pref, function (p) {
      inject.port.emit('pref', {
        pref: p,
        value: prefs.get(p),
        locked: prefService.getBranch(p).prefIsLocked('')
      });
    });
  }
}

var names = [].concat.apply([],Object.keys(ui).map(n => ui[n]).map(o => Object.keys(o)));
var inject = module.panel({
  contentScriptOptions: {
    ui: ui,
    font: sp.prefs.font,
    locales: (() => {let tmp = {}; names.forEach(n => tmp[n] = _(n)); return tmp;})(),
    values: (() => {let tmp = {}; names.forEach(n => tmp[n] = prefs.get(n)); return tmp;})(),
    locked: (() => {let tmp = {}; names.forEach(n => tmp[n] = prefService.getBranch(n).prefIsLocked('')); return tmp;})(),
    types: Object.keys(ui).map(n => ui[n]).reduce((p, c) => Object.assign(p, c), {})
  },
  contentURL: self.data.url('popover/index.html'),
  contentScriptFile: self.data.url('popover/index.js')
});
module.execute(inject);
inject.port.on('size', function (obj) {
  inject.width = obj.width;
  inject.height = obj.height;
});

inject.port.on('pref', function (obj) {
  prefs.set(obj.pref, obj.value);
});
inject.port.on('command', function (obj) {
  if (obj.cmd === 'reset') {
    obj.prefs.forEach(function (pref) {
      prefs.reset(pref);
    });
  }
  if (obj.cmd === 'privacy' || obj.cmd === 'security' || obj.cmd === 'compatible') {
    obj.prefs.forEach(function (pref) {
      if (pref in suggestions[obj.cmd]) {
        prefs.set(pref, suggestions[obj.cmd][pref]);
      }
      else {
        prefs.set(pref, false);
      }
    });
  }
});
sp.on('font', function () {
  if (sp.prefs.font < 10) {
    sp.prefs.font = 10;
  }
  if (sp.prefs.font > 16) {
    sp.prefs.font = 16;
  }
  inject.port.emit('font', sp.prefs.font);
});

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
