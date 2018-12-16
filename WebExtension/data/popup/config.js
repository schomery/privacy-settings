'use strict';

var config = {
  network: {},
  services: {},
  websites: {}
};

config.network.networkPredictionEnabled = {
  false: ['p'],
  true: ['np']
};
config.network.peerConnectionEnabled = {
  false: ['p', 's'],
  true: ['np', 'ns']
};
config.network.webRTCIPHandlingPolicy = {
  'default': ['np', 'ns'],
  'default_public_and_private_interfaces': ['np', 'ns'],
  'default_public_interface_only': ['p', 's'],
  'disable_non_proxied_udp': ['p', 's']
};
config.services.alternateErrorPagesEnabled = {
  false: ['p'],
  true: ['np']
};
config.services.autofillEnabled = {
  false: ['p'],
  true: ['np']
};
config.services.autofillAddressEnabled = {
  false: ['p'],
  true: ['np']
};
config.services.autofillCreditCardEnabled = {
  false: ['p'],
  true: ['np']
};
config.services.hotwordSearchEnabled = {
  false: ['p'],
  true: ['np']
};
config.services.passwordSavingEnabled = {
  false: ['p', 's'],
  true: ['np', 'ns']
};
config.services.safeBrowsingEnabled = {
  false: ['np', 'ns'],
  true: ['p', 's']
};
config.services.safeBrowsingExtendedReportingEnabled = {
  false: ['p'],
  true: ['np']
};
config.services.searchSuggestEnabled = {
  false: ['p'],
  true: ['np']
};
config.services.spellingServiceEnabled = {
  false: ['p'],
  true: ['np']
};
config.services.translationServiceEnabled = {
  false: ['p'],
  true: ['np']
};
config.websites.cookieConfig = {};
config.websites.cookieConfig.behavior = {
  'allow_all': ['np'],
  'reject_all': ['p'],
  'reject_third_party': ['p'],
  'allow_visited': ['np'],
  'reject_trackers': ['p']
};
config.websites.cookieConfig.nonPersistentCookies = {
  false: ['np'],
  true: ['p']
};
config.websites.firstPartyIsolate = {
  false: ['np'],
  true: ['p']
};
config.websites.thirdPartyCookiesAllowed = {
  false: ['p', 's'],
  true: ['np', 'ns']
};
config.websites.hyperlinkAuditingEnabled = {
  false: ['p', 's'],
  true: ['np', 'ns']
};
config.websites.referrersEnabled = {
  false: ['p', 's'],
  true: ['np', 'ns']
};
config.websites.doNotTrackEnabled = {
  false: ['p', 's'],
  true: ['np', 'ns']
};
config.websites.resistFingerprinting = {
  true: ['p', 's'],
  false: ['np', 'ns']
};
config.websites.protectedContentEnabled = {
  false: ['np', 'ns'],
  true: ['p', 's']
};
config.websites.trackingProtectionMode = {
  'always': ['p', 's'],
  'never': ['np', 'ns'],
  'private_browsing': ['p', 's']
};

config.values = {
  'network.networkPredictionEnabled': [false, false],
  'network.peerConnectionEnabled': [false, true],
  'network.webRTCIPHandlingPolicy': ['disable_non_proxied_udp', 'default_public_interface_only'],
  'services.alternateErrorPagesEnabled': [false, false],
  'services.autofillEnabled': [false, false],
  'services.autofillAddressEnabled': [false, false],
  'services.autofillCreditCardEnabled': [false, false],
  'services.hotwordSearchEnabled': [false, false],
  'services.passwordSavingEnabled': [false, true],
  'services.safeBrowsingEnabled': [true, true],
  'services.safeBrowsingExtendedReportingEnabled': [false, false],
  'services.searchSuggestEnabled': [false, false],
  'services.spellingServiceEnabled': [false, false],
  'services.translationServiceEnabled': [false, false],
  'websites.cookieConfig': [{
    'behavior': 'reject_all',
    'nonPersistentCookies': true
  }, {
    'behavior': 'reject_third_party',
    'nonPersistentCookies': false
  }],
  'websites.firstPartyIsolate': [true, true],
  'websites.thirdPartyCookiesAllowed': [false, true],
  'websites.hyperlinkAuditingEnabled': [false, false],
  'websites.referrersEnabled': [false, true],
  'websites.doNotTrackEnabled': [false, false],
  'websites.resistFingerprinting': [true, true],
  'websites.protectedContentEnabled': [true, true],
  'websites.trackingProtectionMode': ['always', 'private_browsing']
};

if (navigator.userAgent.indexOf('OPR') !== -1) {
  delete config.values['services.hotwordSearchEnabled'];
}
