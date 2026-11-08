import { renderIcon } from "../icons";

/**
 * Standalone Client-Side Recent History Shelf.
 * Mounted in .main-wrap directly below the hero card on initial page load.
 * Reads entirely from localStorage without consuming Cloudflare D1 write quota.
 */
export function renderHistoryShelf(): string {
  return `
    <div class="history-card" id="history-card" style="display: none;">
      <div class="history-header">
        <button type="button" class="history-toggle" id="history-toggle" aria-expanded="false" aria-controls="history-accordion">
          ${renderIcon("clock", { size: 15, strokeWidth: 2 })}
          <span class="history-title">Recent</span>
          <span class="history-badge" id="history-count">0</span>
          ${renderIcon("chevronRight", { size: 13, strokeWidth: 2.5, className: "history-chevron" })}
        </button>
        <button type="button" class="btn-clear-history" id="btn-clear-history" title="Clear history" aria-label="Clear all recent link history">
          ${renderIcon("trash", { size: 14, strokeWidth: 2 })}
        </button>
      </div>

      <div class="smooth-accordion" id="history-accordion">
        <div class="smooth-accordion-inner">
          <div class="history-list" id="history-items">
            <!-- Dynamically populated from localStorage via scripts.ts -->
          </div>
        </div>
      </div>
    </div>
  `;
}

