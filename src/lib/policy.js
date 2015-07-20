'use strict';

var sp = require('sdk/simple-prefs');
var prefs = sp.prefs;
var timers = require('sdk/timers');
var utils = require('sdk/tabs/utils');
var xpcom = require('sdk/platform/xpcom');
var urls = require('sdk/url');
var unload = require('sdk/system/unload');
var browsing = require('sdk/private-browsing');
var {Class} = require('sdk/core/heritage');
var {Cc, Ci} = require('chrome');
var {MatchPattern} = require('sdk/util/match-pattern');

var reset;
var af = {};
var modes = {};
var counter = function () {};
var types = {
  2: 'TYPE_SCRIPT',
  3: 'TYPE_IMAGE',
  4: 'TYPE_STYLESHEET',
  5: 'TYPE_OBJECT',
  7: 'TYPE_SUBDOCUMENT',
  10: 'TYPE_PING',
  11: 'TYPE_XMLHTTPREQUEST',
  12: 'TYPE_OBJECT_SUBREQUEST',
  14: 'TYPE_FONT',
  15: 'TYPE_MEDIA',
  16: 'TYPE_WEBSOCKET'
};

function getContext (context) {
  if (!(context instanceof Ci.nsIDOMWindow)) {
    if (context instanceof Ci.nsIDOMNode && context.ownerDocument) {
      context = context.ownerDocument;
    }
    if (context instanceof Ci.nsIDOMDocument) {
      context = context.defaultView;
    }
    else {
      context = null;
    }
  }
  return context && context.top ? context.top : context;
}
function getID (context, forced) {
  context = forced ? getContext(context) : context;
  if (context) {
    var tab = utils.getTabForContentWindow(context.top);
    return tab ? utils.getTabId(tab) : null;
  }
  return null;
}

function valid (url, top, isPrivate, type) {
  var filters = af[type];
  if (!filters) {
    return true;
  }
  if (prefs.private && isPrivate) {
    return false;
  }
  var partial = modes[type] === 'p';
  if (partial) {
    try {
      var host = urls.URL(url).host;
      if ((host && host.split(top)[1] === '') || url.indexOf('data:') === 0) {
        if (prefs['log-passed']) {
          console.error('[Passed]', 'Passed by third-party rule', url, 'domain:', top);
        }
        return false;
      }
    }
    catch (e) {
      console.error(e);
    }
  }

  for (var i = 0; i < filters.length; i++) {
    var filter = filters[i];
    if (filter.domain !== '*' && filter.domain !== top && filter.domain !== top) {
      continue;
    }
    try {
      if (filter.matching === 'RegExp') {
        var re = new RegExp(filter.url);
        if (re.test(url)) {
          if (prefs['log-passed']) {
            console.error('[Passed]', 'passed by RegExp matching rule', 'domain:', url);
          }
          return false;
        }
      }
      else {
        var pattern = new MatchPattern(filter.url);
        if (pattern.test(url)) {
          if (prefs['log-passed']) {
            console.error('[Passed]', 'passed by WildCard matching rule', 'domain:', url);
          }
          return false;
        }
      }
    }
    catch (e) {
      console.error(e);
    }
  }

  return true;
}

var policy = new Class({
  extends: xpcom.Unknown,
  interfaces: ['nsIContentPolicy'],
  shouldLoad: function (contType, contLoc, reqOrig, context, aMimeTypeGuess, aExtra, aRequestPrincipal) {
    // update badge
    if (contType === Ci.nsIContentPolicy.TYPE_DOCUMENT) {
      if (reset && context._contentWindow) {
        reset(getID(context._contentWindow.top), true);
      }
      return Ci.nsIContentPolicy.ACCEPT;
    }
    if (reqOrig.spec.indexOf('http') === 0 && contLoc.spec.indexOf('http') === 0 && types[contType]) {
      if (
        contType === Ci.nsIContentPolicy.TYPE_FONT && !prefs['policy-font'] ||
        contType === Ci.nsIContentPolicy.TYPE_IMAGE && !prefs['policy-image'] ||
        contType === Ci.nsIContentPolicy.TYPE_MEDIA && !prefs['policy-media'] ||
        contType === Ci.nsIContentPolicy.TYPE_OBJECT && !prefs['policy-object'] ||
        contType === Ci.nsIContentPolicy.TYPE_STYLESHEET && !prefs['policy-stylesheet'] ||
        contType === Ci.nsIContentPolicy.TYPE_SCRIPT && !prefs['policy-script'] ||
        contType === Ci.nsIContentPolicy.TYPE_SUBDOCUMENT && !prefs['policy-subdomain'] ||
        contType === Ci.nsIContentPolicy.TYPE_XMLHTTPREQUEST && !prefs['policy-request'] ||
        contType === Ci.nsIContentPolicy.TYPE_OBJECT_SUBREQUEST && !prefs['policy-subrequest'] ||
        contType === Ci.nsIContentPolicy.TYPE_WEBSOCKET && !prefs['policy-websocket'] ||
        contType === Ci.nsIContentPolicy.TYPE_PING && !prefs['policy-ping']
      ) {
        return Ci.nsIContentPolicy.ACCEPT;
      }

      var url = contLoc.spec;
      var top = aRequestPrincipal ? aRequestPrincipal.baseDomain : '';
      var tContext = getContext(context);
      var isPrivate = browsing.isPrivate(tContext);
      if (valid(url, top, isPrivate, contType)) {
        if (prefs['log-blocked']) {
          console.error('[Blocked] url:', url, 'domain:', top, 'type:', types[contType]);
        }
        timers.setTimeout(function () {
          counter(getID(tContext));
        }, 0);

        return Ci.nsIContentPolicy.REJECT;
      }
    }
    return Ci.nsIContentPolicy.ACCEPT;
  },
  shouldProcess: function () {
    return Ci.nsIContentPolicy.ACCEPT;
  }
});

(function (factory) {
  Cc['@mozilla.org/categorymanager;1']
    .getService(Ci.nsICategoryManager)
    .addCategoryEntry('content-policy', 'not-sure', factory.contract, false, true);
})(xpcom.Factory({
  Component:   policy,
  description: 'Implements content policy to prevent some resources',
  contract:    '@add0n.com/policy-control'
}));

exports.reset = function (c) {
  reset = c;
};
exports.counter = function (c) {
  counter = c;
};
exports.filters = function (filters) {
  af[Ci.nsIContentPolicy.TYPE_FONT] = filters.filter(o => o.enabled && o.type === 'TYPE_FONT');
  af[Ci.nsIContentPolicy.TYPE_IMAGE] = filters.filter(o => o.enabled && o.type === 'TYPE_IMAGE');
  af[Ci.nsIContentPolicy.TYPE_MEDIA] = filters.filter(o => o.enabled && o.type === 'TYPE_MEDIA');
  af[Ci.nsIContentPolicy.TYPE_OBJECT] = filters.filter(o => o.enabled && o.type === 'TYPE_OBJECT');
  af[Ci.nsIContentPolicy.TYPE_STYLESHEET] = filters.filter(o => o.enabled && o.type === 'TYPE_STYLESHEET');
  af[Ci.nsIContentPolicy.TYPE_SCRIPT] = filters.filter(o => o.enabled && o.type === 'TYPE_SCRIPT');
  af[Ci.nsIContentPolicy.TYPE_SUBDOCUMENT] = filters.filter(o => o.enabled && o.type === 'TYPE_SUBDOCUMENT');
  af[Ci.nsIContentPolicy.TYPE_XMLHTTPREQUEST] = filters.filter(o => o.enabled && o.type === 'TYPE_XMLHTTPREQUEST');
  af[Ci.nsIContentPolicy.TYPE_OBJECT_SUBREQUEST] = filters.filter(o => o.enabled && o.type === 'TYPE_OBJECT_SUBREQUEST');
  af[Ci.nsIContentPolicy.TYPE_WEBSOCKET] = filters.filter(o => o.enabled && o.type === 'TYPE_WEBSOCKET');
  af[Ci.nsIContentPolicy.TYPE_PING] = filters.filter(o => o.enabled && o.type === 'TYPE_PING');
};

unload.when(function () {
  prefs['log-blocked'] = false;
  prefs['log-passed'] = false;
});

(function () {
  var policies = ['font', 'image', 'media', 'object', 'stylesheet', 'script', 'subdomain', 'request', 'subrequest', 'websocket', 'ping'];
  var codes = [Ci.nsIContentPolicy.TYPE_FONT, Ci.nsIContentPolicy.TYPE_IMAGE, Ci.nsIContentPolicy.TYPE_MEDIA, Ci.nsIContentPolicy.TYPE_OBJECT, Ci.nsIContentPolicy.TYPE_STYLESHEET, Ci.nsIContentPolicy.TYPE_SCRIPT, Ci.nsIContentPolicy.TYPE_SUBDOCUMENT, Ci.nsIContentPolicy.TYPE_XMLHTTPREQUEST, Ci.nsIContentPolicy.TYPE_OBJECT_SUBREQUEST, Ci.nsIContentPolicy.TYPE_WEBSOCKET, Ci.nsIContentPolicy.TYPE_PING]

  policies.forEach((p, i) => modes[codes[i]] = prefs['mod-' + p]);
  sp.on('*', function (pref) {
    if (pref.indexOf('mod-') === 0) {
      modes[codes[policies.indexOf(pref.substr(4))]] = prefs[pref];
    }
  });
})({});
