function createIcon(color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
    <path d="M14 0C6.27 0 0 6.27 0 14c0 9.625 14 22 14 22S28 23.625 28 14C28 6.27 21.73 0 14 0z" fill="${color}" stroke="white" stroke-width="2"/>
    <circle cx="14" cy="14" r="5.5" fill="white"/>
  </svg>`;
  return L.divIcon({
    className: '',
    html: svg,
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -36],
  });
}

function createSearchIcon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
    <path d="M16 0C7.16 0 0 7.16 0 16c0 11 16 26 16 26S32 27 32 16C32 7.16 24.84 0 16 0z"
      fill="#0d47a1" stroke="white" stroke-width="2"/>
    <circle cx="16" cy="16" r="6" fill="white"/>
    <circle cx="16" cy="16" r="3" fill="#0d47a1"/>
  </svg>`;
  return L.divIcon({
    className: '',
    html: svg,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -44],
  });
}
