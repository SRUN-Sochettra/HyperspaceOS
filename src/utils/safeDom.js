const IMAGE_MIME = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp']);
const VIDEO_MIME = new Set(['video/mp4', 'video/webm', 'video/ogg']);

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function setText(element, value) {
  if (element) element.textContent = String(value ?? '');
  return element;
}

export function safeDataUrl(value, expected = 'image') {
  if (typeof value !== 'string') return null;
  const match = /^data:([^;,]+);base64,([A-Za-z0-9+/]*={0,2})$/i.exec(value.trim());
  if (!match) return null;
  const allowed = expected === 'video' ? VIDEO_MIME : IMAGE_MIME;
  return allowed.has(match[1].toLowerCase()) ? value.trim() : null;
}

export function safeMediaUrl(value, expected) {
  return safeDataUrl(value, expected);
}

function inlineMarkdown(text) {
  let output = escapeHtml(text);
  output = output.replace(/`([^`\n]+)`/g, '<code>$1</code>');
  output = output.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  output = output.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
  return output;
}

export function renderSafeMarkdown(source) {
  const lines = String(source ?? '').replace(/\r\n?/g, '\n').split('\n');
  const output = [];
  let inCode = false;
  let code = [];
  let listOpen = false;
  const closeList = () => { if (listOpen) { output.push('</ul>'); listOpen = false; } };
  for (const line of lines) {
    if (/^```/.test(line)) {
      closeList();
      if (inCode) { output.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`); code = []; }
      inCode = !inCode;
      continue;
    }
    if (inCode) { code.push(line); continue; }
    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) { closeList(); const n = heading[1].length; output.push(`<h${n}>${inlineMarkdown(heading[2])}</h${n}>`); continue; }
    const bullet = /^\s*[-*•]\s+(.+)$/.exec(line);
    if (bullet) { if (!listOpen) { output.push('<ul>'); listOpen = true; } output.push(`<li>${inlineMarkdown(bullet[1])}</li>`); continue; }
    closeList();
    if (!line.trim()) output.push('');
    else output.push(`<p>${inlineMarkdown(line)}</p>`);
  }
  if (inCode) output.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
  closeList();
  return output.join('\n');
}
