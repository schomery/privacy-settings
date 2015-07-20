/* globals self */
'use strict';

var add = {
  url: document.getElementById('add').querySelector('input'),
  button: document.querySelector('[data-cmd=add]'),
  matching: document.getElementById('add').querySelector('select'),
  domain: document.getElementById('add').querySelector('input[data-type=domain]'),
  type: document.getElementById('add').querySelector('select[data-type=type]'),
  enabled: document.getElementById('add').querySelector('[type=checkbox]')
};

var rules = document.getElementById('rules');

function validate () {
  if (add.matching.value === 'WildCard' && add.url.value.split('*').length > 2) {
    window.alert('WildCard only accepts one "*"');
    add.button.disabled = true;
    return;
  }
  add.button.disabled = !add.url.value;
}
document.addEventListener('input', validate);

document.addEventListener('click', function (e) {
  var target = e.target;
  if (target.dataset.cmd === 'add') {
    self.port.emit('insert', {
      url: add.url.value,
      matching: add.matching.value,
      domain: add.domain.value  || '*',
      type: add.type.value,
      enabled: add.enabled.checked
    });
  }
});
document.addEventListener('click', function (e) {
  var target = e.target;
  if (target.dataset.cmd === 'delete') {
    self.port.emit('delete', target.parentNode.parentNode.dataset.id);
  }
});
self.port.on('delete', function (id) {
  var tr = document.querySelector('[data-id="' + id + '"]');
  if (tr) {
    tr.parentNode.removeChild(tr);
  }
});

function insert (obj) {
  var tr = document.querySelector('[data-id="-1"]').cloneNode(true);
  var child = tr.children;
  child[0].textContent = obj.url;
  child[1].textContent = obj.matching;
  child[2].textContent = obj.domain;
  child[3].textContent = obj.type;
  child[4].textContent = obj.enabled;
  tr.dataset.id = obj.id;
  rules.querySelector('tbody').appendChild(tr);
  tr.classList.remove('hidden');
}
self.port.on('list', function (arr) {
  arr.forEach(insert);
});
self.port.on('insert', insert);
self.port.emit('list');
