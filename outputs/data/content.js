'use strict';

// Briefing, officer, event, and enemy-doctrine content.

const officerVoices = [
  { name: "Massena", test: () => state.morale > 45 && state.supply > 24, line: "The men can march, General, but not forever. Give them a road and they will find the enemy." },
  { name: "Berthier", test: () => true, line: "The roads toward Carcare remain open, General, but every report is older than the feet that carried it." },
  { name: "Augereau", test: () => state.initiative > 45, line: "If we strike now, we may separate them before they unite." },
  { name: "Laharpe", test: () => state.austrianThreat > 45, line: "Argenteau is not a shadow on a map, General. If he comes by Dego, we must meet him on the road." },
  { name: "Serurier", test: () => state.sardinianPressure > 42, line: "Colli will yield ground slowly. The western roads must be pressed with order, not merely enthusiasm." },
  { name: "Berthier", test: () => state.alliedConcentration > 58, line: "Austrian and Sardinian couriers are crossing the hills. The coalition is trying to become one army again." },
  { name: "Massena", test: () => state.supply < 30, line: "Bread is becoming as decisive as bayonets, General. The columns will still move, but they will remember the march." }
];

const narrativeEvents = [
  {
    title: "A Storm Over The Passes",
    body: "Rain turns the mule tracks into mud. Couriers arrive late and artillery teams curse every bend in the road.",
    delta: { initiative: -3, supply: -2, alliedConcentration: 2 }
  },
  {
    title: "Courier At Midnight",
    body: "A courier reaches headquarters after midnight with a confused warning: Austrian officers have been seen riding between Dego and the upper Bormida roads.",
    delta: { intelligenceAccuracy: 3, austrianThreat: 2 }
  },
  {
    title: "A Local Guide Offers A Path",
    body: "A local guide claims he can lead a column around a blocked road. Berthier notes the route but warns that mountain knowledge is not the same as loyalty.",
    delta: { intelligenceAccuracy: 4, initiative: 1 }
  },
  {
    title: "Prisoner From An Austrian Patrol",
    body: "A captured patrolman says his officers argue about whether to hold Dego or support the Sardinians. The statement may be useful, or merely frightened talk.",
    delta: { intelligenceAccuracy: 5, coalitionCohesion: -2 }
  },
  {
    title: "Bridge Damaged On A Side Road",
    body: "Engineers report damage on a side road. The main column can continue, but any movement off the principal road will take longer.",
    delta: { initiative: -2, frenchConcentration: -2 }
  },
  {
    title: "A Village Provides Bread",
    body: "Local officials, eager to avoid requisition by force, provide bread and animals. The soldiers notice.",
    delta: { supply: 5, morale: 2 }
  }
];

const briefingSteps = [
  {
    title: "Army of Italy Headquarters, April 1796.",
    text: "General Bonaparte, you have assumed command of a hungry, underpaid army on a neglected front. Paris expects action. Your men expect bread. Your generals expect proof that their young commander is more than a political appointment. Before you stand two enemies: Beaulieu's Austrians and Colli's Sardinian-Piedmontese army. Together they outnumber you. Divided, they may be beaten.",
    cta: "Inspect French situation",
    cards: [
      ["Strategic Aim", "Separate Colli's Sardinian army from Beaulieu's Austrians, then force Sardinia toward peace."],
      ["Immediate Problem", "Your army is poor, hungry, and stretched from the coast into mountain roads. Speed helps; supply can break you."],
      ["Enemy Coalition", "Austria and Sardinia are allied, but their armies are not perfectly joined. Geography gives you a chance."]
    ]
  },
  {
    title: "Order Of Battle, General",
    text: "Your field army is about 42,700 men, with a larger administrative total above 64,000. The effective striking force is organized around Laharpe, Meynier, Augereau, Sérurier, and cavalry under Stengel and Kilmaine. Masséna acts as the key advance-guard commander in the central blow.",
    cta: "Inspect French forces",
    cards: [
      ["Masséna", "Advance guard and central operational energy; historically used in the Montenotte/Dego sequence."],
      ["Laharpe", "1st Division, about 8,614 men; the forward striking force around Montenotte and Dego."],
      ["Meynier", "2nd Division, about 9,526 men; supports the center around Savona, Carcare, and Dego."],
      ["Augereau", "3rd Division, about 10,117 men; pressure toward Millesimo, Ceva, and Colli."],
      ["Sérurier", "4th Division, about 9,448 men; western pressure from Ormea toward San Michele and Mondovì."],
      ["Stengel / Kilmaine", "Cavalry screens, scouts, and pursuit; useful but fragile in mountain roads."],
      ["Cervoni", "Voltri detachment, roughly 5,000; under Austrian pressure at the opening."]
    ]
  },
  {
    title: "Review Your Divisions",
    text: "General, inspect the dispositions. Cervoni is exposed at Voltri. Meynier is near Savona. Laharpe and Rampon guard the central mountain approaches. Augereau and Sérurier are farther west. These forces must act like one army, not separate flags on bad roads.",
    focus: "Savona",
    mapReview: true,
    focusSequence: ["Voltri", "Savona", "MonteNegino", "Montezemolo", "Ormea"],
    cta: "Inspect enemy reports",
    cards: [
      ["Savona", "Coastal base and vulnerable supply anchor."],
      ["Cadibona Pass", "Gate from the coast to the inland road network."],
      ["Carcare", "Operational hinge between Dego/Austria and Millesimo/Ceva/Sardinia."]
    ]
  },
  {
    title: "Known And Suspected Enemy Positions",
    text: "Fog of war applies. Beaulieu's Austrians are active near Voltri, moving through Turchino and Bocchetta. Argenteau may threaten Montenotte and Dego. Colli's Sardinians hold the western roads toward Ceva and Mondovì. Your reports are estimates, not omniscience.",
    focus: "Dego",
    focusSequence: ["Voltri", "Dego", "Ceva", "Mondovi"],
    cta: "Inspect roads and passes",
    cards: [
      ["Austrians", "Beaulieu, Sebottendorf, Pittoni, Argenteau, and Vukassovich threaten the east and northeast."],
      ["Sardinia-Piedmont", "Colli and Provera defend the western approaches and can reconnect with Austria if given time."],
      ["Objective", "Separate them, keep them separated, and make Sardinia believe Austria cannot restore the front."]
    ]
  },
  {
    title: "Inspect The Ground Before Orders",
    text: "General, inspect the roads, passes, supply line, and enemy reports. Look at Cadibona, Carcare, Dego, Millesimo, Ceva, Voltri, and the coastal road. When you are satisfied, issue first orders.",
    mapReview: true,
    requiresInspection: true,
    focus: "Carcare",
    focusSequence: ["Savona", "CadibonaPass", "Carcare", "Dego", "Ceva"],
    cta: "Issue first orders",
    cards: [
      ["Roads", "Movement follows roads, not straight lines."],
      ["Passes", "Cadibona, Turchino, and Bocchetta shape what armies can actually do."],
      ["Supply", "Savona and the coast keep the army alive, but staying there may lose the campaign."],
      ["Reports", "Enemy markers are uncertain until scouted or contacted."]
    ]
  }
];

const enemyCommandDoctrine = {
  beaulieu: "Beaulieu seeks to protect Austrian communications and reacts strongly to French attention around Voltri, Genoa, or Dego.",
  colli: "Colli protects Piedmont first. He cooperates with Austria, but retreats if the road to Turin appears endangered.",
  argenteau: "Argenteau attacks if the French center looks weak and withdraws if isolation threatens."
};
