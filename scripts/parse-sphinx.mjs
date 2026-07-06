// Parser deterministico per i file MyST (tab-set) del progetto Sphinx "lucrezio",
// per la migrazione verso il formato YAML del sito Astro "dererumnatura".
//
// Principio guida: MAI generare testo. Ogni carattere del testo latino/italiano/guida/note
// nell'output proviene da una sottostringa del sorgente. Quando qualcosa non è
// interpretabile in modo inequivocabile, viene segnalato in `problemi`, non indovinato.

import fs from 'node:fs';

const ROMANI = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6 };

function stripInvisibili(s) {
  // U+200B (zero width space) e simili, trovati nei sorgenti per errori di copia-incolla.
  return s.replace(/[​‌‍﻿]/g, '');
}

// Refusi noti del tag di numerazione, verificati a mano nel sorgente
// (es. "<up>75</sup>", "<suyp>270</sup>", "<sip>870</sup>"): sono errori di
// battitura sul tag, non sul contenuto — li tollero solo qui.
const APERTURA_SUP = '(?:<sup>|<up>|<suyp>|<sip>)';

function trasformaEtichetta(labelGrezza, problemi, ctx) {
  const label = labelGrezza.replace(/\\/g, '').replace(/\s+/g, '').trim();
  let m;
  if ((m = /^\[(\d+)\]$/.exec(label))) return m[1];
  if ((m = /^(\d+)\[(\d+)\]$/.exec(label))) return `${m[1]} (${m[2]})`;
  if (/^\d+$/.test(label)) return label;
  problemi.push(`${ctx}: etichetta <sup> non riconosciuta: "${labelGrezza}" — mantenuta cosi' com'e'`);
  return label;
}

// Richiamo di nota inline, in forme diverse (anche con tag <sup> mancante,
// bug presente in alcuni file): "<sup>nota</sup>", "<sup><span ...>nota</span></sup>",
// "<span ...>nota</span></sup>". Va rimosso e sostituito da "[n]".
const reNotaInline = /(?:<sup>)?(?:<span[^>]*>)?nota(?:<\/span>)?<\/sup>/gi;

function parseColonna(testoBlocco, lingua, problemi, fileLabel, contatoreNote, tabellaNote) {
  const righe = stripInvisibili(testoBlocco).split('\n');
  const versi = [];
  let fineMarcatore = false;
  const reMarcatore = new RegExp(`^${APERTURA_SUP}([^<]*)<\\/sup>\\s*(.*)$`);
  const reTagRotto = /<\/?su?p?>/i;
  const noteUsate = [];

  for (const rigaGrezza of righe) {
    let riga = rigaGrezza.replace(/\s+$/, ''); // via gli spazi (incl. hard-break "  ") a fine riga
    if (riga.trim() === '') continue;
    if (/^\\?\*\\?\*\\?\*\s*$/.test(riga.trim())) {
      fineMarcatore = true;
      continue;
    }
    riga = riga.trim();

    // Richiami di nota inline: sostituiti con [n], consumando in ordine le
    // righe della tabella "Note al testo" per QUESTA colonna.
    riga = riga.replace(reNotaInline, () => {
      const idx = contatoreNote.n++;
      const voce = tabellaNote[idx];
      if (!voce) {
        problemi.push(`${fileLabel} [${lingua}]: richiamo di nota inline senza riga corrispondente nella tabella (indice ${idx})`);
        return '';
      }
      noteUsate.push({ n: noteUsate.length + 1, lingua, testo: voce.testo, passo: voce.passo });
      return `[${noteUsate.length}]`;
    });

    const m = reMarcatore.exec(riga);
    if (m) {
      const etichetta = trasformaEtichetta(m[1], problemi, `${fileLabel} [${lingua}]`);
      const testo = m[2].trimStart();
      versi.push(`{${etichetta}}${testo}`);
    } else {
      if (reTagRotto.test(riga)) {
        problemi.push(`${fileLabel} [${lingua}]: tag <sup> sospetto/malformato nella riga: "${riga}"`);
      }
      versi.push(riga);
    }
  }
  return { versi, fineMarcatore, noteUsate };
}

function estraiTabSet(testo) {
  const righe = testo.split('\n');
  const tabs = {};
  let etichettaCorrente = null;
  let buffer = [];
  let dentroTabSet = false;

  for (const riga of righe) {
    const t = riga.trim();
    if (/^:::+\{tab-set\}/.test(t)) {
      dentroTabSet = true;
      continue;
    }
    if (!dentroTabSet) continue;
    const mItem = /^:::\{tab-item\}\s*(.+)$/.exec(t);
    if (mItem) {
      etichettaCorrente = mItem[1].trim();
      buffer = [];
      continue;
    }
    if (t === ':::') {
      if (etichettaCorrente) tabs[etichettaCorrente] = buffer.join('\n');
      etichettaCorrente = null;
      buffer = [];
      continue;
    }
    if (t === '::::') {
      dentroTabSet = false;
      continue;
    }
    if (etichettaCorrente) buffer.push(riga);
  }
  return tabs;
}

function estraiNote(testoDopoTabSet) {
  const m = /## Note al testo\s*\n\s*\|\s*Passo\s*\|\s*Nota\s*\|\s*\n\|[-\s|]+\|\s*\n([\s\S]*?)(?:\n##|\n*$)/.exec(
    testoDopoTabSet
  );
  if (!m) return [];
  const righe = m[1].split('\n').filter((r) => r.trim().startsWith('|'));
  const note = [];
  for (const riga of righe) {
    // Non tutte le righe della tabella hanno la pipe di chiusura finale
    // (refuso nel sorgente): tolgo solo le celle vuote ai due estremi,
    // non semplicemente la prima/ultima posizione.
    const celle = riga.split('|').map((c) => c.trim());
    if (celle[0] === '') celle.shift();
    if (celle[celle.length - 1] === '') celle.pop();
    if (celle.length < 2) continue;
    const [passo, ...restoCelle] = celle;
    note.push({ passo, testo: restoCelle.join('|').trim() });
  }
  return note;
}

export function parseFile(percorso) {
  const raw = fs.readFileSync(percorso, 'utf8');
  const problemi = [];
  const fileLabel = percorso.split(/[\\/]/).pop();

  const mHead = /^#\s+(\S+)\s+([\d]+-[\d]+)\s+(.*)$/m.exec(raw);
  if (!mHead) {
    problemi.push(`${fileLabel}: intestazione "# LIBRO RANGE Titolo" non trovata`);
  }
  const libroRomano = mHead ? mHead[1] : null;
  const libro = libroRomano ? ROMANI[libroRomano] : null;
  let rangeGrezzo = mHead ? mHead[2] : null;

  // Il nome del file e l'intestazione dovrebbero riportare lo stesso range di
  // versi. Quando non e' cosi' (visto un caso reale: intestazione con un
  // "off by one" rispetto al nome file) mi fido del nome del file, perche' e'
  // quello coerente con il conteggio effettivo dei versi e con le etichette
  // <sup> esplicite nel testo, e segnalo la discrepanza.
  const rangeFileName = /^(\d+-\d+)\.md$/.exec(fileLabel)?.[1] ?? null;
  if (rangeFileName && rangeGrezzo && rangeFileName !== rangeGrezzo) {
    problemi.push(
      `${fileLabel}: range nell'intestazione ("${rangeGrezzo}") diverso dal nome del file ("${rangeFileName}") — uso quello del nome del file`
    );
    rangeGrezzo = rangeFileName;
  }

  const versi = rangeGrezzo
    ? rangeGrezzo.split('-').map((n) => String(parseInt(n, 10))).join('-')
    : null;
  const versoIniziale = rangeGrezzo ? parseInt(rangeGrezzo.split('-')[0], 10) : null;
  const titoloGrezzo = mHead ? mHead[3].trim() : null;

  const tabs = estraiTabSet(raw);
  if (!tabs.IT) problemi.push(`${fileLabel}: tab IT mancante`);
  if (!tabs.LT) problemi.push(`${fileLabel}: tab LT mancante`);

  const noteGrezze = estraiNote(raw);
  const usaMarcatoreInline = reNotaInlineTest(raw);

  let it, lt, note;
  if (usaMarcatoreInline) {
    // Stile "nuovo": ogni richiamo e' gia' segnato nel testo con <sup>nota</sup>
    // (o varianti con tag rotto). Consumo la tabella note in ordine, per
    // colonna, cosi' come appaiono i richiami.
    const contatoreLT = { n: 0 };
    const contatoreIT = { n: 0 };
    lt = tabs.LT ? parseColonna(tabs.LT, 'la', problemi, fileLabel, contatoreLT, noteGrezze) : { versi: [], fineMarcatore: false, noteUsate: [] };
    it = tabs.IT ? parseColonna(tabs.IT, 'it', problemi, fileLabel, contatoreIT, noteGrezze) : { versi: [], fineMarcatore: false, noteUsate: [] };
    note = [...lt.noteUsate, ...it.noteUsate];
    // Nota: un totale diverso da noteGrezze.length NON e' di per se' un errore
    // (la stessa nota puo' comparire sia in LT sia in IT); i casi realmente
    // fuori range sono gia' segnalati dentro parseColonna.
  } else {
    // Stile "vecchio": nessun richiamo inline, solo la tabella "Passo -> Nota".
    // Non tocco il testo dei versi qui: il posizionamento va deciso con
    // collocaNoteVecchioStile, che a differenza del caso "nuovo" richiede
    // di individuare a quale verso latino corrisponde ciascun "Passo".
    const contatoreVuoto = { n: 0 };
    lt = tabs.LT ? parseColonna(tabs.LT, 'la', problemi, fileLabel, contatoreVuoto, []) : { versi: [], fineMarcatore: false, noteUsate: [] };
    it = tabs.IT ? parseColonna(tabs.IT, 'it', problemi, fileLabel, contatoreVuoto, []) : { versi: [], fineMarcatore: false, noteUsate: [] };
    const risultato = collocaNoteVecchioStile(lt.versi, versoIniziale, noteGrezze, problemi, fileLabel);
    lt.versi = risultato.versi;
    note = risultato.note;
  }

  const guida = tabs['Guida alla lettura'] ? tabs['Guida alla lettura'].trim() : null;
  if (!guida) problemi.push(`${fileLabel}: tab "Guida alla lettura" assente`);

  if (it.fineMarcatore) problemi.push(`${fileLabel}: marcatore "***" a fine colonna IT — verificare se serve una lacuna "<...>"`);
  if (lt.fineMarcatore) problemi.push(`${fileLabel}: marcatore "***" a fine colonna LT — verificare se serve una lacuna "<...>"`);

  return {
    fileLabel,
    libro,
    versi,
    versoIniziale,
    titoloGrezzo,
    latino: lt.versi,
    italiano: it.versi,
    guida,
    note,
    noteGrezze,
    problemi,
  };
}

function reNotaInlineTest(raw) {
  reNotaInline.lastIndex = 0;
  return reNotaInline.test(raw);
}

// Mappa "numero di verso canonico -> indice nell'array latino", usando le
// etichette numeriche esplicite (<sup>N</sup>) gia' presenti nel sorgente
// come punti di sincronizzazione certi, e riempiendo per interpolazione
// lineare i versi non etichettati fra due punti noti.
function costruisciMappaCanonica(versiLatino, versoIniziale) {
  const punti = [{ idx: -1, canonico: versoIniziale - 1 }];
  versiLatino.forEach((v, idx) => {
    const m = /^\{(\d+)(?:\s*\(\d+\))?\}/.exec(v);
    if (m) punti.push({ idx, canonico: parseInt(m[1], 10) });
  });
  punti.push({ idx: versiLatino.length, canonico: punti[punti.length - 1].canonico + (versiLatino.length - punti[punti.length - 1].idx) });

  const mappa = new Map();
  for (let i = 0; i < punti.length - 1; i++) {
    const a = punti[i];
    const b = punti[i + 1];
    for (let idx = a.idx + 1; idx <= b.idx && idx < versiLatino.length; idx++) {
      mappa.set(a.canonico + (idx - a.idx), idx);
    }
  }
  return mappa;
}

function collocaNoteVecchioStile(versiLatino, versoIniziale, noteGrezze, problemi, fileLabel) {
  if (noteGrezze.length === 0) return { versi: versiLatino, note: [] };
  const mappa = costruisciMappaCanonica(versiLatino, versoIniziale);
  const versi = versiLatino.slice();
  const note = [];

  noteGrezze.forEach((voce, i) => {
    let target;
    let m;
    if ((m = /^(\d+)-(\d+)$/.exec(voce.passo.trim()))) {
      target = parseInt(m[1], 10); // convenzione osservata: si aggancia al primo verso del range
    } else if ((m = /^post\s+(\d+)$/i.exec(voce.passo.trim()))) {
      target = parseInt(m[1], 10);
    } else if ((m = /^(\d+)$/.exec(voce.passo.trim()))) {
      target = parseInt(m[1], 10);
    } else {
      problemi.push(`${fileLabel}: formato "Passo" non riconosciuto: "${voce.passo}" — nota non collocata`);
      return;
    }
    const idx = mappa.get(target);
    if (idx === undefined) {
      problemi.push(`${fileLabel}: nessun verso trovato per Passo="${voce.passo}" (target=${target}) — nota non collocata`);
      return;
    }
    note.push({ n: note.length + 1, lingua: 'la', testo: voce.testo, passo: voce.passo, versoAgganciato: versi[idx] });
    versi[idx] = `${versi[idx]}[${note.length}]`;
  });

  return { versi, note };
}

// --- modalita' CLI: scansione di tutti i file o di un singolo file ---
if (process.argv[1]?.endsWith('parse-sphinx.mjs')) {
  const arg = process.argv[2];
  if (!arg) {
    console.error('Uso: node parse-sphinx.mjs <file.md>  |  node parse-sphinx.mjs --scan <cartella>');
    process.exit(1);
  }
  if (arg === '--scan') {
    const cartella = process.argv[3];
    const files = fs
      .readdirSync(cartella)
      .filter((f) => /^\d+-\d+\.md$/.test(f))
      .sort((a, b) => parseInt(a) - parseInt(b));
    let totProblemi = 0;
    for (const f of files) {
      const r = parseFile(`${cartella}/${f}`);
      if (r.problemi.length) {
        totProblemi += r.problemi.length;
        console.log(`\n=== ${f} ===`);
        r.problemi.forEach((p) => console.log('  ! ' + p));
      }
      if (r.noteGrezze.length) {
        console.log(`\n=== ${f} — note (${r.noteGrezze.length}) ===`);
        r.noteGrezze.forEach((n) => console.log(`  passo ${n.passo}: ${n.testo.slice(0, 90)}${n.testo.length > 90 ? '…' : ''}`));
      }
    }
    console.log(`\nFile scansionati: ${files.length}. Problemi totali: ${totProblemi}.`);
  } else {
    const r = parseFile(arg);
    console.log(JSON.stringify(r, null, 2));
  }
}
