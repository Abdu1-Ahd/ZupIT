import { renderStyles } from "./styles";
import { renderHeader } from "./components/header";
import { renderShortenForm } from "./components/form";
import { renderResultBox } from "./components/result";
import { renderHistoryShelf } from "./components/history";
import { renderScripts } from "./scripts";
import { oldMoneyTheme, DesignTheme } from "./theme";

export * from "./icons";
export * from "./styles";
export * from "./theme";
export * from "./qr";
export * from "./components/header";
export * from "./components/form";
export * from "./components/result";
export * from "./components/history";

/**
 * Main Web UI Document Assembler.
 * Returns the complete, secure, minimal, and lightweight HTML document styled
 * with the centralized Old Money design system and buttery-smooth micro-animations.
 */
export function renderWebUi(theme: DesignTheme = oldMoneyTheme): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="${theme.semantic.bgCanvas}">
  <title>Edge URL Shortener &bull; Fast, Zero-Cost URL Shortener</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
${renderStyles(theme)}
  </style>
</head>
<body>
  <div class="main-wrap">
    ${renderHeader()}
    ${renderShortenForm()}
    ${renderResultBox()}
    ${renderHistoryShelf()}
  </div>
  <script>
${renderScripts()}
  </script>
</body>
</html>`;
}
