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
  rivista?: string;
  volume?: string;
  pagine?: string;
  luogo?: string;
  editore?: string;
}

export const bibliografia: VoceBibliografia[] = [
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
    // Da verificare: titolo e dettagli editoriali esatti del riferimento
    // "Sedley (2007, p. 66)" citato in 01_01-49.md.
    chiave: 'sedley2007',
    autore: 'David Sedley',
    anno: 2007,
    titolo: 'Creationism and Its Critics in Antiquity',
    tipo: 'libro',
    luogo: 'Berkeley',
    editore: 'University of California Press',
  },
];
