'use strict';

// Allied reactions and objective-driven operational plans.

function applyAlliedReaction(choice, days) {
  const label = choice.label.toLowerCase();
  let concentrationChange = days * 6;
  if (includesAny(label, ["wait", "pause", "defend", "reconnoitre"])) concentrationChange += 8;
  if (includesAny(label, ["east", "voltri", "genoa", "push west despite", "before securing"])) concentrationChange += 8;
  if (state.frenchConcentration < 38) concentrationChange += 8;
  if (state.supply < 30) concentrationChange += 5;
  if (state.morale < 32) concentrationChange += 5;
  if (choice.routes?.some(route => ["carcareToDego", "montenotteToDego", "carcareRoadToMontenotte"].includes(route))) concentrationChange -= 7;
  if (choice.routes?.some(route => ["millesimoToCeva", "cevaToMondovi", "ormeaToCeva"].includes(route)) && state.austrianThreat <= 42) concentrationChange -= 5;
  if (state.coalitionCohesion <= 35) concentrationChange -= 4;

  addState({
    daysElapsed: days,
    alliedConcentration: concentrationChange,
    austrianThreat: days * 2,
    sardinianPressure: days * -1
  });

  if (choice.routes?.some(route => ["carcareToDego", "montenotteToDego", "acquiToDego", "ovadaToDego"].includes(route))) {
    addState({ austrianThreat: -8, coalitionCohesion: -4 });
  }
  if (choice.routes?.some(route => ["carcareToMillesimo", "millesimoToCeva", "cevaToMondovi", "ormeaToCeva"].includes(route))) {
    addState({ sardinianPressure: 8, coalitionCohesion: -3 });
  }
  if (state.daysElapsed > 5 && state.coalitionCohesion > 45) addState({ alliedConcentration: 6, austrianThreat: 3 });
  if (state.daysElapsed > 8) addState({ supply: -4, morale: -2 });

  if (state.alliedConcentration >= 76 && state.frenchConcentration < 38) {
    revealUnits(["argenteau", "vukassovich", "colli", "provera"]);
    return "Allied concentration rises sharply: Austrian and Sardinian forces are close enough to threaten the French road system.";
  }
  if (state.alliedConcentration >= 60) return "Allied concentration is becoming dangerous. Reports suggest Austrian and Sardinian columns are recovering contact through the inland roads.";
  if (state.coalitionCohesion <= 35) return "Allied reaction is disjointed. The coalition is struggling to make Austria's and Sardinia's problems line up.";
  return "The Allies react during the elapsed time, probing roads and trying to rebuild contact.";
}

function enemyPlanFromState() {
  if (state.frenchConcentration <= 32 && state.alliedConcentration >= 52) {
    return {
      title: "Argenteau tests the French center",
      side: "austrian",
      location: "Montenotte",
      route: ["acquiToDego", "montenotteToDego"],
      reveal: ["argenteau"],
      moves: [{ id: "argenteau", to: { place: "Montenotte", dx: 1.4, dy: -1.1 } }],
      text: "Argenteau appears to have interpreted the French dispersal as an opening. Reports place Austrian troops probing toward Montenotte and Carcare.",
      responseHint: enemyCommandDoctrine.argenteau
    };
  }
  if (state.sardinianPressure >= 58 && state.austrianThreat > 44) {
    return {
      title: "Colli begins protecting the Turin road",
      side: "piedmont",
      location: "Ceva",
      route: ["millesimoToCeva", "cevaToMondovi"],
      reveal: ["colli"],
      moves: [{ id: "colli", to: { place: "Mondovi", dx: 1.6, dy: -1.4 } }],
      text: "Sardinian reports suggest Colli is less interested in a dramatic counterattack than preserving the road toward Turin.",
      responseHint: enemyCommandDoctrine.colli
    };
  }
  if (state.austrianThreat >= 62) {
    return {
      title: "Beaulieu tries to restore Austrian contact",
      side: "austrian",
      location: "Dego",
      route: ["ovadaToDego", "acquiToDego"],
      reveal: ["beaulieu", "vukassovich"],
      moves: [{ id: "vukassovich", to: { place: "Dego", dx: 2.4, dy: .8 } }],
      text: "Austrian movement is reported from the northeast. Beaulieu appears to be trying to rejoin the operational front rather than merely threaten the coast.",
      responseHint: enemyCommandDoctrine.beaulieu
    };
  }
  return null;
}
