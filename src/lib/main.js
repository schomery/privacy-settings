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
var desktop = ['winnt', 'linux', 'darwin'].indexOf(platform) !== -1;

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
  }
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
    'webgl.disabled': true
  },
  'security': {
    'security.ssl.require_safe_negotiation': true,
    'security.ssl.treat_unsafe_negotiation_as_broken': true,
    'browser.safebrowsing.enabled': true,
    'browser.safebrowsing.downloads.enabled': true,
    'browser.safebrowsing.malware.enabled': true,
    'privacy.trackingprotection.enabled': true,
    'webgl.disabled': true
  }
};

var ui = {
  'network': {
    'network.websocket.enabled': {type: 'bol'},
    'network.http.sendSecureXSiteReferrer': {type: 'bol'}
  },
  'browser': {
    'dom.event.clipboardevents.enabled': {type: 'bol'},
    'browser.safebrowsing.enabled': {type: 'bol'},
    'browser.safebrowsing.downloads.enabled': {type: 'bol'},
    'browser.safebrowsing.malware.enabled': {type: 'bol'},
    'browser.send_pings': {type: 'bol'},
  },
  'geolocation': {
    'geo.enabled': {type: 'bol'},
    'geo.wifi.logging.enabled': {type: 'bol'},
  },
  'tracking': {
    'privacy.trackingprotection.enabled': {type: 'bol'}
  },
  'stats-collection': {
    'datareporting.healthreport.service.enabled': {type: 'bol'},
    'datareporting.healthreport.uploadEnabled': {type: 'bol'},
    'toolkit.telemetry.enabled': {type: 'bol'}
  },
  'integration': {
    'loop.enabled': {type: 'bol'},
    'browser.pocket.enabled': {type: 'bol'}
  },
  'media': {
    'media.peerconnection.enabled': {type: 'bol'},
    'media.eme.enabled': {type: 'bol'},
    'media.gmp-eme-adobe.enabled': {type: 'bol'},
    'webgl.disabled': {type: 'bol'}
  },
  'devices': {
    'camera.control.face_detection.enabled': {type: 'bol'},
    'camera.control.autofocus_moving_callback.enabled': {type: 'bol'},
    'device.sensors.enabled': {type: 'bol'}
  },
  'encryption': {
    'security.tls.unrestricted_rc4_fallback': {type: 'bol'},
    'security.tls.insecure_fallback_hosts.use_static_list': {type: 'bol'},
    'security.ssl.require_safe_negotiation': {type: 'bol'},
    'security.ssl.treat_unsafe_negotiation_as_broken': {type: 'bol'}
  }
};

var locale = {};
var values = {};
var locked = {};
for (let category in ui) {
  locale[category] = _(category);
  for (let pref in ui[category]) {
    locale[pref] = _(pref);
    values[pref] = prefs.get(pref);
    values[pref] = prefs.get(pref);
    locked[pref] = prefService.getBranch(pref).prefIsLocked('');
    observe(pref, function (p) {
      inject.port.emit('pref', {
        pref: p,
        value: prefs.get(p),
        locked: locked[p]
      });
    });
  }
}

var module = desktop ? require('./desktop') : require('./android');
var inject = module.panel({
  contentScriptOptions: {
    font: sp.prefs.font,
    ui: ui,
    locale: locale,
    values: values,
    locked: locked
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
  if (obj.cmd === 'privacy' || obj.cmd === 'security') {
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
