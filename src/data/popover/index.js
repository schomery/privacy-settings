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
    var target = td.nextSibling;
    if (obj.value) {
      target.classList.remove('icon-toggle-off');
      target.classList.add('icon-toggle-on');
      target.textContent = 'On';
    }
    else {
      target.classList.add('icon-toggle-off');
      target.classList.remove('icon-toggle-on');
      target.textContent = 'Off';
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
    width: parseInt(window.getComputedStyle(document.getElementById('list'), null).width) + 30,
    height: Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, document.body.offsetHeight, document.documentElement.offsetHeight, document.body.clientHeight, document.documentElement.clientHeight)
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
    html('h1', tr).textContent = self.options.locale[category];
    return html('table', html('td', tr), {
      'width': '100%'
    });
  })(html('tr', document.querySelector('#list tbody')));

  for (var pref in self.options.ui[category]) {
    var tr = html('tr', table);
    html('td', tr, {
      'class': 'pref',
      'title': self.options.locale[pref],
    }).textContent = pref;
    var value = self.options.values[pref] ? 'On' : 'Off';
    if (self.options.locked[pref]) {
      html('td', tr).textContent = 'Locked, ' + (self.options.values[pref] ? 'On' : 'Off');
    }
    else {
      html('td', tr, {
        'class': 'icon-toggle-' + value.toLowerCase() + ' button'
      }).textContent = value;
    }
  }
}
window.setTimeout(font, 1000);
