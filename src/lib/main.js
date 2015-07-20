'use strict';

var {ToggleButton} = require('sdk/ui/button/toggle');
var panels = require('sdk/panel');
var self = require('sdk/self');
var sp = require('sdk/simple-prefs');
var prefs = sp.prefs;
var tabs = require('sdk/tabs');
var core = require('sdk/view/core');
var unload = require('sdk/system/unload');
var runtime = require('sdk/system/runtime');
var pageMod = require('sdk/page-mod');
var policy = require('./policy');

var path = './icons/' + (runtime.OS === 'Darwin' ? 'mac/' : '');

var filters = {
  read: function () {
    return JSON.parse(prefs.filters || '[]');
  },
  write: function (val) {
    var fs = this.read();
    fs.push(val);
    prefs.filters = JSON.stringify(fs);
    policy.filters(fs);
  },
  remove: function (id) {
    var fs = this.read();
    prefs.filters = JSON.stringify(fs.filter(o => o.id !== +id));
    policy.filters(this.read());
  }
};

var states = [];

var button = new ToggleButton({
  id: 'policy-control',
  label: 'Policy Control',
  icon: {
    '16': path + '16.png',
    '32': path + '32.png',
    '64': path + '64.png',
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
  contentScriptOptions: {
    font: sp.prefs.font
  },
  contentURL: self.data.url('popover/index.html'),
  contentScriptFile: self.data.url('popover/index.js'),
  onHide: function () {
    button.state('window', {checked: false});
  }
});
core.getActiveView(panel).setAttribute('tooltip', 'aHTMLTooltip');

panel.port.on('size', function (obj) {
  panel.width = obj.width;
  panel.height = obj.height;
});


panel.port.on('get-preference', function (name) {
  panel.port.emit('set-preference', {
    name,
    value: prefs[name]
  });
});
panel.port.on('set-preference', function (obj) {
  prefs[obj.name] = obj.value;
});
sp.on('*', function (name) {
  if (name) {
    panel.port.emit('set-preference', {
      name,
      value: prefs[name]
    });
  }
});
panel.port.on('command', function (obj) {
  if (obj.cmd === 'options') {
    options();
    panel.hide();
  }
  if (obj.cmd.indexOf('log-') === 0 || obj.cmd === 'private') {
    prefs[obj.cmd] = obj.value;
  }
  if (obj.cmd === 'enable') {
    if (obj.value === 'true') {
      states = obj.states;
      states.forEach(function (obj) {
        prefs[obj.name] = false;
      });
      panel.port.emit('enabled', false);
    }
    else {
      states.forEach(function (obj) {
        prefs[obj.name] = obj.status;
      });
      panel.port.emit('enabled', true);
    }
    if (obj.enabled === 'false') {
      states = [];
    }
  }
});

unload.when(function () {
  if (states.length) {
    states.forEach(function (obj) {
      prefs[obj.name] = obj.status;
    });
  }
});
/* badge */
var counts = {};
var badge = (function () {
  var cache = {id: null, count: 0};
  return function () {
    var id = tabs.activeTab.id;
    var count = counts[id];
    if (count === cache.count) {
      return;
    }
    cache.id = id;
    cache.count = count;
    button.badge = count ? count : '';
  };
})();
tabs.on('activate', badge);

function counter (id) {
  if (id) {
    counts[id] = (isNaN(counts[id]) ? 0 : counts[id]) + 1;
    badge();
  }
}

/* policy */
policy.reset(function (id) {
  counts[id] = 0;
  badge(id);
});
policy.counter(counter);
policy.filters(filters.read());

/* settings page */
function closeOptions () {
  for (let tab of tabs) {
    if (tab.url.indexOf(self.data.url('settings/index.html')) === 0) {
      tab.close();
    }
  }
}
function options () {
  closeOptions();
  tabs.open(self.data.url('settings/index.html'));
}
unload.when(closeOptions);
pageMod.PageMod({
  include: self.data.url('settings/index.html'),
  contentScriptFile: self.data.url('settings/index.js'),
  contentScriptWhen: 'ready',
  onAttach: function (worker) {
    worker.port.on('list', function () {
      worker.port.emit('list', filters.read());
    });
    worker.port.on('delete', function (id) {
      filters.remove(id);
      worker.port.emit('delete', id);
    });
    worker.port.on('insert', function (obj) {
      var id = (prefs.id || 0) + 1;
      prefs.id = id;
      obj.id = id;
      filters.write(obj);
      worker.port.emit('insert', obj);
    });
  }
});
sp.on('options', options);
