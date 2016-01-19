/* globals self */
'use strict';

function html (name, parent, attrbs) {
  var elem = document.createElement(name);
  for (var i in (attrbs || {})) {
    elem.setAttribute(i, attrbs[i]);
  }
  if (parent) {
    parent.appendChild(elem);
  }
  return elem;
}

document.addEventListener('click', function (e) {
  var target = e.target;
  if ([].indexOf.call(target.classList, 'button') === -1) {
    return;
  }
  self.port.emit('pref', {
    pref: target.previousSibling.textContent,
    value: target.classList.contains('icon-toggle-off')
  });
}, false);
document.addEventListener('change', function (e) {
  var target = e.target;
  if ([].indexOf.call(target.classList, 'int-pref') === -1) {
    return;
  }
  self.port.emit('pref', {
    pref: target.parentNode.previousSibling.textContent,
    value: +target.value
  });
}, false);
document.addEventListener('change', function (e) {
  var target = e.target;
  var cmd = target.dataset.cmd;
  if (cmd) {
    self.port.emit('command', {
      cmd: cmd,
      prefs: [].map.call(document.querySelectorAll('td[class=pref]'), td => td.textContent)
    });
  }
}, false);
document.addEventListener('click', function (e) {
  var target = e.target;
  var cmd = target.dataset.cmd;
  if (cmd) {
    self.port.emit('command', {
      cmd: cmd,
      prefs: [].map.call(document.querySelectorAll('td[class=pref]'), td => td.textContent)
    });
  }
}, false);

self.port.on('pref', function (obj) {
  [].filter.call(document.querySelectorAll('td[class=pref]'), function (td) {
    return td.textContent === obj.pref;
  }).forEach(function (td) {
    if (!obj.locked) {
      if (parseInt(obj.value) === obj.value) { // int preference
        // badge handling
        td.dataset.type = self.options.types[pref][obj.value] ? self.options.types[pref][obj.value] : 'npns';
        // element
        let target = td.nextSibling.childNodes[0];
        target.value = obj.value;
      }
      else {  // boolean preference
        // badge handling
        td.dataset.type = obj.value ? self.options.types[obj.pref].true : self.options.types[obj.pref].false;
        // element
        let target = td.nextSibling;
        target.textContent = obj.value ? 'On' : 'Off';
        if (obj.value) {
          target.classList.remove('icon-toggle-off');
          target.classList.add('icon-toggle-on');
        }
        else {
          target.classList.add('icon-toggle-off');
          target.classList.remove('icon-toggle-on');
        }
      }
    }
  });
});

self.port.on('show', function () {
  [].filter.call(document.querySelectorAll('td[class=pref]'), function (td) {
    self.port.emit('update', td.textContent);
  });
});

function size () {
  self.port.emit('size', {
    width: parseInt(window.getComputedStyle(document.getElementById('list'), null).width) + 50,
    height: 1 + document.documentElement.offsetHeight + 5
  });
}
function font (f) {
  function change (e) {
    e.style['font-size'] = (f || self.options.font) + 'px';
  }
  change(document.body);
  [].forEach.call(document.querySelectorAll('table'), change);
  [].forEach.call(document.querySelectorAll('button'), change);
  size();
}

self.port.on('font', font);

for (var category in self.options.ui) {
  var table = (function (tr) {
    html('h1', html('td', tr)).textContent = self.options.locales[category];
    return html('table', html('td', tr));
  })(html('tr', document.querySelector('#list tbody')));

  for (var pref in self.options.ui[category]) {
    let value = self.options.values[pref];
    let tr = html('tr', table);
    let td = html('td', tr, {
      'class': 'pref',
      'title': self.options.locales[pref],
    });
    td.textContent = pref;

    if (self.options.locked[pref]) {
      html('td', tr, {
        'class': 'icon-locked'
      }).textContent = value ? 'On' : 'Off';
    }
    else if (parseInt(value) === value) { // int preference
      // badge handling
      td.dataset.type = self.options.types[pref][value] ? self.options.types[pref][value] : 'npns';
      // element
      html('input', html('td', tr), {
        type: 'number',
        class: 'int-pref',
        min: self.options.types[pref].min,
        max: self.options.types[pref].max
      }).value = self.options.values[pref];
    }
    else { // boolean preference
      // badge handling
      td.dataset.type = value ? self.options.types[pref].true : self.options.types[pref].false;
      //element
      value = value ? 'On' : 'Off';
      html('td', tr, {
        'class': 'icon-toggle-' + value.toLowerCase() + ' button '
      }).textContent = value;
    }
  }
}
window.setTimeout(font, 1000);
