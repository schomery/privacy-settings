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
config.websites.protectedContentEnabled = {
  false: ['np', 'ns'],
  true: ['p', 's']
};

config.values = {
  'network.networkPredictionEnabled': [true, false],
  'network.peerConnectionEnabled': [true, true],
  'network.webRTCIPHandlingPolicy': ['default', 'default_public_interface_only'],
  'services.alternateErrorPagesEnabled': [true, false],
  'services.autofillEnabled': [true, false],
  'services.hotwordSearchEnabled': [false, false],
  'services.passwordSavingEnabled': [true, false],
  'services.safeBrowsingEnabled': [true, true],
  'services.safeBrowsingExtendedReportingEnabled': [false, false],
  'services.searchSuggestEnabled': [true, false],
  'services.spellingServiceEnabled': [false, false],
  'services.translationServiceEnabled': [true, false],
  'websites.firstPartyIsolate': [false, true],
  'websites.thirdPartyCookiesAllowed': [true, false],
  'websites.hyperlinkAuditingEnabled': [true, false],
  'websites.referrersEnabled': [true, false],
  'websites.protectedContentEnabled': [true, true]
};
