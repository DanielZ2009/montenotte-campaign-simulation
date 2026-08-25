'use strict';

// Event wiring and application startup. All systems are loaded before this file.

els.back.addEventListener("click", back);
els.reset.addEventListener("click", reset);
els.advanceOne.addEventListener("click", () => advanceCampaignTime(1));
els.advanceThree.addEventListener("click", () => advanceCampaignTime(3));
els.advanceDawn.addEventListener("click", advanceUntilDawn);
els.advanceReport.addEventListener("click", () => advanceCampaignTime(2, "report"));
els.briefingSkip.addEventListener("click", skipBriefing);
els.briefingNext.addEventListener("click", advanceBriefing);
els.briefingInspect.addEventListener("click", inspectBriefingMap);
els.briefingOrders.addEventListener("click", finishBriefing);
els.zoomIn.addEventListener("click", () => setZoom(zoom + .5));
els.zoomOut.addEventListener("click", () => setZoom(zoom - .5));
els.zoomFit.addEventListener("click", toggleMapExpanded);
els.routeRepairToggle.addEventListener("click", toggleRouteRepairMode);
els.debugToggle.addEventListener("click", toggleDebugView);
els.dockRepair.addEventListener("click", toggleRepairDock);
els.routeSelect.addEventListener("change", event => loadRouteForRepair(event.target.value));
els.routeName.addEventListener("change", () => loadRouteForRepair(currentRouteName()));
els.startRoute.addEventListener("click", startRouteEditor);
els.undoRoute.addEventListener("click", undoRoutePoint);
els.deleteRoute.addEventListener("click", deleteRouteEditor);
els.saveRoute.addEventListener("click", saveRouteEditor);
els.copyRoute.addEventListener("click", copyRouteEditor);
els.locationSelect.addEventListener("change", event => loadLocationForRepair(event.target.value));
els.locationName.addEventListener("change", () => loadLocationForRepair(currentLocationName()));
els.startLocation.addEventListener("click", startLocationEditor);
els.confirmLocation.addEventListener("click", confirmLocationEditor);
els.deleteLocation.addEventListener("click", deleteLocationEditor);
els.copyLocation.addEventListener("click", copyLocationEditor);
els.reportSelect.addEventListener("change", event => loadReportForRepair(event.target.value));
els.reportLabel.addEventListener("input", drawReportEditor);
els.reportSymbol.addEventListener("input", drawReportEditor);
els.startReport.addEventListener("click", startReportEditor);
els.confirmReport.addEventListener("click", confirmReportEditor);
els.copyReport.addEventListener("click", copyReportEditor);
els.movementDecision.addEventListener("change", loadMovementRepair);
els.movementUnit.addEventListener("change", loadMovementRepair);
els.confirmMovement.addEventListener("click", confirmMovementRepair);
els.copyMovement.addEventListener("click", copyMovementRepair);
els.lockRepair.addEventListener("click", lockCurrentRepairs);
els.copyAllRepair.addEventListener("click", copyAllRepairData);
els.importRepair.addEventListener("click", importRepairData);
["pointerdown", "mousedown", "click"].forEach(type => {
  els.routeEditor.addEventListener(type, event => event.stopPropagation());
});
els.routeEditor.addEventListener("wheel", event => event.stopPropagation(), { passive: true });
els.mapCanvas.addEventListener("click", event => {
  if (suppressNextMapClick) {
    suppressNextMapClick = false;
    return;
  }
  if (!routeEditor.active && !locationEditor.active && !reportEditor.active) return;
  event.preventDefault();
  event.stopPropagation();
  if (locationEditor.active) recordLocationPoint(event);
  else if (reportEditor.active) recordReportPoint(event);
  else recordRoutePoint(event);
});
els.mapCanvas.addEventListener("pointermove", updateLocationDrag);
els.mapCanvas.addEventListener("mousemove", updateLocationDrag);
els.mapCanvas.addEventListener("pointermove", updateReportDrag);
els.mapCanvas.addEventListener("mousemove", updateReportDrag);
window.addEventListener("pointerup", finishLocationDrag);
window.addEventListener("pointercancel", finishLocationDrag);
window.addEventListener("mouseup", finishLocationDrag);
window.addEventListener("pointerup", finishReportDrag);
window.addEventListener("pointercancel", finishReportDrag);
window.addEventListener("mouseup", finishReportDrag);
els.mapWrap.addEventListener("pointerdown", event => {
  if (event.button !== 0) return;
  if (routeEditor.active || locationEditor.active || reportEditor.active) return;
  dragState = {
    x: event.clientX,
    y: event.clientY,
    left: els.mapWrap.scrollLeft,
    top: els.mapWrap.scrollTop
  };
  els.mapWrap.classList.add("dragging");
  els.mapWrap.setPointerCapture(event.pointerId);
});
els.mapWrap.addEventListener("pointermove", event => {
  if (!dragState) return;
  els.mapWrap.scrollLeft = dragState.left - (event.clientX - dragState.x);
  els.mapWrap.scrollTop = dragState.top - (event.clientY - dragState.y);
});
els.mapWrap.addEventListener("pointerup", event => {
  dragState = null;
  els.mapWrap.classList.remove("dragging");
  if (els.mapWrap.hasPointerCapture(event.pointerId)) els.mapWrap.releasePointerCapture(event.pointerId);
});
els.mapWrap.addEventListener("pointerleave", () => {
  dragState = null;
  els.mapWrap.classList.remove("dragging");
});
els.mapWrap.addEventListener("wheel", event => {
  event.preventDefault();
  const delta = event.deltaY < 0 ? .3 : -.3;
  zoomAt(delta, event.clientX, event.clientY);
}, { passive: false });
els.back.classList.add("hidden");
els.debrief.classList.add("hidden");

unitState = cloneUnitState();
activeTurns = [openingTurn];
applySavedMapData();
syncRepairDock();
populateRouteRepairCatalog();
populateLocationRepairCatalog();
populateReportRepairCatalog();
populateMovementRepairCatalog();
if (routeRepairEnabled) {
  els.routeRepairToggle.classList.remove("hidden");
  if (urlParams.get("dev") === "1") document.body.classList.add("debug-mode");
} else {
  els.routeRepairToggle.classList.add("hidden");
}
drawMapOverlay();
renderIntro();
renderBriefing();
