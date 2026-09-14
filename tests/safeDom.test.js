import test from "node:test";
import assert from "node:assert/strict";
import { escapeHtml, renderSafeMarkdown, safeMediaUrl } from "../src/utils/safeDom.js";

test("escapeHtml neutralizes hostile HTML, SVG, attributes and filenames", () => {
  for (const payload of ['<img src=x onerror=alert(1)>', '<svg/onload=alert(1)>', '\" autofocus onfocus=alert(1) x=\"', "</div><script>alert(1)</script>"]) {
    const escaped = escapeHtml(payload);
    assert.equal(escaped.includes('<script'), false);
    assert.equal(escaped.includes('<svg'), false);
    assert.equal(escaped.includes('<img'), false);
  }
});

test("limited markdown escapes HTML before formatting", () => {
  const html = renderSafeMarkdown('**safe** <img src=x onerror=1>\n```\n</code><svg/onload=1>\n```\n**malformed');
  assert.match(html, /<strong>safe<\/strong>/);
  assert.doesNotMatch(html, /<img|<svg|<script/i);
  assert.match(html, /&lt;img/);
});

test("media URLs only accept expected base64 MIME schemes", () => {
  assert.ok(safeMediaUrl('data:image/png;base64,AAAA', 'image'));
  assert.ok(safeMediaUrl('data:video/mp4;base64,AAAA', 'video'));
  assert.equal(safeMediaUrl('javascript:alert(1)', 'image'), null);
  assert.equal(safeMediaUrl('https://example.com/a.mp4', 'video'), null);
  assert.equal(safeMediaUrl('data:image/svg+xml;base64,PHN2Zz4=', 'image'), null);
  assert.equal(safeMediaUrl('data:text/html;base64,AAAA', 'image'), null);
});
