import { renderQrScript } from "./qr";
import { renderIcon } from "./icons";

/**
 * Client-side interactive runtime script.
 * Enforces XSS-safe DOM bindings (zero innerHTML for user data),
 * protocol auto-sanitization, one-tap clipboard paste, zero-dependency QR generation,
 * multi-platform preview emulator tabs, client-side localStorage history shelf,
 * global keyboard shortcuts, and tactile micro-interactions.
 */
export function renderScripts(): string {
  return `
    ${renderQrScript()}

    const form = document.getElementById('shorten-form');
    const inputBarWrap = document.getElementById('input-bar-wrap');
    const urlInput = document.getElementById('url-input');
    const pasteBtn = document.getElementById('btn-paste');
    const clearBtn = document.getElementById('btn-clear');
    const errorBox = document.getElementById('error-box');
    const errorMsg = document.getElementById('error-msg');
    const resultAccordion = document.getElementById('result-accordion');
    const submitBtn = document.getElementById('btn-submit');
    const btnLabel = document.getElementById('btn-label');
    const copyBtn = document.getElementById('btn-copy');
    const copyToast = document.getElementById('copy-toast');
    const visitBtn = document.getElementById('btn-visit');
    const resetBtn = document.getElementById('btn-reset');
    const shortUrlOutput = document.getElementById('short-url-output');

    // QR Code elements
    const qrBtn = document.getElementById('btn-qr');
    const qrFlyout = document.getElementById('qr-flyout');
    const qrSvgWrap = document.getElementById('qr-svg-wrap');
    const qrCloseBtn = document.getElementById('btn-qr-close');
    const qrDownloadBtn = document.getElementById('btn-qr-download');

    // History elements
    const historyCard = document.getElementById('history-card');
    const historyToggle = document.getElementById('history-toggle');
    const historyAccordion = document.getElementById('history-accordion');
    const historyCount = document.getElementById('history-count');
    const historyItems = document.getElementById('history-items');
    const clearHistoryBtn = document.getElementById('btn-clear-history');

    // Platform preview elements
    const previewCard = document.getElementById('preview-card');
    const platformTabs = document.querySelectorAll('.platform-tabs .tab-btn');

    let toastTimer = null;

    function showError(msg) {
      if (toastTimer) clearTimeout(toastTimer);
      errorMsg.textContent = msg;
      errorBox.classList.remove('closing');
      errorBox.classList.add('show');

      // Trigger tactile shake animation
      inputBarWrap.classList.remove('shake');
      void inputBarWrap.offsetWidth; // Force CSS reflow
      inputBarWrap.classList.add('shake');
    }

    function hideError() {
      if (!errorBox.classList.contains('show') || errorBox.classList.contains('closing')) return;
      errorBox.classList.add('closing');
      toastTimer = setTimeout(() => {
        errorBox.classList.remove('show', 'closing');
      }, 240);
    }

    function toggleClearBtn() {
      if (!clearBtn) return;
      clearBtn.style.display = urlInput.value.length > 0 ? 'inline-flex' : 'none';
    }

    // Input events
    urlInput.addEventListener('input', () => {
      hideError();
      inputBarWrap.classList.remove('shake');
      toggleClearBtn();
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        urlInput.value = '';
        toggleClearBtn();
        hideError();
        urlInput.focus();
      });
    }

    // One-Tap Clipboard Paste
    if (pasteBtn && navigator.clipboard && navigator.clipboard.readText) {
      pasteBtn.addEventListener('click', async () => {
        try {
          const text = await navigator.clipboard.readText();
          if (text) {
            urlInput.value = text.trim();
            toggleClearBtn();
            hideError();
            urlInput.focus();
          }
        } catch (err) {
          // Clipboard read permission denied or unavailable
          showError('Clipboard access denied. Please paste manually.');
        }
      });
    } else if (pasteBtn) {
      pasteBtn.style.display = 'none';
    }

    // Multi-Platform Preview Switcher
    platformTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        platformTabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        const platform = tab.getAttribute('data-platform') || 'x';
        previewCard.setAttribute('data-platform', platform);
      });
    });

    // Client-Side History Manager (localStorage)
    const HISTORY_STORAGE_KEY = 'edge_shortener_history';

    function getHistory() {
      try {
        const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    }

    function saveHistoryItem(item) {
      try {
        let history = getHistory();
        history = history.filter(h => h.short_url !== item.short_url);
        history.unshift(item);
        if (history.length > 5) history = history.slice(0, 5);
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
        renderHistory();
      } catch (e) {}
    }

    function renderHistory() {
      if (!historyCard || !historyItems) return;
      const history = getHistory();
      if (!history || history.length === 0) {
        historyCard.style.display = 'none';
        return;
      }

      historyCard.style.display = 'block';
      if (historyCount) historyCount.textContent = String(history.length);

      // Render items safely via DOM construction (no unescaped innerHTML)
      historyItems.textContent = '';
      history.forEach((h) => {
        const row = document.createElement('div');
        row.className = 'history-item';

        const left = document.createElement('div');
        left.className = 'history-item-left';

        const slugLink = document.createElement('a');
        slugLink.className = 'history-item-slug';
        slugLink.href = h.short_url;
        slugLink.target = '_blank';
        slugLink.rel = 'noopener noreferrer';
        slugLink.textContent = h.short_url;

        const targetText = document.createElement('span');
        targetText.className = 'history-item-target';
        targetText.textContent = h.title || h.target_url;

        left.appendChild(slugLink);
        left.appendChild(targetText);

        const actions = document.createElement('div');
        actions.className = 'history-item-actions';

        const itemCopyBtn = document.createElement('button');
        itemCopyBtn.type = 'button';
        itemCopyBtn.className = 'btn-history-action';
        itemCopyBtn.title = 'Copy link';
        itemCopyBtn.setAttribute('aria-label', 'Copy ' + h.short_url);
        itemCopyBtn.innerHTML = '${renderIcon("copy", { size: 14, strokeWidth: 2 })}';
        itemCopyBtn.addEventListener('click', async () => {
          try {
            await navigator.clipboard.writeText(h.short_url);
          } catch (e) {}
          itemCopyBtn.innerHTML = '${renderIcon("check", { size: 14, strokeWidth: 2 })}';
          setTimeout(() => {
            itemCopyBtn.innerHTML = '${renderIcon("copy", { size: 14, strokeWidth: 2 })}';
          }, 1500);
        });

        const itemVisitLink = document.createElement('a');
        itemVisitLink.className = 'btn-history-action';
        itemVisitLink.href = h.short_url;
        itemVisitLink.target = '_blank';
        itemVisitLink.rel = 'noopener noreferrer';
        itemVisitLink.title = 'Open link';
        itemVisitLink.setAttribute('aria-label', 'Open ' + h.short_url);
        itemVisitLink.innerHTML = '${renderIcon("externalLink", { size: 14, strokeWidth: 2 })}';

        actions.appendChild(itemCopyBtn);
        actions.appendChild(itemVisitLink);

        row.appendChild(left);
        row.appendChild(actions);
        historyItems.appendChild(row);
      });
    }

    if (historyToggle && historyAccordion) {
      historyToggle.addEventListener('click', () => {
        const isOpen = historyAccordion.classList.toggle('open');
        historyToggle.classList.toggle('open', isOpen);
        historyToggle.setAttribute('aria-expanded', String(isOpen));
      });
    }

    if (clearHistoryBtn) {
      clearHistoryBtn.addEventListener('click', () => {
        try {
          localStorage.removeItem(HISTORY_STORAGE_KEY);
          renderHistory();
        } catch (e) {}
      });
    }

    // Initialize history on page load
    renderHistory();

    // Form Submission with Protocol Auto-Sanitizer
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideError();

      let rawUrl = urlInput.value.trim();
      if (!rawUrl) {
        showError('Please enter a destination link');
        urlInput.focus();
        return;
      }

      // Protocol Auto-Sanitizer: Prepend https:// if naked domain
      if (!/^https?:\/\//i.test(rawUrl)) {
        rawUrl = 'https://' + rawUrl;
      }

      try {
        const parsed = new URL(rawUrl);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          throw new Error('Only http:// and https:// destination links are supported');
        }
      } catch (err) {
        showError(err.message || 'Please enter a valid URL');
        urlInput.focus();
        return;
      }

      submitBtn.disabled = true;
      submitBtn.classList.add('loading');
      if (btnLabel) btnLabel.textContent = 'Shortening...';
      resultAccordion.classList.remove('open');
      if (qrFlyout) qrFlyout.style.display = 'none';

      const payload = {
        url: rawUrl
      };

      try {
        const res = await fetch('/api/shorten', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to shorten link');
        }

        shortUrlOutput.value = data.short_url;
        visitBtn.setAttribute('href', data.short_url);

        // Safe DOM updates
        const titleElem = document.getElementById('card-title');
        const descElem = document.getElementById('card-desc');
        const targetElem = document.getElementById('card-target');
        const cardImg = document.getElementById('card-img');

        titleElem.textContent = data.metadata?.title || data.target_url;
        descElem.textContent = data.metadata?.description || '';
        targetElem.textContent = data.target_url;

        if (data.metadata?.image_url) {
          cardImg.setAttribute('src', data.metadata.image_url);
          cardImg.style.display = 'block';
        } else {
          cardImg.style.display = 'none';
        }

        previewCard.style.display = 'block';

        // Save to client-side localStorage history
        saveHistoryItem({
          short_url: data.short_url,
          target_url: data.target_url,
          title: data.metadata?.title,
          created_at: Date.now()
        });

        // Fluid spring reveal of result accordion
        requestAnimationFrame(() => {
          resultAccordion.classList.add('open');
        });
      } catch (err) {
        showError(err.message);
      } finally {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        if (btnLabel) btnLabel.textContent = 'Shorten it';
      }
    });

    // Tactile One-Tap Copy
    let copyTimer = null;
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(shortUrlOutput.value);
      } catch (e) {
        shortUrlOutput.select();
        document.execCommand('copy');
      }

      copyBtn.classList.add('copied');
      const copyLabel = copyBtn.querySelector('.copy-label');
      if (copyLabel) copyLabel.textContent = 'Copied';
      copyToast.classList.add('visible');

      if (copyTimer) clearTimeout(copyTimer);
      copyTimer = setTimeout(() => {
        copyBtn.classList.remove('copied');
        if (copyLabel) copyLabel.textContent = 'Copy';
        copyToast.classList.remove('visible');
      }, 2000);
    });

    // QR Code Generator & Download
    if (qrBtn && qrFlyout && qrSvgWrap) {
      qrBtn.addEventListener('click', () => {
        const isShown = qrFlyout.style.display === 'block';
        if (isShown) {
          qrFlyout.style.display = 'none';
          return;
        }

        const url = shortUrlOutput.value;
        if (!url) return;
        const svgString = renderClientQrSvg(url, 180);
        qrSvgWrap.innerHTML = svgString;
        qrFlyout.style.display = 'block';
      });

      if (qrCloseBtn) {
        qrCloseBtn.addEventListener('click', () => {
          qrFlyout.style.display = 'none';
        });
      }

      if (qrDownloadBtn) {
        qrDownloadBtn.addEventListener('click', () => {
          const svgEl = qrSvgWrap.querySelector('svg');
          if (!svgEl) return;
          const svgData = new XMLSerializer().serializeToString(svgEl);
          const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'shortlink-qr.svg';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        });
      }
    }

    // Reset / "Shorten Another"
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        urlInput.value = '';
        toggleClearBtn();
        resultAccordion.classList.remove('open');
        if (qrFlyout) qrFlyout.style.display = 'none';
        hideError();
        urlInput.focus();
      });
    }

    // Global Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      // Cmd/Ctrl + K: Focus URL input
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        urlInput.focus();
        urlInput.select();
      }

      // Escape: Close QR flyout or clear error
      if (e.key === 'Escape') {
        if (qrFlyout && qrFlyout.style.display === 'block') {
          qrFlyout.style.display = 'none';
        } else {
          hideError();
        }
      }
    });
  `;
}
