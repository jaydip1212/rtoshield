/*!
 * RTOShield first-party JS SDK (privacy-safe).
 *
 * What it does:
 *   - Stores a first-party device token in localStorage (no third-party cookies).
 *   - Sends coarse, non-identifying checkout signals to the merchant's RTOShield
 *     /api/track endpoint.
 *
 * What it deliberately does NOT do:
 *   - No canvas / audio / WebGL fingerprinting.
 *   - No GPS / precise geolocation.
 *   - No exact screen dimensions (coarse category only).
 *   - No raw IP collection (the server derives a hashed IP).
 *
 * Security model:
 *   - The public key is NOT a secret; it only identifies the merchant org and
 *     grants write-only access to /api/track. The server enforces rate limits,
 *     origin allow-listing, strict validation, and hashing.
 *   - This script never reads cookies, never evaluates remote code, never throws
 *     into the host page, and exposes a single frozen global (window.RTOShield).
 *   - Serve it over HTTPS and pin it with Subresource Integrity (see docs).
 *
 * Merchants MUST disclose this collection in their privacy policy. See docs.
 */
(function (global) {
  "use strict";

  // Refuse to run twice (e.g. script included on the page more than once).
  if (global.RTOShield && global.RTOShield.__rtos) return;

  var STORAGE_KEY = "rtoshield_device_token";
  var PUBLIC_KEY_RE = /^rtos_pk_[A-Za-z0-9]+$/;
  var LIMITS = { user_agent: 512, referrer: 256, language: 32, timezone: 64, id: 128 };

  var state = { publicKey: null, endpoint: "/api/track", checkoutId: null, orderId: null, ready: false };

  function uuid() {
    try {
      if (global.crypto && global.crypto.randomUUID) return global.crypto.randomUUID();
      if (global.crypto && global.crypto.getRandomValues) {
        var b = new Uint8Array(16);
        global.crypto.getRandomValues(b);
        b[6] = (b[6] & 0x0f) | 0x40;
        b[8] = (b[8] & 0x3f) | 0x80;
        var h = [];
        for (var i = 0; i < 16; i++) h.push((b[i] + 0x100).toString(16).slice(1));
        return (
          h[0] + h[1] + h[2] + h[3] + "-" + h[4] + h[5] + "-" + h[6] + h[7] +
          "-" + h[8] + h[9] + "-" + h[10] + h[11] + h[12] + h[13] + h[14] + h[15]
        );
      }
    } catch (e) {}
    // Last-resort fallback (non-crypto). Device token is an identifier, not a secret.
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function clamp(value, max) {
    if (typeof value !== "string") return undefined;
    var s = value.trim();
    if (!s) return undefined;
    return s.length > max ? s.slice(0, max) : s;
  }

  function getDeviceToken() {
    try {
      var t = global.localStorage.getItem(STORAGE_KEY);
      if (!t || !/^[A-Za-z0-9-]{8,128}$/.test(t)) {
        t = uuid();
        global.localStorage.setItem(STORAGE_KEY, t);
      }
      return t;
    } catch (e) {
      return uuid(); // private mode / blocked storage fallback (non-persistent)
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

  // Reduce referrer to its origin only — never leak full URLs / query strings.
  function referrerOrigin() {
    try {
      var r = global.document ? global.document.referrer : "";
      if (!r) return undefined;
      return new URL(r).origin;
    } catch (e) {
      return undefined;
    }
  }

  function utmParams() {
    try {
      var p = new URLSearchParams(global.location.search);
      return {
        source: clamp(p.get("utm_source") || "", LIMITS.id),
        medium: clamp(p.get("utm_medium") || "", LIMITS.id),
        campaign: clamp(p.get("utm_campaign") || "", LIMITS.id)
      };
    } catch (e) {
      return {};
    }
  }

  // Block sending secrets over insecure transport when the page itself is secure.
  function endpointAllowed(endpoint) {
    try {
      var u = new URL(endpoint, global.location.href);
      if (u.protocol !== "http:" && u.protocol !== "https:") return false;
      if (global.location.protocol === "https:" && u.protocol === "http:") {
        console.warn("[RTOShield] refusing to send over insecure http from an https page");
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  var _sid;
  function getSessionId() {
    if (!_sid) _sid = uuid();
    return _sid;
  }

  function send(extra) {
    if (!state.ready || !state.publicKey) {
      console.warn("[RTOShield] init() with a valid publicKey is required before tracking");
      return;
    }
    if (!endpointAllowed(state.endpoint)) return;

    var payload = {
      public_key: state.publicKey,
      session_id: getSessionId(),
      device_token: getDeviceToken(),
      checkout_id: clamp(state.checkoutId || "", LIMITS.id),
      order_id: clamp(state.orderId || "", LIMITS.id),
      user_agent: clamp(global.navigator ? global.navigator.userAgent : "", LIMITS.user_agent),
      timezone: clamp(safeTimezone(), LIMITS.timezone),
      language: clamp(global.navigator ? global.navigator.language : "", LIMITS.language),
      screen_category: screenCategory(),
      referrer: referrerOrigin(),
      utm: utmParams()
    };
    if (extra && extra.order_id) payload.order_id = clamp(extra.order_id, LIMITS.id);

    try {
      var body = JSON.stringify(payload);
      if (global.navigator && global.navigator.sendBeacon) {
        global.navigator.sendBeacon(state.endpoint, new Blob([body], { type: "application/json" }));
      } else if (global.fetch) {
        global.fetch(state.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: body,
          keepalive: true,
          mode: "cors",
          credentials: "omit"
        }).catch(function () {});
      }
    } catch (e) {
      /* swallow — never break checkout */
    }
  }

  function safeTimezone() {
    try {
      return Intl && Intl.DateTimeFormat ? Intl.DateTimeFormat().resolvedOptions().timeZone : "";
    } catch (e) {
      return "";
    }
  }

  var api = {
    __rtos: true,
    init: function (opts) {
      opts = opts || {};
      var key = typeof opts.publicKey === "string" ? opts.publicKey.trim() : "";
      if (!PUBLIC_KEY_RE.test(key)) {
        console.warn("[RTOShield] invalid publicKey; tracking disabled");
        state.ready = false;
        return this;
      }
      state.publicKey = key;
      state.checkoutId = clamp(opts.checkoutId || "", LIMITS.id) || null;
      if (typeof opts.endpoint === "string" && opts.endpoint) state.endpoint = opts.endpoint;
      state.ready = true;
      return this;
    },
    identifyOrder: function (opts) {
      state.orderId = clamp((opts && opts.orderId) || "", LIMITS.id) || null;
      send({ order_id: state.orderId });
      return this;
    },
    trackCheckout: function () {
      send();
      return this;
    }
  };

  global.RTOShield = Object.freeze(api);

  // Optional zero-JS auto-init via data attributes on the script tag:
  //   <script src=".../sdk/rtoshield.js"
  //           data-public-key="rtos_pk_..." data-endpoint="https://app/api/track"
  //           data-auto="checkout"></script>
  try {
    var self = global.document && (global.document.currentScript ||
      (function () {
        var s = global.document.getElementsByTagName("script");
        return s[s.length - 1];
      })());
    if (self && self.getAttribute) {
      var pk = self.getAttribute("data-public-key");
      if (pk) {
        api.init({
          publicKey: pk,
          endpoint: self.getAttribute("data-endpoint") || undefined,
          checkoutId: self.getAttribute("data-checkout-id") || undefined
        });
        if (self.getAttribute("data-auto") === "checkout") api.trackCheckout();
      }
    }
  } catch (e) {}
})(typeof window !== "undefined" ? window : this);
