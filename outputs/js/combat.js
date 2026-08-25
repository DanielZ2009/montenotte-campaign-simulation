'use strict';

// Engagement reports, campaign outcomes, and debrief scoring.

function locationFromChoice(choice) {
  const label = choice.label.toLowerCase();
  if (label.includes("mondovi")) return "Mondovi";
  if (label.includes("ceva")) return "Ceva";
  if (label.includes("millesimo")) return "Millesimo";
  if (label.includes("dego")) return "Dego";
  if (label.includes("montenotte")) return "Montenotte";
  if (label.includes("voltri")) return "Voltri";
  if (choice.map?.reports?.[0]) return choice.map.reports[0];
  return "Carcare";
}

function terrainFromChoice(choice) {
  const routesText = (choice.routes || []).join(" ");
  if (routesText.includes("Cadibona")) return "Ligurian pass roads descending from Savona toward the Bormida valley.";
  if (routesText.includes("Dego")) return "Bormida valley road junctions and broken mountain approaches around Dego.";
  if (routesText.includes("Millesimo") || routesText.includes("Ceva") || routesText.includes("Mondovi")) return "Western roads toward Ceva, the Corsaglia, and the Piedmontese plain.";
  if (routesText.includes("Voltri")) return "Coastal road and pass exits near Voltri, Turchino, and Bocchetta.";
  return "Mountain roads around Carcare and the central gap.";
}

function forcesFromChoice(choice) {
  const ids = [...new Set([...(choice.unitMoves || []).map(move => move.id), ...(choice.reveal || [])])];
  return ids.map(id => unitState[id]?.name || id).filter(Boolean).join(", ") || "advance guards and reported enemy detachments";
}

function frenchForcesFromChoice(choice) {
  const ids = [...new Set((choice.unitMoves || []).map(move => move.id))];
  const names = ids
    .map(id => unitState[id])
    .filter(unit => unit?.side === "french")
    .map(unit => unit.name);
  return names.join(", ") || "available French columns";
}

function lossesFromCasualties(casualties = []) {
  if (!casualties.length) return "No reliable casualty return has reached headquarters.";
  return casualties.map(item => {
    const unit = unitState[item.id] || Object.values(armyForces).flat().find(force => force.id === item.id);
    const name = unit?.name || item.id;
    return `${name}: about ${formatNumber(item.loss)}${item.note ? ` (${item.note})` : ""}`;
  }).join("; ");
}

function createBattleReport(choice, turn, days, casualties = []) {
  if (!choice.battle && !casualties.length) return null;
  const battleTitle = choice.battle?.title || "Engagement report";
  const location = locationFromChoice(choice);
  const historicalPlaces = ["Montenotte", "Dego", "Millesimo", "Ceva", "Mondovi"];
  return {
    title: battleTitle.replace(/^Battle report:\s*/i, "").replace(/^Operational report:\s*/i, ""),
    date: campaignDateText(),
    location,
    forces: forcesFromChoice(choice),
    terrain: terrainFromChoice(choice),
    cause: choice.battle?.text || choice.rationale,
    result: choice.effectText,
    losses: lossesFromCasualties(casualties),
    consequence: choice.lesson,
    historicalNote: battleTitle.includes("Alternate")
      ? "Alternate Campaign Outcome: this engagement follows from your operational choices, not from the historical sequence."
      : historicalPlaces.includes(location)
        ? "Historical note: this battlefield was part of Napoleon's real April 1796 campaign, but in this prototype it occurs only when movement creates contact there."
        : "Historical note: this is a plausible operational report generated from the campaign state."
  };
}

function battleReportHtml(report) {
  if (!report) return "";
  return `
    <div class="terrain-note">
      <strong>Battle Report: ${report.title}</strong>
      <span><b>Date:</b> ${report.date}</span>
      <span><b>Location:</b> ${report.location}</span>
      <span><b>Forces engaged:</b> ${report.forces}</span>
      <span><b>Terrain:</b> ${report.terrain}</span>
      <span><b>Cause of battle:</b> ${report.cause}</span>
      <span><b>Result:</b> ${report.result}</span>
      <span><b>Estimated losses:</b> ${report.losses}</span>
      <span><b>Operational consequence:</b> ${report.consequence}</span>
      <span><b>Historical note:</b> ${report.historicalNote}</span>
    </div>
  `;
}

function alliedCounterstrokeReport() {
  const possibilities = [
    "French attack repulsed near Montenotte/Carcare.",
    "Austrian and Sardinian forces restore contact.",
    "French divisions become separated in mountain roads.",
    "French army retreats toward Savona.",
    "Severe defeat forces withdrawal toward Nice and the Var frontier."
  ];
  if (state.supply <= 12 || state.morale <= 14) return possibilities[4];
  if (state.frenchConcentration < 28) return possibilities[2];
  if (state.coalitionCohesion >= 70) return possibilities[1];
  if (state.austrianThreat >= 72) return possibilities[0];
  return possibilities[3];
}

function campaignOutcome() {
  const sardiniaBroken = state.sardinianPressure >= 68 || state.coalitionCohesion <= 24;
  const austriaChecked = state.austrianThreat <= 34 || (state.coalitionCohesion <= 28 && state.alliedConcentration <= 48);
  if (sardiniaBroken && austriaChecked) {
    return {
      type: "victory",
      title: "Campaign Victory",
      military: "Piedmont-Sardinia is operationally separated from Austria and begins seeking peace while Austrian forces retreat east or fail to restore the coalition front.",
      lesson: "The campaign was won by using roads, passes, and timing to make two allied armies fight two separate operational problems.",
      comparison: "This resembles Napoleon's historical achievement: Montenotte, Dego, Millesimo/Ceva, and Mondovi mattered because they converted geography into diplomatic collapse.",
      diagnosis: "You kept enough concentration and morale to turn movement into political pressure before the Allies could reunite."
    };
  }

  const counterstroke = state.alliedConcentration >= 78 && (state.frenchConcentration <= 38 || state.morale <= 35 || state.supply <= 30);
  const collapse = state.supply <= 10 || state.morale <= 12;
  const superiorConcentration = state.coalitionCohesion >= 72 && state.austrianThreat >= 68 && state.frenchConcentration <= 34;
  if (counterstroke || collapse || superiorConcentration) {
    return {
      type: "defeat",
      title: "Operational Defeat",
      military: alliedCounterstrokeReport(),
      lesson: "The map punished dispersal and delay. Once the Allies restored contact, French divisions could be beaten separately or forced back toward the coast.",
      comparison: "This is the failure Napoleon avoided in 1796: being pinned near Savona or driven back toward Nice and the Var frontier before Sardinia could be forced out.",
      diagnosis: "French concentration, supply, or morale fell too low while Allied concentration rose too high."
    };
  }
  return null;
}

function ending() {
  return campaignOutcome();
}

function campaignBadges(result) {
  const labels = history.filter(item => item.type === "decision").map(item => item.label).join(" | ");
  const badges = [];
  if (state.coalitionCohesion <= 35 || state.sardinianPressure >= 60) badges.push(["The Seam", "Separated Austrian and Sardinian forces."]);
  if (history.some(item => /Cadibona|Carcare|Dego|Millesimo|Mondovi|Montenotte/.test(item.result))) badges.push(["Master of the Passes", "Used roads and mountain routes as operational tools."]);
  if (state.intelligenceAccuracy <= 38 && result?.type === "victory") badges.push(["The Gamble", "Won despite uncertain intelligence."]);
  if (state.alliedConcentration >= 65 || labels.includes("wait") || labels.includes("Remain near Savona")) badges.push(["Too Late", "Allowed Allied cooperation to become dangerous."]);
  if (result?.type === "defeat" && /Var|Nice|Savona|frontier|retreat/i.test(result.military)) badges.push(["Retreat to the Var", "Lost the campaign and withdrew toward the frontier or coast."]);
  if (result?.type === "victory" && labels.includes("Montenotte") && labels.match(/Dego|Millesimo|Ceva|Mondovi/)) badges.push(["Historical Bonaparte", "Achieved an outcome close to the real 1796 campaign logic."]);
  if (!badges.length) badges.push(["Campaign Student", "Saw how geography, uncertainty, and coalition timing shape the campaign."]);
  return badges;
}

function majorDecisionHtml() {
  const decisions = history.filter(item => item.type === "decision");
  if (!decisions.length) return "<p>No operational orders recorded.</p>";
  return `
    <div class="report-list">
      ${decisions.slice(0, 6).map(item => `
        <div class="report-card"><strong>${item.title}</strong><span>${item.label}</span></div>
      `).join("")}
    </div>
  `;
}

function lossTotals() {
  return Object.values(unitState).reduce((totals, unit) => {
    const lost = Math.max(0, (unit.startingStrength || unit.strength) - unit.strength);
    if (unit.side === "french") totals.french += lost;
    else totals.allied += lost;
    return totals;
  }, { french: 0, allied: 0 });
}

function armyConditionText() {
  const french = Object.values(unitState).filter(unit => unit.side === "french");
  const averageFatigue = french.reduce((sum, unit) => sum + (unit.fatigue || 0), 0) / Math.max(1, french.length);
  if (averageFatigue >= 65 || state.morale <= 22) return "dangerously worn";
  if (averageFatigue >= 42 || state.supply <= 28) return "strained";
  if (averageFatigue <= 24 && state.morale >= 45) return "good";
  return "usable but tired";
}

function campaignScore(result) {
  const losses = lossTotals();
  let score = result?.type === "victory" ? 62 : result?.type === "defeat" ? 22 : 42;
  if (state.coalitionCohesion <= 30) score += 12;
  if (state.sardinianPressure >= 68) score += 10;
  if (state.austrianThreat <= 34) score += 8;
  if (state.daysElapsed <= 4) score += 8;
  if (losses.french <= 3000) score += 8;
  if (armyConditionText() === "good") score += 6;
  if (state.alliedConcentration >= 70) score -= 12;
  if (losses.french >= 7000) score -= 10;
  if (state.supply <= 20 || state.morale <= 20) score -= 10;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function historicalDebriefHtml(result) {
  const losses = lossTotals();
  const score = campaignScore(result);
  const rating = score >= 85 ? "Decisive Victory" : score >= 68 ? "Strong Campaign" : score >= 50 ? "Limited Success" : score >= 32 ? "Pyrrhic Or Stalled Result" : "Campaign Failure";
  return `
    <div class="terrain-note">
      <strong>Historical Debrief</strong>
      <div class="historical-debrief-grid">
        <div class="debrief-row"><strong>Political result</strong><span>Historical: Sardinia moved toward peace by late April.</span><span>Your run: ${result?.type === "victory" ? "Sardinia is operationally separated from Austria." : "The coalition remains dangerous or the French army has failed."}</span></div>
        <div class="debrief-row"><strong>Time</strong><span>Historical: roughly 18 days to force the armistice logic.</span><span>Your run: ${state.daysElapsed.toFixed(1).replace(".0", "")} campaign days elapsed.</span></div>
        <div class="debrief-row"><strong>French losses</strong><span>Historical comparison point: about 6,000 campaign losses.</span><span>Your run: about ${formatNumber(losses.french)} recorded losses.</span></div>
        <div class="debrief-row"><strong>Allied losses</strong><span>Historical comparison point: heavy Allied losses and prisoners across the campaign.</span><span>Your run: about ${formatNumber(losses.allied)} recorded losses.</span></div>
        <div class="debrief-row"><strong>Army condition</strong><span>Historical problem: speed worked only because the army kept moving.</span><span>Your army is ${armyConditionText()}.</span></div>
      </div>
      <span><b>Rating:</b> ${score} — ${rating}</span>
    </div>
  `;
}
