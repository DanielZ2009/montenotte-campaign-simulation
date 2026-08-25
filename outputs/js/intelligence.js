'use strict';

// Fog-of-war reports and intelligence presentation.

function collectReportObjects(value, reports = [], seen = new WeakSet()) {
  if (!value || typeof value !== "object" || seen.has(value)) return reports;
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach(item => collectReportObjects(item, reports, seen));
    return reports;
  }
  if ("side" in value && "location" in value && "reliability" in value && "updated" in value) {
    reports.push(value);
  }
  Object.values(value).forEach(item => collectReportObjects(item, reports, seen));
  return reports;
}

function allReportObjects() {
  return collectReportObjects([startingReports, openingTurn, followUpTurns]);
}

function reportKey(report) {
  return `${report.side}::${report.location}::${report.label}`;
}

function reportByKey(key) {
  return allReportObjects().find(report => reportKey(report) === key);
}

function reportPoint(report) {
  if (Number.isFinite(report.x) && Number.isFinite(report.y)) return { x: report.x, y: report.y };
  return point(report.location);
}

function reportSymbol(report) {
  return report.symbol || (report.side === "Austrian" ? "Austrian?" : report.side === "Sardinian" ? "Sardinian?" : "Enemy?");
}

function reportBaseAgeDays(report) {
  if (report.updated === "today") return 0;
  if (report.updated === "yesterday") return 1;
  if (report.updated === "two days ago") return 2;
  return report.stale ? 1 : 0;
}

function reportAgeDays(report) {
  return reportBaseAgeDays(report) + state.daysElapsed;
}

function reportFreshness(report) {
  const age = reportAgeDays(report);
  if (age >= 2) return { label: "possibly obsolete", stale: true };
  if (age >= 1) return { label: "last reported position", stale: true };
  if (age >= .5) return { label: "aging report", stale: report.stale };
  return { label: "fresh report", stale: !!report.stale };
}

function reportProvenance(report) {
  const source = report.source || "unattributed report";
  if (source === "scout") return "Scout report";
  if (source === "local guide") return "Civilian/local guide report";
  if (source === "officer") return "Commander report";
  if (source === "captured dispatch") return "Captured dispatch";
  if (source === "distant firing") return "Distant firing";
  return source;
}

function reportForLocation(locationName, reportSet) {
  return reportSet.find(report => report.location === locationName);
}

function renderReports(reportSet) {
  els.reports.innerHTML = "";
  reportSet.forEach(report => {
    const loc = reportPoint(report);
    const freshness = reportFreshness(report);
    const group = svgEl("g", { class: `report${freshness.stale ? " stale" : ""}${report.label.includes("rumour") ? " rumour" : ""}`, "aria-label": `${report.label} ${report.location}` });
    const marker = svgEl("path", { "data-cx": loc.x, "data-cy": loc.y });
    const title = svgEl("title");
    title.textContent = `${reportProvenance(report)}: ${report.side}, ${report.estimate || "unknown strength"}, ${report.reliability} reliability, ${freshness.label}`;
    marker.appendChild(title);
    group.appendChild(marker);
    const letter = svgEl("text", { x: loc.x, y: loc.y });
    letter.textContent = freshness.stale && !report.symbol ? "?" : reportSymbol(report);
    group.appendChild(letter);
    els.reports.appendChild(group);
  });
  applyOverlayScale();
}

function reportHtml(report) {
  const freshness = reportFreshness(report);
  const stale = freshness.stale ? " This may be wrong, old, or already overtaken by enemy movement." : "";
  const source = ` Source: ${reportProvenance(report)}.`;
  return `
    <div class="report-card">
      <strong>${freshness.label}: ${report.location}</strong>
      <span>${report.side} report. Estimated strength: ${report.estimate || "unknown"}. Reliability: ${report.reliability}. Last updated: ${report.updated}; now ${campaignDateText()}.${source}</span>
      <span>${report.note}${stale}</span>
    </div>
  `;
}

function campaignStatusHtml() {
  const phrases = [];
  if (state.morale >= 60) phrases.push("The men are weary, but confidence is spreading through the ranks.");
  else if (state.morale <= 25) phrases.push("Officers report exhaustion, straggling, and bitter talk in several columns.");
  else phrases.push("The army is still obedient, though fatigue is visible on the marches.");

  if (state.supply <= 25) phrases.push("Several brigades report empty bread wagons and growing disorder among the pack animals.");
  else if (state.supply >= 55) phrases.push("The coastal magazines give the army some breathing room, provided the roads remain open.");
  else phrases.push("Supply is adequate for movement, but not for hesitation.");

  if (state.coalitionCohesion >= 62) phrases.push("Prisoners report increased communication between Austrian and Sardinian headquarters.");
  else if (state.coalitionCohesion <= 35) phrases.push("Reports suggest Austrian and Sardinian concerns are diverging.");

  if (state.frenchConcentration <= 30) phrases.push("Berthier warns that the French columns are becoming too separated for easy support.");
  else if (state.frenchConcentration >= 55) phrases.push("The divisions are close enough to support one another along the central roads.");

  if (state.politicalPressure >= 62) phrases.push("Paris grows impatient; the Directory expects proof that this neglected front can produce results.");
  return `
    <div class="status-phrases" aria-label="Narrative campaign status">
      ${phrases.slice(0, 4).map(text => `<div class="status-phrase">${text}</div>`).join("")}
    </div>
  `;
}

function enemyEventHtml(event) {
  if (!event) return "";
  return `
    <div class="terrain-note attack-card">
      <strong>Enemy action: ${event.title}</strong>
      <span>${event.text}</span>
      <span>${event.responseHint}</span>
    </div>
  `;
}

function campaignReports() {
  const reports = [
    { side: "Austrian", label: state.austrianThreat > 55 ? "reported Austrian pressure" : "Austrian force falling back", location: state.austrianThreat > 55 ? "Dego" : "Acqui", estimate: state.intelligenceAccuracy > 52 ? "several thousand" : "uncertain strength", reliability: state.intelligenceAccuracy > 50 ? "medium" : "low", updated: "today", source: state.intelligenceAccuracy > 55 ? "scout" : "distant firing", note: state.austrianThreat > 55 ? "Austrian forces may restore contact if not checked." : "Austrian movement appears east or northeast of Dego.", stale: state.intelligenceAccuracy < 35 },
    { side: "Sardinian", label: state.sardinianPressure > 50 ? "Sardinian line under pressure" : "reported Sardinian force", location: state.sardinianPressure > 50 ? "Mondovi" : "Ceva", estimate: state.intelligenceAccuracy > 55 ? "large but stretched" : "uncertain", reliability: state.intelligenceAccuracy > 45 ? "medium" : "low", updated: state.intelligenceAccuracy > 40 ? "today" : "yesterday", source: state.intelligenceAccuracy > 50 ? "captured dispatch" : "local guide", note: state.sardinianPressure > 50 ? "Political pressure on Turin is rising." : "Colli may still be able to coordinate with Austria.", stale: state.intelligenceAccuracy < 38 }
  ];
  if (state.alliedConcentration >= 62) {
    reports.push({ side: "Austrian", label: "coalition contact danger", location: "Carcare", estimate: "two allied forces nearing contact", reliability: "medium", updated: "today", source: "captured dispatch", note: "If French divisions are dispersed, a counterstroke is possible.", stale: false, symbol: "Contact?" });
  }
  return reports;
}
