'use strict';

// Dispatches, officer voices, and narrative events.

function officerComments() {
  const available = officerVoices.filter(voice => voice.test());
  const count = state.alliedConcentration > 60 ? 2 : 1;
  return available.slice(0, count).map(voice => [`${voice.name}`, `“${voice.line}”`]);
}

function chooseNarrativeEvent(choice) {
  const seed = Math.abs(Math.floor((state.daysElapsed + choice.label.length + history.length) * 17));
  const event = narrativeEvents[seed % narrativeEvents.length];
  addState(event.delta);
  return event;
}

function stateDispatches(turn) {
  const lines = [];
  const date = campaignDateText();
  lines.push(["Dispatch from Headquarters", `${date}. General, reports reach us unevenly from the passes and valleys. The map is not yet the same thing as the truth.`]);
  if (lastNarrativeEvent) lines.push([lastNarrativeEvent.title, lastNarrativeEvent.body]);
  officerComments().forEach(line => lines.push(line));
  if (state.supply < 25) lines.push(["Quartermaster's note", "Bread and shoes are becoming a campaign question. Several battalions are still moving, but not without complaint."]);
  else if (state.supply > 55) lines.push(["Quartermaster's note", "The magazines near the coast are giving the army a little breathing room. Officers warn that this security will not follow every mountain road."]);
  const tiredFrench = Object.values(unitState).filter(unit => unit.side === "french" && (unit.fatigue || 0) >= 52);
  if (tiredFrench.length) lines.push(["Report on marching condition", `${tiredFrench.map(unit => unit.name).slice(0, 3).join(", ")} ${tiredFrench.length === 1 ? "is" : "are"} showing serious fatigue. Rapid orders may still work, but the army will pay for them.`]);
  if (state.morale < 30) lines.push(["Report from the columns", "Several officers report exhaustion and straggling. The men still obey, but the marches are biting deeply."]);
  else if (state.morale > 58) lines.push(["Report from the columns", "The soldiers are beginning to believe the enemy can be beaten in detail. Confidence is spreading faster than the rations."]);
  if (state.alliedConcentration > 65) lines.push(["Prisoner statement", "Captured men speak of couriers moving between Austrian and Sardinian headquarters. The coalition may be trying to restore contact."]);
  else if (state.coalitionCohesion < 35) lines.push(["Report from Massena", "The enemy answers slowly. Austrian and Sardinian concerns appear to be diverging."]);
  if (state.austrianThreat > 62) lines.push(["Report from local guides", "Guides insist Austrian detachments are active around the Dego and Acqui roads. Their numbers remain uncertain."]);
  if (state.sardinianPressure > 55) lines.push(["Rumour from Piedmont", "Merchants say Turin is anxious. If Colli cannot show Austrian support, politics may do what battle has begun."]);
  if (turn.enemyEvent) lines.push([`Dispatch: ${turn.enemyEvent.title}`, turn.enemyEvent.text]);
  return lines;
}

function dispatchHtml(turn) {
  return `
    <div class="report-list">
      ${stateDispatches(turn).map(([title, body]) => `
        <div class="report-card"><strong>${title}</strong><span>${body}</span></div>
      `).join("")}
    </div>
  `;
}

function narrativeConsequence(choice, alliedReaction, days) {
  const notes = [choice.effectText, choice.lesson, `The decision consumes ${timeCostText(days)}.`];
  if (alliedReaction) notes.push(alliedReaction);
  if (choice.scout) notes.push("Scouting clarifies some reports, but also reminds the staff how quickly yesterday's information goes stale.");
  return notes.filter(Boolean).join(" ");
}
