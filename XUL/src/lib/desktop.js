'use strict';

var core = require('sdk/view/core');
var panels = require('sdk/panel');
var sp = require('sdk/simple-prefs');
var _ = require('sdk/l10n').get;
var {ToggleButton} = require('sdk/ui/button/toggle');

var button = new ToggleButton({
  id: 'privacy-settings',
  label: _('name'),
  icon: {
    '16': './icons/16.png',
    '32': './icons/32.png',
    '64': './icons/64.png',
  }
});

var callbacks = [];
var properties = {};
var panel;

exports.panel = function (obj) {
  properties = obj;
  //return panels.Panel(obj);
  return {
    set width (val) { // jshint ignore:line
      if (panel) {
        panel.width = val;
      }
    },
    set height (val) { // jshint ignore:line
      if (panel) {
        panel.height = val;
      }
    },
    hide: () => panel ? panel.hide() : null,
    port: {
      emit: (id, data) => panel ? panel.port.emit(id, data) : null,
      on: (name, callback) => callbacks.push([name, callback])
    }
  };
};

var size = {
  10: {
    width: 520,
    height: 520
  },
  11: {
    width: 530,
    height: 550
  },
  12: {
    width: 540,
    height: 620
  },
  13: {
    width: 560,
    height: 640
  },
  14: {
    width: 580,
    height: 650
  }
};

button.on('change', function (state) {
  if (state.checked) {
    properties.width = size[sp.prefs.font].width;
    properties.height = size[sp.prefs.font].height;
    panel = panels.Panel(properties);
    callbacks.forEach(([name, callback]) => panel.port.on(name, callback));
    core.getActiveView(panel).setAttribute('tooltip', 'aHTMLTooltip');
    panel.on('hide', function () {
      button.state('window', {checked: false});
      panel.destroy();
      panel = null;
    });
    panel.show({
      position: button
    });
    panel.port.on('size', obj => {
      panel.width = obj.width;
      panel.height = obj.height + 40;
    });
  }
});
