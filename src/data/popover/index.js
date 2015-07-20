/* globals self */
'use strict';

function size () {
  self.port.emit('size', {
    width: Math.max(document.body.scrollWidth, document.documentElement.scrollWidth, document.body.offsetWidth, document.documentElement.offsetWidth, document.body.clientWidth, document.documentElement.clientWidth),
    height: Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, document.body.offsetHeight, document.documentElement.offsetHeight, document.body.clientHeight, document.documentElement.clientHeight)
  });
}
size();

var dom = {
  get policies () {
    return [].slice.call(document.querySelectorAll('[data-policy]'));
  },
  policy: function (name) {
    return document.querySelector('[data-policy=' + name + ']').querySelector('.button');
  },
  mod: function (name) {
    return document.querySelector('[data-policy=' + name + ']').querySelector('a');
  },
  get checkboxes () {
    return [].slice.call(document.querySelectorAll('input[type=checkbox]'));
  },
  cmd: function (name) {
    return document.querySelector('[data-cmd="' + name + '"]');
  }
};

self.port.on('set-preference', function (obj) {
  if (obj.name.indexOf('policy-') === 0) {
    var policy = dom.policy(obj.name.substr(7));
    if (policy) {
      if (obj.value) {
        policy.textContent = 'On';
        policy.classList.remove('icon-toggle-off');
        policy.classList.add('icon-toggle-on');
      }
      else {
        policy.textContent = 'Off';
        policy.classList.remove('icon-toggle-on');
        policy.classList.add('icon-toggle-off');
      }
    }
  }
  if (obj.name.indexOf('mod-') === 0) {
    var mod = dom.mod(obj.name.substr(4));
    if (mod) {
      mod.dataset.mod = obj.value;
      mod.textContent = obj.value === 'p' ? 'third-party' : 'all';
    }
  }
  if (obj.name.indexOf('log-') === 0 || obj.name === 'private') {
    var log = dom.cmd(obj.name);
    log.checked = obj.value;
  }
});

// init
dom.policies.map(p => p.dataset.policy).forEach(function (name) {
  self.port.emit('get-preference', 'policy-' + name);
  self.port.emit('get-preference', 'mod-' + name);
});
dom.checkboxes.map(e => e.dataset.cmd).forEach(p => self.port.emit('get-preference', p));
// click
document.addEventListener('click', function (e) {
  var target = e.target;
  if (target.classList.contains('button')) {
    var pref = 'policy-' + target.parentNode.dataset.policy;
    self.port.emit('set-preference', {
      name: pref,
      value: target.classList.contains('icon-toggle-off')
    });
  }
}, false);
document.addEventListener('click', function (e) {
  var target = e.target;
  var mod = target.dataset.mod;
  var policy = target.parentNode.dataset.policy;
  if (mod && policy) {
    self.port.emit('set-preference', {
      name: 'mod-' + policy,
      value: mod === 'p' ? 'f' : 'p'
    });
  }
}, false);
document.addEventListener('click', function (e) {
  var target = e.target;
  var cmd = target.dataset.cmd;
  if (cmd === 'enable') {
    self.port.emit('command', {
      cmd: cmd,
      value: target.dataset.value,
      states: dom.policies.map(function (elem) {
        var policy = elem.dataset.policy;
        return {
          status: dom.policy(policy).classList.contains('icon-toggle-on'),
          name: 'policy-' + policy
        };
      })
    });
  }
  else if (cmd) {
    self.port.emit('command', {
      cmd: cmd,
      value: target.checked
    });
  }
}, false);

self.port.on('enabled', function (b) {
  var button = document.querySelector('[data-cmd=enable]');
  button.value = b ? 'Disable all filters temporarily' : 'Enable filters rules';
  button.dataset.value = b;
});
