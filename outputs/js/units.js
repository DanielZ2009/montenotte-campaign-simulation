'use strict';

// Formation state, fatigue, losses, and map markers.

function allUnitObjects() {
  return Object.values(armyForces).flat();
}

function cloneUnitState() {
  const units = {};
  Object.values(armyForces).flat().forEach(unit => {
    units[unit.id] = {
      ...unit,
      strength: unit.strength,
      startingStrength: unit.strength,
      fatigue: unit.fatigue || 0,
      location: { ...unit.location },
      visible: unit.visible
    };
  });
  return units;
}

function formatNumber(value) {
  return Math.max(0, Math.round(value)).toLocaleString("en-US");
}

function sideClass(unit) {
  return unit.side === "french" ? "French" : unit.side === "austrian" ? "Austrian" : "Piedmontese";
}

function visibleStrength(unit) {
  if (unit.side === "french") {
    if (unit.strength > 8500) return "strong division";
    if (unit.strength > 4500) return "division detachment";
    if (unit.strength > 1800) return "brigade force";
    return "cavalry/screen";
  }
  const rough = Math.max(1000, Math.round(unit.strength / 1000) * 1000);
  const low = Math.max(500, rough - 1000);
  const high = rough + 1000;
  return state.intelligenceAccuracy >= 55
    ? `about ${formatNumber(rough)} men`
    : `${formatNumber(low)}-${formatNumber(high)} men?`;
}

function fatigueLabel(unit) {
  const fatigue = unit.fatigue || 0;
  if (fatigue >= 76) return "EXHAUSTED";
  if (fatigue >= 52) return "WEARY";
  if (fatigue >= 26) return "TIRED";
  return "FRESH";
}

function fatigueSentence(unit) {
  const label = fatigueLabel(unit);
  if (label === "EXHAUSTED") return "exhausted; officers report straggling and slow response";
  if (label === "WEARY") return "weary; able to fight, but marches are biting";
  if (label === "TIRED") return "tired; still reliable if not overdriven";
  return "fresh enough for immediate orders";
}

function choicePosture(choice) {
  const label = choice.label.toLowerCase();
  if (choice.scout || label.includes("reconnoitre")) return "Reconnaissance";
  if (label.includes("rapid") || label.includes("rush") || label.includes("night") || label.includes("late strike")) return "Rapid march";
  if (label.includes("defend") || label.includes("hold") || label.includes("wait")) return "Defensive posture";
  if (label.includes("retreat") || label.includes("fall back")) return "Retreat";
  return "Operational march";
}

function applyFatigueForChoice(choice, days) {
  const movedIds = new Set((choice.unitMoves || []).map(move => move.id));
  const posture = choicePosture(choice);
  movedIds.forEach(id => {
    const unit = unitState[id];
    if (!unit || unit.side !== "french") return;
    const routeLoad = Math.max(1, (choice.routes || []).length);
    const base = posture === "Rapid march" ? 22 : posture === "Reconnaissance" ? 10 : posture === "Retreat" ? 16 : 14;
    unit.fatigue = clamp((unit.fatigue || 0) + base * Math.max(.5, days) + routeLoad * 2);
  });
  Object.values(unitState).forEach(unit => {
    if (unit.side === "french" && !movedIds.has(unit.id)) unit.fatigue = Math.max(0, (unit.fatigue || 0) - 6 * Math.max(.5, days));
  });
  const exhausted = Object.values(unitState).filter(unit => unit.side === "french" && (unit.fatigue || 0) >= 76).length;
  const weary = Object.values(unitState).filter(unit => unit.side === "french" && (unit.fatigue || 0) >= 52).length;
  if (exhausted) addState({ morale: -4 * exhausted, frenchConcentration: -3 * exhausted });
  else if (weary) addState({ morale: -2, frenchConcentration: -1 });
}

function applyUnitMove(move) {
  if (!unitState[move.id]) return;
  unitState[move.id].location = { ...move.to };
  if (move.visible !== false) unitState[move.id].visible = true;
}

function revealUnits(ids = []) {
  ids.forEach(id => {
    if (unitState[id]) unitState[id].visible = true;
  });
}

function applyCasualties(casualties = []) {
  if (!casualties.length) return "";
  const lines = [];
  casualties.forEach(item => {
    const unit = unitState[item.id];
    if (!unit) return;
    const loss = Math.min(unit.strength, item.loss);
    unit.strength -= loss;
    if (unit.side === "french") {
      lines.push(`${unit.name}: about ${formatNumber(loss)} lost${item.note ? ` (${item.note})` : ""}`);
    } else {
      const roughLoss = Math.max(100, Math.round(loss / 500) * 500);
      lines.push(`${unit.name}: reported losses about ${formatNumber(roughLoss)}${item.note ? ` (${item.note})` : ""}`);
    }
  });
  return lines.join("; ");
}

function renderUnits() {
  els.units.innerHTML = "";
  Object.values(unitState).forEach(unit => {
    if (!unit.visible || unit.strength <= 0) return;
    const loc = point(unit.location);
    const group = svgEl("g", { id: `unit-${unit.id}`, class: "unit", transform: `translate(${loc.x} ${loc.y})`, "aria-label": `${sideClass(unit)} ${unit.name}, ${visibleStrength(unit)}, ${fatigueLabel(unit)}` });
    const title = svgEl("title");
    title.textContent = `${sideClass(unit)} ${unit.name} (${unit.role}) - ${visibleStrength(unit)} - ${fatigueLabel(unit)}`;
    group.appendChild(title);
    group.appendChild(svgEl("image", { href: unit.flag, x: "-2.175", y: "-3.2", width: "4.35", height: "2.75" }));
    const name = svgEl("text", { class: "unit-name", y: ".25" });
    name.textContent = unit.name;
    const strength = svgEl("text", { class: "unit-strength historical-label", y: "2.15" });
    strength.textContent = visibleStrength(unit);
    const fatigue = svgEl("text", { class: "unit-fatigue historical-label", y: "3.75" });
    fatigue.textContent = unit.side === "french" ? fatigueLabel(unit) : "reported";
    group.appendChild(name);
    group.appendChild(strength);
    group.appendChild(fatigue);
    els.units.appendChild(group);
  });
  applyOverlayScale();
  if (routeEditor.visible) drawReportEditor();
}

function moveUnitGroup(id, ref) {
  const unit = unitState[id];
  const group = document.getElementById(`unit-${id}`);
  if (!unit || !group) return;
  const p = point(ref);
  group.setAttribute("transform", `translate(${p.x} ${p.y})`);
}

function animateUnitAlongRoute(move, routeNames = []) {
  const unit = unitState[move.id];
  if (!unit) return;
  const via = routePoints(routeNames);
  const finalPoint = point(move.to);
  const points = via.length ? via : [finalPoint];
  let index = 0;

  function step() {
    if (index < points.length) {
      moveUnitGroup(move.id, points[index]);
      index += 1;
      window.setTimeout(step, 110);
      return;
    }
    unit.location = { ...move.to };
    unit.visible = move.visible === false ? unit.visible : true;
    moveUnitGroup(move.id, unit.location);
  }

  step();
}

function runUnitMoves(moves = [], routeNames = []) {
  if (!moves.length) {
    renderUnits();
    return;
  }
  const starts = {};
  moves.forEach(move => {
    if (!unitState[move.id]) return;
    starts[move.id] = { ...unitState[move.id].location };
    unitState[move.id].location = { ...move.to };
    if (move.visible !== false) unitState[move.id].visible = true;
  });
  renderUnits();
  moves.forEach(move => {
    if (starts[move.id]) moveUnitGroup(move.id, starts[move.id]);
    animateUnitAlongRoute(move, move.routes || routeNames);
  });
}

function forceLedgerHtml() {
  const visibleUnits = Object.values(unitState).filter(unit => unit.visible && unit.strength > 0);
  const cards = visibleUnits.map(unit => `
    <div>
      <strong>${unit.name}</strong>
      <span>${sideClass(unit)} ${unit.role}</span>
      <span>${unit.side === "french" ? fatigueSentence(unit) : "strength and intent uncertain"}</span>
    </div>
  `).join("");
  return `
    <div class="terrain-note">
      <strong>Commands currently visible</strong>
      <span>Markers show the commands and reports currently shaping your decisions. Enemy strength remains approximate unless confirmed by contact or scouting.</span>
      <div class="force-ledger">${cards}</div>
    </div>
  `;
}
