/* globals self */
'use strict';

document.addEventListener('change', function (e) {
  let target = e.target;
  if (target.type === 'range') {
    target.parentNode.querySelector('span[type=range]').textContent = target.value;
    target.parentNode.parentNode.querySelector('span[type=tooltip]').textContent =
      document.querySelector(`[data-l10n-id="avdsttngs.${target.name}.${target.value}"]`).textContent;
    if (e.isTrusted) {
      self.port.emit('changed', {
        name: target.name,
        value: parseInt(target.value)
      });
    }
  }
  if (target.type === 'checkbox') {
    target.parentNode.querySelector('span[type=checkbox]').textContent = target.checked;
    target.parentNode.parentNode.querySelector('span[type=tooltip]').textContent =
      document.querySelector(`[data-l10n-id="avdsttngs.${target.name}.${target.checked}"]`).textContent;
    if (e.isTrusted) {
      self.port.emit('changed', {
        name: target.name,
        value: target.checked
      });
    }
  }
  if (target.type === 'text' && e.isTrusted) {
    self.port.emit('changed', {
      name: target.name,
      value: target.value
    });
  }
  if (target.type === 'number' && e.isTrusted) {
    self.port.emit('changed', {
      name: target.name,
      value: parseInt(target.value)
    });
  }
}, false);

document.addEventListener('click', function (e) {
  let target = e.target;
  let command = target.dataset.cmd;
  if (command) {
    self.port.emit('cmd', {
      command,
      name: target.parentNode.querySelector('[name]').name
    });
  }
}, false);

self.port.on('changed', function (obj) {
  let elem = document.querySelector(`input[name="${obj.name}"]`);
  if (elem) {
    if (elem.type === 'checkbox') {
      elem.checked = obj.value;
    }
    else {
      elem.value = obj.value;
    }
    elem.dispatchEvent(new Event('change', {'bubbles': true}));
  }
});

Array.from(document.querySelectorAll('input[name]')).forEach(e => self.port.emit('register', e.name));
