/*!
 * RTOShield first-party JS SDK (privacy-safe).
 *
 * What it does:
 *   - Stores a first-party device token in localStorage (no third-party cookies).
 *   - Sends checkout signals to the merchant's own /api/track endpoint.
 *
 * What it deliberately does NOT do:
 *   - No canvas / audio fingerprinting.
 *   - No GPS / geolocation.
 *   - No exact screen dimensions (category only).
 *
 * Merchants MUST disclose this collection in their privacy policy. See docs.
 */
(function (global) {
  "use strict";

  var STORAGE_KEY = "rtoshield_device_token";
  var state = { publicKey: null, endpoint: "/api/track", checkoutId: null, orderId: null };

  function uuid() {
    if (global.crypto && global.crypto.randomUUID) return global.crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function getDeviceToken() {
    try {
      var t = global.localStorage.getItem(STORAGE_KEY);
      if (!t) {
        t = uuid();
        global.localStorage.setItem(STORAGE_KEY, t);
      }
      return t;
    } catch (e) {
      return uuid(); // private mode fallback (non-persistent)
    }
  }

  function screenCategory() {
    try {
      var w = global.screen ? global.screen.width : 0;
      if (w && w < 768) return "mobile";
      if (w && w < 1024) return "tablet";
      if (w) return "desktop";
    } catch (e) {}
    return "unknown";
  }

  function utmParams() {
    try {
      var p = new URLSearchParams(global.location.search);
      return { source: p.get("utm_source") || undefined, medium: p.get("utm_medium") || undefined, campaign: p.get("utm_campaign") || undefined };
    } catch (e) {
      return {};
    }
  }

  function send(extra) {
    if (!state.publicKey) {
      console.warn("[RTOShield] init() must be called with a publicKey before tracking");
      return;
    }
    var payload = Object.assign(
      {
        public_key: state.publicKey,
        session_id: getSessionId(),
        device_token: getDeviceToken(),
        checkout_id: state.checkoutId || undefined,
        order_id: state.orderId || undefined,
        user_agent: global.navigator ? global.navigator.userAgent : undefined,
        timezone: Intl && Intl.DateTimeFormat ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined,
        language: global.navigator ? global.navigator.language : undefined,
        screen_category: screenCategory(),
        referrer: global.document ? global.document.referrer : undefined,
        utm: utmParams()
      },
      extra || {}
    );
    try {
      var body = JSON.stringify(payload);
      if (global.navigator && global.navigator.sendBeacon) {
        global.navigator.sendBeacon(state.endpoint, new Blob([body], { type: "application/json" }));
      } else {
        fetch(state.endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: body, keepalive: true });
      }
    } catch (e) {
      /* swallow — never break checkout */
    }
  }

  var _sid;
  function getSessionId() {
    if (!_sid) _sid = uuid();
    return _sid;
  }

  global.RTOShield = {
    init: function (opts) {
      opts = opts || {};
      state.publicKey = opts.publicKey || null;
      state.checkoutId = opts.checkoutId || null;
      if (opts.endpoint) state.endpoint = opts.endpoint;
      return this;
    },
    identifyOrder: function (opts) {
      state.orderId = (opts && opts.orderId) || null;
      send({ order_id: state.orderId });
      return this;
    },
    trackCheckout: function () {
      send();
      return this;
    }
  };
})(typeof window !== "undefined" ? window : this);
