/**
 * Bibliografia critica citata nelle guide alla lettura.
 * Ogni voce ha una `chiave` univoca, usata come ancora: per citare un'opera
 * da una guida si scrive `[Autore anno](/bibliografia#chiave)`.
 */
export type TipoBibliografia = 'libro' | 'capitolo' | 'articolo';

export interface VoceBibliografia {
  chiave: string;
  autore: string;
  anno: number;
  titolo: string;
  tipo: TipoBibliografia;
  curatore?: string;
  raccolta?: string;
  rivista?: string;
  volume?: string;
  pagine?: string;
  luogo?: string;
  editore?: string;
}

export const bibliografia: VoceBibliografia[] = [
  {
    chiave: 'beretta2015',
    autore: 'Marco Beretta',
    anno: 2015,
    titolo: "La rivoluzione culturale di Lucrezio. Filosofia e scienza nell'antica Roma",
    tipo: 'libro',
    luogo: 'Roma',
    editore: 'Carocci',
  },
  {
    chiave: 'bignone1920',
    autore: 'Ernesto Bignone',
    anno: 1920,
    titolo: 'Le muse eraclitee in Lucrezio',
    tipo: 'capitolo',
    curatore: 'Aa.Vv.',
    raccolta: 'Miscellanea di studi critici in onore di Ettore Stampini',
    pagine: '229-231',
    luogo: 'Torino-Genova',
    editore: 'Lattes & C.',
  },
  {
    chiave: 'boyance1970',
    autore: 'Pierre Boyancé',
    anno: 1970,
    titolo: "Lucrezio e l'epicureismo",
    tipo: 'libro',
    luogo: 'Brescia',
    editore: 'Paideia',
  },
  {
    chiave: 'canfora1993',
    autore: 'Luciano Canfora',
    anno: 1993,
    titolo: 'Vita di Lucrezio',
    tipo: 'libro',
    luogo: 'Palermo',
    editore: 'Sellerio',
  },
  {
    chiave: 'farrell2020',
    autore: 'Joseph Farrell',
    anno: 2020,
    titolo: 'Was Memmius a Good King?',
    tipo: 'capitolo',
    curatore: "Donncha O'Rourke (ed.)",
    raccolta: 'Approaches to Lucretius. Traditions and Innovations in Reading the De Rerum Natura',
    pagine: '219-240',
    luogo: 'Cambridge',
    editore: 'Cambridge University Press',
  },
  {
    chiave: 'gerlo1956',
    autore: 'Aloïs Gerlo',
    anno: 1956,
    titolo: 'Pseudo-Lucretius?',
    tipo: 'articolo',
    rivista: '«L\'Antiquité Classique»',
    volume: 'T. 25, Fasc. 1',
    pagine: '41-72',
  },
  {
    chiave: 'giancotti1950',
    autore: 'Francesco Giancotti',
    anno: 1950,
    titolo: 'Il preludio di Lucrezio',
    tipo: 'libro',
    luogo: 'Messina-Firenze',
    editore: "D'Anna",
  },
  {
    chiave: 'nail2018',
    autore: 'Thomas Nail',
    anno: 2018,
    titolo: 'Lucretius I. An Ontology of Motion',
    tipo: 'libro',
    luogo: 'Edinburgh',
    editore: 'Edinburgh University Press',
  },
  {
    chiave: 'nail2020',
    autore: 'Thomas Nail',
    anno: 2020,
    titolo: 'Lucretius II. An Ethics of Motion',
    tipo: 'libro',
    luogo: 'Edinburgh',
    editore: 'Edinburgh University Press',
  },
  {
    chiave: 'nail2022',
    autore: 'Thomas Nail',
    anno: 2022,
    titolo: 'Lucretius III. A History of Motion',
    tipo: 'libro',
    luogo: 'Edinburgh',
    editore: 'Edinburgh University Press',
  },
  {
    chiave: 'nethercut2021',
    autore: 'Jason S. Nethercut',
    anno: 2021,
    titolo: 'Ennius Noster: Lucretius and the Annales',
    tipo: 'libro',
    luogo: 'Oxford',
    editore: 'Oxford University Press',
  },
  {
    chiave: 'nichols1976',
    autore: 'James H. Nichols',
    anno: 1976,
    titolo: 'Epicurean Political Philosophy. The De Rerum Natura of Lucretius',
    tipo: 'libro',
    luogo: 'Ithaca and London',
    editore: 'Cornell University Press',
  },
  {
    chiave: 'nussbaum1998',
    autore: 'Martha Nussbaum',
    anno: 1998,
    titolo: "Terapia del desiderio. Teoria e pratica nell'etica ellenistica",
    tipo: 'libro',
    luogo: 'Milano',
    editore: 'Vita e Pensiero',
  },
  {
    chiave: 'orourke2020',
    autore: "Donncha O'Rourke (a cura di)",
    anno: 2020,
    titolo:
      'Approaches to Lucretius. Traditions and Innovations in Reading the De Rerum Natura',
    tipo: 'libro',
    luogo: 'Cambridge',
    editore: 'Cambridge University Press',
  },
  {
    chiave: 'rebeggiani2019',
    autore: 'Stefano Rebeggiani',
    anno: 2019,
    titolo:
      "Roman Agamemnon. Political Echoes in the Proem to Lucretius' De rerum natura",
    tipo: 'articolo',
    rivista: '«Mnemosyne»',
    pagine: '1–23',
  },
  {
    chiave: 'sedley2007',
    autore: 'David Sedley',
    anno: 2007,
    titolo: 'The Empedoclean Opening',
    tipo: 'capitolo',
    curatore: 'Monica R. Gale (a cura di)',
    raccolta: 'Oxford Readings in Classical Studies. Lucretius',
    pagine: '49-87',
    luogo: 'Oxford',
    editore: 'Oxford University Press',
  },
  {
    chiave: 'segal1990',
    autore: 'Charles Segal',
    anno: 1990,
    titolo: 'Lucretius on Death and Anxiety. Poetry and Philosophy in De Rerum Natura',
    tipo: 'libro',
    luogo: 'Princeton',
    editore: 'Princeton University Press',
  },
  {
    chiave: 'vesperini2017',
    autore: 'P. Vesperini',
    anno: 2017,
    titolo: "Lucrèce. Archéologie d'un classique européenne",
    tipo: 'libro',
    luogo: 'Paris',
    editore: 'Fayard',
  },
];
