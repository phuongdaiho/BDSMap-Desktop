// ── Vị trí tôi ──
    let myLocationWatchId = null;

    const myLocationIcon = L.divIcon({
      className: '',
      html: '<div class="my-location-icon"><div class="ring"></div><div class="dot"></div></div>',
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });

    function startLocationWatch(centerMap, openPopupOnFirst) {
      if (!navigator.geolocation) return;
      if (myLocationWatchId !== null) {
        if (centerMap && myLocationMarker) map.setView(myLocationMarker.getLatLng(), 16);
        if (openPopupOnFirst && myLocationMarker) myLocationMarker.openPopup();
        return;
      }
      let isFirst = true;
      myLocationWatchId = navigator.geolocation.watchPosition(
        ({ coords }) => {
          const lat = coords.latitude, lng = coords.longitude;
          if (!myLocationMarker) {
            myLocationMarker = L.marker([lat, lng], { icon: myLocationIcon, zIndexOffset: 1000 }).addTo(map);
            myLocationMarker.bindPopup(`<b>Vị trí của bạn</b><br><span style="font-size:0.8rem;color:#666">${lat.toFixed(5)}, ${lng.toFixed(5)}</span>`);
          } else {
            myLocationMarker.setLatLng([lat, lng]);
            myLocationMarker.setPopupContent(`<b>Vị trí của bạn</b><br><span style="font-size:0.8rem;color:#666">${lat.toFixed(5)}, ${lng.toFixed(5)}</span>`);
          }
          if (isFirst) {
            if (centerMap) map.setView([lat, lng], 16);
            if (openPopupOnFirst) myLocationMarker.openPopup();
            isFirst = false;
          }
        },
        () => { myLocationWatchId = null; },
        { enableHighAccuracy: true, maximumAge: 5000 }
      );
    }

    function goToMyLocation() {
      if (!navigator.geolocation) { alert('Trình duyệt không hỗ trợ định vị.'); return; }
      if (myLocationWatchId !== null && myLocationMarker) {
        map.setView(myLocationMarker.getLatLng(), 16);
        myLocationMarker.openPopup();
        return;
      }
      startLocationWatch(true, true);
    }

    function initLocationWatch() {
      startLocationWatch(true, false);
    }
