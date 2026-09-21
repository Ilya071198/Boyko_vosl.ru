/* Public configuration only. Never put CRM tokens or server secrets in this file. */
window.VOSL_CONFIG = Object.freeze({
  mode: 'demo',                         // 'live' requires the configured PHP receiver below.
  leadEndpoint: 'api/lead.php',
  tokenEndpoint: 'api/token.php',
  privacyUrl: '',                       // Approved privacy policy on the same production website.
  consentUrl: '',                       // Approved separate consent document.
  consentVersion: '',                   // Must match VOSL_CONSENT_VERSION on the server.
  maxFileBytes: 10 * 1024 * 1024,
  requestTimeoutMs: 25000,
  analytics: { metrikaId: 0, enabled: false }, // Disabled until consent and an actual counter are configured.
  mapTiles: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  remotePhotos: true,
  version: '17.0'
});
