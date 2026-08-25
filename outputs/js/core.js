'use strict';

// Shared state, clock, and value helpers.

function clamp(value) {
  return Math.max(0, Math.min(100, value));
}

function addState(delta = {}) {
  const aliases = {
    cohesion: "coalitionCohesion",
    intel: "intelligenceAccuracy",
    pressure: "politicalPressure",
    frenchSupply: "supply",
    frenchMorale: "morale",
    sardinianThreat: "sardinianPressure"
  };
  Object.entries(delta).forEach(([key, value]) => {
    const stateKey = aliases[key] || key;
    if (!(stateKey in state)) return;
    state[stateKey] = stateKey === "daysElapsed"
      ? Math.max(0, state[stateKey] + value)
      : clamp(state[stateKey] + value);
  });
}

function campaignDateText(offset = state.daysElapsed) {
  const day = 10 + Math.floor(offset);
  const frac = offset - Math.floor(offset);
  const hour = Math.round((6 + frac * 24) % 24);
  return `${day} Apr ${String(hour).padStart(2, "0")}:00`;
}

function timeCostText(days) {
  if (days < .5) return `${Math.round(days * 24)} hours`;
  if (days === .5) return "half-day";
  if (days === 1) return "one day";
  return `${days} days`;
}

function choiceTimeCost(choice) {
  if (choice.timeCost !== undefined) return choice.timeCost;
  const label = choice.label.toLowerCase();
  if (choice.scout || label.includes("reconnoitre")) return .5;
  if (label.includes("wait") || label.includes("pause") || label.includes("defend")) return 1;
  if (label.includes("mountain") || label.includes("rapid")) return .5;
  if (label.includes("push west despite") || label.includes("protecting the genoa")) return 2;
  return 1;
}

function includesAny(text, words) {
  const lower = text.toLowerCase();
  return words.some(word => lower.includes(word));
}
