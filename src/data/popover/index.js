/* globals self */
'use strict';

function html (name, parent, attrbs) {
  let elem = document.createElement(name);
  for (let i in (attrbs || {})) {
    elem.setAttribute(i, attrbs[i]);
  }
  if (parent) {
    parent.appendChild(elem);
  }
  return elem;
}

document.addEventListener('click', function (e) {
  let target = e.target;
  if ([].indexOf.call(target.classList, 'button') === -1) {
    return;
  }
  self.port.emit('pref', {
    pref: target.previousSibling.textContent,
    value: target.classList.contains('icon-toggle-off')
  });
}, false);
document.addEventListener('change', function (e) {
  let target = e.target;
  if ([].indexOf.call(target.classList, 'int-pref') === -1) {
    return;
  }
  self.port.emit('pref', {
    pref: target.parentNode.previousSibling.textContent,
    value: +target.value
  });
}, false);
document.addEventListener('change', function (e) {
  let target = e.target;
  let cmd = target.dataset.cmd;
  if (cmd) {
    self.port.emit('command', {
      cmd: cmd,
      prefs: [].map.call(document.querySelectorAll('td[class=pref]'), td => td.textContent)
    });
  }
}, false);
document.addEventListener('click', function (e) {
  let target = e.target;
  let cmd = target.dataset.cmd;
  if (cmd) {
    self.port.emit('command', {
      cmd: cmd,
      prefs: [].map.call(document.querySelectorAll('td[class=pref]'), td => td.textContent)
    });
  }
}, false);

let options = {};

self.port.on('pref', function (obj) {
  [].filter.call(document.querySelectorAll('td[class=pref]'), function (td) {
    return td.textContent === obj.pref;
  }).forEach(function (td) {
    if (!obj.locked) {
      if (parseInt(obj.value) === obj.value) { // int preference
        // badge handling
        td.dataset.type = options.types[obj.pref][obj.value] ? options.types[obj.pref][obj.value] : 'npns';
        // element
        let target = td.nextSibling.childNodes[0];
        target.value = obj.value;
      }
      else {  // boolean preference
        // badge handling
        td.dataset.type = obj.value ? options.types[obj.pref].true : options.types[obj.pref].false;
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

function font (f) {
  function change (e) {
    e.style['font-size'] = (f || options.font) + 'px';
  }
  change(document.body);
  [].forEach.call(document.querySelectorAll('table'), change);
  [].forEach.call(document.querySelectorAll('button'), change);
}

self.port.on('options', function (o) {
  options = o;
  for (var category in options.ui) {
    var table = (function (tr) {
      html('h1', html('td', tr)).textContent = options.locales[category];
      return html('table', html('td', tr));
    })(html('tr', document.querySelector('#list tbody')));

    for (var pref in options.ui[category]) {
      let value = options.values[pref];
      let tr = html('tr', table);
      let td = html('td', tr, {
        'class': 'pref',
        'title': options.locales[pref],
      });
      td.textContent = pref;

      if (options.locked[pref]) {
        html('td', tr, {
          'class': 'icon-locked'
        }).textContent = value ? 'On' : 'Off';
      }
      else if (parseInt(value) === value) { // int preference
        // badge handling
        td.dataset.type = options.types[pref][value] ? options.types[pref][value] : 'npns';
        // element
        html('input', html('td', tr), {
          type: 'number',
          class: 'int-pref',
          min: options.types[pref].min,
          max: options.types[pref].max
        }).value = options.values[pref];
      }
      else { // boolean preference
        // badge handling
        td.dataset.type = value ? options.types[pref].true : options.types[pref].false;
        //element
        value = value ? 'On' : 'Off';
        html('td', tr, {
          'class': 'icon-toggle-' + value.toLowerCase() + ' button '
        }).textContent = value;
      }
    }
  }

  document.querySelector('#proxy a').textContent = o.proxy.title;
  document.querySelector('#proxy td:nth-child(2)').title = o.proxy.description;

  font();

  self.port.emit('size', {
    width: Math.max(document.body.scrollWidth, document.documentElement.scrollWidth, document.body.offsetWidth, document.documentElement.offsetWidth, document.body.clientWidth, document.documentElement.clientWidth),
    height: Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, document.body.offsetHeight, document.documentElement.offsetHeight, document.body.clientHeight, document.documentElement.clientHeight)
  });
});
self.port.emit('options');

