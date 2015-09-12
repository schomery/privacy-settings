#### Temporary Locking a Preference

var prefs = Cc['@mozilla.org/preferences-service;1']
  .getService(Ci.nsIPrefService);
var branch = prefs.getBranch("geo.enabled");
branch.lockPref('', true);
console.error(branch.prefIsLocked(''))
