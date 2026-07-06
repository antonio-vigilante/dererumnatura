# De Rerum Natura — edizione digitale

Template [Astro](https://astro.build) per pubblicare un'edizione umanistica del
*De Rerum Natura* di Lucrezio, con **testo latino**, **traduzione italiana** e
**guida alla lettura**. Ogni brano è consultabile a schede (tab): Latino ·
Traduzione · Guida · Testo a fronte.

## Avvio

```bash
npm install
npm run dev      # anteprima su http://localhost:4321
npm run build    # genera il sito statico in dist/
npm run preview  # serve la build di produzione
```

## Struttura

```
src/
├── content/passi/        # un file .md per ogni brano (il "cuore" editoriale)
├── content.config.ts     # schema della collezione "passi"
├── components/           # Header, Footer, ColonnaVersi (versi + numerazione)
├── layouts/BaseLayout    # scheletro HTML, temi, testata/piè di pagina
├── pages/
│   ├── index.astro            # frontespizio + sommario dei brani
│   ├── passi/[...id]          # pagina del brano con le schede a tab
│   ├── indice.astro           # il poema: indice per libro
│   ├── indice-tematico.astro  # indice tematico (concordanza)
│   └── cerca.astro            # ricerca client-side (accenti-insensibile)
└── styles/global.css          # estetica umanistica + 3 temi di lettura
```

## Aggiungere un brano

Crea un file in `src/content/passi/`, es. `04-elogio-di-epicuro.md`:

```yaml
---
libro: 3
titolo: "Elogio di Epicuro"
versi: "1-30"
versoIniziale: 1
ordine: 4
sommario: "..."
temi: ["ataraxia", "sapientia"]
latino:
  - "E tenebris tantis tam clarum extollere lumen"
  - "..."            # un verso per riga, allineato all'italiano
italiano:
  - "Da tenebre così fitte primo a levare un lume così chiaro"
  - "..."
---

## Titolo della guida

Testo della **guida alla lettura** in Markdown (prosa, note, link…).
```

Gli array `latino` e `italiano` sono **allineati riga per riga**: il verso *n* del
latino corrisponde al verso *n* dell'italiano. Questo alimenta sia le schede sia la
vista a fronte e la numerazione (mostrata ogni 5 versi, a partire da `versoIniziale`).
Imposta `bozza: true` per escludere un brano dalla pubblicazione.

## Strumenti inclusi

| Strumento | Dove |
|---|---|
| Schede Latino / Traduzione / Guida / Testo a fronte | pagina del brano; le frecce ←→ scorrono i tab; l'ancora `#guida` apre il tab |
| Numerazione dei versi | automatica, ogni 5 versi |
| Navigazione prev/next tra i brani | fondo pagina del brano |
| Il poema: indice per libro | `/indice` |
| Indice tematico (concordanza) | `/indice-tematico` |
| Ricerca full-text (latino, traduzione, guide, temi) | `/cerca`, anche via `?q=` |
| Temi di lettura: papiro / sepia / notte | selettore nella testata, salvato in `localStorage` |
| Foglio di stile per la stampa | in stampa esce il testo a fronte |

## Personalizzazione rapida

- **Colori e temi**: variabili CSS in cima a `src/styles/global.css`.
- **Font**: importati da Google Fonts in `global.css` (Cormorant Garamond + EB
  Garamond). Per un sito offline, sostituiscili con font auto-ospitati.
- **Titoli dei libri**: in `src/pages/indice.astro` (`titoliLibri`).

## Idee di sviluppo

- Note a piè di pagina / marginalia cliccabili sui singoli versi.
- Audio della lettura metrica (esametro dattilico) per brano.
- Confronto di più traduzioni (es. storiche vs. di servizio).
- Concordanza lemmatizzata del testo latino.
- Ricerca avanzata con [Pagefind](https://pagefind.app/) per corpora ampi.
