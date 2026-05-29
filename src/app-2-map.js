function routeSvg(route, className = "route-map-svg", options = {}) {
  if (!route || !route.points || route.points.length < 2) return "";
  const displayPoints = options.reverse ? [...route.points].reverse() : route.points;
  const startLabel = options.startLabel || "INICIO";
  const endLabel = options.endLabel || "FINAL";
  const width = 1100;
  const height = 360;
  const pad = 42;
  const bounds = routeBounds(displayPoints);
  const latRange = bounds.maxLat - bounds.minLat || 0.000001;
  const lonRange = bounds.maxLon - bounds.minLon || 0.000001;
  const projected = displayPoints.map((point) => {
    const x = pad + ((point.lon - bounds.minLon) / lonRange) * (width - pad * 2);
    const y = height - pad - ((point.lat - bounds.minLat) / latRange) * (height - pad * 2);
    return [x, y];
  });
  const polyline = projected.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const start = projected[0];
  const end = projected[projected.length - 1];
  const midLines = Array.from({ length: 5 }, (_, index) => {
    const x = pad + ((width - pad * 2) / 4) * index;
    return `<line x1="${x}" y1="${pad}" x2="${x}" y2="${height - pad}" class="route-grid-line"/>`;
  }).join("");
  const horizontalLines = Array.from({ length: 4 }, (_, index) => {
    const y = pad + ((height - pad * 2) / 3) * index;
    return `<line x1="${pad}" y1="${y}" x2="${width - pad}" y2="${y}" class="route-grid-line"/>`;
  }).join("");
  return `
    <svg class="${className}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(route.name)}">
      <rect x="0" y="0" width="${width}" height="${height}" class="route-map-bg"/>
      ${midLines}${horizontalLines}
      <polyline points="${polyline}" class="route-track-shadow"/>
      <polyline points="${polyline}" class="route-track"/>
      <circle cx="${start[0]}" cy="${start[1]}" r="12" class="route-start"/>
      <circle cx="${end[0]}" cy="${end[1]}" r="13" class="route-end"/>
      <text x="${labelX(start[0], width)}" y="${labelY(start[1])}" class="route-label">${escapeHtml(startLabel)}</text>
      <text x="${labelX(end[0], width)}" y="${labelY(end[1])}" class="route-label">${escapeHtml(endLabel)}</text>
      <text x="28" y="334" class="route-footnote">${escapeHtml(route.name)} | ${route.points.length} puntos GPS</text>
    </svg>
  `;
}

function lonToTileX(lon, zoom) {
  return ((lon + 180) / 360) * 2 ** zoom;
}

function latToTileY(lat, zoom) {
  const rad = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** zoom;
}

function staticTileRouteMap(route, options = {}) {
  if (!route || !route.points || route.points.length < 2) return "";
  const displayPoints = options.reverse ? [...route.points].reverse() : route.points;
  const startLabel = options.startLabel || "INICIO";
  const endLabel = options.endLabel || "FINAL";
  const width = 1100;
  const height = 420;
  const tileSize = 256;
  const bounds = routeBounds(displayPoints);
  const lonRange = bounds.maxLon - bounds.minLon || 0.000001;
  const latRange = bounds.maxLat - bounds.minLat || 0.000001;
  const centerLon = bounds.minLon + lonRange / 2;
  const centerLat = bounds.minLat + latRange / 2;
  const paddedLonRange = lonRange * 1.45;
  const paddedLatRange = latRange * 1.75;
  const zoomByLon = Math.log2((width * 360) / (tileSize * paddedLonRange));
  const zoomByLat = Math.log2((height * 170) / (tileSize * paddedLatRange));
  const zoom = Math.max(3, Math.min(17, Math.floor(Math.min(zoomByLon, zoomByLat))));
  const scale = tileSize;
  const centerX = lonToTileX(centerLon, zoom) * scale;
  const centerY = latToTileY(centerLat, zoom) * scale;
  const originX = centerX - width / 2;
  const originY = centerY - height / 2;
  const minTileX = Math.floor(originX / tileSize);
  const maxTileX = Math.floor((originX + width) / tileSize);
  const minTileY = Math.floor(originY / tileSize);
  const maxTileY = Math.floor((originY + height) / tileSize);
  const maxTileIndex = 2 ** zoom;
  const tiles = [];

  for (let x = minTileX; x <= maxTileX; x++) {
    for (let y = minTileY; y <= maxTileY; y++) {
      if (y < 0 || y >= maxTileIndex) continue;
      const wrappedX = ((x % maxTileIndex) + maxTileIndex) % maxTileIndex;
      tiles.push(`<img class="static-map-tile" src="https://tile.openstreetmap.org/${zoom}/${wrappedX}/${y}.png" style="left:${(x * tileSize - originX).toFixed(1)}px;top:${(y * tileSize - originY).toFixed(1)}px;" alt="">`);
    }
  }

  const projected = displayPoints.map((point) => [
    lonToTileX(point.lon, zoom) * scale - originX,
    latToTileY(point.lat, zoom) * scale - originY
  ]);
  const polyline = projected.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const start = projected[0];
  const end = projected[projected.length - 1];

  return `
    <div class="static-route-map" style="width:${width}px;height:${height}px;">
      ${tiles.join("")}
      <svg class="static-route-overlay" viewBox="0 0 ${width} ${height}" aria-label="${escapeHtml(route.name)}">
        <polyline points="${polyline}" class="route-track-shadow"/>
        <polyline points="${polyline}" class="route-track"/>
        <circle cx="${start[0]}" cy="${start[1]}" r="12" class="route-start"/>
        <circle cx="${end[0]}" cy="${end[1]}" r="13" class="route-end"/>
        <text x="${labelX(start[0], width)}" y="${labelY(start[1])}" class="route-label">${escapeHtml(startLabel)}</text>
        <text x="${labelX(end[0], width)}" y="${labelY(end[1])}" class="route-label">${escapeHtml(endLabel)}</text>
      </svg>
    </div>
  `;
}

function labelX(x, width) {
  return x > width - 260 ? x - 210 : x + 18;
}

function labelY(y) {
  return y < 70 ? y + 32 : y - 12;
}

function leafletAvailable() {
  return typeof L !== "undefined";
}

function displayRoutePoints() {
  if (!state.gpxRoute || !state.gpxRoute.points) return [];
  return state.direction === "retorno" ? [...state.gpxRoute.points].reverse() : state.gpxRoute.points;
}

function destroyLeafletMap(mapInstance) {
  if (mapInstance) mapInstance.remove();
}

function initLeafletRouteMap(containerId, target) {
  const container = $(`#${containerId}`);
  const route = routeNames();
  const points = displayRoutePoints();
  if (!container || !leafletAvailable() || points.length < 2) return null;

  const latLngs = points.map((point) => [point.lat, point.lon]);
  const map = L.map(container, {
    zoomControl: true,
    attributionControl: true,
    scrollWheelZoom: false
  });

  const tileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap"
  }).addTo(map);
  map.panrTileLayer = tileLayer;

  L.polyline(latLngs, {
    color: "#0b84d8",
    weight: 6,
    opacity: 0.95,
    lineJoin: "round",
    lineCap: "round"
  }).addTo(map);

  L.circleMarker(latLngs[0], {
    radius: 8,
    color: "#ffffff",
    weight: 3,
    fillColor: "#1f9d55",
    fillOpacity: 1
  }).addTo(map).bindTooltip(route.origin, { permanent: true, direction: "top", offset: [0, -8] });

  L.circleMarker(latLngs[latLngs.length - 1], {
    radius: 9,
    color: "#ffffff",
    weight: 3,
    fillColor: "#d92d20",
    fillOpacity: 1
  }).addTo(map).bindTooltip(route.destination, { permanent: true, direction: "top", offset: [0, -8] });

  map.fitBounds(latLngs, { padding: target === "document" ? [58, 58] : [34, 34] });
  setTimeout(() => {
    map.invalidateSize();
    map.fitBounds(latLngs, { padding: target === "document" ? [58, 58] : [34, 34] });
  }, 140);
  map.panrLatLngs = latLngs;
  map.panrPadding = target === "document" ? [70, 70] : [34, 34];

  if (target === "media") mediaLeafletMap = map;
  if (target === "document") documentLeafletMap = map;
  return map;
}

function refitLeafletMap(map) {
  if (!map || !map.panrLatLngs) return;
  map.invalidateSize(true);
  map.fitBounds(map.panrLatLngs, {
    padding: map.panrPadding || [58, 58],
    animate: false
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitForLeafletTiles(map, timeout = 5000) {
  if (!map || !map.panrTileLayer) return Promise.resolve();
  const layer = map.panrTileLayer;
  return new Promise((resolve) => {
    let finished = false;
    const done = () => {
      if (finished) return;
      finished = true;
      layer.off("load", done);
      resolve();
    };
    layer.on("load", done);
    setTimeout(done, timeout);
  });
}

function renderLeafletRouteShell(id, className = "") {
  return `<div id="${id}" class="leaflet-route-map ${className}" aria-label="Mapa con ruta GPX sobre OpenStreetMap"></div>`;
}

function routeMapMarkup() {
  const route = routeNames();
  if (state.gpxRoute) {
    return staticTileRouteMap(state.gpxRoute, {
      reverse: state.direction === "retorno",
      startLabel: route.origin,
      endLabel: route.destination
    });
  }
  if (state.mapImage) return `<img class="doc-map" src="${state.mapImage}" alt="Mapa general">`;
  return "";
}
