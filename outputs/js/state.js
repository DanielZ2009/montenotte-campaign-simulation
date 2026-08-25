'use strict';

// Mutable campaign state and cached DOM references.

let activeTurns = [openingTurn];

const initialState = {
  initiative: 48,
  supply: 42,
  morale: 46,
  coalitionCohesion: 72,
  austrianThreat: 56,
  sardinianPressure: 22,
  intelligenceAccuracy: 34,
  frenchConcentration: 38,
  alliedConcentration: 24,
  politicalPressure: 46,
  daysElapsed: 0
};

const initialMap = {
  f: { place: "Savona", dx: -1.2, dy: -1.4 },
  reports: ["Voltri", "Dego", "Ceva"],
  wedge: .1
};

let state = { ...initialState };

let phase = "intro";

let turnIndex = 0;

let history = [];

let lastTerrainFeedback = "";

let lastTerrainCorrect = false;

let lastChoiceLesson = "";

let lastCasualtyReport = "";

let lastBattleReport = null;

let finalOutcome = null;

let zoom = 1;

let dragState = null;

let locationDragState = null;

let reportDragState = null;

let suppressNextMapClick = false;

let unitState = {};

let routeEditor = { visible: false, active: false, savedName: "voltriToSavona", points: [] };

let locationEditor = { active: false, savedName: "Savona", point: null };

let reportEditor = { active: false, savedKey: "", point: null };

let repairPanelDock = "right";

let mapExpanded = false;

let briefingIndex = 0;

let mapReviewed = false;

let briefingFocusTimers = [];

let movementPlans = {};

let lastNarrativeEvent = null;

const savedMapKey = "montenottePrototypeMapRepairsV1";

const urlParams = new URLSearchParams(window.location.search);

const routeRepairEnabled = urlParams.get("dev") === "1" || urlParams.get("repair") === "1";

const els = {
  dateChip: document.getElementById("dateChip"),
  title: document.getElementById("stageTitle"),
  brief: document.getElementById("stageBrief"),
  choices: document.getElementById("choices"),
  evidence: document.getElementById("evidence"),
  journal: document.getElementById("journal"),
  back: document.getElementById("backBtn"),
  reset: document.getElementById("resetBtn"),
  debrief: document.getElementById("debriefBtn"),
  debugToggle: document.getElementById("debugToggleBtn"),
  advanceOne: document.getElementById("advanceOneBtn"),
  advanceThree: document.getElementById("advanceThreeBtn"),
  advanceDawn: document.getElementById("advanceDawnBtn"),
  advanceReport: document.getElementById("advanceReportBtn"),
  places: document.getElementById("placeLayer"),
  routes: document.getElementById("routeLayer"),
  routeEdit: document.getElementById("routeEditLayer"),
  locationEdit: document.getElementById("locationEditLayer"),
  reportEdit: document.getElementById("reportEditLayer"),
  movement: document.getElementById("movementLayer"),
  enemyMovement: document.getElementById("enemyMovementLayer"),
  terrain: document.getElementById("terrainLayer"),
  reports: document.getElementById("reportLayer"),
  wedge: document.getElementById("wedge"),
  units: document.getElementById("unitLayer"),
  mapViewport: document.querySelector(".map-wrap"),
  mapWrap: document.querySelector(".map-scroll"),
  mapCanvas: document.querySelector(".map-canvas"),
  zoomIn: document.getElementById("zoomInBtn"),
  zoomOut: document.getElementById("zoomOutBtn"),
  zoomFit: document.getElementById("zoomFitBtn"),
  zoomLevel: document.getElementById("zoomLevel"),
  routeName: document.getElementById("routeNameInput"),
  routeEditor: document.getElementById("routeEditor"),
  routeRepairToggle: document.getElementById("routeRepairToggle"),
  dockRepair: document.getElementById("dockRepairBtn"),
  routeSelect: document.getElementById("routeSelect"),
  startRoute: document.getElementById("startRouteBtn"),
  undoRoute: document.getElementById("undoRouteBtn"),
  deleteRoute: document.getElementById("deleteRouteBtn"),
  saveRoute: document.getElementById("saveRouteBtn"),
  copyRoute: document.getElementById("copyRouteBtn"),
  routeCopyOutput: document.getElementById("routeCopyOutput"),
  locationSelect: document.getElementById("locationSelect"),
  locationName: document.getElementById("locationNameInput"),
  startLocation: document.getElementById("startLocationBtn"),
  confirmLocation: document.getElementById("confirmLocationBtn"),
  deleteLocation: document.getElementById("deleteLocationBtn"),
  copyLocation: document.getElementById("copyLocationBtn"),
  locationCopyOutput: document.getElementById("locationCopyOutput"),
  reportSelect: document.getElementById("reportSelect"),
  reportLabel: document.getElementById("reportLabelInput"),
  reportSymbol: document.getElementById("reportSymbolInput"),
  startReport: document.getElementById("startReportBtn"),
  confirmReport: document.getElementById("confirmReportBtn"),
  copyReport: document.getElementById("copyReportBtn"),
  reportCopyOutput: document.getElementById("reportCopyOutput"),
  movementDecision: document.getElementById("movementDecisionSelect"),
  movementUnit: document.getElementById("movementUnitSelect"),
  movementStart: document.getElementById("movementStartSelect"),
  movementRoutes: document.getElementById("movementRoutesInput"),
  confirmMovement: document.getElementById("confirmMovementBtn"),
  copyMovement: document.getElementById("copyMovementBtn"),
  movementCopyOutput: document.getElementById("movementCopyOutput"),
  lockRepair: document.getElementById("lockRepairBtn"),
  copyAllRepair: document.getElementById("copyAllRepairBtn"),
  importRepair: document.getElementById("importRepairBtn"),
  repairDataInput: document.getElementById("repairDataInput"),
  repairDataOutput: document.getElementById("repairDataOutput"),
  briefingScreen: document.getElementById("briefingScreen"),
  briefingTitle: document.getElementById("briefingTitle"),
  briefingText: document.getElementById("briefingText"),
  briefingCards: document.getElementById("briefingCards"),
  briefingSkip: document.getElementById("briefingSkipBtn"),
  briefingNext: document.getElementById("briefingNextBtn"),
  briefingInspect: document.getElementById("briefingInspectBtn"),
  briefingOrders: document.getElementById("briefingOrdersBtn"),
  routeStatus: document.getElementById("routeEditorStatus"),
  bars: {
    initiative: [document.getElementById("initiativeBar"), document.getElementById("initiativeVal")],
    supply: [document.getElementById("supplyBar"), document.getElementById("supplyVal")],
    morale: [document.getElementById("moraleBar"), document.getElementById("moraleVal")],
    coalitionCohesion: [document.getElementById("coalitionCohesionBar"), document.getElementById("coalitionCohesionVal")],
    austrianThreat: [document.getElementById("austrianThreatBar"), document.getElementById("austrianThreatVal")],
    sardinianPressure: [document.getElementById("sardinianPressureBar"), document.getElementById("sardinianPressureVal")],
    intelligenceAccuracy: [document.getElementById("intelligenceAccuracyBar"), document.getElementById("intelligenceAccuracyVal")],
    frenchConcentration: [document.getElementById("frenchConcentrationBar"), document.getElementById("frenchConcentrationVal")],
    alliedConcentration: [document.getElementById("alliedConcentrationBar"), document.getElementById("alliedConcentrationVal")],
    politicalPressure: [document.getElementById("politicalPressureBar"), document.getElementById("politicalPressureVal")],
    daysElapsed: [document.getElementById("daysElapsedBar"), document.getElementById("daysElapsedVal")]
  }
};
