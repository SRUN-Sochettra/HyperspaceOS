const paths = {
  brand: '<path d="M5 4v16M19 4v16M5 12h14"/><path d="M2.5 12 7 7.5M21.5 12 17 16.5"/>',
  terminal: '<path d="m4 6 5 5-5 5"/><path d="M11 18h9"/>',
  files: '<path d="M3 7h7l2 2h9v10H3z"/><path d="M3 7V5h7l2 2"/>',
  editor: '<path d="m8 9-3 3 3 3"/><path d="m16 9 3 3-3 3"/><path d="m14 5-4 14"/>',
  notes: '<path d="M5 3h14v18H5z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  calculator: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M7 7h10M8 12h1M12 12h1M16 12h1M8 16h1M12 16h1M16 16h1"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
  sysmon: '<path d="M3 18h18M5 15l4-5 3 3 4-7 3 4"/>',
  taskman: '<path d="M6 4h12v16H6z"/><path d="M9 8h6M9 12h6M9 16h4"/>',
  music: '<path d="M9 18V6l10-2v12"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/>',
  weather: '<circle cx="9" cy="9" r="4"/><path d="M9 2v2M2 9h2M4 4l1.5 1.5M14 4l-1.5 1.5M7 19h11a3 3 0 0 0 0-6 5 5 0 0 0-9-1"/>',
  whiteboard: '<path d="M4 4h16v13H4zM8 21h8M12 17v4"/><path d="m8 13 6-6 2 2-6 6H8z"/>',
  assistant: '<path d="M5 5h14v11H9l-4 4z"/><path d="M9 9h6M9 12h4"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="m16 16 5 5"/>',
  folder: '<path d="M3 7h7l2 2h9v10H3z"/>',
  file: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5"/>',
  close: '<path d="m7 7 10 10M17 7 7 17"/>',
  minus: '<path d="M5 12h14"/>',
  maximize: '<rect x="5" y="5" width="14" height="14" rx="1"/>',
  play: '<path d="m8 5 11 7-11 7z"/>', pause: '<path d="M8 5v14M16 5v14"/>',
  warning: '<path d="M12 3 2 21h20z"/><path d="M12 9v5M12 18h.01"/>',
  check: '<path d="m5 12 4 4L19 6"/>', info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
}
export function icon(name, label = '') {
  const path = paths[name] || paths.file
  const aria = label ? `role="img" aria-label="${label.replace(/"/g, '&quot;')}"` : 'aria-hidden="true"'
  return `<svg class="hs-icon hs-icon-${name}" ${aria} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" focusable="false">${path}</svg>`
}
export default icon
