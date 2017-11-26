'use strict';

var webExtension = require('sdk/webextension');
var prefs = require('sdk/preferences/service');
var {Cc, Ci} = require('chrome');
var prefService = Cc['@mozilla.org/preferences-service;1']
  .getService(Ci.nsIPrefService);

function sendPref (pref, response) {
  let value = prefs.get(pref);
  response({
    pref,
    value,
    default: prefService.getDefaultBranch(pref)[typeof value === 'number' ? 'getIntPref' : 'getBoolPref'](''),
    locked: prefService.getBranch(pref).prefIsLocked('')
  });
}

function message (request, sender, response) {
  if (request.method === 'get-pref') {
    sendPref(request.pref, response);
  }
  else if (request.method === 'change-pref') {
    try {
      prefs.set(request.pref, request.value);
    }
    catch (e) {
      console.error(e);
    }
    sendPref(request.pref, response);
  }
  else if (request.method === 'reset-pref') {
    prefs.reset(request.pref);
    sendPref(request.pref, response);
  }
}
webExtension.startup().then(api => {
  let {browser} = api;
  browser.runtime.onMessage.addListener(message);
}).catch(e => console.error(e));

