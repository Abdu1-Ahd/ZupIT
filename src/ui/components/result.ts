import { renderIcon } from "../icons";

/**
 * Result display component with iconic action group (Copy, QR, Visit, Reset),
 * interactive QR flyout modal, and multi-platform social preview emulator tabs.
 */
export function renderResultBox(): string {
  return `
    <div class="result-accordion" id="result-accordion" aria-live="polite">
      <div class="result-box" id="result-box">
        <div class="output-row">
          <label for="short-url-output" class="sr-only">Shortened URL result</label>
          <input type="text" id="short-url-output" readonly>
          <div class="action-group">
            <div class="copy-wrap">
              <span class="copy-toast" id="copy-toast">Copied!</span>
              <button type="button" class="btn-action btn-copy" id="btn-copy" title="Copy to clipboard" aria-label="Copy short URL">
                ${renderIcon("copy", { size: 15, strokeWidth: 2, className: "copy-icon" })}
                <span class="copy-label sr-only">Copy</span>
              </button>
            </div>
            <button type="button" class="btn-action" id="btn-qr" title="Show QR Code" aria-label="Show QR Code">
              ${renderIcon("qrCode", { size: 15, strokeWidth: 2 })}
            </button>
            <a class="btn-action" id="btn-visit" target="_blank" rel="noopener noreferrer" title="Open shortened link" aria-label="Open shortened link in new tab">
              ${renderIcon("externalLink", { size: 15, strokeWidth: 2 })}
            </a>
            <button type="button" class="btn-action" id="btn-reset" title="Shorten another" aria-label="Shorten another link">
              ${renderIcon("refresh", { size: 14, strokeWidth: 2 })}
            </button>
          </div>
        </div>

        <!-- Zero-Latency Client QR Flyout Drawer -->
        <div class="qr-flyout" id="qr-flyout" style="display: none;">
          <div class="qr-flyout-inner">
            <div class="qr-svg-wrap" id="qr-svg-wrap"></div>
            <div class="qr-controls">
              <button type="button" class="btn-qr-action" id="btn-qr-download" title="Download SVG QR Code" aria-label="Download QR code as SVG">
                ${renderIcon("download", { size: 14, strokeWidth: 2 })}
                <span>SVG</span>
              </button>
              <button type="button" class="btn-qr-action" id="btn-qr-close" title="Close QR Code" aria-label="Close QR Code view">
                ${renderIcon("xClose", { size: 14, strokeWidth: 2 })}
              </button>
            </div>
          </div>
        </div>

        <!-- Multi-Platform Social Simulator Tabs -->
        <div class="preview-wrap">
          <div class="platform-tabs" role="tablist" aria-label="Social media preview platforms">
            <button type="button" class="tab-btn active" data-platform="x" role="tab" aria-selected="true" title="X (Twitter) Preview" aria-label="X (Twitter) Preview">
              ${renderIcon("brandTwitter", { size: 14 })}
            </button>
            <button type="button" class="tab-btn" data-platform="whatsapp" role="tab" aria-selected="false" title="WhatsApp Preview" aria-label="WhatsApp Preview">
              ${renderIcon("brandWhatsApp", { size: 14 })}
            </button>
            <button type="button" class="tab-btn" data-platform="discord" role="tab" aria-selected="false" title="Discord Preview" aria-label="Discord Preview">
              ${renderIcon("brandDiscord", { size: 14 })}
            </button>
            <button type="button" class="tab-btn" data-platform="linkedin" role="tab" aria-selected="false" title="LinkedIn Preview" aria-label="LinkedIn Preview">
              ${renderIcon("brandLinkedIn", { size: 14 })}
            </button>
          </div>

          <div class="preview-card" id="preview-card" data-platform="x">
            <img class="preview-img" id="card-img" alt="Link preview">
            <div class="preview-body">
              <div class="preview-title" id="card-title"></div>
              <div class="preview-desc" id="card-desc"></div>
              <div class="preview-target" id="card-target"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
