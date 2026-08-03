/**
 * Registro dei nomi propri (persone, divinità, popoli) e dei luoghi citati
 * nel poema, usato per costruire l'Indice dei nomi e dei luoghi.
 *
 * Ogni voce ha una `chiave` univoca (minuscola), usata come ancora nella
 * pagina dell'indice e come riferimento nel marcatore inline dei versi:
 * si scrive `[[Testo]]` quando la forma nel verso coincide, a meno di
 * maiuscole/minuscole, con `chiave` (es. `[[Venere]]` → chiave "venere");
 * altrimenti si usa `[[Testo|chiave]]`, per forme diverse come un caso
 * latino declinato (es. `[[Veneris|venere]]`).
 */
export type CategoriaNome = 'persona' | 'divinita' | 'luogo' | 'popolo';

export const categorieNomi: { chiave: CategoriaNome; etichetta: string }[] = [
  { chiave: 'persona', etichetta: 'Persone' },
  { chiave: 'divinita', etichetta: 'Divinità' },
  { chiave: 'luogo', etichetta: 'Luoghi' },
  { chiave: 'popolo', etichetta: 'Popoli' },
];

export interface VoceNome {
  chiave: string;
  etichetta: string;
  tipo: CategoriaNome;
  nota?: string;
}

export const nomiLuoghi: VoceNome[] = [
  { chiave: 'venere', etichetta: 'Venere', tipo: 'divinita' },
  { chiave: 'marte', etichetta: 'Marte', tipo: 'divinita' },
  { chiave: 'memmio', etichetta: 'Memmio', tipo: 'persona' },
  { chiave: 'romani', etichetta: 'Romani', tipo: 'popolo' },
  { chiave: 'ifigenia', etichetta: 'Ifigenia', tipo: 'persona' },
  { chiave: 'ennio', etichetta: 'Ennio', tipo: 'persona' },
  { chiave: 'omero', etichetta: 'Omero', tipo: 'persona' },
  { chiave: 'acheronte', etichetta: 'Acheronte', tipo: 'luogo' },
  { chiave: 'elena', etichetta: 'Elena', tipo: 'persona' },
  { chiave: 'tindaro', etichetta: 'Tindaro', tipo: 'persona' },
  { chiave: 'troia', etichetta: 'Troia', tipo: 'luogo' },
  { chiave: 'eraclito', etichetta: 'Eraclito', tipo: 'persona' },
  { chiave: 'empedocle', etichetta: 'Empedocle', tipo: 'persona' },
  { chiave: 'agrigento', etichetta: 'Agrigento', tipo: 'luogo' },
  { chiave: 'sicilia', etichetta: 'Sicilia', tipo: 'luogo' },
  { chiave: 'ionio', etichetta: 'Ionio', tipo: 'luogo' },
  { chiave: 'eolia', etichetta: 'Eolia', tipo: 'luogo' },
  { chiave: 'cariddi', etichetta: 'Cariddi', tipo: 'luogo' },
  { chiave: 'etna', etichetta: 'Etna', tipo: 'luogo' },
  { chiave: 'pizia', etichetta: 'Pizia', tipo: 'persona' },
  { chiave: 'febo', etichetta: 'Febo (Apollo)', tipo: 'divinita' },
  { chiave: 'anassagora', etichetta: 'Anassagora', tipo: 'persona' },
  { chiave: 'epicuro', etichetta: 'Epicuro', tipo: 'persona' },
  { chiave: 'muse', etichetta: 'Muse', tipo: 'divinita' },
  { chiave: 'cilicia', etichetta: 'Cilicia', tipo: 'luogo' },
  { chiave: 'pancaia', etichetta: 'Pancaia', tipo: 'luogo' },
  { chiave: 'nettuno', etichetta: 'Nettuno', tipo: 'divinita' },
  { chiave: 'melibea', etichetta: 'Melibea', tipo: 'luogo' },
  { chiave: 'tessalia', etichetta: 'Tessalia', tipo: 'luogo' },
];
