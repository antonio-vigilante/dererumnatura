// Genera i PDF LaTeX del solo Libro Primo del De rerum natura, usando i file
// sorgente in src/content/passi/01_*.md, gia' pubblicati sul sito, come unica
// fonte di verita' per i versi e le guide alla lettura.
//
// Due profili, due impaginazioni:
// - "standard" (libro-primo.tex): A4 da stampa/desktop, un'impaginazione
//   propria (Cambria, XeLaTeX), con italiano/latino/guida interfogliati
//   brano per brano.
// - "tablet" (libro-primo-tablet.tex): ricalca la veste di pdf/modello.tex
//   (classe, font, colori, geometria, struttura a capitoli separati
//   Libro I / Liber I / Guida alla lettura). Va compilato con pdflatex
//   (o lualatex), NON xelatex: usa ebgaramond + babel latin/greek/italian
//   come modello.tex, non fontspec.
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { nomiLuoghi } from '../src/data/nomi-luoghi.ts';
import { bibliografia, sezioniBibliografia } from '../src/data/bibliografia.ts';

const cartellaPassi = path.resolve('src/content/passi');
const cartellaOut = path.resolve('pdf');

// ---------------------------------------------------------------- lettura --

function leggiPasso(nomeFile) {
  const testo = fs.readFileSync(path.join(cartellaPassi, nomeFile), 'utf8').replace(/\r\n/g, '\n');
  const m = testo.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error(`Frontmatter non trovato in ${nomeFile}`);
  const data = yaml.load(m[1]);
  const guida = m[2].trim();
  const id = nomeFile.replace(/\.md$/, '');
  return { id, data, guida };
}

const passi = fs
  .readdirSync(cartellaPassi)
  .filter((f) => /^01_.*\.md$/.test(f))
  .map(leggiPasso)
  .filter((p) => !p.data.bozza)
  .sort((a, b) => a.data.ordine - b.data.ordine);

// ------------------------------------------------------------- utilita' ---

function sanId(id) {
  return id.replace(/[^a-zA-Z0-9]/g, '-');
}

// Segnaposto d'uso privato Unicode: delimitano i token gia' convertiti in
// LaTeX (link, corsivo, richiami di nota...) cosi' che il passo finale di
// escaping non li tocchi e il ripristino non collida con cifre letterali
// del testo (anni, numeri di verso, ecc.).
const BS = '';
const APRI = '';
const CHIUDI = '';
const reTok = new RegExp(`${APRI}(\\d+)${CHIUDI}`, 'g');

function escapeLatex(str) {
  return String(str)
    .split('\\')
    .join(BS)
    .replace(/([&%$#_{}])/g, '\\$1')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}')
    .split(BS)
    .join('\\textbackslash{}');
}

// Notazione da apparato critico: "\<e\>" o "<et>" -> parentesi uncinate
// tipografiche, coerenti con la lacuna "⟨...⟩" gia' usata nel testo.
// "\[e\]" -> parentesi quadre letterali (verso ritenuto spurio). Un
// backslash residuo davanti a un carattere qualsiasi e' un refuso di
// escaping stile markdown (es. "<\in illis>" in 01_712-829.md) e va
// scartato: nel testo dei versi il backslash non ha altro significato.
function normalizzaUncinate(str) {
  return String(str)
    .replace(/\\</g, '⟨')
    .replace(/\\>/g, '⟩')
    .replace(/</g, '⟨')
    .replace(/>/g, '⟩')
    .replace(/〈/g, '⟨')
    .replace(/〉/g, '⟩')
    .replace(/\\\[/g, '[')
    .replace(/\\\]/g, ']')
    .replace(/\\(?=\S)/g, '');
}

// Una riga di versi che sia interamente una lacuna ("⟨...⟩" o "⟨…⟩") va resa
// con il comando \lacuna del modello, non con le parentesi uncinate Unicode
// lette alla lettera (che con ebgaramond/T1 possono mancare come glifi).
const reLacunaIntera = /^⟨\s*(?:\.\.\.|…)\s*⟩$/;

// Testo greco politonico letterale nelle guide (es. "ἄτομος"): sotto
// pdflatex + babel[greek] va avvolto in \textgreek{...}, altrimenti babel
// tenta di leggerlo con la codifica T1 del font latino e pdflatex si ferma
// con "Command \texttau unavailable in encoding T1" (verificato compilando
// modello.tex, che infatti non compila cosi' com'e'). Con XeLaTeX/fontspec
// (profilo "standard") il testo Unicode si stampa direttamente: li' il
// comando \textgreek non esiste nemmeno, quindi l'avvolgimento va applicato
// solo per il profilo tablet.
const reGreco = /[Ͱ-Ͽἀ-῿]+(?:[  ][Ͱ-Ͽἀ-῿]+)*/gu;

function avvolgiGreco(str) {
  return str.replace(reGreco, (m) => `\\textgreek{${m}}`);
}

const bibUsate = new Set();
const nomiOccorrenze = new Map(); // chiave -> Set(id passo)

function registraNome(chiave, passoId) {
  if (!nomiOccorrenze.has(chiave)) nomiOccorrenze.set(chiave, new Set());
  nomiOccorrenze.get(chiave).add(passoId);
}

// ---- Inline: guida alla lettura e testo delle note (markdown leggero) ----

function convertiInline(testo, { greco = false } = {}) {
  testo = String(testo).replace(/<em>([\s\S]*?)<\/em>/g, '*$1*');
  const tok = [];
  const push = (latex) => {
    tok.push(latex);
    return `${APRI}${tok.length - 1}${CHIUDI}`;
  };

  testo = testo.replace(/<sup>([\s\S]*?)<\/sup>/g, (_, dentro) => push(`\\textsuperscript{${escapeLatex(dentro)}}`));

  testo = testo.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, etichetta, url) => {
    const escEtichetta = escapeLatex(etichetta);
    const m = url.match(/\/bibliografia\/?#([a-z0-9]+)/i) || url.match(/^#([a-z0-9]+)$/i);
    if (m) {
      const chiave = m[1].toLowerCase();
      bibUsate.add(chiave);
      return push(`\\hyperlink{bib:${chiave}}{${escEtichetta}}`);
    }
    if (/^https?:\/\//.test(url)) {
      const urlSicuro = url.replace(/([%#])/g, '\\$1');
      return push(`\\href{${urlSicuro}}{${escEtichetta}}`);
    }
    return push(escEtichetta);
  });

  testo = testo.replace(/\*\*([^*]+)\*\*/g, (_, dentro) => push(`\\textbf{${escapeLatex(dentro)}}`));
  testo = testo.replace(/\*([^*\n]+)\*/g, (_, dentro) => push(`\\textit{${escapeLatex(dentro)}}`));

  testo = escapeLatex(testo);
  testo = testo.replace(reTok, (_, i) => tok[Number(i)]);

  // Testo greco letterale e segni diacritici rari (es. "musę", variante
  // paleografica per "musae" in 01_635-711.md) si gestiscono sulla stringa
  // gia' risolta, non con push()/token come sopra: se lo si facesse prima,
  // un simile token annidato dentro un \textit{...}/\hyperlink{...} pushato
  // successivamente non verrebbe mai sciolto dal replace(reTok, ...) qui
  // sopra, che e' a passata singola (non ricorsiva).
  if (greco) testo = testo.replace(reGreco, (m) => `\\textgreek{${m}}`);
  testo = testo
    .normalize('NFC')
    .replace(/([a-zA-Z])̧/g, (_, lettera) => `\\c{${lettera}}`)
    .replace(/ȩ/g, () => '\\c{e}');

  return testo;
}

function convertiGuida(corpo, opts) {
  corpo = corpo.replace(/<!--[\s\S]*?-->/g, '');
  corpo = corpo.replace(/〈/g, '⟨').replace(/〉/g, '⟩');
  const blocchi = corpo
    .trim()
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  return blocchi
    .map((b) => {
      if (b.startsWith('>')) {
        const testo = b
          .split('\n')
          .map((r) => r.replace(/^>\s?/, ''))
          .join(' ');
        return `\\begin{quotation}\\noindent ${convertiInline(testo, opts)}\\end{quotation}`;
      }
      return convertiInline(b.replace(/\s*\n\s*/g, ' '), opts);
    })
    .join('\n\n');
}

// -------------------------------------------------------------- versi ----

const reMarcatore = /^\{([^}]+)\}([\s\S]*)$/;
const reNota = /\[(\d+)\]/g;
const reNome = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
const reVersoAggiuntivo = /^\d+[a-zA-Z]$/;

// Converte il testo di un verso: nomi propri come link, richiami di nota
// come \footnote{} veri (LaTeX li numera da solo), lacune come \lacuna.
function convertiTestoVerso(testoGrezzo, lingua, note, passoId) {
  if (reLacunaIntera.test(testoGrezzo.trim())) return '\\lacuna';

  const tok = [];
  const push = (latex) => {
    tok.push(latex);
    return `${APRI}${tok.length - 1}${CHIUDI}`;
  };

  let testo = testoGrezzo.replace(reNome, (_, mostrato, chiaveEsplicita) => {
    const chiave = (chiaveEsplicita || mostrato).toLowerCase();
    registraNome(chiave, passoId);
    return push(`\\hyperlink{nome:${chiave}}{${escapeLatex(mostrato)}}`);
  });

  testo = testo.replace(reNota, (_, n) => {
    const nt = note.find((x) => x.lingua === lingua && String(x.n) === n);
    if (!nt) {
      console.warn(`Attenzione: richiamo di nota [${n}] (${lingua}) senza testo in ${passoId}`);
      return '';
    }
    return push(`\\footnote{${convertiInline(nt.testo, { greco: true })}}`);
  });

  testo = escapeLatex(testo);
  testo = testo.replace(reTok, (_, i) => tok[Number(i)]);
  return testo || '~';
}

// Rende un elenco di versi in righe "\vnum{N}testo\\", risincronizzando il
// contatore automatico sul numero esplicito ogni volta che la sorgente ne
// fornisce uno: un marcatore come "{1070}" indica che il verso E' il 1070,
// non solo che va MOSTRATO come 1070. Senza risincronizzare, dopo una riga
// che nella fonte manoscritta compendia piu' di un verso reale (lacune,
// ricostruzioni), il contatore resta indietro e ogni 5 righe ristampa per
// coincidenza lo stesso numero gia' mostrato dal marcatore precedente.
function versiRighe(versi, { lingua, versoIniziale = 1, mostraNumeri, note = [], passoId }) {
  let versoAuto = versoIniziale - 1;
  return versi.map((rigaOriginale) => {
    const riga = normalizzaUncinate(rigaOriginale);
    const match = riga.match(reMarcatore);
    const marcatore = match ? match[1].trim() : null;
    const testoGrezzo = match ? match[2].trimStart() : riga;

    const versoAggiuntivo = marcatore !== null && reVersoAggiuntivo.test(marcatore);
    if (!versoAggiuntivo) {
      const numeroEsplicito = marcatore !== null ? marcatore.match(/^(\d+)/) : null;
      versoAuto = numeroEsplicito ? Number(numeroEsplicito[1]) : versoAuto + 1;
    }
    const n = versoAuto;

    const numeroMargine = mostraNumeri ? marcatore ?? (n % 5 === 0 ? String(n) : null) : marcatore;
    const testo = convertiTestoVerso(testoGrezzo, lingua, note, passoId);

    if (testo === '\\lacuna') return '\\lacuna\\\\';
    const prefisso = numeroMargine ? `\\vnum{${escapeLatex(numeroMargine)}}` : '';
    return `\\noindent ${prefisso}${testo}\\\\`;
  });
}

// -------------------------------------------------------- range e nomi ---

const libriRomani = ['Primo', 'Secondo', 'Terzo', 'Quarto', 'Quinto', 'Sesto'];
const numeriRomani = ['I', 'II', 'III', 'IV', 'V', 'VI'];

// "1-49" -> "01-49": il modello impagina cosi' i numeri a una cifra.
function formattaRange(versi) {
  return String(versi)
    .split('-')
    .map((parte) => (/^\d$/.test(parte) ? `0${parte}` : parte))
    .join('-');
}

function idBase(p) {
  // "01_01-49" -> "01-49" (via data.versi, gia' normalizzato)
  return formattaRange(p.data.versi);
}

function targetIT(p) {
  return `IT-${numeriRomani[p.data.libro - 1]}-${idBase(p)}`;
}
function targetLT(p) {
  return `LT-${numeriRomani[p.data.libro - 1]}-${idBase(p)}`;
}
function targetG(p) {
  return `G-${numeriRomani[p.data.libro - 1]}-${idBase(p)}`;
}

// ---------------------------------------------- profilo "standard" (A4) --

function sezionePassoStandard(p) {
  const { data, guida, id } = p;
  const sid = sanId(id);
  const titolo = escapeLatex(data.titolo);

  let out = `\\clearpage\n\\section{${titolo}}\n\\hypertarget{passo:${sid}}{}\n`;
  out += `{\\color{tenue}\\small Libro ${libriRomani[data.libro - 1]}, vv. ${escapeLatex(data.versi)}}\\par\\medskip\n`;
  if (data.sommario) out += `\\textit{${escapeLatex(data.sommario)}}\\par\\bigskip\n`;
  if (data.temi && data.temi.length) {
    out += `{\\footnotesize\\color{tenue}Temi: ${data.temi.map(escapeLatex).join(', ')}}\\par\\bigskip\n`;
  }

  out += `\\subsection*{Testo italiano}\n{\\raggedright\n`;
  out += versiRighe(data.italiano, {
    lingua: 'it',
    versoIniziale: data.versoInizialeIt ?? 1,
    mostraNumeri: data.versoInizialeIt !== undefined,
    note: data.note ?? [],
    passoId: id,
  }).join('\n');
  out += `\n\\par}\n`;
  if (data.traduttore) out += `{\\footnotesize\\color{tenue}\\hfill Traduzione: ${escapeLatex(data.traduttore)}}\\par\n`;

  out += `\n\\subsection*{Testo latino}\n{\\raggedright\n`;
  out += versiRighe(data.latino, {
    lingua: 'la',
    versoIniziale: data.versoIniziale ?? 1,
    mostraNumeri: true,
    note: data.note ?? [],
    passoId: id,
  }).join('\n');
  out += `\n\\par}\n`;
  if (data.fonteLatino) out += `{\\footnotesize\\color{tenue}\\hfill Testo latino: ${escapeLatex(data.fonteLatino)}}\\par\n`;

  out += `\n\\subsection*{Guida alla lettura}\n`;
  out += (guida ? convertiGuida(guida, { greco: false }) : `{\\color{tenue}\\itshape Guida non ancora disponibile.}`) + '\n';

  return out;
}

// ------------------------------------------------- profilo "tablet" -----
// Struttura a capitoli separati (Libro I / Liber I / Guida alla lettura),
// come in pdf/modello.tex, con pillole [it] [lt] [g] per saltare da un
// capitolo all'altro.

function pillole(escludi, p) {
  const voci = [
    ['it', targetIT(p), '[it]'],
    ['lt', targetLT(p), '[lt]'],
    ['g', targetG(p), '[g]'],
  ].filter(([chiave]) => chiave !== escludi);
  return voci.map(([, target, etichetta]) => `\\hyperlink{${target}}{\\texttt{${etichetta}}}`).join(' ');
}

function sezioneITchapter(p) {
  const { data, id } = p;
  const titolo = `${idBase(p)} ${escapeLatex(data.titolo)}`;
  let out = `\\phantomsection\n\\hypertarget{${targetIT(p)}}{}\n`;
  out += `\\section*{${titolo}}\n\\addcontentsline{toc}{section}{${titolo}}\n`;
  out += `\\noindent{${pillole('it', p)}}\n\n`;
  out += versiRighe(data.italiano, {
    lingua: 'it',
    versoIniziale: data.versoInizialeIt ?? 1,
    mostraNumeri: data.versoInizialeIt !== undefined,
    note: data.note ?? [],
    passoId: id,
  }).join('\n');
  return out + '\n';
}

function sezioneLATchapter(p) {
  const { data, id } = p;
  let out = `\\phantomsection\n\\hypertarget{${targetLT(p)}}{}\n`;
  out += `\\section*{${idBase(p)}}\n`;
  out += `\\noindent{${pillole('lt', p)}}\n\n`;
  out += versiRighe(data.latino, {
    lingua: 'la',
    versoIniziale: data.versoIniziale ?? 1,
    mostraNumeri: true,
    note: data.note ?? [],
    passoId: id,
  }).join('\n');
  return out + '\n';
}

function sezioneGchapter(p) {
  const { data, guida, id } = p;
  const titolo = `${idBase(p)} ${escapeLatex(data.titolo)}`;
  let out = `\\phantomsection\n\\hypertarget{${targetG(p)}}{}\n`;
  out += `\\section*{${titolo}}\n\\addcontentsline{toc}{section}{${titolo}}\n`;
  out += `\\noindent{${pillole('g', p)}}\n\n`;
  out += (guida ? convertiGuida(guida, { greco: true }) : `{\\color{tenue}\\itshape Guida non ancora disponibile.}`);
  void id;
  return out + '\n';
}

// -------------------------------------------------- indice nomi e luoghi --

const etichetteTipo = { persona: 'persona', divinita: 'divinità', luogo: 'luogo', popolo: 'popolo' };

function sezioneIndiceNomi({ cmd, tocLevel, targetFn }) {
  const voci = nomiLuoghi.filter((v) => nomiOccorrenze.has(v.chiave));
  if (!voci.length) return '';
  let out = `\\clearpage\n${cmd}{Indice dei nomi e dei luoghi}\n\\addcontentsline{toc}{${tocLevel}}{Indice dei nomi e dei luoghi}\n`;
  out += `\\begin{description}\n`;
  for (const v of voci) {
    const ids = [...nomiOccorrenze.get(v.chiave)]
      .map((pid) => passi.find((p) => p.id === pid))
      .filter(Boolean)
      .sort((a, b) => a.data.ordine - b.data.ordine);
    const link = ids.map((p) => `\\hyperlink{${targetFn(p)}}{${escapeLatex(p.data.titolo)}}`).join(', ');
    out += `\\item[\\hypertarget{nome:${v.chiave}}{${escapeLatex(v.etichetta)}}] {\\footnotesize\\color{tenue}(${etichetteTipo[v.tipo]})} --- ${link}\n`;
  }
  out += `\\end{description}\n`;
  return out;
}

// -------------------------------------------------------------- bibliog. --

// Alcuni valori di "curatore" contengono gia' la dicitura "(a cura di)"
// (es. "Monica R. Gale (a cura di)"), altri sono un nome nudo: si evita
// cosi' di duplicare la dicitura o di perdere la virgola di raccordo.
function formattaCuratore(curatore) {
  if (!curatore) return '';
  const esc = escapeLatex(curatore);
  return /a cura di/i.test(curatore) ? esc : `a cura di ${esc}`;
}

function formattaVoceBib(v) {
  const curClause = formattaCuratore(v.curatore);
  let s = `${escapeLatex(v.autore)}, \\textit{${escapeLatex(v.titolo)}}`;
  if (v.tipo === 'capitolo' || v.tipo === 'articolo') {
    if (v.raccolta) {
      s += `, in \\textit{${escapeLatex(v.raccolta)}}`;
      if (curClause) s += `, ${curClause}`;
    } else if (v.rivista) {
      s += `, in ${escapeLatex(v.rivista)}`;
    }
  } else if (curClause) {
    s += `, ${curClause}`;
  }
  if (v.volume) s += `, ${escapeLatex(v.volume)}`;
  if (v.pagine) s += `, pp.~${escapeLatex(v.pagine)}`;
  if (v.luogo || v.editore) {
    s += `, ${[v.luogo, v.editore].filter(Boolean).map(escapeLatex).join(', ')}`;
  }
  s += `, ${v.anno}`;
  if (v.nota) s += ` (${escapeLatex(v.nota)})`;
  s += '.';
  return s;
}

function sezioneBibliografia({ cmd, tocLevel }) {
  const usate = bibliografia.filter((v) => bibUsate.has(v.chiave));
  if (!usate.length) return '';
  let out = `\\clearpage\n${cmd}{Bibliografia}\n\\addcontentsline{toc}{${tocLevel}}{Bibliografia}\n`;
  out += `{\\small Opere citate nelle guide alla lettura del Libro Primo.}\\par\\bigskip\n`;
  for (const sez of sezioniBibliografia) {
    const voci = usate.filter((v) => v.sezione === sez.chiave).sort((a, b) => a.autore.localeCompare(b.autore, 'it'));
    if (!voci.length) continue;
    out += `\\subsection*{${escapeLatex(sez.etichetta)}}\n`;
    out += `\\begin{itemize}\\setlength\\itemsep{0.3em}\n`;
    for (const v of voci) {
      out += `\\item \\hypertarget{bib:${v.chiave}}{} ${formattaVoceBib(v)}\n`;
    }
    out += `\\end{itemize}\n`;
  }
  return out;
}

// mancanti nella bibliografia: log per sicurezza
function segnalaBibMancanti() {
  for (const chiave of bibUsate) {
    if (!bibliografia.some((v) => v.chiave === chiave)) {
      console.warn(`Attenzione: chiave bibliografica citata ma non trovata: ${chiave}`);
    }
  }
}

// =====================================================================
// Profilo "standard": A4, Cambria/XeLaTeX, brani interfogliati
// =====================================================================

function generaStandard() {
  const corpoPassi = passi.map(sezionePassoStandard).join('\n\n');
  const indiceNomi = sezioneIndiceNomi({ cmd: '\\section*', tocLevel: 'section', targetFn: (p) => `passo:${sanId(p.id)}` });
  const bibliografiaTex = sezioneBibliografia({ cmd: '\\section*', tocLevel: 'section' });

  const preambolo = String.raw`\documentclass[11pt,a4paper]{article}

\usepackage{fontspec}
\setmainfont{Cambria}
\linespread{1}
\usepackage[italian]{babel}
\usepackage[a4paper,margin=2.8cm,headsep=1.2cm]{geometry}
\usepackage{xcolor}
\usepackage{parskip}
\usepackage{titlesec}
\usepackage{fancyhdr}
\usepackage{enumitem}
\usepackage[colorlinks=true,linkcolor=rubrica,citecolor=rubrica,urlcolor=blunotte,filecolor=blunotte,bookmarksnumbered=true]{hyperref}

\definecolor{rubrica}{HTML}{7A1F1F}
\definecolor{blunotte}{HTML}{1F3A5F}
\definecolor{tenue}{gray}{0.45}

\titleformat{\section}{\normalfont\Large\bfseries\color{rubrica}}{\thesection.}{0.6em}{}
\titleformat{\subsection}{\normalfont\large\bfseries}{}{0em}{}
\titlespacing*{\subsection}{0pt}{1.4em}{0.8em}

\newcommand{\vnum}[1]{\llap{\footnotesize\itshape\color{tenue}#1\hspace{1em}}}
\newcommand{\lacuna}{$\langle$\,\ldots\,$\rangle$}

\pagestyle{fancy}
\fancyhf{}
\fancyhead[C]{\footnotesize\color{tenue}De rerum natura \textbullet\ Libro Primo}
\fancyfoot[C]{\footnotesize\thepage}
\renewcommand{\headrulewidth}{0.3pt}

\setlength{\parindent}{0pt}
\frenchspacing

\title{}
\date{}

\hypersetup{
  pdftitle={De rerum natura -- Libro Primo},
  pdfauthor={Tito Lucrezio Caro},
  pdfsubject={Traduzione e guida alla lettura di Antonio Vigilante}
}

\begin{document}

\begin{titlepage}
\centering
\vspace*{3cm}
{\Huge\bfseries T. Lucrezio Caro}\\[0.8cm]
{\huge De rerum natura}\\[0.4cm]
{\Large\itshape Libro Primo}\\[2.5cm]
{\large Testo latino, traduzione italiana e guida alla lettura}\\[0.3cm]
{\large a cura di Antonio Vigilante}\\[3cm]
{\small\color{tenue} Testo latino: edizione di Cyril Bailey (1947)}\\[0.2cm]
{\small\color{tenue} Estratto in edizione PDF dall'edizione digitale del \emph{De rerum natura}}\\[0.2cm]
{\small\color{tenue} Distribuito con licenza Creative Commons BY-SA 4.0}\\[1cm]
\vfill
{\small\color{tenue}\today}
\end{titlepage}

\tableofcontents
\clearpage
`;

  const chiusura = '\n\\end{document}\n';

  return preambolo + '\n' + corpoPassi + '\n\n' + indiceNomi + '\n' + bibliografiaTex + '\n' + chiusura;
}

// =====================================================================
// Profilo "tablet": veste di pdf/modello.tex (pdflatex, non xelatex)
// =====================================================================

// Introduzione e Sigle vivono solo dentro modello.tex: non hanno ancora una
// fonte dati strutturata (src/content/passi copre solo i brani versificati).
// Il testo qui sotto e' copiato da modello.tex, correggendo solo refusi di
// battitura evidenti (non il contenuto): il resto, comprese le note aperte
// segnalate nel testo stesso ("CONTROLLA", frasi interrotte...), resta cosi'
// com'e' finche' non viene rivisto editorialmente.
const introduzioneTex = String.raw`\chapter*{Introduzione\\Il sublime Lucrezio}
\addcontentsline{toc}{chapter}{Introduzione. Il sublime Lucrezio}
\markboth{INTRODUZIONE}{INTRODUZIONE}

\vspace{1em}

\section*{1. Solo quando finirà la terra}
\addcontentsline{toc}{section}{1. Solo quando finirà la terra}
\vspace{0.5cm}

\begin{quote}
Carmina sublimis tunc sunt peritura Lucreti,\\
exitio terras cum dabit una dies.
\end{quote}

I versi del sublime Lucrezio moriranno solo quando finirà la terra. Il giudizio lusinghiero si trova in una delle elegie degli \textit{Amores} di Ovidio (I, 15, 23-24), in cui il poeta traccia una sorta di canone greco e latino. Ed è significativo che Lucrezio sia posto in qualche modo al di sopra dello stesso Virgilio: perché se le opere di quest'ultimo saranno lette fino a quando Roma sarà a capo del suo impero (\textit{Roma triumphati dum caput orbis erit}, v. 26), i versi di Lucrezio dureranno quanto il mondo stesso. Si ritiene, peraltro, che sia a Lucrezio che lo stesso Virgilio fa riferimento nei famosi versi del secondo libro delle \textit{Georgiche} (490-493): “Felice chi ha potuto investigare le cause delle cose e mettere sotto i piedi tutte le paure, il fato inesorabile, il risuonare dell'avido Acheronte” (trad. A. Barchiesi; \textit{Felix qui potuit rerum cognoscere causas} / \textit{atque metus omnis et inexorabile fatum} / \textit{subiecit pedibus strepitumque Acherontis avari}). E questo, in effetti, era il programma di Lucrezio, come presto vedremo: conoscere la \textit{natura rerum}, l'essenza della realtà, le cause dei fenomeni, e al tempo stesso superare i terrori legati alle superstizioni religiose.

Ma il primo giudizio sull'opera di Lucrezio si trova in Cicerone. In una delle lettere al fratello Quinto si legge: “I poemi di Lucrezio, come scrivi, hanno molta luce d'ingegno e tuttavia molta arte” (\textit{Lucreti poemata ut scribis ita sunt, multis luminibus ingeni, multae tamen artis}) (\textit{Ad Quintum fratrem}, 2.10.3). Anche se ci si aspetterebbe un \textit{etiam} al posto del \textit{tamen}, il giudizio è chiaro: nel poema di Lucrezio c'è una felice unione di intelligenza e di tecnica poetica.

Con questo riconoscimento della grandezza della sua opera contrasta l'assoluta oscurità sulla vita del poeta. Quello che di Lucrezio sappiamo è quasi nulla.

Le notizie su Lucrezio che hanno plasmato nei secoli la percezione della sua figura sono quelle che provengono dalle aggiunte di Sofronio Eusebio Girolamo, noto come san Girolamo, al \textit{Chronicon} di Eusebio, nell'anno 660 di Roma e 1923 di Abramo, equivalente al 94 a.C: “Nasce il poeta Tito Lucrezio Caro, che impazzì a causa di un filtro d'amore e scrisse alcuni libri negli intervalli della follia, che poi Cicerone emendò, si suicidò all'età di quarantaquattro anni” (\textit{Titus Lucretius Carus nascitur, qui postea a poculo amatorio in furorem versus et per intervalla insaniae cum aliquot libros conscripsisset, quos postea Cicero emendavit, sua manu se interfecit anno XLIV}).

Un poeta folle, dunque, e suicida. Per quanto sia una fonte tutt'altro che solida, anche perché un cristiano come Girolamo era interessato a mostrare l'abiezione e la disperazione di un pensatore materialista e nemico della religione, queste parole pesano ancora oggi sulla lettura del poema lucreziano, nel quale non è infrequente che si cerchino segni della follia o della depressione dell'autore. Si può obiettare sia alla prima che alla seconda ipotesi. Come osserva Ernout, è improbabile che un'opera con una complessa struttura come il \textit{De rerum natura} possa nascere \textit{per intervalla insaniae} (Ernout 1920, p. IX); e quanto alla depressione, ci si può chiedere se un vero e proprio inno alla gioia quale è il proemio a Venere del primo libro possa essere opera di una persona con scarso attaccamento alla vita. C'è in lui, senz'altro, una consapevolezza cruda degli aspetti più drammatici della nostra esistenza - ed è una delle ragioni della sua attualità, della sua capacità di toccare ancora profondamente chi lo legge -, ma questa può essere una ragione per definirlo pessimista, non certo per diagnosticare una depressione o qualche altra patologia psichiatrica.

Una seconda informazione giunge dalla vita di Virgilio del grammatico Elio Donato, che ci informa che Virgilio visse la sua giovinezza a Cremona, durante l'epoca del secondo consolato di Pompeo e Crasso e assunse la toga virile a quindici anni, nello stesso giorno in cui il poeta Lucrezio morì (\textit{initia aetatis Cremonae egit usque ad virilem togam, quam XVII anno natali suo accepit isdem illis consulibus iterum duobus, erat natus, evenitque ut eo ipso die Lucretius poeta decederet}; Ael. Don., \textit{Vita Vergilii} 6, ed. Brugnoli–Stok).

Secondo questa datazione Lucrezio sarebbe morto nel 55 a.e.v. (l'anno appunto del secondo consolato di Pompeo e Crasso), mentre secondo la datazione di Girolamo, se diamo per buona la notizia della morte a 44 anni, il poeta sarebbe scomparso il 50 a.e.v. Il periodo della vita di Lucrezio oscilla dunque, stando alle testimonianze più antiche, tra il 99/94 e il 55/50 a.e.v. Non conosciamo il luogo di nascita né la sua condizione sociale, né siamo a conoscenza di altre opere da lui scritte. Questa disperante mancanza di informazioni ha spinto gli studiosi a formulare le più diverse congetture, fino a ipotizzare che Lucrezio sia solo uno pseudonimo dietro il quale si cela un personaggio influente dell'epicureismo romano come Tito Pomponio Attico (Gerlo 1956).

\vspace{0.5cm}
\section*{2. Un tempo difficile}
\addcontentsline{toc}{section}{2. Un tempo difficile}
\vspace{0.5cm}

Gli anni della breve vita di Lucrezio sono stati tra i più travagliati della storia di Roma.
Dopo aver cacciato l'ultimo re, i romani avevano costruito un sistema di governo, la \textit{res publica}, al cui vertice c'erano due consoli, eletti ogni anno, che si dividevano il potere esecutivo e si controllavano a vicenda. Li affiancava il Senato, un'assemblea di ex magistrati che esercitava un'autorità enorme sulle decisioni militari, finanziarie e diplomatiche. Era un sistema pensato per impedire che il potere si concentrasse nelle mani di una sola persona.

Questo sistema era governato quasi esclusivamente dai patrizi, l'aristocrazia di sangue che monopolizzava le cariche pubbliche e la proprietà terriera. I plebei – la grande maggioranza della popolazione, artigiani, contadini, piccoli commercianti – erano cittadini romani, combattevano nelle legioni, pagavano le tasse, ma avevano scarsissima voce in capitolo nelle decisioni che li riguardavano. Nel corso dei secoli, attraverso una lunga serie di conflitti politici, i romani avevano trovato un compromesso: istituire una magistratura speciale, il tribuno della plebe, pensata apposta per tutelare gli interessi dei cittadini comuni.

Il tribuno della plebe era una figura straordinaria nell'architettura costituzionale romana. Ne venivano eletti dieci ogni anno, e la loro persona era dichiarata sacra e inviolabile: chiunque avesse esercitato violenza su un tribuno poteva essere ucciso senza che ciò costituisse reato. Ma il potere più importante del tribuno era quello di \textit{veto}. Un tribuno poteva bloccare qualsiasi atto di qualsiasi magistrato romano, compreso il console; una forma di freno costituzionale pensato per proteggere i più deboli dai soprusi dei potenti. I tribuni potevano anche proporre leggi direttamente all'assemblea popolare, scavalcando il Senato, una prerogativa che li rendeva, almeno in teoria, uno strumento formidabile di riforma dal basso.

Questo equilibrio resse per oltre quattro secoli. Poi, nel giro di pochi decenni, cominciò a sgretolarsi.

Il primo segnale di crisi arrivò nel 133 a.e.v., quando Tiberio Gracco, tribuno della plebe, propose una riforma agraria radicale che prevedeva la ridistribuzione al popolo delle terre che l'aristocrazia aveva occupato illegalmente per restituirle ai cittadini poveri. Era una proposta legittima, alla quale tuttavia si opposero l'aristocrazie e i grandi proprietari terrieri. Tiberio fu ucciso a bastonate in piena assemblea popolare, insieme a trecento dei suoi sostenitori; il suo cadavere fu gettato nel Tevere. Dodici anni dopo, nel 121 a.e.v., toccò al fratello Gaio: anche lui tribuno, anche lui riformatore, anche lui ucciso in circostanze violente.

Lucrezio nacque intorno al 99 a.e.v. Nei primi anni della sua vita, la crisi si aggravò su due fronti contemporaneamente. Sul fronte interno, scoppiò nel 91 a.e.v. la cosiddetta guerra sociale: gli alleati italici di Roma – popoli che combattevano nelle legioni romane e pagavano le tasse romane – si ribellarono perché non avevano la cittadinanza romana, e dunque nessun diritto politico. La guerra durò tre anni e fu straordinariamente sanguinosa; alla fine Roma concesse la cittadinanza, ma il prezzo era stato altissimo.

Sul fronte interno le tensioni esplosero in modo ancora più drammatico con la prima guerra civile, tra l'88 e l'82 a.e.v.. Da un lato c'era Gaio Mario, generale plebeo che aveva riformato l'esercito romano trasformandolo da milizia di cittadini a forza di mestiere; dall'altro Lucio Cornelio Silla, aristocratico, generale brillante e spietato. I due si contendevano il comando di una guerra contro il re del Ponto, Mitridate, che minacciava le province orientali di Roma. Silla fece qualcosa di inaudito: marciò su Roma con il suo esercito e prese la città con la forza. Sconfitto Mario, partì per l'Oriente; tornò, vinse una seconda guerra civile, e nell'82 a.e.v. si fece conferire la dittatura a tempo indeterminato.

La dittatura di Silla fu breve (durò fino al 79 a.e.v.) ma lasciò un'impronta indelebile. Silla introdusse le proscrizioni, liste pubbliche di nemici politici, che chiunque poteva uccidere intascando una ricompensa; i loro beni venivano confiscati.

Quando Silla morì, nel 78 a.e.v., Lucrezio aveva circa vent'anni. Il volto di Roma era stato profondamente stravolto dalla violenza politica e le istituzioni repubblicane sopravvivevano formalmente ma erano svuotate di sostanza. Il potere reale gravitava attorno a figure militari straordinarie, generali capaci di comandare eserciti fedeli alla loro persona più che allo Stato. Nel 63 a.e.v. Cicerone, da console, sventò la congiura di Catilina, un patrizio rovinato che aveva tentato di sovvertire il governo con la forza, ricorrendo a misure di emergenza che lui stesso sapeva essere al limite della legalità.

Il punto di non ritorno arrivò nel 60 a.e.v., quando tre degli uomini più potenti di Roma – Gaio Giulio Cesare, Gneo Pompeo Magno e Marco Licinio Crasso – strinsero un accordo privato per spartirsi il controllo della repubblica. Questo patto, il primo triumvirato, non era previsto da alcuna legge; era semplicemente un accordo tra potenti, che usavano le loro risorse (eserciti, denaro, clientele) per pilotare le istituzioni a proprio vantaggio.

Lucrezio sarebbe morto prima del collasso finale (ma torneremo sulla questione della datazione della morte): Cesare che attraversa il Rubicone nel 49 a.e.v. con il suo esercito, la guerra civile contro Pompeo, la dittatura, l'assassinio alle Idi di marzo del 44 a.e.v. Il prologo del primo libro del \textit{De rerum natura} porta il segno di questo periodo così travagliato: Lucrezio, da epicureo, comincia il suo poema invocando Venere, cui chiede la pace in un tempo così \textit{iniquus} per Roma; pace per sé, per potersi dedicare alla sua impresa, e pace per Memmio, cui l'opera è dedicata.

\vspace{0.5cm}
\section*{3. Memmio}
\addcontentsline{toc}{section}{3. Memmio}
\vspace{0.5cm}

Il riferimento a Memmio come dedicatario del poema è l'unico aggancio storico concreto presente nel \textit{De rerum natura}. Si tratta con certezza \textit{quasi} assoluta di Gaio Memmio, un personaggio di primo piano della vita politica del tempo, le cui alterne fortune non sono forse estranee alla composizione del poema lucreziano.

Memmio apparteneva a una famiglia influente di origine plebea che si era distinta per la veemenza dell'attacco alla corruzione dei patrizi. Genero di Silla, di cui sposò la figlia Fausta Cornelia (poi ripudiata per infedeltà), lo troviamo nel 66 tribuno della plebe, carica nella quale si distingue per l'opposizione a Lucio Licinio Lucullo, il generale che Pompeo aveva sostituito nella Terza guerra mitridatica. Nel 58 ricopre la pretura, durante la quale, insieme al collega Lucio Domizio Enobarbo, avvia un'inchiesta sulla condotta consolare di Cesare dell'anno precedente. L'anno seguente parte come governatore della Bitinia. Lo seguono Catullo e Elvio Cinna, con la speranza di trarne guadagni. Speranza delusa, a giudicare dalla violenta ironia del carme 28 di Catullo; Memmio ne riporta comunque il titolo di \textit{imperator} e, tornato a Roma, punta al consolato. Ma le condizioni non sono favorevoli: deve aspettare due anni prima di potersi presentare, con il sostegno sia di Pompeo che di Cesare. Per assicurarsi la vittoria, Memmio stringe un accordo segreto (\textit{coitio Memmiana}) con l'altro candidato, Gneo Domizio Calvino, e con i consoli in carica, Appio Claudio Pulcro e Lucio Domizio Enobarbo. Il patto, che prevedeva la manipolazione delle procedure istituzionali attraverso la fabbricazione di falsi decreti senatoriali e la corruzione di testimoni augurali per garantire le province ai magistrati uscenti, determinò un'alterazione del mercato finanziario romano senza precedenti, documentata dall'impennata dei tassi d'interesse dovuta alla massiccia compravendita di voti.

L'accordo si infranse nell'agosto del medesimo anno, quando lo stesso Memmio scelse di denunciare pubblicamente i termini del patto dinanzi al Senato. La rivelazione produsse una paralisi istituzionale che lasciò la Repubblica priva di magistrati ordinari per diversi mesi e trascinò lo Stato in una spirale di veti tribunizi e disordini di piazza. L'esito di tale strategia si rivelò tuttavia fallimentare per Memmio: l'approvazione della severa legislazione retroattiva contro i brogli elettorali promossa da Pompeo nel 52 a.e.v. (la \textit{Lex Pompeia de ambitu}) condusse il politico a processo. Il disperato tentativo di ottenere l'immunità incriminando Metello Scipione, influente suocero di Pompeo, fallì a causa della diretta interferenza di quest'ultimo nelle dinamiche giudiziarie, costringendo infine Memmio all'esilio definitivo ad Atene e decretando la fine della sua carriera politica.

Ed è al tempo dell'esilio ad Atene che risale una notizia che sorprende non poco il lettore di Lucrezio. Cicerone ha avuto pressioni da Patrone, filosofo epicureo, affinché interceda presso Memmio, che ha dei terreni all'interno dei quali si trovano i ruderi della casa di Epicuro, che verrebbero spazzati via da un suo progetto edilizio. Cicerone lo prega di desistere dal suo progetto, non senza ostentare una certa ironia, evidentemente condivisa dall'interlocutore, verso gli epicurei:

\begin{quote}
Se le cose stanno così e se ormai non ti importa affatto della cosa, vorrei che tu – se si è generata qualche piccola offesa per la stranezza di certi individui, ché conosco bene quella gente – ti mostrassi indulgente, sia per la tua grande umanità sia anche per il mio onore.\footnote{Quod si ita est et si iam tua plane nihil interest, velim, si qua offensiuncula facta est animi tui perversitate aliquorum – novi enim gentem illam –, des te ad lenitatem vel propter summam tuam humanitatem vel etiam honoris mei causa. \textit{Ep. fam.}, XIII, 1.}
\end{quote}

Ad Atene, dunque, Memmio non è affatto un epicureo, ed anzi condivide con ogni probabilità con Cicerone un certo sguardo ironico verso gli epicurei. Se l'intento di Lucrezio era quello di convertirlo, bisogna riconoscere che non è stato raggiunto. Ma era davvero quello l'intento di Lucrezio?

Bisogna chiedersi, intanto, quale sia il rapporto tra Lucrezio e Memmio. Lucrezio si rivolge a lui come interlocutore e destinatario del suo insegnamento, incarnazione concreta del lettore, ma anche amico, benché vi sia qui una oscillazione: in I.140 l'amicizia è \textit{sperata} (la \textit{sperata voluptas} di una dolce amicizia), mentre più oltre, nei versi 410 e seguenti, lo zelo e la preoccupazione del poeta lasciano intendere un rapporto di amicizia reale. Certo è bene ricordare che la parola \textit{amicitia} può indicare anche il rapporto che c'è tra il cliente, anche letterato, e il patrono; e sembra essere questa l'ipotesi più probabile: che Memmio sia il protettore di Lucrezio. Per il lettore odierno è naturale vedere nel poema un'iniziativa dell'autore, in questo caso con finalità educative, oltre che scientifiche, ma è una visione che corrisponde poco alle condizioni anche materiali di produzione di un'opera nel mondo romano. Se si considerano questi aspetti, pare plausibile l'ipotesi di Pierre Vesperini: che il \textit{De rerum natura} sia l'opera commissionata da Memmio a Lucrezio allo scopo di erigergli una sorta di monumento letterario, mostrando per tale via la sua raffinatezza e l'amore per la cultura greca, e conferendogli dunque un prestigio spendibile nella carriera politica (Vesperini, 2025). E la figura di Lucrezio risulta ridimensionata: un prestatore d'opera, per così dire, un geniale artigiano della parola che mette la sua arte al servizio del committente e confeziona un prodotto ben riuscito. Una lettura provocatoria, che mette in discussione anche la fede epicurea di Lucrezio, che in quanto artefice abile ha usato l'insegnamento di Epicuro come occasione o innesco per un dispiegamento enciclopedico del sapere del tempo. Si tratterebbe di una commessa piuttosto infelice, a dire il vero. Come è stato notato, a un certo punto Memmio scompare dal poema. Il suo nome compare solo nei libri I, II e V, probabilmente i primi ad essere composti (Canfora, 1993, p. 47), poi più nulla. E non è difficile immaginare che possa esserci un legame con la caduta in disgrazia di Memmio. Se si accetta la datazione di Donato (55 a.e.v.) e di San Girolamo (51/50 a.e.v.), Lucrezio dovrebbe essere già morto quando Memmio va in esilio ad Atene; ma è una datazione che si può discutere. Si può ipotizzare, come fa ancora Canfora (ivi, p. 61), che dopo l'uscita di scena di Memmio Lucrezio si sia legato a Cassio, di cui conosciamo la conversione all'epicureismo: e dunque il Lucrezio \textit{familiaris Cassii} di cui Cicerone parla in una lettera (VEDERE) sarebbe il nostro poeta.

L'interpretazione di Pierre Vesperini porta a conclusioni piuttosto radicali riguardo alla natura del poema. Se non è espressione autonoma del poeta, ma opera commissionata da Memmio, possiamo essere sicuri che le idee espresse appartengano a Lucrezio? Vesperini mette in discussione lo stesso epicureismo di Lucrezio. Un poema epicureo, osserva Vesperini, era un'impresa improbabile, considerata l'avversione di Epicuro e dello stesso Filodemo, per la poesia (Vesperini, 2025, pp. 146-147). Il Lucrezio di Vesperini è un dotto artigiano della parola, che scrive un poema che vuole essere in primo luogo un'enciclopedia del sapere, e che non è espressione di una personale visione filosofica, né ha la pretesa di convertire alcuno all'epicureismo.

L'ipotesi è affascinante, ma appare in contrasto con il tono stesso del \textit{De rerum natura}, che non è solo quello di chi vuole convertire a una precisa visione del mondo, ma è attraversato anche da una vena polemica molto forte, caratteristica che per Vesperini è estranea al modo raffinato in cui i Romani praticavano la filosofia, e apparteneva piuttosto ai filosofi di bassa estrazione, i \textit{Graeculi} (p. 134), che si spingevano fino ad insultare gli avversari. Ora, come considerare se non insulti veri e propri, le parole che Lucrezio dedica a pensatori come...

È plausibile che un uomo come Memmio, spasmodicamente alla ricerca del potere, abbia a un certo punto commissionato un \textit{monumentum} finalizzato a dargli lustro. Ma perché un'opera epicurea? E perché, tra l'altro, un'opera nella quale si legge un attacco violento contro coloro la cui \textit{caeca cupido} di onori e potere spinge verso ogni scelleratezza, come quello che si trova nel terzo libro (vv.59 segg.). Qualsiasi lettore del \textit{De rerum natura} non avrebbe potuto fare a meno di riconoscere quella passione malsana anche in colui cui l'opera è dedicata. E ci si chiede se quel passo non sia in relazione proprio con la caduta in disgrazia di Memmio.

Comunque la si consideri -- opera nata per iniziativa autonoma o scritta su commissione -- è certo che il poema di Lucrezio rivela sia un'assoluta maestria poetica che una profonda conoscenza filosofico-scientifica degli argomenti trattati: due cose che non si improvvisano. Lucrezio doveva senza alcun dubbio aver scritto altre opere. Di cui tuttavia non abbiamo alcuna notizia. Lucrezio compare come autore del solo \textit{De rerum natura}. E questa circostanza sembra rendere plausibile l'ipotesi della falsa identità: dietro il nome del poeta potrebbe nascondersi un rappresentante in vista della \textit{setta} epicurea che scrive per superare la diffidenza verso l'insegnamento del maestro e per farlo si rivolge a un personaggio in vista, che tuttavia finisce in disgrazia. Non è possibile naturalmente dimostrare questa ipotesi, ma diverse circostanze la rendono tutt'altro che fantasiosa.

\section{4. Un incontro difficile: l'epicureismo a Roma}

La penetrazione dell'epicureismo a Roma fu un lungo processo iniziato, secondo la tradizione, durante la guerra contro Pirro (280/79 a.C.), quando l'inviato Cineas illustrò per la prima volta i precetti del piacere epicureo al console Fabricius. Sebbene la dottrina sia diventata straordinariamente popolare a partire dalla metà del II secolo a.C., il suo successo scatenò una violenta reazione dai circoli conservatori, fino a giungere a sanzioni drastiche, come l'espulsione degli epicurei Alceo e Filisco nel 154 a.e.v. Nonostante l'ostilità di figure come Cicerone, l'epicureismo divenne un fenomeno d'élite, attirando esponenti di spicco come Tito Pomponio Attico, Cassio Longino e Calpurnio Pisone. Un centro nevralgico di questa diffusione fu la Campania, in particolare la Villa dei Papiri ad Ercolano, in cui si formò un cenacolo intellettuale intorno alla figura di Filodemo di Gadara, autore estremamente prolifico protetto da \textbf{Lucio Calpurnio Pisone Cesonino (suocero di Giulio Cesare), CONTROLLA}

Una prima divulgazione del pensiero epicureo in lingua latina era avvenuta attraverso Gaio Amafinio e Rabirio, entrambi criticati da Cicerone per lo stile povero e la mancanza di rigore filosofico. CERCA FONTE E APPROFONDISCI.

\section*{5. L'epicureismo di Lucrezio}

Una prima, importante particolarità dell'epicureismo di Lucrezio riguarda il ricorso stesso alla poesia. Come già osservato, Epicuro non apprezzava la poesia... Lucrezio ricorre alla poesia come strumento per la diffusione delle idee epicuree, ricorrendo alla metafora del medico che usa il miele per far ingurgitare una medicina. Non siamo a conoscenza di posizioni simili nell'ambiente epicureo romano. C'è da osservare che, se il \textit{De rerum natura} fosse opera scritta su commissione, Memmio avrebbe chiesto a Lucrezio di scrivere un poema che, oltre a suscitare reazioni e resistenze da parte degli avversari dell'epicureismo, che a Roma non erano pochi, avrebbe potuto irritare la stessa comunità epicurea.

Seneca, le cui \textit{Lettere a Lucilio} si possono considerare uno dei vertici della filosofia latina, cita più volte Lucrezio... Non un solo riferimento, invece, in Orazio, l'altro grande poeta epicureo romano. Come si spiega questa assenza? Non si può escludere che Orazio non conoscesse...

\vspace{0.5cm}
\section*{Questa traduzione}
\vspace{0.5cm}

Lucrezio è tra gli autori latini più tradotti, letti e amati ancora oggi. Poeta, filosofo e scienziato, per quanto lo consentiva il suo tempo, ha tra i suoi traduttori, oltre ai latinisti, poeti, filosofi e scienziati. Perché tradurlo ancora? E perché farlo in endecasillabi?

Alla prima domanda risponderò in modo epicureo: per semplice \textit{voluptas}, il piacere non solo di tradurre – e certo tradurre è uno dei piaceri della vita – ma anche di entrare come solo una traduzione consente in un testo-mondo che porta l'io occidentale ad un punto di tensione raramente eguagliato nel mondo antico. A ciò aggiungo che, se esistono molte traduzioni, in versi e in prosa, non esiste una traduzione recente che sia interamente ad accesso aperto, ossia tale che si possa liberamente leggere, distribuire e modificare. E rendere \textit{aperto} un poema classico, non solo con l'atto di tradurre, che è sempre pratica di apertura, ma anche con la scelta di una licenza aperta, è un piacere non meno tangibile.

Perché in endecasillabi? Almeno due ragioni sconsiglierebbero oggi di tradurre Lucrezio ricorrendo al verso classico della nostra tradizione. La prima è che la mutata sensibilità porta a preferire, e a sentire più vicine, forme più libere, che sono proprie, con poche eccezioni, della poesia degli ultimi decenni. La seconda è che adottare il verso libero, o la prosa, consente una più facile aderenza al testo, che può risultare problematica quando occorre rispettare una metrica fissa.

E perché, allora? Si potrebbe rispondere che esistono ormai molte traduzioni in verso libero e, se non sono tutte ugualmente valide, ve ne sono molte di validissime. Ma la ragione è un'altra. Sono convinto della bellezza dell'endecasillabo, e mi piace poter rendere la bellezza di Lucrezio con la bellezza dell'endecasillabo. Tutto qui.

Quanto allo stile, ho cercato di tradurre nel modo più fedele e chiaro possibile, consentendo al lettore di accedere al pensiero di Lucrezio, oltre che alla sua poesia. Non ho nemmeno provato a riprodurre lo stile arcaizzante lucreziano, sia perché questo avrebbe condotto, con ogni probabilità, ad esiti più ridicoli che credibili, sia perché per leggere una traduzione italiana in endecasillabi con linguaggio arcaizzante il lettore di oggi può ricorrere semplicemente alle belle versioni di Mario Rapisardi\footnote{\textit{La Natura libri VI tradotti da Mario Rapisardi}, Gaetano Brigola e Comp., Milano 1880.} o di Camillo Giussani\footnote{Tito Lucrezio Caro, \textit{La Natura}, versione di Camillo Giussani, Mondadori, Milano 1939.}. Qualche licenza mi sono concesso nei passi in cui il poeta fa aggio, per così dire, sul filosofo (ammesso che in Lucrezio si possa distinguere il poeta dal filosofo); ma mai, comunque, stravolgendo il significato del testo.

Il testo latino su cui è condotta la traduzione, e che è riportato, è quello dell'edizione critica di Cyril Bailey; nella traduzione ho tenuto conto anche delle edizioni di Munro, Giussani e Deufert. La \textit{Guida alla lettura} non vuole essere un commento puntuale dell'opera, ma accompagnare chi legge nella comprensione soprattutto da un punto di vista filosofico e argomentativo.

Affido questo lavoro alla lettrice e al lettore con l'invito a mettervi le mani: correggano pure, modifichino, riscrivano, con le uniche limitazioni della licenza Creative Commons BY-SA.

\vspace{1cm}

\begin{flushright}
Siena, maggio 2026
\end{flushright}
`;

const sigleTex = String.raw`\chapter*{Sigle}
\addcontentsline{toc}{chapter}{Sigle}
\markboth{SIGLE}{SIGLE}

G \textit{Schedae Gottorpienses} (G)\\
O Codice \textit{Oblungus}\\
O\textsuperscript{1} Codice \textit{Oblungus} corretto dal copista Dungal\\
Q Codice \textit{Quadratus}\\
U \textit{Schedae Vindobonenses posteriores}\\
V \textit{Schedae Vindobonenses priores}
`;

function generaTablet() {
  const corpoIT = passi.map(sezioneITchapter).join('\n\n');
  const corpoLAT = passi.map(sezioneLATchapter).join('\n\n');
  const corpoGuida = passi.map(sezioneGchapter).join('\n\n');
  const indiceNomi = sezioneIndiceNomi({ cmd: '\\chapter*', tocLevel: 'chapter', targetFn: targetIT });
  const bibliografiaTex = sezioneBibliografia({ cmd: '\\chapter*', tocLevel: 'chapter' });

  const preambolo = String.raw`\documentclass[14pt]{extbook}

% Pacchetti essenziali
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage[latin,greek,italian]{babel}
\usepackage{csquotes}
\usepackage{xcolor}

% Font (EB Garamond per un aspetto classico)
\usepackage{ebgaramond}
\usepackage{microtype}

% Layout e margini per tablet/ONYX Boox Note (10.3" ~ 210x280mm)
\usepackage[
  paperwidth=210mm,
  paperheight=280mm,
  left=40mm,
  right=40mm,
  top=40mm,
  bottom=40mm,
  twoside=false
]{geometry}

% Interlinea
\usepackage{setspace}
\setstretch{1.15}

% Palette colori classica/umanistica
\definecolor{bordeaux}{rgb}{0.55, 0.0, 0.0}
\definecolor{sepia}{rgb}{0.44, 0.26, 0.08}
\definecolor{tenue}{gray}{0.45}

% Riferimenti e collegamenti
\usepackage{hyperref}
\hypersetup{
  colorlinks=true,
  linkcolor=bordeaux,
  citecolor=bordeaux,
  filecolor=sepia,
  urlcolor=sepia,
  pdfauthor={Tito Lucrezio Caro},
  pdftitle={De Rerum Natura -- Libro I},
  pdfsubject={Traduzione e guida alla lettura di Antonio Vigilante}
}
\usepackage{marginnote}
\setlength{\marginparsep}{-100pt}

% Intestazioni personalizzate
\usepackage{fancyhdr}
\pagestyle{fancy}
\fancyhf{}
\fancyfoot[R]{\thepage}
\renewcommand{\headrulewidth}{0pt}
\renewcommand{\footrulewidth}{0pt}

% Personalizzazione capitoli e sezioni
\makeatletter
\renewcommand{\section}{\@startsection{section}{1}{\z@}%
  {1.5ex plus .5ex minus .2ex}%
  {0.5ex plus .2ex}%
  {\normalfont\itshape}}
\renewcommand{\@makechapterhead}[1]{%
  \vspace*{20pt}%
  {\centering\normalfont\Large #1\par}%
  \vspace{20pt}%
}
\renewcommand{\@makeschapterhead}[1]{%
  \vspace*{20pt}%
  {\centering\normalfont\Large #1\par}%
  \vspace{20pt}%
}
\makeatother

\fancypagestyle{plain}{%
  \fancyhf{}%
  \fancyfoot[R]{\thepage}%
  \renewcommand{\headrulewidth}{0pt}%
  \renewcommand{\footrulewidth}{0pt}%
}

\makeatletter
\let\ori@chapter\@chapter
\renewcommand{\@chapter}[2][]{%
  \ori@chapter[#1]{#2}%
  \thispagestyle{fancy}%
}
\let\ori@schapter\@schapter
\renewcommand{\@schapter}[1]{%
  \ori@schapter{#1}%
  \thispagestyle{fancy}%
}
\makeatother

\widowpenalty=10000
\clubpenalty=10000

\newcommand{\lacuna}{$\langle$\,\ldots\,$\rangle$}
\newcommand{\vnum}[1]{\llap{\small\textit{#1}\hspace{1.5em}}}

\raggedbottom

\begin{document}

\begin{titlepage}
  \centering
  \vspace*{1cm}
  {\large Tito Lucrezio Caro}\\[2cm]
  {\Huge\textsc{De Rerum Natura\\[0.5cm]\Large Libro I}}\\[1cm]
  {\normalsize Traduzione in endecasillabi e guida alla lettura\\[0.3em]
  di Antonio Vigilante}
  \vfill
  Zenodo
\end{titlepage}

\newpage
\vspace*{\fill}

\noindent Licenza Creative Commons BY-SA 4.0 International\\
Prima edizione: \today\\
Zenodo\\
DOI:

\tableofcontents

% ========================================
% INTRODUZIONE E SIGLE
% ========================================

${introduzioneTex}

${sigleTex}

% ========================================
% LIBRO I - ITALIANO
% ========================================

\chapter*{Libro I}
\addcontentsline{toc}{chapter}{Libro I}
\markboth{LIBRO I}{LIBRO I}

`;

  const cernieraLatino = String.raw`

% ========================================
% LIBER I - LATINO
% ========================================

\chapter*{Liber I}
\addcontentsline{toc}{chapter}{Liber I}
\markboth{LIBER I}{LIBER I}

`;

  const cernieraGuida = String.raw`

% ========================================
% LIBRO I - GUIDA ALLA LETTURA
% ========================================

\chapter*{Guida alla lettura}
\addcontentsline{toc}{chapter}{Guida alla lettura}
\markboth{GUIDA ALLA LETTURA}{GUIDA ALLA LETTURA}

`;

  const chiusura = '\n\\end{document}\n';

  return (
    preambolo +
    corpoIT +
    cernieraLatino +
    corpoLAT +
    cernieraGuida +
    corpoGuida +
    '\n\n' +
    indiceNomi +
    '\n' +
    bibliografiaTex +
    chiusura
  );
}

// ------------------------------------------------------------------ main --

fs.mkdirSync(cartellaOut, { recursive: true });

const profiloRichiesto = process.argv[2];
const generatori = { standard: generaStandard, tablet: generaTablet };
const nomiFile = { standard: 'libro-primo.tex', tablet: 'libro-primo-tablet.tex' };
const daGenerare = profiloRichiesto && generatori[profiloRichiesto] ? [profiloRichiesto] : Object.keys(generatori);

for (const nome of daGenerare) {
  const documento = generatori[nome]();
  const fileTex = path.join(cartellaOut, nomiFile[nome]);
  fs.writeFileSync(fileTex, documento, 'utf8');
  console.log(`Scritto ${fileTex}`);
}

segnalaBibMancanti();
console.log(`${passi.length} brani, ${bibUsate.size} voci bibliografiche, ${nomiOccorrenze.size} nomi indicizzati.`);
console.log('Nota: libro-primo-tablet.tex va compilato con pdflatex (o lualatex), non xelatex.');
