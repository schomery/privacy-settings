# Privacy Settings
Alter Firefox's built-in privacy settings easily with a toolbar panel.
![screen shot 2016-01-30 at 10 16 18](https://cloud.githubusercontent.com/assets/11704051/12694203/8e0a3670-c73a-11e5-9ef5-991d76c67253.png)

For FAQs and instruction on how to use the extension please visit http://firefox.add0n.com/privacy-settings.html

## Downloads:
Production version can be found at https://addons.mozilla.org/en-US/firefox/addon/privacy-settings/
Developer version can be found at https://github.com/schomery/privacy-settings/tree/master/builds

## How to build from source code
If you have modified the source code and want to see the modified version in action, you can simply compile the project yourself. Run the following command in the terminal
```bash
cd src
jpm xpi
```
This will generate an `XPI` file for you in the src directory. Drop the file in your Firefox browser
Notes:

1. To build this project you need to have [nodejs](https://nodejs.org/en/) installed. Also make sure `jpm` module is also globally available; [https://www.npmjs.com/package/jpm](https://www.npmjs.com/package/jpm)

## Technical notes:
#### Temporary Locking a Preference
```javascript
var prefs = Cc['@mozilla.org/preferences-service;1']
  .getService(Ci.nsIPrefService);
var branch = prefs.getBranch("geo.enabled");
branch.lockPref('', true);
console.error(branch.prefIsLocked(''))
