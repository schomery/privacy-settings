'use strict';

var {ToggleButton} = require('sdk/ui/button/toggle');
var panels = require('sdk/panel');
var self = require('sdk/self');
var prefs = require('sdk/preferences/service');
var sp = require('sdk/simple-prefs');
var timers = require('sdk/timers');
var tabs = require('sdk/tabs');

var button = new ToggleButton({
  id: 'privacy-settings',
  label: 'Privacy Settings\n\nEasily alter Firefox\'s built-in privacy settings',
  icon: {
    '16': './icons/16.png',
    '32': './icons/32.png',
    '64': './icons/64.png',
  },
  onChange: function (state) {
    if (state.checked) {
      panel.show({
        position: button
      });
    }
  }
});

var panel = panels.Panel({
  width: 400,
  height: 670,
  contentURL: self.data.url('popover/index.html'),
  contentScriptFile: self.data.url('popover/index.js'),
  onHide: function () {
    button.state('window', {checked: false});
  }
});
panel.on('show', function () {
  panel.port.emit('show');
});
panel.port.on('update', function (pref) {
  panel.port.emit('pref', {
    pref: pref,
    value: prefs.get(pref)
  });
});
panel.port.on('pref', function (obj) {
  console.error(obj);
  prefs.set(obj.pref, obj.value);
  panel.port.emit('pref', {
    pref: obj.pref,
    value: prefs.get(obj.pref)
  });
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
