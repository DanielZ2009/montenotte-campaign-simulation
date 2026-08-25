'use strict';

// Map geometry, zooming, overlays, and movement traces.

function svgEl(name, attrs = {}) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", name);
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
  return el;
}

function point(ref) {
  if (typeof ref === "string") return locations[ref];
  if (ref.place) {
    const base = locations[ref.place];
    return { x: base.x + (ref.dx || 0), y: base.y + (ref.dy || 0) };
  }
  return ref;
}

function pathFor(points) {
  return points.map((p, index) => {
    const pt = point(p);
    return `${index === 0 ? "M" : "L"} ${pt.x} ${pt.y}`;
  }).join(" ");
}

function routePoints(routeNames) {
  const points = [];
  routeNames.forEach(name => {
    const route = routes[name] || [];
    route.forEach((p, index) => {
      if (points.length && index === 0) return;
      points.push(p);
    });
  });
  return points;
}

function setZoom(nextZoom) {
  const oldZoom = zoom;
  zoom = Math.max(1, Math.min(8, nextZoom));
  els.mapCanvas.style.height = `${zoom * 100}%`;
  els.mapCanvas.style.maxHeight = zoom === 1 ? "100%" : "none";
  els.mapCanvas.style.maxWidth = zoom === 1 ? "100%" : "none";
  els.zoomLevel.textContent = `${Math.round(zoom * 100)}%`;
  applyOverlayScale();

  if (zoom > oldZoom) {
    els.mapWrap.scrollLeft = (els.mapWrap.scrollWidth - els.mapWrap.clientWidth) / 2;
    els.mapWrap.scrollTop = (els.mapWrap.scrollHeight - els.mapWrap.clientHeight) / 2;
  }
}

function zoomAt(delta, clientX, clientY) {
  const before = zoom;
  const nextZoom = zoom + delta;
  const rect = els.mapWrap.getBoundingClientRect();
  const relX = clientX - rect.left + els.mapWrap.scrollLeft;
  const relY = clientY - rect.top + els.mapWrap.scrollTop;
  setZoom(nextZoom);
  const ratio = zoom / before;
  els.mapWrap.scrollLeft = relX * ratio - (clientX - rect.left);
  els.mapWrap.scrollTop = relY * ratio - (clientY - rect.top);
}

function toggleMapExpanded() {
  mapExpanded = !mapExpanded;
  els.mapViewport.classList.toggle("map-expanded", mapExpanded);
  let backdrop = document.getElementById("mapExpandedBackdrop");
  if (mapExpanded && !backdrop) {
    backdrop = document.createElement("div");
    backdrop.id = "mapExpandedBackdrop";
    backdrop.className = "map-expanded-backdrop";
    backdrop.addEventListener("click", toggleMapExpanded);
    document.body.appendChild(backdrop);
  } else if (!mapExpanded && backdrop) {
    backdrop.remove();
  }
  els.zoomFit.textContent = mapExpanded ? "↙" : "⤢";
  els.zoomFit.title = mapExpanded ? "Restore map" : "Open large map";
  els.zoomFit.setAttribute("aria-label", mapExpanded ? "Restore map" : "Open large map");
  window.setTimeout(() => applyOverlayScale(), 50);
}

function applyOverlayScale() {
  const scale = Math.max(.42, Math.min(1, 1 / zoom));
  document.documentElement.style.setProperty("--overlay-scale", scale.toFixed(3));

  document.querySelectorAll(".place-dot").forEach(dot => dot.setAttribute("r", .62 * scale));
  document.querySelectorAll(".report path").forEach(marker => {
    const size = 1.95 * Math.max(.55, scale);
    const cx = Number(marker.dataset.cx);
    const cy = Number(marker.dataset.cy);
    marker.setAttribute("d", `M ${cx} ${cy - size} L ${cx + size * 2.7} ${cy} L ${cx} ${cy + size} L ${cx - size * 2.7} ${cy} Z`);
  });
  document.querySelectorAll(".unit").forEach(group => {
    const image = group.querySelector("image");
    if (!image) return;
    const width = 4.35 * Math.max(.48, scale);
    const height = 2.75 * Math.max(.48, scale);
    image.setAttribute("x", -width / 2);
    image.setAttribute("y", -height - .45);
    image.setAttribute("width", width);
    image.setAttribute("height", height);
    const name = group.querySelector(".unit-name");
    const strength = group.querySelector(".unit-strength");
    if (name) name.setAttribute("y", .25 * Math.max(.48, scale));
    if (strength) strength.setAttribute("y", 2.15 * Math.max(.48, scale));
  });
}

function centerOn(ref) {
  const p = point(ref);
  window.setTimeout(() => {
    const width = els.mapCanvas.getBoundingClientRect().width;
    const height = els.mapCanvas.getBoundingClientRect().height;
    els.mapWrap.scrollTo({
      left: Math.max(0, width * (p.x / 100) - els.mapWrap.clientWidth / 2),
      top: Math.max(0, height * (p.y / 100) - els.mapWrap.clientHeight / 2),
      behavior: "auto"
    });
  }, 220);
}

function drawRoutes() {
  els.routes.innerHTML = "";
  if (!routeEditor.visible) return;
  const selectedRoute = currentRouteName();
  Object.entries(routes).forEach(([name, pts]) => {
    if (name !== selectedRoute) return;
    if (!pts.length) return;
    els.routes.appendChild(svgEl("path", {
      id: `route-${name}`,
      class: "route road-route",
      d: pathFor(pts)
    }));
  });
}

function drawMapOverlay() {
  drawRoutes();

  els.terrain.innerHTML = "";
  terrainFeatures.forEach(feature => {
    const loc = point(feature.location);
    const group = svgEl("g", { "aria-label": feature.title });
    const title = svgEl("title");
    title.textContent = feature.note;
    const label = svgEl("text", {
      class: `terrain-label historical-label${feature.kind === "topographic" ? " topographic-label" : ""}`,
      x: loc.x + (locations[feature.location]?.labelDx || .9),
      y: loc.y + (locations[feature.location]?.labelDy || -.6)
    });
    label.textContent = feature.title;
    label.appendChild(title);
    group.appendChild(label);
    els.terrain.appendChild(group);
  });

  els.places.innerHTML = "";
  Object.entries(locations).forEach(([name, loc]) => {
    if (["BormidaValley", "CoastRoad", "TurchinoPass", "BocchettaPass"].includes(name)) return;
    const labelText = loc.label || name;
    const group = svgEl("g", { "aria-label": labelText });
    group.appendChild(svgEl("circle", { class: "place-dot", cx: loc.x, cy: loc.y, r: .62 }));
    const label = svgEl("text", {
      class: "map-label historical-label",
      x: loc.x + (loc.labelDx || .9),
      y: loc.y + (loc.labelDy || -.6)
    });
    label.textContent = labelText;
    group.appendChild(label);
    els.places.appendChild(group);
  });

  drawWedge(.1);
  els.enemyMovement.innerHTML = "";
  renderUnits();
  renderReports(startingReports);
  if (routeEditor.visible) {
    drawRouteEditor();
    drawLocationEditor();
    drawReportEditor();
  }
  if (!routeEditor.visible) setZoom(1);
  else applyOverlayScale();
}

function drawWedge(opacity) {
  const a = point("Dego");
  const b = point("Millesimo");
  const c = point("Carcare");
  els.wedge.innerHTML = "";
  els.wedge.setAttribute("opacity", opacity);
  els.wedge.appendChild(svgEl("polygon", {
    class: "wedge",
    points: `${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y}`
  }));
}

function showTerrainNote(feature) {
  els.evidence.innerHTML = `
    <div class="terrain-note">
      <strong>${feature.title}</strong>
      <span>${feature.note}</span>
    </div>
  `;
}

function drawMovement(routeNames, color = "#315f8d") {
  els.movement.innerHTML = "";
  const pts = routePoints(routeNames);
  if (!pts.length) return;
  els.movement.appendChild(svgEl("path", {
    class: "movement-trace",
    d: pathFor(pts),
    stroke: color,
    "marker-end": "url(#arrowBlue)"
  }));
}

function drawEnemyEvent(event) {
  els.enemyMovement.innerHTML = "";
  if (!event) return;
  revealUnits(event.reveal || []);

  const color = event.side === "piedmont" ? "#3f7652" : "#9e3f32";
  const marker = event.side === "piedmont" ? "arrowGreen" : "arrowRed";
  (event.route || []).forEach(routeName => {
    const pts = routes[routeName] || [];
    if (!pts.length) return;
    els.enemyMovement.appendChild(svgEl("path", {
      class: "movement-trace",
      d: pathFor(pts),
      stroke: color,
      "marker-end": `url(#${marker})`
    }));
  });

  runUnitMoves(event.moves || [], event.route || []);
}
