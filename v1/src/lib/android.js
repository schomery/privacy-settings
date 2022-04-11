'use strict';

var unload = require('sdk/system/unload');
var self = require('sdk/self');
var pageMod = require('sdk/page-mod');
var array = require('sdk/util/array');
var tabs = require('sdk/tabs');
var _ = require('sdk/l10n').get;
var {Cu} = require('chrome');

var {Services} = Cu.import('resource://gre/modules/Services.jsm');

var url = self.data.url('popover/index.html');
var window = Services.wm.getMostRecentWindow('navigator:browser').NativeWindow; // jshint ignore:line

var ports = {};
var workers = [];
exports.panel = function (obj) {
  obj.include = self.data.url('popover/index.html');
  obj.attachTo = ['top', 'existing'];
  let pm = pageMod.PageMod(obj);
  pm.on('attach', function (worker) {
    array.add(workers, worker);
    worker.on('pageshow', function () {
      array.add(workers, this);
    });
    worker.on('pagehide', function () {
      array.remove(workers, this);
    });
    worker.on('detach', function () {
      array.remove(workers, this);
    });
    for (let name in ports) {
      worker.port.on(name, ports[name]);
    }
  });
  return {
    port: {
      on: (name, callback) => ports[name] = callback,
      emit: (name, val) => workers.forEach(w => w.port.emit(name, val))
    },
    hide: function () {}
  };
};

var id = (function () {
  return window.menu.add({
    name: _('name'),
    parent: window.menu.toolsMenuID,
    callback: () => {
      for (let tab of tabs) {
        if (tab && tab.url && tab.url.startsWith(self.data.url('')) ) {
          tab.close();
        }
      }
      tabs.open(url);
    }
  });
})();

unload.when(() => window.menu.remove(id));
