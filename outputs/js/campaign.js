'use strict';

// Campaign clock, decisions, turn progression, and reset.

function makeCampaignTurn() {
  const highDanger = state.alliedConcentration >= 62;
  const enemyPlan = enemyPlanFromState();
  return {
    date: campaignDateText(),
    title: highDanger ? "Allied Concentration Danger" : enemyPlan ? "Enemy Intentions Shift" : "Campaign Continues",
    brief: highDanger
      ? "Reports suggest Austrian and Sardinian forces may be restoring contact. French concentration, supply, and morale now decide whether the army can keep operating inland."
      : enemyPlan
        ? "Enemy commanders are reacting to your orders. The reports are imperfect, but they no longer describe a passive coalition."
      : "The campaign has not yet reached a decision. Each day lets the French exploit roads and passes, but it also lets the Allies react.",
    enemyEvent: highDanger ? {
      title: "Coalition columns seek contact",
      side: "both",
      location: "Carcare",
      route: ["carcareToDego", "carcareToMillesimo"],
      reveal: ["argenteau", "colli", "provera"],
      moves: [
        { id: "argenteau", to: { place: "Dego", dx: 1.5, dy: -1.3 } },
        { id: "colli", to: { place: "Ceva", dx: 1.7, dy: -1.5 } },
        { id: "provera", to: { place: "Millesimo", dx: 1.6, dy: -1.3 } }
      ],
      text: "Allied movement is no longer just rumour. Austrian and Sardinian forces are trying to make the French central position untenable.",
      responseHint: "If French concentration, morale, or supply is weak, this can become a campaign-ending counterstroke."
    } : enemyPlan,
    reports: campaignReports(),
    choices: generatedChoices()
  };
}

function advanceCampaignTime(hours, mode = "time") {
  if (phase === "intro" || phase === "final") return;
  const days = hours / 24;
  const before = { ...state };
  addState({
    daysElapsed: days,
    alliedConcentration: Math.max(1, Math.round(hours / 3)),
    austrianThreat: hours >= 6 ? 2 : 1,
    intelligenceAccuracy: mode === "report" ? 3 : -Math.max(1, Math.round(hours / 6)),
    politicalPressure: hours >= 6 ? 2 : 0
  });
  Object.values(unitState).forEach(unit => {
    if (unit.side === "french") unit.fatigue = Math.max(0, (unit.fatigue || 0) - Math.round(hours / 3));
  });
  lastNarrativeEvent = mode === "report"
    ? { title: "Report Arrives", body: "Headquarters waits until another courier arrives. The new report clarifies one question while making yesterday's map less trustworthy." }
    : { title: "Time Passes", body: `${hours} hours pass at headquarters. Couriers move, enemy commanders react, and older reports become less certain.` };
  lastChoiceLesson = "No new operational order was issued. Waiting can rest tired columns, but it also gives the coalition time to interpret French intentions.";
  history.push({
    type: "time",
    title: campaignDateText(before.daysElapsed),
    label: mode === "report" ? "Advance until next report" : `Advance ${hours}h`,
    result: lastChoiceLesson,
    before
  });
  activeTurns = [makeCampaignTurn()];
  turnIndex = 0;
  phase = "decision";
  renderJournal();
  renderTurn();
}

function advanceUntilDawn() {
  const frac = state.daysElapsed - Math.floor(state.daysElapsed);
  const currentHour = (6 + frac * 24) % 24;
  const hours = currentHour < 6 ? 6 - currentHour : 30 - currentHour;
  advanceCampaignTime(Math.max(1, Math.round(hours)), "dawn");
}

function effectSummary(delta) {
  return Object.entries(delta).map(([key, value]) => `${labelFor(key)} ${value > 0 ? "+" : ""}${value}`).join(" | ");
}

function labelFor(key) {
  return {
    initiative: "Initiative",
    supply: "Supply",
    morale: "Morale",
    coalitionCohesion: "Coalition",
    austrianThreat: "Austrian Threat",
    sardinianPressure: "Sardinian Pressure",
    intelligenceAccuracy: "Intel",
    frenchConcentration: "French Concentration",
    alliedConcentration: "Allied Concentration",
    daysElapsed: "Days"
  }[key] || key;
}

function answerTerrain(option) {
  lastTerrainCorrect = option.correct;
  lastTerrainFeedback = option.feedback;
  lastBattleReport = null;
  if (option.correct) {
    state.intelligenceAccuracy = clamp(state.intelligenceAccuracy + 4);
    state.initiative = clamp(state.initiative + 2);
  } else {
    state.intelligenceAccuracy = clamp(state.intelligenceAccuracy - 3);
    state.coalitionCohesion = clamp(state.coalitionCohesion + 2);
  }
  history.push({
    type: "terrain",
    title: activeTurns[turnIndex].title,
    label: option.label,
    result: option.feedback,
    correct: option.correct
  });
  phase = "decision";
  renderJournal();
  renderTurn();
}

function chooseOperational(choice) {
  const before = { ...state };
  const days = choiceTimeCost(choice);
  addState(choice.delta);

  if (lastTerrainCorrect && choice.label.includes("rapidly")) state.initiative = clamp(state.initiative + 2);
  if (!lastTerrainCorrect && choice.label.includes("mountain")) state.supply = clamp(state.supply - 4);
  if (activeTurns[turnIndex].enemyEvent && (choice.scout || choice.label.includes("Defend") || choice.label.includes("Pause"))) {
    state.coalitionCohesion = clamp(state.coalitionCohesion + 4);
    state.morale = clamp(state.morale - 2);
  }
  const alliedReaction = applyAlliedReaction(choice, days);
  applyFatigueForChoice(choice, days);
  lastNarrativeEvent = chooseNarrativeEvent(choice);
  applyMovementPlansToChoice(choice);

  revealUnits(choice.reveal || []);
  lastCasualtyReport = applyCasualties(choice.casualties || []);
  lastBattleReport = createBattleReport(choice, activeTurns[turnIndex], days, choice.casualties || []);
  lastChoiceLesson = narrativeConsequence(choice, alliedReaction, days);
  history.push({
    type: "decision",
    title: activeTurns[turnIndex].title,
    label: choice.label,
    result: `${lastChoiceLesson}${lastBattleReport ? ` Battle report filed: ${lastBattleReport.title}.` : ""}`,
    battleReport: lastBattleReport,
    before
  });

  drawMovement(choice.routes);
  drawWedge(choice.map.wedge);
  renderReports(activeTurns[turnIndex].reports.filter(report => choice.map.reports.includes(report.location)));
  runUnitMoves(choice.unitMoves || [], choice.routes || []);

  finalOutcome = choice.outcome || campaignOutcome();
  if (finalOutcome) {
    renderJournal();
    renderFinal(finalOutcome);
    return;
  }

  if (choice.next && followUpTurns[choice.next]) {
    activeTurns = [openingTurn, followUpTurns[choice.next]];
    turnIndex = 1;
  } else {
    activeTurns = [makeCampaignTurn()];
    turnIndex = 0;
  }

  phase = activeTurns[turnIndex]?.terrainQuestion ? "terrain" : "decision";
  lastTerrainFeedback = "";
  lastTerrainCorrect = false;
  renderJournal();
  renderTurn();
}

function back() {
  reset();
}

function reset() {
  state = { ...initialState };
  phase = "intro";
  turnIndex = 0;
  history = [];
  lastTerrainFeedback = "";
  lastTerrainCorrect = false;
  lastChoiceLesson = "";
  lastCasualtyReport = "";
  lastBattleReport = null;
  lastNarrativeEvent = null;
  finalOutcome = null;
  briefingIndex = 0;
  mapReviewed = false;
  unitState = cloneUnitState();
  activeTurns = [openingTurn];
  els.briefingScreen.classList.remove("hidden", "map-review");
  drawMapOverlay();
  setZoom(1);
  renderIntro();
  renderBriefing();
}
