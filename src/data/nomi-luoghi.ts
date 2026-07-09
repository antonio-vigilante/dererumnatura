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

];
