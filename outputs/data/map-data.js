'use strict';

// Locked percentage-based locations, roads, and terrain definitions.

const locations = {
  Genoa: { x: 88.1, y: 59.4, labelDx: 1.1, labelDy: -0.6 },
  Voltri: { x: 76.4, y: 55.9, labelDx: 1, labelDy: -0.6 },
  TurchinoPass: { x: 74.9, y: 49.0, label: "Turchino Pass", labelDx: 1, labelDy: -0.6 },
  BocchettaPass: { x: 84.7, y: 41.7, label: "Bocchetta Pass", labelDx: 1, labelDy: -0.6 },
  Savona: { x: 57.1, y: 72.2, labelDx: 0.9, labelDy: 0.1 },
  CadibonaPass: { x: 49.4, y: 68.9, label: "Cadibona Pass", labelDx: -7.6, labelDy: 0.4 },
  Montenotte: { x: 44.5, y: 60.2, labelDx: 0.9, labelDy: -0.6 },
  MonteNegino: { x: 54.6, y: 65.2, label: "Monte Negino", labelDx: 0.9, labelDy: -0.7 },
  Sassello: { x: 58.6, y: 49.9, labelDx: 0.9, labelDy: -0.5 },
  Carcare: { x: 45.2, y: 65.7, labelDx: 0.9, labelDy: 0.2 },
  Cairo: { x: 44.5, y: 59.4, labelDx: 0.9, labelDy: -0.5 },
  Dego: { x: 46.8, y: 54.2, labelDx: 0.9, labelDy: -0.5 },
  Millesimo: { x: 39.7, y: 64.8, labelDx: -6.2, labelDy: -0.4 },
  Montezemolo: { x: 35.5, y: 63.1, labelDx: -6.5, labelDy: 0.2 },
  Ceva: { x: 28.4, y: 61.9, labelDx: -2.8, labelDy: -0.4 },
  Ormea: { x: 20.0, y: 93.5, labelDx: 0.9, labelDy: -0.5 },
  Mondovi: { x: 14.0, y: 60.8, labelDx: 0.9, labelDy: -0.5 },
  SanMichele: { x: 19.8, y: 63.5, label: "San Michele", labelDx: 0.9, labelDy: -0.5 },
  Cherasco: { x: 16.8, y: 27.3, labelDx: 0.9, labelDy: -0.5 },
  Acqui: { x: 57.2, y: 23.7, labelDx: 0.8, labelDy: -0.5 },
  Ovada: { x: 69.0, y: 28.9, labelDx: 0.8, labelDy: -0.5 },
  BormidaValley: { x: 46.6, y: 45.3, label: "Bormida Valley", labelDx: 1, labelDy: -1.1 },
  CoastRoad: { x: 70.4, y: 67.0, label: "Coast Road", labelDx: 1, labelDy: -.7 }
};

const routes = {
  mondoviToSanMichele: [
    { x: 14.0, y: 61.1 },
    { x: 15.1, y: 66.0 },
    { x: 19.7, y: 63.8 }
  ],
  voltriToSavona: [
    { x: 76.8, y: 55.5 },
    { x: 73.4, y: 57.9 },
    { x: 70.4, y: 60.2 },
    { x: 67.3, y: 63.5 },
    { x: 64.2, y: 65.3 },
    { x: 61.8, y: 67.9 },
    { x: 59.0, y: 70.2 },
    { x: 57.2, y: 72.3 }
  ],
  turchinoToVoltri: [
    { x: 74.8, y: 49.0 },
    { x: 76.4, y: 56.2 }
  ],
  savonaToCadibona: [
    { x: 58.1, y: 72.1 },
    { x: 49.4, y: 69.1 }
  ],
  cadibonaToMontenotte: [
    { x: 49.4, y: 69.1 },
    { x: 45.8, y: 66.2 },
    { x: 44.5, y: 60.3 }
  ],
  carcareRoadToMontenotte: [
    { x: 45.4, y: 66.2 },
    { x: 44.5, y: 60.4 }
  ],
  sasselloRoadToMontenotte: [
    { x: 58.6, y: 50.0 },
    { x: 57.9, y: 53.8 },
    { x: 57.9, y: 57.0 },
    { x: 58.7, y: 60.6 },
    { x: 54.7, y: 65.3 }
  ],
  montenotteToDego: [
    { x: 44.6, y: 60.4 },
    { x: 46.1, y: 57.1 },
    { x: 46.9, y: 53.9 }
  ],
  carcareToDego: [
    { x: 45.2, y: 66.0 },
    { x: 44.4, y: 60.4 },
    { x: 45.8, y: 56.9 },
    { x: 46.7, y: 53.7 }
  ],
  acquiToDego: [
    { x: 57.3, y: 23.8 },
    { x: 55.4, y: 24.3 },
    { x: 54.1, y: 24.9 },
    { x: 50.5, y: 26.3 },
    { x: 50.0, y: 30.3 },
    { x: 49.6, y: 33.9 },
    { x: 49.2, y: 37.2 },
    { x: 48.7, y: 40.9 },
    { x: 46.3, y: 50.4 },
    { x: 46.8, y: 54.5 }
  ],
  bocchettaToVoltri: [
    { x: 84.7, y: 41.7 },
    { x: 82.4, y: 45.1 },
    { x: 79.7, y: 50.2 },
    { x: 76.4, y: 55.9 }
  ],
  ovadaToDego: [
    { x: 69.0, y: 29.0 },
    { x: 66.9, y: 31.2 },
    { x: 63.7, y: 33.6 },
    { x: 61.3, y: 36.9 },
    { x: 59.6, y: 39.5 },
    { x: 57.7, y: 40.2 },
    { x: 55.4, y: 40.7 },
    { x: 57.0, y: 43.5 },
    { x: 54.5, y: 47.1 },
    { x: 53.7, y: 48.3 },
    { x: 53.8, y: 51.1 },
    { x: 54.2, y: 53.4 },
    { x: 51.7, y: 52.4 },
    { x: 49.5, y: 53.0 },
    { x: 46.8, y: 54.2 }
  ],
  carcareToMillesimo: [
    { x: 45.2, y: 66.0 },
    { x: 39.8, y: 65.0 }
  ],
  millesimoToMontezemolo: [
    { x: 39.7, y: 65.1 },
    { x: 37.1, y: 65.5 },
    { x: 35.6, y: 63.3 }
  ],
  millesimoToCeva: [
    { x: 39.8, y: 65.2 },
    { x: 36.4, y: 65.7 },
    { x: 34.1, y: 63.2 },
    { x: 29.3, y: 63.7 },
    { x: 28.2, y: 61.9 }
  ],
  ormeaToCeva: [
    { x: 20.0, y: 93.8 },
    { x: 20.4, y: 92.8 },
    { x: 23.5, y: 91.7 },
    { x: 25.0, y: 89.3 },
    { x: 26.2, y: 88.0 },
    { x: 27.0, y: 85.3 },
    { x: 27.2, y: 81.2 },
    { x: 28.2, y: 76.2 },
    { x: 29.6, y: 69.3 },
    { x: 29.9, y: 64.8 },
    { x: 28.0, y: 61.9 }
  ],
  cevaToMondovi: [
    { x: 28.6, y: 61.8 },
    { x: 23.6, y: 60.1 },
    { x: 21.5, y: 59.7 },
    { x: 18.3, y: 57.6 },
    { x: 16.3, y: 57.3 },
    { x: 14.1, y: 61.1 }
  ]
};

const routeRepairCatalog = [
  { id: "voltriToSavona", label: "Coastal road: Voltri to Savona", note: "Cervoni withdrawal and coast movement." },
  { id: "turchinoToVoltri", label: "Turchino Pass road to Voltri", note: "Beaulieu/Sebottendorf approach." },
  { id: "bocchettaToVoltri", label: "Bocchetta Pass road to Voltri", note: "Pittoni approach." },
  { id: "savonaToCadibona", label: "Savona to Cadibona Pass", note: "Main inland gate from the coast." },
  { id: "cadibonaToMontenotte", label: "Cadibona Pass to Montenotte", note: "French concentration toward the seam." },
  { id: "carcareRoadToMontenotte", label: "Carcare road to Montenotte / Monte Negino", note: "Laharpe/Massena central attack route." },
  { id: "sasselloRoadToMontenotte", label: "Sassello road to Monte Negino / Montenotte", note: "Rampon/Laharpe forward line." },
  { id: "montenotteToDego", label: "Montenotte to Dego", note: "Austrian side after Montenotte." },
  { id: "carcareToDego", label: "Carcare to Dego road", note: "Central hinge toward the Austrian side." },
  { id: "ovadaToDego", label: "Ovada to Dego road", note: "Austrian approach/counter-move toward Dego." },
  { id: "acquiToDego", label: "Acqui to Dego road", note: "Austrian road from the northeast." },
  { id: "carcareToMillesimo", label: "Carcare to Millesimo road", note: "Western branch toward Colli and Provera." },
  { id: "millesimoToMontezemolo", label: "Millesimo to Montezemolo road", note: "Western mountain road." },
  { id: "millesimoToCeva", label: "Millesimo to Ceva road", note: "Pressure route toward Colli." },
  { id: "ormeaToCeva", label: "Ormea to Ceva road", note: "Serurier's western approach." },
  { id: "cevaToMondovi", label: "Ceva to Mondovi road", note: "Late Sardinian pressure route." },
  { id: "mondoviToSanMichele", label: "Mondovi to San Michele road", note: "Corsaglia/San Michele line." }
];

const locationRepairCatalog = [
  "Genoa", "Voltri", "TurchinoPass", "BocchettaPass", "Savona", "CadibonaPass",
  "Montenotte", "MonteNegino", "Sassello", "Carcare", "Cairo", "Dego",
  "Millesimo", "Montezemolo", "Ceva", "Ormea", "Mondovi", "SanMichele",
  "Cherasco", "Acqui", "Ovada", "BormidaValley"
];

const terrainFeatures = [
  {
    id: "cadibona",
    title: "Cadibona Pass",
    location: "CadibonaPass",
    kind: "topographic",
    note: "The pass is the gate from Savona into the mountain roads. Whoever moves through it quickly can concentrate inland; whoever loses it risks being pinned to the coast."
  },
  {
    id: "turchino",
    title: "Turchino Pass",
    location: "TurchinoPass",
    kind: "topographic",
    note: "One of Beaulieu's coastal approaches toward Voltri. It matters because pressure here can pull French attention eastward along the coast."
  },
  {
    id: "bocchetta",
    title: "Bocchetta Pass",
    location: "BocchettaPass",
    kind: "topographic",
    note: "Another Austrian approach toward Voltri and Genoa. It is a road-and-pass problem, not simply a battlefield point."
  },
  {
    id: "bormida",
    title: "Bormida Valley",
    location: "BormidaValley",
    kind: "topographic",
    note: "The valley roads connect Montenotte, Cairo, Carcare, and Dego. They are the operating space where French divisions can split the allied armies."
  },
  {
    id: "carcare",
    title: "Carcare Junction",
    location: "Carcare",
    note: "Carcare is a road junction between the Austrian side near Dego and the Sardinian side near Millesimo and Ceva. It is a useful way to teach coalition separation."
  }
];
