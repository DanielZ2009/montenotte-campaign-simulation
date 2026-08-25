'use strict';

// Player order generation and order-sheet presentation.

function generatedChoices() {
  const choices = [
    {
      label: "Re-concentrate at Carcare before continuing",
      rationale: "Gather divisions around the central junction so the Allies cannot defeat them separately.",
      effectText: "The army regains operational coherence but spends precious time.",
      timeCost: 1,
      delta: { initiative: -4, supply: -3, morale: 3, coalitionCohesion: 2, austrianThreat: -3, sardinianPressure: 0, intelligenceAccuracy: 4, frenchConcentration: 14, alliedConcentration: -8 },
      routes: ["savonaToCadibona", "carcareToDego", "carcareToMillesimo"],
      reveal: [],
      unitMoves: [
        { id: "meynier", to: { place: "Carcare", dx: -1.7, dy: 1.4 } },
        { id: "laharpeCarcare", to: { place: "Carcare", dx: 1.1, dy: -1.4 } },
        { id: "stengel", to: { place: "Carcare", dx: 1.4, dy: 1.4 } }
      ],
      casualties: [],
      map: { reports: ["Dego", "Ceva", "Carcare"], wedge: .55 },
      lesson: "In mountain warfare, concentration is a resource. Sometimes the best move is to repair the army's shape."
    },
    {
      label: "Secure Dego and drive Austrians northeast",
      rationale: "Push the Austrian side away from the Sardinian side before turning west.",
      effectText: "Austria loses the ability to rebuild the coalition front, though French supply thins.",
      timeCost: 1,
      delta: { initiative: 5, supply: -8, morale: 5, coalitionCohesion: -10, austrianThreat: -18, sardinianPressure: 2, intelligenceAccuracy: 1, frenchConcentration: 2, alliedConcentration: -10 },
      routes: ["carcareToDego", "acquiToDego"],
      reveal: ["argenteau", "vukassovich"],
      unitMoves: [
        { id: "laharpeCarcare", to: { place: "Dego", dx: -1.4, dy: 1.2 } },
        { id: "meynier", to: { place: "Dego", dx: -2.6, dy: -.5 } },
        { id: "argenteau", to: { place: "Acqui", dx: 1.2, dy: .9 } }
      ],
      casualties: [
        { id: "laharpeCarcare", loss: 450, note: "Dego fighting" },
        { id: "meynier", loss: 320, note: "Dego support" },
        { id: "argenteau", loss: 900, note: "retreat northeast" }
      ],
      map: { reports: ["Dego", "Ceva"], wedge: .7 },
      lesson: "Driving Austria northeast makes Sardinia's political problem worse."
    },
    {
      label: "Press Sardinia toward Mondovi and Cherasco",
      rationale: "Convert battlefield separation into pressure for peace before Austria can recover.",
      effectText: "Sardinia approaches political collapse, but the pursuit strains men and roads.",
      timeCost: 1,
      delta: { initiative: 7, supply: -9, morale: 4, coalitionCohesion: -12, austrianThreat: 3, sardinianPressure: 18, intelligenceAccuracy: -2, frenchConcentration: -4, alliedConcentration: -4 },
      routes: ["millesimoToCeva", "cevaToMondovi"],
      reveal: ["colli"],
      unitMoves: [
        { id: "augereau", to: { place: "Mondovi", dx: -1.5, dy: 1.3 } },
        { id: "serurier", to: { place: "SanMichele", dx: -1.8, dy: 1.5 } },
        { id: "colli", to: { place: "Mondovi", dx: 1.6, dy: -1.4 } }
      ],
      casualties: [
        { id: "augereau", loss: 320, note: "pursuit fighting" },
        { id: "serurier", loss: 280, note: "San Michele line" },
        { id: "colli", loss: 900, note: "withdrawal toward Mondovi" }
      ],
      map: { reports: ["Mondovi", "Dego"], wedge: .88 },
      lesson: "The aim is not simply westward movement; it is making Sardinia doubt Austria can still help."
    },
    {
      label: "Reconnoitre the roads before committing",
      rationale: "Improve intelligence along the Dego and Ceva branches.",
      effectText: "Information improves, but the Allies use the time as well.",
      timeCost: .5,
      delta: { initiative: -3, supply: -2, morale: 1, coalitionCohesion: 3, austrianThreat: 2, sardinianPressure: 0, intelligenceAccuracy: 16, frenchConcentration: 2, alliedConcentration: 5 },
      routes: ["carcareToDego", "carcareToMillesimo"],
      reveal: ["stengel"],
      unitMoves: [
        { id: "stengel", to: { place: "Carcare", dx: 1.4, dy: 1.4 } }
      ],
      casualties: [{ id: "stengel", loss: 60, note: "screening patrols" }],
      scout: true,
      map: { reports: ["Dego", "Ceva", "Millesimo"], wedge: .5 },
      lesson: "Better intelligence reduces uncertainty, but it does not freeze the enemy."
    },
    {
      label: "Defend the Savona supply base",
      rationale: "Recover supplies and morale by pulling closer to the coast.",
      effectText: "Supply improves, but the Allies gain room to reconnect inland.",
      timeCost: 1,
      delta: { initiative: -12, supply: 13, morale: 2, coalitionCohesion: 10, austrianThreat: 8, sardinianPressure: -8, intelligenceAccuracy: 3, frenchConcentration: -10, alliedConcentration: 12 },
      routes: ["savonaToCadibona"],
      reveal: [],
      unitMoves: [
        { id: "meynier", to: { place: "Savona", dx: -1.4, dy: -1.4 } },
        { id: "cervoni", to: { place: "Savona", dx: 1.8, dy: -2.0 } }
      ],
      casualties: [],
      map: { reports: ["Voltri", "Dego", "Ceva"], wedge: .18 },
      lesson: "The coast preserves the army, but it also returns the initiative to the coalition."
    }
  ];

  if (state.alliedConcentration >= 62) {
    choices.unshift({
      label: "Meet the Allied counterstroke at Carcare",
      rationale: "Stop Austrian and Sardinian columns from restoring contact at the central roads.",
      effectText: "The French accept a hard defensive fight to keep the coalition split.",
      timeCost: .5,
      delta: { initiative: 2, supply: -6, morale: 3, coalitionCohesion: -8, austrianThreat: -8, sardinianPressure: 2, intelligenceAccuracy: 2, frenchConcentration: 6, alliedConcentration: -14 },
      routes: ["carcareToDego", "carcareToMillesimo"],
      reveal: ["argenteau", "colli", "provera"],
      unitMoves: [
        { id: "meynier", to: { place: "Carcare", dx: -1.7, dy: 1.4 } },
        { id: "augereau", to: { place: "Millesimo", dx: -1.6, dy: 2.1 } },
        { id: "argenteau", to: { place: "Dego", dx: 1.5, dy: -1.3 } },
        { id: "colli", to: { place: "Ceva", dx: 1.7, dy: -1.5 } }
      ],
      casualties: [
        { id: "meynier", loss: 600, note: "Carcare counterstroke" },
        { id: "augereau", loss: 420, note: "western blocking action" },
        { id: "argenteau", loss: 700, note: "checked near Dego road" },
        { id: "colli", loss: 400, note: "failed contact" }
      ],
      map: { reports: ["Dego", "Ceva", "Carcare"], wedge: .45 },
      lesson: "When Allied concentration rises, survival may require fighting for the road hinge before pursuing victory."
    });
  }
  return choices.slice(0, 4);
}

function choiceDestination(choice) {
  const firstMove = (choice.unitMoves || []).find(move => unitState[move.id]?.side === "french") || choice.unitMoves?.[0];
  if (firstMove?.to?.place) return locations[firstMove.to.place]?.label || firstMove.to.place;
  if (choice.map?.reports?.length) return choice.map.reports.join(" / ");
  return "central roads";
}

function choiceAuthority(choice) {
  const label = choice.label.toLowerCase();
  if (label.includes("defend") || label.includes("hold")) return "Hold unless enemy presses hard";
  if (label.includes("reconnoitre")) return "Observe; avoid general action";
  if (label.includes("retreat") || label.includes("fall back")) return "Withdraw in order";
  if (label.includes("counterstroke") || label.includes("attack") || label.includes("strike")) return "Attack if local advantage appears";
  return "Engage only if road objective requires it";
}

function orderDelayText(choice) {
  const moved = (choice.unitMoves || []).filter(move => unitState[move.id]?.side === "french").length;
  const routeLoad = Math.max(1, (choice.routes || []).length);
  const hours = Math.max(1, Math.round(moved * .75 + routeLoad * .5));
  return `${hours}h courier and staff friction`;
}

function orderSheetHtml(choice) {
  return `
    <div class="order-sheet" aria-label="Order sheet">
      <dl>
        <dt>To</dt><dd>${frenchForcesFromChoice(choice)}</dd>
        <dt>Route</dt><dd>${(choice.routes || []).join(" -> ") || "road not specified"}</dd>
        <dt>Destination</dt><dd>${choiceDestination(choice)}</dd>
        <dt>Posture</dt><dd>${choicePosture(choice)}</dd>
        <dt>Authority</dt><dd>${choiceAuthority(choice)}</dd>
        <dt>Delay</dt><dd>${orderDelayText(choice)}</dd>
      </dl>
    </div>
  `;
}
