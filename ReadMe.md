# Privacy Settings
Alter Firefox's built-in privacy settings easily with a toolbar panel.
![screen shot 2016-01-30 at 10 16 18](https://cloud.githubusercontent.com/assets/11704051/12694203/8e0a3670-c73a-11e5-9ef5-991d76c67253.png)

For FAQs and instruction on how to use the extension please visit http://firefox.add0n.com/privacy-settings.html

## Downloads:
Production version can be found at https://addons.mozilla.org/en-US/firefox/addon/privacy-settings/
Developer version can be found at https://github.com/schomery/privacy-settings/blob/master/builds/packed/firefox.xpi?raw=true

## How to build from source code
If you have modified the source code and want to see the modified version in action, you can simply compile the project yourself. Run the following command in the terminal
```bash
gulp firefox
```
Notes:

1. The compiler is based on [nodejs](https://nodejs.org/en/) and [gulp](http://gulpjs.com/)
2. You also need to have these modules available, https://github.com/schomery/privacy-settings/blob/master/gulpfile.js#L3-L14


## Technical notes:
#### Temporary Locking a Preference
```javascript
var prefs = Cc['@mozilla.org/preferences-service;1']
  .getService(Ci.nsIPrefService);
var branch = prefs.getBranch("geo.enabled");
branch.lockPref('', true);
console.error(branch.prefIsLocked(''))
