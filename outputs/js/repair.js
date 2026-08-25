'use strict';

// Instructor-only map, report, and movement repair tools.

function routeSnippet(name, points) {
  const safeName = name || "customRoute";
  const body = points.map(p => `  {x: ${p.x.toFixed(1)}, y: ${p.y.toFixed(1)}}`).join(",\n");
  return `routes.${safeName} = [\n${body}\n];`;
}

function currentRouteName() {
  return (els.routeName.value || els.routeSelect.value || routeEditor.savedName || "voltriToSavona").trim();
}

function currentLocationName() {
  return (els.locationName.value || els.locationSelect.value || locationEditor.savedName || "Savona").trim();
}

function currentReportKey() {
  return els.reportSelect.value || reportEditor.savedKey || "";
}

function updateRouteStatus(message) {
  els.routeStatus.textContent = message;
}

function syncRepairDock() {
  els.routeEditor.classList.toggle("dock-right", repairPanelDock === "right");
  els.mapViewport.classList.toggle("panel-left", repairPanelDock === "left");
  els.dockRepair.textContent = repairPanelDock === "right" ? "Move panel left" : "Move panel right";
}

function toggleRepairDock() {
  repairPanelDock = repairPanelDock === "right" ? "left" : "right";
  syncRepairDock();
  updateRouteStatus(`Repair panel moved ${repairPanelDock}. It stays outside the map area.`);
}

function routeCatalogEntry(name) {
  return routeRepairCatalog.find(route => route.id === name);
}

function collectChoiceObjects(value, choices = [], seen = new WeakSet()) {
  if (!value || typeof value !== "object" || seen.has(value)) return choices;
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach(item => collectChoiceObjects(item, choices, seen));
    return choices;
  }
  if (Array.isArray(value.choices)) value.choices.forEach(choice => choices.push(choice));
  Object.values(value).forEach(item => collectChoiceObjects(item, choices, seen));
  return choices;
}

function movementChoiceCatalog() {
  const catalog = new Map();
  collectChoiceObjects([openingTurn, followUpTurns]).forEach(choice => {
    if (!choice?.label || !Array.isArray(choice.unitMoves)) return;
    catalog.set(choice.label, choice);
  });
  generatedChoices().forEach(choice => {
    if (choice?.label && Array.isArray(choice.unitMoves)) catalog.set(choice.label, choice);
  });
  return [...catalog.values()];
}

function movementKey(choiceLabel, unitId) {
  return `${choiceLabel}::${unitId}`;
}

function movementRouteList() {
  return els.movementRoutes.value
    .split(",")
    .map(route => route.trim())
    .filter(Boolean);
}

function selectedMovementChoice() {
  return movementChoiceCatalog().find(choice => choice.label === els.movementDecision.value);
}

function selectedMovementUnit() {
  return allUnitObjects().find(unit => unit.id === els.movementUnit.value);
}

function snapshotCurrentRepairs() {
  const reports = {};
  allReportObjects().forEach(report => {
    reports[reportKey(report)] = {
      x: reportPoint(report).x,
      y: reportPoint(report).y,
      label: report.label,
      symbol: reportSymbol(report)
    };
  });
  const unitStarts = {};
  allUnitObjects().forEach(unit => {
    if (unit.location?.place) unitStarts[unit.id] = { ...unit.location };
  });
  const data = {
    routes: Object.fromEntries(Object.entries(routes).map(([name, points]) => [name, points.map(p => ({ x: p.x, y: p.y }))])),
    locations: Object.fromEntries(Object.entries(locations).map(([name, loc]) => [name, { ...loc }])),
    reports,
    unitStarts,
    movementPlans
  };
  writeSavedMapData(data);
  return data;
}

async function copyTextWithFallback(text, output, successMessage, failureMessage) {
  output.value = text;
  try {
    await navigator.clipboard.writeText(text);
    updateRouteStatus(successMessage);
  } catch (error) {
    output.focus();
    output.select();
    const copied = document.execCommand && document.execCommand("copy");
    updateRouteStatus(copied ? successMessage : failureMessage);
  }
}

function populateMovementRepairCatalog() {
  const choices = movementChoiceCatalog();
  els.movementDecision.innerHTML = "";
  choices.forEach(choice => {
    const option = document.createElement("option");
    option.value = choice.label;
    option.textContent = choice.label;
    els.movementDecision.appendChild(option);
  });

  els.movementUnit.innerHTML = "";
  allUnitObjects().forEach(unit => {
    const option = document.createElement("option");
    option.value = unit.id;
    option.textContent = `${sideClass(unit)}: ${unit.name}`;
    els.movementUnit.appendChild(option);
  });

  els.movementStart.innerHTML = "";
  Object.entries(locations).forEach(([name, loc]) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = loc.label || name;
    els.movementStart.appendChild(option);
  });

  loadMovementRepair();
}

function loadMovementRepair() {
  const choice = selectedMovementChoice();
  const unit = selectedMovementUnit();
  if (!choice || !unit) return;
  const plan = movementPlans[movementKey(choice.label, unit.id)];
  const move = (choice.unitMoves || []).find(item => item.id === unit.id);
  const routeNames = plan?.routes || move?.routes || choice.routes || [];
  const startPlace = plan?.startPlace || unit.location?.place || "Savona";
  els.movementStart.value = locations[startPlace] ? startPlace : "Savona";
  els.movementRoutes.value = routeNames.join(", ");
  updateRouteStatus(`Movement repair: ${unit.name} for "${choice.label}". Choose a start place and route sequence, then Confirm movement.`);
}

function applyMovementPlansToChoice(choice) {
  if (!choice?.unitMoves) return choice;
  choice.unitMoves.forEach(move => {
    const plan = movementPlans[movementKey(choice.label, move.id)];
    if (plan?.routes?.length) move.routes = [...plan.routes];
  });
  return choice;
}

function confirmMovementRepair() {
  const choice = selectedMovementChoice();
  const unit = selectedMovementUnit();
  if (!choice || !unit) {
    updateRouteStatus("Select a decision and unit before confirming movement.");
    return;
  }
  const startPlace = els.movementStart.value;
  const routeNames = movementRouteList();
  movementPlans[movementKey(choice.label, unit.id)] = { startPlace, routes: routeNames };
  unit.location = { place: startPlace };
  if (unitState[unit.id]) unitState[unit.id].location = { place: startPlace };
  applyMovementPlansToChoice(choice);
  snapshotCurrentRepairs();
  renderUnits();
  updateRouteStatus(`Confirmed movement repair for ${unit.name}: starts at ${locations[startPlace]?.label || startPlace}; follows ${routeNames.join(" -> ") || "no route override"}.`);
}

async function copyMovementRepair() {
  const choice = selectedMovementChoice();
  const unit = selectedMovementUnit();
  if (!choice || !unit) return;
  const routeNames = movementRouteList();
  const text = `movementPlans[${JSON.stringify(movementKey(choice.label, unit.id))}] = {\n  startPlace: ${JSON.stringify(els.movementStart.value)},\n  routes: ${JSON.stringify(routeNames)}\n};`;
  await copyTextWithFallback(text, els.movementCopyOutput, "Copied movement repair data.", "Clipboard was blocked, so the movement data is selected in the box above.");
}

function lockCurrentRepairs() {
  const data = snapshotCurrentRepairs();
  els.repairDataOutput.value = JSON.stringify(data, null, 2);
  updateRouteStatus("Locked the current routes, places, report markers, unit starts, and movement plans into this browser's local storage.");
}

async function copyAllRepairData() {
  const text = JSON.stringify(snapshotCurrentRepairs(), null, 2);
  await copyTextWithFallback(text, els.repairDataOutput, "Copied all repair data. Keep this as a backup before further edits.", "Clipboard was blocked, so all repair data is selected in the box above.");
}

function importRepairData() {
  try {
    const data = JSON.parse(els.repairDataInput.value || els.repairDataOutput.value || "{}");
    writeSavedMapData(data);
    applySavedMapData();
    populateRouteRepairCatalog();
    populateLocationRepairCatalog();
    populateReportRepairCatalog();
    populateMovementRepairCatalog();
    drawMapOverlay();
    updateRouteStatus("Imported repair data and redrew the map.");
  } catch (error) {
    updateRouteStatus("Import failed. The repair data box must contain valid JSON.");
  }
}

function populateRouteRepairCatalog() {
  els.routeSelect.innerHTML = "";
  routeRepairCatalog.forEach(route => {
    const option = document.createElement("option");
    option.value = route.id;
    option.textContent = route.label;
    els.routeSelect.appendChild(option);
  });
  els.routeSelect.value = routeEditor.savedName;
  els.routeName.value = routeEditor.savedName;
  loadRouteForRepair(routeEditor.savedName);
}

function populateLocationRepairCatalog() {
  els.locationSelect.innerHTML = "";
  locationRepairCatalog.forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = locations[name]?.label || name;
    els.locationSelect.appendChild(option);
  });
  els.locationSelect.value = locationEditor.savedName;
  els.locationName.value = locationEditor.savedName;
  loadLocationForRepair(locationEditor.savedName);
}

function populateReportRepairCatalog() {
  const reports = allReportObjects();
  const unique = new Map();
  reports.forEach(report => {
    const key = reportKey(report);
    if (!unique.has(key)) unique.set(key, report);
  });
  els.reportSelect.innerHTML = "";
  unique.forEach((report, key) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = `${reportSymbol(report)} ${report.location}: ${report.label}`;
    els.reportSelect.appendChild(option);
  });
  if (!reportEditor.savedKey || !unique.has(reportEditor.savedKey)) {
    reportEditor.savedKey = unique.keys().next().value || "";
  }
  if (reportEditor.savedKey) {
    els.reportSelect.value = reportEditor.savedKey;
    loadReportForRepair(reportEditor.savedKey);
  }
}

function drawRouteEditor() {
  els.routeEdit.innerHTML = "";
  if (!routeEditor.points.length) return;
  const path = svgEl("path", {
    class: "route-edit-line",
    d: pathFor(routeEditor.points)
  });
  els.routeEdit.appendChild(path);
  routeEditor.points.forEach((p, index) => {
    const pointNode = svgEl("g", { "aria-label": `Route point ${index + 1}` });
    pointNode.appendChild(svgEl("circle", { class: "route-edit-point", cx: p.x, cy: p.y, r: .8 }));
    const label = svgEl("text", {
      class: "route-edit-index",
      x: p.x,
      y: p.y - 1.3
    });
    label.textContent = index + 1;
    pointNode.appendChild(label);
    els.routeEdit.appendChild(pointNode);
  });
}

function drawLocationEditor() {
  els.locationEdit.innerHTML = "";
  const locName = currentLocationName();
  const p = locationEditor.point || locations[locName];
  if (!p) return;
  const group = svgEl("g", {
    class: locationDragState ? "location-edit-dragging" : "location-edit-handle",
    "aria-label": `Drag repair marker ${locName}`
  });
  group.addEventListener("pointerdown", startLocationDrag);
  group.addEventListener("mousedown", startLocationDrag);
  group.appendChild(svgEl("circle", { class: "location-edit-hit", cx: p.x, cy: p.y, r: 3.2 }));
  group.appendChild(svgEl("circle", { class: "location-edit-marker", cx: p.x, cy: p.y, r: 1.25 }));
  group.appendChild(svgEl("line", { class: "location-edit-cross", x1: p.x - 1.7, y1: p.y, x2: p.x + 1.7, y2: p.y }));
  group.appendChild(svgEl("line", { class: "location-edit-cross", x1: p.x, y1: p.y - 1.7, x2: p.x, y2: p.y + 1.7 }));
  const label = svgEl("text", {
    class: "route-edit-index",
    x: p.x,
    y: p.y - 2.4
  });
  label.textContent = locName;
  group.appendChild(label);
  els.locationEdit.appendChild(group);
}

function drawReportEditor() {
  els.reportEdit.innerHTML = "";
  const report = reportByKey(currentReportKey());
  if (!report) return;
  const p = reportEditor.point || reportPoint(report);
  const group = svgEl("g", {
    class: reportDragState ? "report report-edit-dragging" : "report report-edit-handle",
    "aria-label": `Drag report marker ${report.location}`
  });
  group.addEventListener("pointerdown", startReportDrag);
  group.addEventListener("mousedown", startReportDrag);
  const size = 2.15;
  group.appendChild(svgEl("circle", { class: "report-edit-hit", cx: p.x, cy: p.y, r: 4.2 }));
  group.appendChild(svgEl("path", {
    class: "report-edit-outline",
    "data-cx": p.x,
    "data-cy": p.y,
    d: `M ${p.x} ${p.y - size} L ${p.x + size * 2.7} ${p.y} L ${p.x} ${p.y + size} L ${p.x - size * 2.7} ${p.y} Z`
  }));
  const label = svgEl("text", { x: p.x, y: p.y });
  label.textContent = els.reportSymbol.value || reportSymbol(report);
  group.appendChild(label);
  els.reportEdit.appendChild(group);
  applyOverlayScale();
}

function loadRouteForRepair(name) {
  const routeName = name || currentRouteName();
  routeEditor.savedName = routeName;
  routeEditor.active = false;
  routeEditor.points = (routes[routeName] || []).map(p => ({ x: p.x, y: p.y }));
  els.routeSelect.value = routeName;
  els.routeName.value = routeName;
  if (routeEditor.visible) drawRouteEditor();
  else els.routeEdit.innerHTML = "";
  const entry = routeCatalogEntry(routeName);
  const pointText = routeEditor.points.length ? `${routeEditor.points.length} current points` : "no current points";
  updateRouteStatus(`${entry?.label || routeName}: ${pointText}. ${entry?.note || ""}`);
}

function loadLocationForRepair(name) {
  const locName = name || currentLocationName();
  locationEditor.active = false;
  locationEditor.savedName = locName;
  locationEditor.point = locations[locName] ? { x: locations[locName].x, y: locations[locName].y } : null;
  els.locationSelect.value = locName;
  els.locationName.value = locName;
  if (routeEditor.visible) drawLocationEditor();
  else els.locationEdit.innerHTML = "";
  const loc = locations[locName];
  updateRouteStatus(loc
    ? `${loc.label || locName}: x ${loc.x.toFixed(1)}, y ${loc.y.toFixed(1)}. Start placing, then click the map to move it.`
    : `${locName} is not in locations yet. Start placing, then click the map.`);
}

function loadReportForRepair(key) {
  const report = reportByKey(key || currentReportKey());
  if (!report) {
    els.reportEdit.innerHTML = "";
    updateRouteStatus("No report marker selected.");
    return;
  }
  reportEditor.active = false;
  reportEditor.savedKey = reportKey(report);
  reportEditor.point = { ...reportPoint(report) };
  els.reportSelect.value = reportEditor.savedKey;
  els.reportLabel.value = report.label;
  els.reportSymbol.value = reportSymbol(report);
  if (routeEditor.visible) drawReportEditor();
  else els.reportEdit.innerHTML = "";
  updateRouteStatus(`${reportSymbol(report)} at ${report.location}: x ${reportPoint(report).x.toFixed(1)}, y ${reportPoint(report).y.toFixed(1)}. Start report placing or drag the marker, then Confirm report.`);
}

function toggleRouteRepairMode() {
  routeEditor.visible = !routeEditor.visible;
  els.routeEditor.classList.toggle("hidden", !routeEditor.visible);
  els.mapViewport.classList.toggle("repair-open", routeEditor.visible);
  els.routeRepairToggle.textContent = routeEditor.visible ? "Hide Route Editor" : "Enter Route Editor";
  if (routeEditor.visible) {
    syncRepairDock();
    loadRouteForRepair(currentRouteName());
    loadLocationForRepair(currentLocationName());
    populateReportRepairCatalog();
    populateMovementRepairCatalog();
  }
  else {
    routeEditor.active = false;
    locationEditor.active = false;
    reportEditor.active = false;
    els.routeEdit.innerHTML = "";
    els.locationEdit.innerHTML = "";
    els.reportEdit.innerHTML = "";
  }
}

function startLocationEditor() {
  const locName = currentLocationName();
  locationEditor = {
    active: true,
    savedName: locName,
    point: locations[locName] ? { x: locations[locName].x, y: locations[locName].y } : null
  };
  routeEditor.active = false;
  reportEditor.active = false;
  drawLocationEditor();
  updateRouteStatus(`Placing ${locName}. Click the map where this place should sit, then Confirm place.`);
}

function confirmLocationEditor() {
  const locName = currentLocationName();
  if (!locationEditor.point) {
    updateRouteStatus("No place point selected yet. Start placing and click the map first.");
    return;
  }
  const existing = locations[locName] || {};
  locations[locName] = {
    ...existing,
    x: locationEditor.point.x,
    y: locationEditor.point.y
  };
  persistLocation(locName);
  locationEditor = { active: false, savedName: locName, point: { x: locations[locName].x, y: locations[locName].y } };
  drawMapOverlay();
  drawLocationEditor();
  updateRouteStatus(`Confirmed ${locName}: x ${locations[locName].x.toFixed(1)}, y ${locations[locName].y.toFixed(1)}.`);
}

function deleteLocationEditor() {
  const locName = currentLocationName();
  locationDragState = null;
  locationEditor = { active: false, savedName: locName, point: null };
  els.locationEdit.innerHTML = "";
  updateRouteStatus(`Deleted the repair marker for ${locName}. The saved game location is unchanged until you confirm a new point.`);
}

async function copyLocationEditor() {
  const locName = currentLocationName();
  const loc = locations[locName];
  if (!loc && !locationEditor.point) {
    updateRouteStatus("Nothing to copy yet. Place or confirm a location first.");
    return;
  }
  const p = locationEditor.point || loc;
  const label = loc?.label ? `, label: ${JSON.stringify(loc.label)}` : "";
  const dx = loc?.labelDx !== undefined ? `, labelDx: ${loc.labelDx}` : "";
  const dy = loc?.labelDy !== undefined ? `, labelDy: ${loc.labelDy}` : "";
  const text = `locations.${locName} = { x: ${p.x.toFixed(1)}, y: ${p.y.toFixed(1)}${label}${dx}${dy} };`;
  els.locationCopyOutput.value = text;
  try {
    await navigator.clipboard.writeText(text);
    updateRouteStatus(`Copied location data for ${locName}.`);
  } catch (error) {
    els.locationCopyOutput.focus();
    els.locationCopyOutput.select();
    const copied = document.execCommand && document.execCommand("copy");
    updateRouteStatus(copied ? `Copied location data for ${locName}.` : "Clipboard was blocked, so the location data is selected in the box above.");
  }
}

function setReportDraftFromEvent(event) {
  const p = mapPointFromEvent(event);
  reportEditor.point = {
    x: Math.round(p.x * 10) / 10,
    y: Math.round(p.y * 10) / 10
  };
}

function startReportEditor() {
  const report = reportByKey(currentReportKey());
  if (!report) {
    updateRouteStatus("No report marker selected.");
    return;
  }
  reportEditor = {
    active: true,
    savedKey: reportKey(report),
    point: { ...reportPoint(report) }
  };
  routeEditor.active = false;
  locationEditor.active = false;
  drawReportEditor();
  updateRouteStatus(`Placing ${reportSymbol(report)}. Click the map or drag the report marker, then Confirm report.`);
}

function matchingReports(key) {
  const original = reportByKey(key);
  if (!original) return [];
  return allReportObjects().filter(report => reportKey(report) === key);
}

function confirmReportEditor() {
  const key = currentReportKey();
  const reports = matchingReports(key);
  if (!reports.length || !reportEditor.point) {
    updateRouteStatus("No report point selected yet. Start report placing and click or drag first.");
    return;
  }
  reports.forEach(report => {
    report.x = reportEditor.point.x;
    report.y = reportEditor.point.y;
    report.label = els.reportLabel.value.trim() || report.label;
    report.symbol = els.reportSymbol.value.trim() || reportSymbol(report);
    persistReport(report, key);
  });
  const updatedKey = reportKey(reports[0]);
  reportEditor = { active: false, savedKey: updatedKey, point: { x: reports[0].x, y: reports[0].y } };
  populateReportRepairCatalog();
  renderReports(activeTurns[turnIndex]?.reports || startingReports);
  drawReportEditor();
  updateRouteStatus(`Confirmed ${reportSymbol(reports[0])}: x ${reports[0].x.toFixed(1)}, y ${reports[0].y.toFixed(1)}.`);
}

async function copyReportEditor() {
  const report = reportByKey(currentReportKey());
  if (!report && !reportEditor.point) {
    updateRouteStatus("Nothing to copy yet. Select or place a report marker first.");
    return;
  }
  const p = reportEditor.point || reportPoint(report);
  const text = `// Match report by side/location/label, then apply:\n{ side: ${JSON.stringify(report?.side || "Austrian")}, location: ${JSON.stringify(report?.location || "Dego")}, label: ${JSON.stringify(els.reportLabel.value || report?.label || "enemy report")}, symbol: ${JSON.stringify(els.reportSymbol.value || reportSymbol(report || { side: "Austrian" }))}, x: ${p.x.toFixed(1)}, y: ${p.y.toFixed(1)} }`;
  els.reportCopyOutput.value = text;
  try {
    await navigator.clipboard.writeText(text);
    updateRouteStatus(`Copied report marker data.`);
  } catch (error) {
    els.reportCopyOutput.focus();
    els.reportCopyOutput.select();
    const copied = document.execCommand && document.execCommand("copy");
    updateRouteStatus(copied ? "Copied report marker data." : "Clipboard was blocked, so the report data is selected in the box above.");
  }
}

function startRouteEditor() {
  const name = currentRouteName();
  routeEditor = { visible: true, active: true, savedName: name, points: [] };
  locationEditor.active = false;
  reportEditor.active = false;
  drawRouteEditor();
  updateRouteStatus(`Recording ${name}. Click the map along that road in order. Confirm route when finished.`);
}

function deleteRouteEditor() {
  const name = currentRouteName();
  routes[name] = [];
  persistRoute(name);
  routeEditor = { visible: true, active: false, savedName: name, points: [] };
  drawRoutes();
  drawRouteEditor();
  updateRouteStatus(`Deleted routes.${name}. Start a new route to replace it.`);
}

function undoRoutePoint() {
  if (!routeEditor.points.length) {
    updateRouteStatus("No route points to undo.");
    return;
  }
  const removed = routeEditor.points.pop();
  drawRouteEditor();
  updateRouteStatus(`Removed last point: x ${removed.x}, y ${removed.y}. ${routeEditor.points.length} points remain.`);
}

function saveRouteEditor() {
  const name = currentRouteName();
  if (!routeEditor.points.length) {
    updateRouteStatus("No route points yet. Start a route and click the map first.");
    return;
  }
  routes[name] = routeEditor.points.map(p => ({ x: p.x, y: p.y }));
  persistRoute(name);
  routeEditor = { visible: true, active: false, savedName: name, points: routes[name].map(p => ({ ...p })) };
  drawRoutes();
  drawRouteEditor();
  updateRouteStatus(`Confirmed routes.${name} with ${routes[name].length} points. Units using this route will follow these points.`);
}

async function copyRouteEditor() {
  const name = currentRouteName();
  const points = routeEditor.points.length ? routeEditor.points : (routes[name] || []);
  if (!points.length) {
    updateRouteStatus("Nothing to copy yet. Save or record a route first.");
    return;
  }
  const text = routeSnippet(name, points);
  els.routeCopyOutput.value = text;
  try {
    await navigator.clipboard.writeText(text);
    updateRouteStatus(`Copied ${points.length} route points for routes.${name}.`);
  } catch (error) {
    els.routeCopyOutput.focus();
    els.routeCopyOutput.select();
    const copied = document.execCommand && document.execCommand("copy");
    updateRouteStatus(copied
      ? `Copied ${points.length} route points for routes.${name}.`
      : "Clipboard was blocked, so the route data is selected in the box above.");
  }
}

function setLocationDraftFromEvent(event) {
  const p = mapPointFromEvent(event);
  locationEditor.point = {
    x: Math.round(p.x * 10) / 10,
    y: Math.round(p.y * 10) / 10
  };
}

function startLocationDrag(event) {
  if (!routeEditor.visible || event.button !== 0) return;
  event.preventDefault();
  event.stopPropagation();
  const locName = currentLocationName();
  routeEditor.active = false;
  reportEditor.active = false;
  locationEditor.active = true;
  locationEditor.savedName = locName;
  if (!locationEditor.point && locations[locName]) {
    locationEditor.point = { x: locations[locName].x, y: locations[locName].y };
  }
  locationDragState = {
    pointerId: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    moved: false
  };
  drawLocationEditor();
  updateRouteStatus(`Dragging ${locName}. Release the marker, then Confirm place to apply.`);
}

function updateLocationDrag(event) {
  if (!locationDragState) return;
  const moved = Math.abs(event.clientX - locationDragState.x) + Math.abs(event.clientY - locationDragState.y);
  if (moved > 2) locationDragState.moved = true;
  setLocationDraftFromEvent(event);
  drawLocationEditor();
  updateRouteStatus(`${locationEditor.savedName}: x ${locationEditor.point.x}, y ${locationEditor.point.y}. Release, then Confirm place.`);
}

function finishLocationDrag() {
  if (!locationDragState) return;
  suppressNextMapClick = locationDragState.moved;
  locationDragState = null;
  drawLocationEditor();
}

function startReportDrag(event) {
  if (!routeEditor.visible || event.button !== 0) return;
  event.preventDefault();
  event.stopPropagation();
  const report = reportByKey(currentReportKey());
  if (!report) return;
  routeEditor.active = false;
  locationEditor.active = false;
  reportEditor.active = true;
  reportEditor.savedKey = reportKey(report);
  if (!reportEditor.point) reportEditor.point = { ...reportPoint(report) };
  reportDragState = {
    pointerId: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    moved: false
  };
  drawReportEditor();
  updateRouteStatus(`Dragging ${els.reportSymbol.value || reportSymbol(report)}. Release the marker, then Confirm report.`);
}

function updateReportDrag(event) {
  if (!reportDragState) return;
  const moved = Math.abs(event.clientX - reportDragState.x) + Math.abs(event.clientY - reportDragState.y);
  if (moved > 2) reportDragState.moved = true;
  setReportDraftFromEvent(event);
  drawReportEditor();
  updateRouteStatus(`${els.reportSymbol.value || "Report"}: x ${reportEditor.point.x}, y ${reportEditor.point.y}. Release, then Confirm report.`);
}

function finishReportDrag() {
  if (!reportDragState) return;
  suppressNextMapClick = reportDragState.moved;
  reportDragState = null;
  drawReportEditor();
}

function mapPointFromEvent(event) {
  const rect = els.mapCanvas.getBoundingClientRect();
  return {
    x: Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100)),
    y: Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100))
  };
}

function recordRoutePoint(event) {
  if (!routeEditor.active) return false;
  const p = mapPointFromEvent(event);
  routeEditor.points.push({
    x: Math.round(p.x * 10) / 10,
    y: Math.round(p.y * 10) / 10
  });
  drawRouteEditor();
  updateRouteStatus(`Point ${routeEditor.points.length}: x ${routeEditor.points.at(-1).x}, y ${routeEditor.points.at(-1).y}`);
  return true;
}

function recordLocationPoint(event) {
  if (!locationEditor.active) return false;
  setLocationDraftFromEvent(event);
  drawLocationEditor();
  updateRouteStatus(`${locationEditor.savedName}: x ${locationEditor.point.x}, y ${locationEditor.point.y}. Confirm place to apply.`);
  return true;
}

function recordReportPoint(event) {
  if (!reportEditor.active) return false;
  setReportDraftFromEvent(event);
  drawReportEditor();
  updateRouteStatus(`${els.reportSymbol.value || "Report"}: x ${reportEditor.point.x}, y ${reportEditor.point.y}. Confirm report to apply.`);
  return true;
}
