import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Collezione "passi": ogni file è un brano del De Rerum Natura.
 *
 * I campi `latino` e `italiano` sono array INDIPENDENTI: il numero di elementi
 * può (e di solito deve) essere diverso, perché un esametro dattilico non
 * corrisponde a un numero fisso di endecasillabi o di versi della traduzione.
 * Il "testo a fronte" mostra le due colonne affiancate con la propria
 * numerazione autonoma, come nelle edizioni bilingui cartacee di qualità.
 *
 * Il corpo Markdown del file contiene la "Guida alla lettura".
 */
const passi = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/passi' }),
  schema: z.object({
    libro: z.number().int().min(1).max(6),
    titolo: z.string(),
    // Intervallo dei versi latini nel canone, es. "1-43"
    versi: z.string(),
    // Numero del primo verso latino (per la numerazione a margine).
    versoIniziale: z.number().int().min(1).default(1),
    // Ordine di lettura all'interno del sito.
    ordine: z.number(),
    // Breve occhiello / sommario mostrato nell'indice.
    sommario: z.string().optional(),
    // Temi epicurei per l'indice tematico (concordanza).
    temi: z.array(z.string()).default([]),
    // Testo latino: un elemento per verso.
    latino: z.array(z.string()),
    // Traduzione italiana: un elemento per verso della traduzione.
    // Non deve essere allineato al latino: la lunghezza è indipendente.
    italiano: z.array(z.string()),
    // Numero del primo verso italiano (es. se la traduzione è numerata).
    // Se assente, la colonna italiana non mostra numeri di verso.
    versoInizialeIt: z.number().int().min(1).optional(),
    // Metadati editoriali facoltativi.
    fonteLatino: z.string().optional(),
    traduttore: z.string().optional(),
    bozza: z.boolean().default(false),
    // Note a piè di colonna: nel testo (latino o italiano) si segna il punto
    // da annotare con un richiamo inline "[n]"; qui si fornisce il testo
    // corrispondente. "lingua" indica a quale colonna appartiene il richiamo.
    note: z.array(z.object({
      n: z.number().int().min(1),
      lingua: z.enum(['la', 'it']).default('it'),
      testo: z.string(),
    })).default([]),
  }),
});

export const collections = { passi };
