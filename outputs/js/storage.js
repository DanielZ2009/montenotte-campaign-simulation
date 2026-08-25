'use strict';

// Persistent map-repair storage and restoration.

function savedMapData() {
  try {
    return JSON.parse(localStorage.getItem(savedMapKey) || "{}");
  } catch (error) {
    return {};
  }
}

function writeSavedMapData(data) {
  try {
    localStorage.setItem(savedMapKey, JSON.stringify(data));
  } catch (error) {
    console.warn("Map repair storage failed", error);
  }
}

function persistRoute(name) {
  const data = savedMapData();
  data.routes = data.routes || {};
  data.routes[name] = (routes[name] || []).map(p => ({ x: p.x, y: p.y }));
  writeSavedMapData(data);
}

function persistLocation(name) {
  const data = savedMapData();
  data.locations = data.locations || {};
  const loc = locations[name];
  if (loc) data.locations[name] = { ...loc };
  writeSavedMapData(data);
}

function persistReport(report, key = reportKey(report)) {
  const data = savedMapData();
  data.reports = data.reports || {};
  data.reports[key] = {
    x: report.x,
    y: report.y,
    label: report.label,
    symbol: report.symbol
  };
  writeSavedMapData(data);
}

function applySavedMapData() {
  const data = savedMapData();
  Object.entries(data.routes || {}).forEach(([name, points]) => {
    if (Array.isArray(points) && points.length) routes[name] = points.map(p => ({ x: p.x, y: p.y }));
  });
  Object.entries(data.locations || {}).forEach(([name, loc]) => {
    locations[name] = { ...(locations[name] || {}), ...loc };
  });
  movementPlans = data.movementPlans || {};
  Object.entries(data.unitStarts || {}).forEach(([id, start]) => {
    const unit = allUnitObjects().find(force => force.id === id);
    if (!unit || !start?.place) return;
    unit.location = { place: start.place, dx: start.dx || 0, dy: start.dy || 0 };
    if (unitState[id]) unitState[id].location = { ...unit.location };
  });
  allReportObjects().forEach(report => {
    const saved = data.reports?.[reportKey(report)];
    if (!saved) return;
    report.x = saved.x;
    report.y = saved.y;
    report.label = saved.label || report.label;
    report.symbol = saved.symbol || report.symbol;
  });
}
