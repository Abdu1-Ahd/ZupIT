import { oldMoneyTheme, themeToCssVariables, DesignTheme } from "./theme";

/**
 * Centralized design system styles & buttery-smooth micro-animations.
 * Incorporates WCAG 2.2 AA accessibility, iOS 16px viewport zoom prevention,
 * 44px touch targets, QR flyout, platform preview emulators, and client history shelf.
 */
export function renderStyles(theme: DesignTheme = oldMoneyTheme): string {
  return `
    :root {
      ${themeToCssVariables(theme)}
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    /* Standard WCAG Accessible Screen Reader Utility */
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2.5rem 1.25rem;
      overflow-x: hidden;
    }

    .main-wrap {
      width: 100%;
      max-width: 620px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.5rem;
    }

    /* Choreographed Page Load Sequence */
    header {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.65rem;
      animation: staggerFadeUp 0.65s cubic-bezier(0.16, 1, 0.3, 1) both;
      animation-delay: 0.05s;
    }

    .brand-mark {
      width: 54px;
      height: 54px;
      border-radius: 16px;
      background: linear-gradient(145deg, rgba(95, 14, 13, 0.45) 0%, rgba(50, 49, 47, 0.6) 100%);
      border: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 25px -5px var(--primary-glow);
      margin-bottom: 0.25rem;
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease;
    }

    .brand-mark:hover {
      transform: scale(1.05) translateY(-1px);
      box-shadow: 0 14px 30px -4px var(--primary-glow);
    }

    .brand-mark svg {
      color: var(--text);
    }

    h1 {
      font-family: 'Playfair Display', 'Plus Jakarta Sans', Georgia, serif;
      font-size: 2rem;
      font-weight: 700;
      letter-spacing: -0.015em;
      color: var(--text);
      background: linear-gradient(180deg, #ffffff 0%, var(--text) 70%, var(--text-muted) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      background: rgba(95, 14, 13, 0.2);
      color: var(--text-muted);
      border: 1px solid var(--border);
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.72rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .pulse-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 8px var(--accent);
      animation: pulse 2.5s infinite;
    }

    /* Hero Card & Central Input Bar */
    .hero-card {
      width: 100%;
      background: transparent;
      border: none;
      box-shadow: none;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      animation: staggerFadeUp 0.65s cubic-bezier(0.16, 1, 0.3, 1) both;
      animation-delay: 0.15s;
    }

    .input-bar {
      display: flex;
      align-items: center;
      background: var(--card-inner);
      border: 1px solid var(--border);
      border-radius: 0.85rem;
      padding: 0.35rem 0.45rem 0.35rem 0.85rem;
      gap: 0.5rem;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.35);
      transition: border-color 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .input-bar:focus-within {
      border-color: var(--border-focus);
      box-shadow: 0 0 0 3px var(--primary-glow), inset 0 2px 4px rgba(0, 0, 0, 0.35);
    }

    .input-bar.shake {
      animation: subtleShake 0.32s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
      border-color: var(--danger) !important;
      box-shadow: 0 0 0 3px var(--danger-bg) !important;
    }

    .input-icon {
      color: var(--text-muted);
      display: flex;
      align-items: center;
      flex-shrink: 0;
      transition: color 0.2s ease;
    }

    .input-bar:focus-within .input-icon {
      color: var(--accent);
    }

    /* iOS Safari 16px font-size rule to prevent auto-zoom */
    .input-bar input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: var(--text);
      font-size: 1rem;
      font-family: inherit;
      min-width: 0;
    }

    .input-bar input::placeholder {
      color: var(--text-subtle);
    }

    .btn-input-action {
      background: transparent;
      border: none;
      color: var(--text-muted);
      padding: 0.45rem;
      border-radius: 0.4rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: color 0.15s ease, background-color 0.15s ease;
      flex-shrink: 0;
      min-width: 32px;
      min-height: 32px;
    }

    .btn-input-action:hover {
      color: var(--text);
      background: rgba(255, 255, 255, 0.08);
    }

    .kbd-badge {
      display: inline-flex;
      align-items: center;
      font-family: inherit;
      font-size: 0.68rem;
      font-weight: 600;
      color: var(--text-subtle);
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border);
      border-radius: 0.35rem;
      padding: 0.15rem 0.35rem;
      letter-spacing: 0.02em;
      user-select: none;
    }

    /* Morphing Button with 44px min touch target */
    button.btn-shorten {
      position: relative;
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
      color: var(--text);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 0.65rem;
      padding: 0.7rem 1.15rem;
      font-size: 0.88rem;
      font-weight: 600;
      letter-spacing: 0.02em;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      white-space: nowrap;
      min-height: 44px;
      min-width: 44px;
      box-shadow: 0 4px 16px -2px var(--primary-glow);
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      flex-shrink: 0;
    }

    button.btn-shorten:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 22px 0 var(--primary-glow);
      filter: brightness(1.1);
    }

    button.btn-shorten:active {
      transform: translateY(0);
      filter: brightness(0.95);
    }

    button.btn-shorten:disabled {
      opacity: 0.75;
      cursor: not-allowed;
      transform: none;
    }

    .btn-spinner {
      display: none;
      width: 15px;
      height: 15px;
      border: 2px solid rgba(243, 239, 230, 0.25);
      border-top-color: var(--text);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    button.btn-shorten.loading .btn-icon {
      display: none;
    }

    button.btn-shorten.loading .btn-spinner {
      display: inline-block;
    }

    /* Zero-Jank CSS Grid Accordion Interpolation */
    .smooth-accordion {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows 350ms cubic-bezier(0.16, 1, 0.3, 1), opacity 280ms ease, margin 300ms cubic-bezier(0.16, 1, 0.3, 1);
      opacity: 0;
      margin-top: 0;
    }

    .smooth-accordion.open {
      grid-template-rows: 1fr;
      opacity: 1;
      margin-top: 0.85rem;
    }

    .smooth-accordion-inner {
      overflow: hidden;
    }

    @media (max-width: 520px) {
      .input-bar { flex-direction: column; align-items: stretch; padding: 0.65rem; }
      button.btn-shorten { width: 100%; margin-top: 0.35rem; }
      .kbd-badge { display: none; }
    }

    /* Custom Floating Toast Error Notification */
    .toast-banner {
      display: none;
      align-items: center;
      gap: 0.65rem;
      background: rgba(45, 18, 18, 0.92);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border: 1px solid rgba(153, 27, 27, 0.5);
      color: #fecaca;
      padding: 0.75rem 1rem;
      border-radius: 0.75rem;
      font-size: 0.84rem;
      font-weight: 500;
      box-shadow: 0 10px 28px -4px rgba(0, 0, 0, 0.5);
      animation: toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    .toast-banner.show {
      display: flex;
    }

    .toast-banner.closing {
      animation: toastSlideOut 0.24s cubic-bezier(0.4, 0, 1, 1) both;
    }

    .toast-banner svg {
      flex-shrink: 0;
      color: #ef4444;
    }

    /* Result Card with Smooth Grid Accordion */
    .result-accordion {
      width: 100%;
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows 400ms cubic-bezier(0.16, 1, 0.3, 1), opacity 320ms ease;
      opacity: 0;
    }

    .result-accordion.open {
      grid-template-rows: 1fr;
      opacity: 1;
    }

    .result-box {
      overflow: hidden;
      display: flex;
      flex-direction: column;
      gap: 1.15rem;
      width: 100%;
      background: var(--card-bg);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(196, 163, 90, 0.35);
      border-radius: 1.25rem;
      padding: 1.35rem;
      box-shadow: 0 20px 40px -10px var(--accent-glow);
    }

    .output-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--card-inner);
      border: 1px solid var(--border);
      border-radius: 0.85rem;
      padding: 0.35rem 0.45rem 0.35rem 0.95rem;
    }

    .output-row input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: var(--accent);
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.95rem;
      font-weight: 500;
      min-width: 0;
    }

    .action-group {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      flex-shrink: 0;
    }

    .copy-wrap {
      position: relative;
      display: inline-flex;
    }

    .copy-toast {
      position: absolute;
      bottom: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%) translateY(4px);
      background: var(--palette-obsidian);
      color: var(--accent);
      border: 1px solid var(--border);
      font-size: 0.72rem;
      font-weight: 600;
      padding: 0.2rem 0.55rem;
      border-radius: 0.4rem;
      pointer-events: none;
      opacity: 0;
      white-space: nowrap;
      transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
      z-index: 10;
    }

    .copy-toast.visible {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }

    .btn-action {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border);
      color: var(--text);
      border-radius: 0.55rem;
      padding: 0.45rem 0.65rem;
      font-size: 0.8rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 44px;
      min-width: 44px;
      text-decoration: none;
      transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .btn-action:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: var(--border-focus);
      transform: translateY(-1px);
    }

    .btn-copy.copied {
      background: var(--accent);
      border-color: var(--accent);
      color: var(--palette-obsidian);
    }

    /* QR Flyout Drawer */
    .qr-flyout {
      background: rgba(23, 22, 21, 0.95);
      border: 1px solid var(--border);
      border-radius: 0.85rem;
      padding: 1rem;
      animation: fadeInSlide 0.25s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    .qr-flyout-inner {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.85rem;
    }

    .qr-svg-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      background: #ffffff;
      padding: 0.5rem;
      border-radius: 0.65rem;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    }

    .qr-controls {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-qr-action {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid var(--border);
      color: var(--text);
      font-size: 0.78rem;
      font-weight: 600;
      padding: 0.35rem 0.75rem;
      border-radius: 0.45rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      min-height: 36px;
      transition: all 0.15s ease;
    }

    .btn-qr-action:hover {
      background: rgba(255, 255, 255, 0.14);
      border-color: var(--border-focus);
    }

    /* Multi-Platform Social Simulator Tabs */
    .preview-wrap {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }

    .platform-tabs {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      background: rgba(23, 22, 21, 0.7);
      border: 1px solid var(--border);
      padding: 0.25rem;
      border-radius: 0.65rem;
      width: fit-content;
    }

    .tab-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      border-radius: 0.45rem;
      padding: 0.4rem 0.65rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 36px;
      min-width: 36px;
      transition: all 0.18s ease;
    }

    .tab-btn:hover {
      color: var(--text);
    }

    .tab-btn.active {
      background: rgba(255, 255, 255, 0.1);
      color: var(--accent);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
    }

    /* Social Card Preview Base */
    .preview-card {
      display: none;
      background: var(--card-inner);
      border: 1px solid var(--border);
      border-radius: 0.75rem;
      overflow: hidden;
      animation: fadeInSlide 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
      transition: all 0.25s ease;
    }

    .preview-img {
      width: 100%;
      height: 140px;
      object-fit: cover;
      background: #232220;
      display: none;
    }

    .preview-body {
      padding: 0.85rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .preview-title {
      font-weight: 600;
      font-size: 0.88rem;
      color: var(--text);
    }

    .preview-desc {
      font-size: 0.78rem;
      color: var(--text-muted);
      line-height: 1.35;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .preview-target {
      font-size: 0.72rem;
      font-family: 'JetBrains Mono', monospace;
      color: var(--text-muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Platform-Specific Theming */
    .preview-card[data-platform="x"] {
      border-radius: 0.85rem;
    }

    .preview-card[data-platform="whatsapp"] {
      border-left: 3px solid #25d366;
      border-radius: 0.65rem;
      background: rgba(30, 40, 35, 0.75);
    }

    .preview-card[data-platform="discord"] {
      background: #2b2d31;
      border-left: 4px solid var(--primary);
      border-radius: 0.5rem;
    }

    .preview-card[data-platform="linkedin"] {
      border: 1px solid rgba(10, 102, 194, 0.4);
      background: rgba(25, 30, 36, 0.8);
      border-radius: 0.65rem;
    }

    /* Standalone Client-Side Recent History Shelf */
    .history-card {
      width: 100%;
      background: var(--card-bg);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid var(--border);
      border-radius: 1rem;
      padding: 0.85rem 1.15rem;
      animation: staggerFadeUp 0.65s cubic-bezier(0.16, 1, 0.3, 1) both;
      animation-delay: 0.25s;
    }

    .history-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .history-toggle {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0.4rem;
      border-radius: 0.45rem;
      min-height: 40px;
      transition: color 0.15s ease;
    }

    .history-toggle:hover {
      color: var(--text);
    }

    .history-badge {
      background: rgba(196, 163, 90, 0.18);
      color: var(--accent);
      border: 1px solid rgba(196, 163, 90, 0.35);
      border-radius: 9999px;
      padding: 0.1rem 0.45rem;
      font-size: 0.68rem;
      font-weight: 700;
    }

    .history-chevron {
      transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .history-toggle.open .history-chevron {
      transform: rotate(90deg);
    }

    .btn-clear-history {
      background: transparent;
      border: none;
      color: var(--text-subtle);
      cursor: pointer;
      padding: 0.4rem;
      border-radius: 0.4rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 36px;
      min-width: 36px;
      transition: color 0.15s ease, background 0.15s ease;
    }

    .btn-clear-history:hover {
      color: var(--danger);
      background: rgba(153, 27, 27, 0.15);
    }

    .history-list {
      display: flex;
      flex-direction: column;
      gap: 0.55rem;
      margin-top: 0.65rem;
    }

    .history-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      background: var(--card-inner);
      border: 1px solid var(--border);
      border-radius: 0.65rem;
      padding: 0.55rem 0.75rem;
      transition: border-color 0.15s ease;
    }

    .history-item:hover {
      border-color: var(--border-focus);
    }

    .history-item-left {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      min-width: 0;
      flex: 1;
    }

    .history-item-slug {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--accent);
      text-decoration: none;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .history-item-target {
      font-size: 0.72rem;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .history-item-actions {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      flex-shrink: 0;
    }

    .btn-history-action {
      background: transparent;
      border: 1px solid var(--border);
      color: var(--text-muted);
      border-radius: 0.45rem;
      padding: 0.35rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 36px;
      min-width: 36px;
      text-decoration: none;
      transition: all 0.15s ease;
    }

    .btn-history-action:hover {
      color: var(--text);
      background: rgba(255, 255, 255, 0.08);
      border-color: var(--border-focus);
    }

    /* Keyframes */
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.45; transform: scale(0.92); }
    }

    @keyframes staggerFadeUp {
      from { opacity: 0; transform: translateY(14px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes fadeInSlide {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes toastSlideIn {
      from { opacity: 0; transform: translateY(-10px) scale(0.97); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    @keyframes toastSlideOut {
      from { opacity: 1; transform: translateY(0) scale(1); }
      to { opacity: 0; transform: translateY(-8px) scale(0.97); }
    }

    @keyframes subtleShake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-4px); }
      40%, 80% { transform: translateX(4px); }
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
}
