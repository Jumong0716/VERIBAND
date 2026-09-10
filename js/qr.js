/**
 * VeriBand — QR Code Render Wrapper (js/qr.js)
 *
 * Wraps vendored offline QRCode library into a clean modern ES module function:
 * renderQR(token, targetElement, options)
 */

/**
 * Render a QR Code for a given patient token into target DOM element.
 * @param {string} token - The unique patient token, e.g. "VB-8291"
 * @param {HTMLElement|string} targetElement - DOM element or ID to render into
 * @param {object} [options]
 * @returns {object} QRCode instance
 */
export function renderQR(token, targetElement, options = {}) {
  const el = typeof targetElement === 'string' ? document.getElementById(targetElement) : targetElement;
  if (!el) {
    console.error('VeriBand renderQR: target element not found', targetElement);
    return null;
  }

  const computedStyle = typeof window !== 'undefined' ? getComputedStyle(document.documentElement) : null;
  const tokenDark = computedStyle ? computedStyle.getPropertyValue('--text').trim() : '';
  const tokenLight = computedStyle ? computedStyle.getPropertyValue('--surface').trim() : '';

  const defaultOptions = {
    text: token,
    width: options.width || 140,
    height: options.height || 140,
    colorDark: options.colorDark || tokenDark,
    colorLight: options.colorLight || tokenLight
  };

  const QRCodeLib = window.QRCode;
  if (!QRCodeLib) {
    console.error('VeriBand renderQR: QRCode library not loaded from /vendor/qrcode.min.js');
    return null;
  }

  el.innerHTML = '';
  return new QRCodeLib(el, defaultOptions);
}