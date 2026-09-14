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
  browser: '<circle cx="12" cy="12" r="9"/><path d="M3.6 9h16.8M3.6 15h16.8M12 3a14 14 0 0 0 0 18M12 3a14 14 0 0 1 0 18"/>',
  calendar: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 9h18"/>',
  camera: '<path d="M4 7h4l2-3h4l2 3h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z"/><circle cx="12" cy="14" r="4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  contacts: '<path d="M18 20a6 6 0 0 0-12 0"/><circle cx="12" cy="9" r="4"/>',
  games: '<rect x="3" y="6" width="18" height="12" rx="3"/><path d="M7 12h4M9 10v4M15 11h.01M17 13h.01"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  markdown: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 15V9l3 3 3-3v6M17 12l-2 3M17 12l2 3"/>',
  photos: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="1.5"/><path d="m21 16-5-5-5 5-2-2-5 5"/>',
  video: '<rect x="2" y="5" width="14" height="14" rx="2"/><path d="m16 10 6-4v12l-6-4z"/>',
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
