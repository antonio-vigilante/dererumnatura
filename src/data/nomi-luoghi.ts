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
export type CategoriaNome = 'persona' | 'divinita' | 'luogo' | 'popolo' | 'creatura';

export const categorieNomi: { chiave: CategoriaNome; etichetta: string }[] = [
  { chiave: 'persona', etichetta: 'Persone' },
  { chiave: 'divinita', etichetta: 'Divinità' },
  { chiave: 'luogo', etichetta: 'Luoghi' },
  { chiave: 'popolo', etichetta: 'Popoli' },
  { chiave: 'creatura', etichetta: 'Creature mitologiche' },
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
  { chiave: 'cibele', etichetta: 'Cibele (Grande Madre)', tipo: 'divinita' },
  { chiave: 'giove', etichetta: 'Giove', tipo: 'divinita' },
  { chiave: 'saturno', etichetta: 'Saturno', tipo: 'divinita' },
  { chiave: 'cerere', etichetta: 'Cerere', tipo: 'divinita' },
  { chiave: 'bacco', etichetta: 'Bacco', tipo: 'divinita' },
  { chiave: 'cureti', etichetta: 'Cureti', tipo: 'divinita' },
  { chiave: 'galli', etichetta: 'Galli', tipo: 'persona', nota: 'sacerdoti della Grande Madre' },
  { chiave: 'ida', etichetta: 'Ida', tipo: 'luogo' },
  { chiave: 'creta', etichetta: 'Creta', tipo: 'luogo' },
  { chiave: 'alessandro', etichetta: 'Alessandro (Paride)', tipo: 'persona' },
  { chiave: 'orco', etichetta: 'Orco', tipo: 'divinita' },
  { chiave: 'trivia', etichetta: 'Trivia (Diana)', tipo: 'divinita' },
  { chiave: 'imeneo', etichetta: 'Imeneo', tipo: 'divinita' },
  { chiave: 'greci', etichetta: 'Greci', tipo: 'popolo' },
  { chiave: 'troiani', etichetta: 'Troiani', tipo: 'popolo' },
  { chiave: 'frigi', etichetta: 'Frigi', tipo: 'popolo' },
  { chiave: 'elicona', etichetta: 'Elicona', tipo: 'luogo' },
  { chiave: 'aulide', etichetta: 'Aulide', tipo: 'luogo' },
  { chiave: 'india', etichetta: 'India', tipo: 'luogo' },
  { chiave: 'chimera', etichetta: 'Chimera', tipo: 'creatura', nota: 'mostro ibrido dal respiro di fiamma' },
];
