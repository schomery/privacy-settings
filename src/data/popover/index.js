/* globals self */
'use strict';

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
    width: Math.max(document.body.scrollWidth, document.documentElement.scrollWidth, document.body.offsetWidth, document.documentElement.offsetWidth, document.body.clientWidth, document.documentElement.clientWidth),
    height: Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, document.body.offsetHeight, document.documentElement.offsetHeight, document.body.clientHeight, document.documentElement.clientHeight)
  });
}
function font (f) {
  document.querySelector('table').style['font-size'] = (f || self.options.font) + 'px';
  size();
}

self.port.on('font', font);
font();
