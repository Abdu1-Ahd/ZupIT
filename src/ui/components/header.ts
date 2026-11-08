import { renderIcon } from "../icons";

/**
 * Header component rendering the brand symbol, edge runtime badge, and title.
 */
export function renderHeader(): string {
  return `
    <header>
      <div class="brand-mark">
        ${renderIcon("brand", { size: 26, strokeWidth: 2 })}
      </div>
      <div class="badge">
        <span class="pulse-dot"></span>
        <span>⚡ 0ms Cold Start</span>
      </div>
      <h1>Fast, Zero-Cost URL Shortener</h1>
    </header>
  `;
}

