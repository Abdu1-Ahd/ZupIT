export function renderWebUi(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Edge URL Shortener | Zero-Cost High Performance</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0b0f19;
      --card-bg: #111827;
      --border: #1f2937;
      --border-focus: #3b82f6;
      --text: #f9fafb;
      --text-muted: #9ca3af;
      --primary: #2563eb;
      --primary-hover: #1d4ed8;
      --accent: #10b981;
      --danger: #ef4444;
      --code-bg: #030712;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2.5rem 1rem;
    }
    .container {
      width: 100%;
      max-width: 680px;
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
    }
    header {
      text-align: center;
      margin-bottom: 0.5rem;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: rgba(37, 99, 235, 0.15);
      color: #60a5fa;
      border: 1px solid rgba(59, 130, 246, 0.3);
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-bottom: 1rem;
    }
    h1 {
      font-size: 2.25rem;
      font-weight: 700;
      letter-spacing: -0.025em;
      margin-bottom: 0.5rem;
    }
    p.subtitle {
      color: var(--text-muted);
      font-size: 1rem;
      line-height: 1.5;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 1rem;
      padding: 1.75rem;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text);
    }
    .input-wrapper {
      position: relative;
    }
    input[type="url"], input[type="text"] {
      width: 100%;
      background: var(--code-bg);
      border: 1px solid var(--border);
      border-radius: 0.5rem;
      padding: 0.75rem 1rem;
      color: var(--text);
      font-size: 0.95rem;
      font-family: inherit;
      outline: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    input:focus {
      border-color: var(--border-focus);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
    }
    .advanced-toggle {
      background: none;
      border: none;
      color: #60a5fa;
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      align-self: flex-start;
      padding: 0;
    }
    .advanced-fields {
      display: none;
      flex-direction: column;
      gap: 1rem;
      padding-top: 0.5rem;
      border-top: 1px dashed var(--border);
    }
    .advanced-fields.open {
      display: flex;
    }
    button.submit-btn {
      background: var(--primary);
      color: #fff;
      border: none;
      border-radius: 0.5rem;
      padding: 0.85rem 1.5rem;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.15s, transform 0.05s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }
    button.submit-btn:hover {
      background: var(--primary-hover);
    }
    button.submit-btn:active {
      transform: scale(0.99);
    }
    button.submit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .error-box {
      display: none;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid var(--danger);
      color: #fca5a5;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
    }
    .result-box {
      display: none;
      flex-direction: column;
      gap: 1.25rem;
    }
    .link-output {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }
    .link-output input {
      font-family: 'JetBrains Mono', monospace;
      color: #34d399;
      font-weight: 500;
    }
    .btn-copy {
      background: var(--border);
      border: none;
      color: var(--text);
      border-radius: 0.5rem;
      padding: 0.75rem 1.25rem;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.15s;
    }
    .btn-copy:hover {
      background: #374151;
    }
    .btn-copy.copied {
      background: var(--accent);
      color: #064e3b;
    }
    .preview-card {
      background: var(--code-bg);
      border: 1px solid var(--border);
      border-radius: 0.75rem;
      overflow: hidden;
    }
    .preview-image {
      width: 100%;
      height: 180px;
      object-fit: cover;
      background: #1f2937;
      display: block;
    }
    .preview-content {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .preview-title {
      font-weight: 600;
      font-size: 0.95rem;
      color: var(--text);
    }
    .preview-desc {
      font-size: 0.825rem;
      color: var(--text-muted);
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .preview-target {
      font-size: 0.75rem;
      font-family: 'JetBrains Mono', monospace;
      color: #60a5fa;
      margin-top: 0.25rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .api-docs {
      font-size: 0.825rem;
      color: var(--text-muted);
    }
    .api-docs pre {
      background: var(--code-bg);
      border: 1px solid var(--border);
      padding: 0.85rem;
      border-radius: 0.5rem;
      margin-top: 0.5rem;
      overflow-x: auto;
      font-family: 'JetBrains Mono', monospace;
      color: #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="badge">Edge Runtime &bull; 0ms Cold Start</div>
      <h1>Fast, Zero-Cost URL Shortener</h1>
      <p class="subtitle">Instant redirects for humans, rich OpenGraph preview cards for social bots.</p>
    </header>

    <div class="card">
      <form id="shorten-form">
        <div class="form-group">
          <label for="url-input">Target Destination URL</label>
          <input type="url" id="url-input" placeholder="https://github.com/torvalds/linux/blob/master/README.md" required>
        </div>

        <button type="button" class="advanced-toggle" id="adv-toggle">
          <span>+ Custom slug &amp; preview overrides</span>
        </button>

        <div class="advanced-fields" id="adv-fields">
          <div class="form-group">
            <label for="slug-input">Custom Alias (Optional)</label>
            <input type="text" id="slug-input" placeholder="e.g. linux-kernel" maxlength="32">
          </div>
          <div class="form-group">
            <label for="title-input">Override Preview Title (Optional)</label>
            <input type="text" id="title-input" placeholder="Custom link title">
          </div>
          <div class="form-group">
            <label for="desc-input">Override Description (Optional)</label>
            <input type="text" id="desc-input" placeholder="Custom description preview">
          </div>
          <div class="form-group">
            <label for="img-input">Override Thumbnail Image URL (Optional)</label>
            <input type="url" id="img-input" placeholder="https://example.com/thumbnail.png">
          </div>
        </div>

        <button type="submit" class="submit-btn" id="btn-submit">Shorten Link</button>
      </form>

      <div class="error-box" id="error-box"></div>

      <div class="result-box" id="result-box" style="margin-top: 1.5rem;">
        <label>Your Short Link</label>
        <div class="link-output">
          <input type="text" id="short-url-output" readonly>
          <button class="btn-copy" id="btn-copy">Copy</button>
        </div>

        <label style="margin-top: 0.5rem;">Social Preview Card (WhatsApp / X / Discord)</label>
        <div class="preview-card" id="preview-card">
          <img class="preview-image" id="card-img" src="" alt="Thumbnail" style="display: none;">
          <div class="preview-content">
            <div class="preview-title" id="card-title"></div>
            <div class="preview-desc" id="card-desc"></div>
            <div class="preview-target" id="card-target"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="card api-docs">
      <strong>Developer REST API:</strong>
      <pre><code>curl -X POST https://${"${location.host}"}/api/shorten \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com/my-long-link"}'</code></pre>
    </div>
  </div>

  <script>
    const form = document.getElementById('shorten-form');
    const advToggle = document.getElementById('adv-toggle');
    const advFields = document.getElementById('adv-fields');
    const errorBox = document.getElementById('error-box');
    const resultBox = document.getElementById('result-box');
    const submitBtn = document.getElementById('btn-submit');
    const copyBtn = document.getElementById('btn-copy');
    const shortUrlOutput = document.getElementById('short-url-output');

    advToggle.addEventListener('click', () => {
      const isOpen = advFields.classList.toggle('open');
      advToggle.querySelector('span').textContent = isOpen 
        ? '- Hide custom options' 
        : '+ Custom slug & preview overrides';
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorBox.style.display = 'none';
      resultBox.style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Extracting Metadata & Shortening...';

      const payload = {
        url: document.getElementById('url-input').value.trim(),
        custom_slug: document.getElementById('slug-input').value.trim() || undefined,
        title: document.getElementById('title-input').value.trim() || undefined,
        description: document.getElementById('desc-input').value.trim() || undefined,
        image_url: document.getElementById('img-input').value.trim() || undefined
      };

      try {
        const res = await fetch('/api/shorten', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to shorten URL');
        }

        shortUrlOutput.value = data.short_url;
        document.getElementById('card-title').textContent = data.metadata.title || data.target_url;
        document.getElementById('card-desc').textContent = data.metadata.description || 'No description provided';
        document.getElementById('card-target').textContent = data.target_url;
        
        const cardImg = document.getElementById('card-img');
        if (data.metadata.image_url) {
          cardImg.src = data.metadata.image_url;
          cardImg.style.display = 'block';
        } else {
          cardImg.style.display = 'none';
        }

        resultBox.style.display = 'flex';
      } catch (err) {
        errorBox.textContent = err.message;
        errorBox.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Shorten Link';
      }
    });

    copyBtn.addEventListener('click', async () => {
      await navigator.clipboard.writeText(shortUrlOutput.value);
      copyBtn.textContent = 'Copied!';
      copyBtn.classList.add('copied');
      setTimeout(() => {
        copyBtn.textContent = 'Copy';
        copyBtn.classList.remove('copied');
      }, 2000);
    });
  </script>
</body>
</html>`;
}

