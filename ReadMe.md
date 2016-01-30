# Firefox plugin "Privacy Settings"

This extension provides a toolbar panel for easily altering Firefox's built-in privacy settings.

It is recommended to use Privacy Settings along with Policy Control to have more control over data flow.

Currently the following preferences are supported:

    network.websocket.enabled
    network.http.sendSecureXSiteReferrer
    network.dns.disablePrefetch
    network.prefetch-next
    dom.event.clipboardevents.enabled
    dom.battery.enabled
    browser.safebrowsing.enabled
    browser.safebrowsing.downloads.enabled
    browser.safebrowsing.malware.enabled
    browser.send_pings
    beacon.enabled
    privacy.trackingprotection.enabled
    datareporting.healthreport.service.enabled
    datareporting.healthreport.uploadEnabled
    toolkit.telemetry.enabled
    loop.enabled
    browser.pocket.enabled
    media.peerconnection.enabled
    media.eme.enabled
    media.gmp-eme-adobe.enabled
    webgl.disabled
    geo.enabled
    camera.control.face_detection.enabled
    camera.control.autofocus_moving_callback.enabled
    device.sensors.enabled
    security.tls.unrestricted_rc4_fallback
    security.tls.insecure_fallback_hosts.use_static_list
    security.ssl.require_safe_negotiation
    security.ssl.treat_unsafe_negotiation_as_broken


To get more info please visit the FAQ page at: http://firefox.add0n.com/privacy-settings.html

#### Temporary Locking a Preference

    var prefs = Cc['@mozilla.org/preferences-service;1']
      .getService(Ci.nsIPrefService);
    var branch = prefs.getBranch("geo.enabled");
    branch.lockPref('', true);
    console.error(branch.prefIsLocked(''))
