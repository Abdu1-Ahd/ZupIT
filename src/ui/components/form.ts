import { renderIcon } from "../icons";

/**
 * Centered hero input form component with symbol-dominant input bar,
 * one-tap clipboard paste button, quick-clear action, shortcut cue,
 * smooth CSS grid accordion drawer for advanced options, and custom
 * floating toast error banner.
 */
export function renderShortenForm(): string {
  return `
    <div class="hero-card">
      <form id="shorten-form" novalidate>
        <div class="input-bar" id="input-bar-wrap">
          <label for="url-input" class="sr-only">Destination URL to shorten</label>
          <span class="input-icon">
            ${renderIcon("link", { size: 18, strokeWidth: 2 })}
          </span>
          <input 
            type="url" 
            id="url-input" 
            placeholder="Paste link..." 
            autocomplete="off" 
            spellcheck="false" 
            required
          >
          <button type="button" class="btn-input-action" id="btn-paste" title="Paste from clipboard" aria-label="Paste URL from clipboard">
            ${renderIcon("clipboard", { size: 15, strokeWidth: 2 })}
          </button>
          <button type="button" class="btn-input-action" id="btn-clear" title="Clear input" aria-label="Clear input text" style="display: none;">
            ${renderIcon("xClose", { size: 14, strokeWidth: 2.2 })}
          </button>
          <kbd class="kbd-badge" title="Press ⌘K or Ctrl+K to focus">⌘K</kbd>
          <button type="submit" class="btn-shorten" id="btn-submit" title="Shorten URL" aria-label="Shorten URL">
            <span class="btn-spinner"></span>
            ${renderIcon("scissors", { size: 16, strokeWidth: 2, className: "btn-icon" })}
            <span id="btn-label" class="sr-only">Shorten it</span>
          </button>
        </div>
      </form>

      <div class="toast-banner" id="error-box" role="alert" aria-live="assertive">
        ${renderIcon("alert", { size: 16, strokeWidth: 2 })}
        <span id="error-msg"></span>
      </div>
    </div>
  `;
}
