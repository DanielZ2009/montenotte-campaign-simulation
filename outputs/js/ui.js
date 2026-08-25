'use strict';

// Primary screen rendering and instructor status display.

function toggleDebugView() {
  document.body.classList.toggle("debug-mode");
  const active = document.body.classList.contains("debug-mode");
  els.debugToggle.setAttribute("aria-pressed", active ? "true" : "false");
  els.debugToggle.textContent = active ? "Hide Instructor View" : "Instructor View";
}

function renderMeters() {
  Object.entries(state).forEach(([key, value]) => {
    const pair = els.bars[key];
    if (!pair) return;
    const [bar, label] = pair;
    if (!bar || !label) return;
    const score = key === "daysElapsed" ? Math.min(100, value * 10) : clamp(value);
    bar.style.width = `${score}%`;
    label.textContent = key === "daysElapsed" ? value.toFixed(1).replace(".0", "") : Math.round(clamp(value));
  });
}

function renderEvidence(turn) {
  const feedback = lastTerrainFeedback
    ? `<div class="terrain-note"><strong>Terrain feedback</strong><span>${lastTerrainFeedback}</span></div>`
    : "";
  const lesson = lastChoiceLesson
    ? `<div class="terrain-note"><strong>Staff assessment</strong><span>${lastChoiceLesson}</span></div>`
    : "";
  const losses = lastCasualtyReport
    ? `<div class="terrain-note"><strong>Casualty return</strong><span>${lastCasualtyReport}</span></div>`
    : "";
  els.evidence.innerHTML = `
    ${dispatchHtml(turn)}
    ${campaignStatusHtml()}
    ${battleReportHtml(lastBattleReport)}
    ${feedback}
    ${lesson}
    ${losses}
    ${enemyEventHtml(turn.enemyEvent)}
    ${forceLedgerHtml()}
    <div class="report-list">
      ${turn.reports.map(reportHtml).join("")}
    </div>
  `;
}

function renderIntro() {
  phase = "intro";
  els.dateChip.textContent = "Apr 1796";
  els.title.textContent = "Army Of Italy";
  els.brief.textContent = "The French Revolution has drawn France into war with Europe's monarchies, and the Italian front is one way the Republic tries to knock Sardinia-Piedmont out of the First Coalition. In April 1796, the Army of Italy is poorly supplied, politically pressured, and stretched along the Ligurian coast. Napoleon Bonaparte, a young artillery officer who rose during the Revolution and impressed the Directory after Toulon and the Paris uprising of 13 Vendemiaire, has just been given command. Your challenge is to do as well as, or better than, Napoleon: use roads, passes, speed, and imperfect information to break the coalition before it can concentrate.";
  els.choices.innerHTML = `<div class="terrain-note"><strong>Command briefing required</strong><span>Complete the headquarters briefing before issuing first orders.</span></div>`;
  els.evidence.innerHTML = `
    <p><span class="tag">Revolution</span>The war grows out of revolutionary France's struggle against monarchies that fear its ideas and armies.</p>
    <p><span class="tag">Napoleon</span>Bonaparte is talented and ambitious, but still unproven as an army commander. His opportunity is also a gamble.</p>
    <p><span class="tag">Goal</span>Reduce coalition cohesion while keeping enough supply and morale to keep moving.</p>
    ${forceLedgerHtml()}
  `;
  els.journal.innerHTML = "<p>The campaign journal will record terrain judgments, operational choices, and consequences.</p>";
  drawMovement([]);
  drawEnemyEvent(null);
  renderReports(startingReports);
  renderMeters();
}

function renderTurn() {
  if (turnIndex >= activeTurns.length) activeTurns = [makeCampaignTurn()];

  const turn = activeTurns[turnIndex];
  els.dateChip.textContent = campaignDateText();
  els.title.textContent = phase === "terrain" && turn.terrainQuestion
    ? `Read The Ground — ${campaignDateText()}`
    : `Army of Italy Headquarters — ${campaignDateText()}`;
  els.brief.textContent = phase === "terrain" && turn.terrainQuestion
    ? turn.terrainQuestion.prompt
    : `${turn.title}. ${turn.brief}`;
  renderEvidence(turn);
  renderReports(turn.reports);
  drawEnemyEvent(turn.enemyEvent);
  renderMeters();
  if (turn.date === "13-14 Apr") {
    setZoom(Math.max(zoom, 1.75));
    centerOn("Carcare");
  }

  if (phase === "terrain" && turn.terrainQuestion) {
    els.choices.innerHTML = "";
    turn.terrainQuestion.options.forEach(option => {
      const button = document.createElement("button");
      button.className = "choice";
      button.innerHTML = `<strong>${option.label}</strong><span>Make a terrain judgment before issuing orders.</span>`;
      button.addEventListener("click", () => answerTerrain(option));
      els.choices.appendChild(button);
    });
    return;
  }

  els.choices.innerHTML = "";
  turn.choices.forEach(choice => {
    const button = document.createElement("button");
    button.className = "choice";
    button.innerHTML = `<strong>${choice.label}</strong><span>${choice.rationale}</span>${orderSheetHtml(choice)}<small>Estimated execution time: ${timeCostText(choiceTimeCost(choice))}. Dispatch reports will describe the consequences.</small>`;
    button.addEventListener("click", () => chooseOperational(choice));
    els.choices.appendChild(button);
  });
}

function renderJournal() {
  if (!history.length) {
    els.journal.innerHTML = "<p>The campaign journal will record terrain judgments, operational choices, and consequences.</p>";
    return;
  }
  els.journal.innerHTML = history.map(item => `
    <div class="log-entry">
      <p><strong>${item.title}: ${item.label}</strong></p>
      <p>${item.result}</p>
      ${item.battleReport ? `<p><strong>${item.battleReport.date}, ${item.battleReport.location}:</strong> ${item.battleReport.result} Estimated losses: ${item.battleReport.losses}</p>` : ""}
    </div>
  `).join("");
}

function renderFinal(result = finalOutcome || campaignOutcome()) {
  phase = "final";
  result = result || {
    title: "Campaign Unresolved",
    military: "The campaign remains undecided. The French army is still operating, but no coalition-level decision has occurred.",
    lesson: "The important question is whether roads, passes, supply, and concentration are producing separation or allowing Allied recovery.",
    comparison: "Historically, Napoleon forced a decision quickly. A slower campaign gives Austria and Sardinia more chances to restore contact.",
    diagnosis: "Continue playing until Sardinia is separated from Austria or the French army is forced back."
  };
  els.dateChip.textContent = "Debrief";
  els.title.textContent = result.title;
  els.brief.textContent = result.military;
  els.choices.innerHTML = `<button class="choice" id="playAgain"><strong>Play Again</strong><span>Restart with the same map and different operational assumptions.</span></button>`;
  document.getElementById("playAgain").addEventListener("click", reset);
  els.evidence.innerHTML = `
    <div class="terrain-note"><strong>Major decisions</strong>${majorDecisionHtml()}</div>
    <div class="terrain-note"><strong>Geography lesson</strong><span>${result.lesson}</span></div>
    <div class="terrain-note"><strong>Historical comparison</strong><span>${result.comparison}</span></div>
    <div class="terrain-note"><strong>What your run shows</strong><span>${result.diagnosis}</span></div>
    ${historicalDebriefHtml(result)}
    <div class="terrain-note"><strong>Campaign badges</strong><div class="badge-row">${campaignBadges(result).map(([name, note]) => `<span class="campaign-badge" title="${note}">${name}</span>`).join("")}</div></div>
  `;
  renderMeters();
  renderJournal();
}
