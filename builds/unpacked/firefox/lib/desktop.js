'use strict';

var core = require('sdk/view/core');
var panels = require('sdk/panel');
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

exports.panel = function (obj) {
  return panels.Panel(obj);
};
exports.execute = function (panel) {
  core.getActiveView(panel).setAttribute('tooltip', 'aHTMLTooltip');
  panel.on('hide', function () {
    button.state('window', {checked: false});
  });
  button.on('change', function (state) {
    if (state.checked) {
      panel.show({
        position: button
      });
    }
  });
};
