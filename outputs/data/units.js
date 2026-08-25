'use strict';

// Historical and estimated formation data used by the campaign.

const armyForces = {
  /*
    Strengths are editable starting strengths. They use historical order-of-battle figures where available:
    Army of Italy: 42,717 in the field, 64,356 total.
    Laharpe 8,614; Meynier 9,526; Augereau 10,117; Serurier 9,448.
    Cavalry: Stengel 3,090 and Kilmaine 1,778. Cervoni's Voltri force is shown as 5,000 from the campaign account.
  */
  french: [
    { id: "cervoni", side: "french", name: "Cervoni", role: "Voltri detachment", strength: 5000, location: { place: "Voltri", dx: -1.2, dy: 1.8 }, flag: "flag-france.png", visible: true },
    { id: "meynier", side: "french", name: "Meynier", role: "2nd Division at Savona", strength: 9526, location: { place: "Savona", dx: -1.4, dy: -1.4 }, flag: "flag-france.png", visible: true },
    { id: "laharpeCarcare", side: "french", name: "Laharpe", role: "Carcare-road brigade", strength: 4300, location: { place: "Carcare", dx: 1.1, dy: -1.4 }, flag: "flag-france.png", visible: true },
    { id: "laharpeSassello", side: "french", name: "Rampon", role: "Sassello/Monte Negino brigade", strength: 4314, location: { place: "MonteNegino", dx: -1.5, dy: -1.0 }, flag: "flag-france.png", visible: true },
    { id: "augereau", side: "french", name: "Augereau", role: "3rd Division farther west", strength: 10117, location: { place: "Montezemolo", dx: -1.6, dy: 2.1 }, flag: "flag-france.png", visible: true },
    { id: "serurier", side: "french", name: "Serurier", role: "4th Division at Ormea", strength: 9448, location: { place: "Ormea", dx: -1.7, dy: -1.0 }, flag: "flag-france.png", visible: true },
    { id: "stengel", side: "french", name: "Stengel", role: "Cavalry detachment", strength: 1545, location: { place: "Savona", dx: 1.5, dy: 1.6 }, flag: "flag-france.png", visible: true },
    { id: "kilmaine", side: "french", name: "Kilmaine", role: "Cavalry en route", strength: 1778, location: { place: "Savona", dx: 2.6, dy: 2.7 }, flag: "flag-france.png", visible: false }
  ],
  austrian: [
    { id: "beaulieu", side: "austrian", name: "Beaulieu", role: "Voltri column", strength: 3200, location: { place: "TurchinoPass", dx: .8, dy: -1.0 }, flag: "flag-austria.png", visible: false },
    { id: "pittoni", side: "austrian", name: "Pittoni", role: "Bocchetta column", strength: 4000, location: { place: "BocchettaPass", dx: .7, dy: -1.0 }, flag: "flag-austria.png", visible: false },
    { id: "argenteau", side: "austrian", name: "Argenteau", role: "Right wing", strength: 9000, location: { place: "Dego", dx: 1.5, dy: -1.3 }, flag: "flag-austria.png", visible: false },
    { id: "vukassovich", side: "austrian", name: "Vukassovich", role: "Dego support", strength: 4500, location: { place: "Ovada", dx: .8, dy: -1.1 }, flag: "flag-austria.png", visible: false }
  ],
  piedmont: [
    { id: "colli", side: "piedmont", name: "Colli", role: "Sardinian army", strength: 20000, location: { place: "Ceva", dx: 1.7, dy: -1.5 }, flag: "flag-piedmont.png", visible: false },
    { id: "provera", side: "piedmont", name: "Provera", role: "Austrian auxiliary", strength: 4000, location: { place: "Millesimo", dx: 1.6, dy: -1.3 }, flag: "flag-piedmont.png", visible: false }
  ]
};
