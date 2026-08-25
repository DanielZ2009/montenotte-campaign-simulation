'use strict';

// Interactive headquarters briefing flow.

function renderBriefing() {
  briefingFocusTimers.forEach(timer => window.clearTimeout(timer));
  briefingFocusTimers = [];
  const step = briefingSteps[briefingIndex];
  els.briefingScreen.classList.toggle("map-review", !!step.mapReview);
  if (!step.mapReview && mapExpanded) toggleMapExpanded();
  els.briefingTitle.textContent = step.title;
  els.briefingText.textContent = step.text;
  els.briefingCards.innerHTML = step.cards.map(([title, body]) => `
    <div class="briefing-unit"><strong>${title}</strong><span>${body}</span></div>
  `).join("");
  els.briefingNext.classList.remove("hidden");
  els.briefingNext.textContent = step.cta || "Continue";
  els.briefingInspect.classList.add("hidden");
  els.briefingOrders.classList.add("hidden");
  if (step.focus) {
    setZoom(Math.max(zoom, step.mapReview ? 1.4 : 1.25));
    centerOn(step.focus);
    if (step.mapReview && !mapExpanded) toggleMapExpanded();
  }
  if (step.focusSequence) {
    if (!mapExpanded) toggleMapExpanded();
    step.focusSequence.forEach((place, index) => {
      briefingFocusTimers.push(window.setTimeout(() => centerOn(place), 700 + index * 950));
    });
  }
}

function advanceBriefing() {
  if (briefingSteps[briefingIndex]?.requiresInspection) {
    finishBriefing();
    return;
  }
  briefingIndex = Math.min(briefingSteps.length - 1, briefingIndex + 1);
  renderBriefing();
}

function inspectBriefingMap() {
  mapReviewed = true;
  els.briefingInspect.classList.add("hidden");
  els.briefingOrders.classList.remove("hidden");
  if (!mapExpanded) toggleMapExpanded();
  updateRouteStatus("Briefing inspection active. Review roads, passes, supply, and enemy reports, then issue first orders.");
}

function finishBriefing() {
  els.briefingScreen.classList.add("hidden");
  if (mapExpanded) toggleMapExpanded();
  phase = "decision";
  renderTurn();
}

function skipBriefing() {
  mapReviewed = true;
  briefingIndex = briefingSteps.length - 1;
  finishBriefing();
}
