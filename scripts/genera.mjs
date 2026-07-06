import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { parseFile } from './parse-sphinx.mjs';

// Le note passano per set:html (ColonnaVersi.astro) e NON per il renderer
// Markdown di Astro: a differenza del corpo "Guida alla lettura", qui
// l'enfasi in stile Markdown (*parola*) resterebbe visibile con gli asterischi
// letterali. Il file gia' migrato a mano (01_01-49.md) conferma la
// convenzione: *patriai tempore iniquo* -> <em>patriai tempore iniquo</em>.
// Trasformazione di solo markup, il testo delle parole non cambia.
function emInline(testo) {
  return testo.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
}

function generaFrontmatter(r, ordine) {
  return {
    libro: r.libro,
    titolo: r.titoloGrezzo,
    versi: r.versi,
    versoIniziale: r.versoIniziale,
    ordine,
    traduttore: 'Antonio Vigilante',
    fonteLatino: 'Cyril Bailey',
    // Metadati editoriali (sommario, temi, titolo rifinito) non esistono nel
    // sorgente Sphinx: restano da scrivere a mano. Finche' mancano, il passo
    // e' segnato come bozza e non compare nell'elenco pubblico del sito.
    bozza: true,
    latino: r.latino,
    italiano: r.italiano,
    note: r.note.map(({ n, lingua, testo }) => ({ n, lingua, testo: emInline(testo) })),
  };
}

function scriviFile(percorsoOut, fm, guida) {
  const yamlTesto = yaml.dump(fm, { lineWidth: -1, noRefs: true, quotingType: '"' });
  const output = `---\n${yamlTesto}---\n\n${guida ?? ''}\n`;
  fs.writeFileSync(percorsoOut, output, 'utf8');
}

const cartellaSorgente = String.raw`C:\Users\anton\Desktop\Siti\lucrezio\source\I`;
const cartellaDestinazione = path.resolve('src/content/passi');

const files = fs
  .readdirSync(cartellaSorgente)
  .filter((f) => /^\d+-\d+\.md$/.test(f))
  .sort((a, b) => parseInt(a) - parseInt(b));

let ordine = 1; // 01_01-49.md e' gia' ordine 1
const report = [];

for (const f of files) {
  if (f === '01-49.md') {
    ordine++; // gia' esistente e migrato a mano, non lo tocco
    continue;
  }
  const r = parseFile(path.join(cartellaSorgente, f));
  ordine++;
  const nomeOut = `01_${r.versi}.md`;
  const percorsoOut = path.join(cartellaDestinazione, nomeOut);
  const fm = generaFrontmatter(r, ordine);
  scriviFile(percorsoOut, fm, r.guida);
  report.push({ file: f, out: nomeOut, ordine, note: r.note.length, problemi: r.problemi });
}

console.log(`\nGenerati ${report.length} file in ${cartellaDestinazione}\n`);
for (const rr of report) {
  console.log(`  ${rr.out}  (ordine ${rr.ordine}, note ${rr.note})`);
  rr.problemi.forEach((p) => console.log(`      ! ${p}`));
}
console.log(`\nUltimo ordine usato per libro I: ${ordine}. I placeholder di libro II/III vanno spostati a ${ordine + 1} e ${ordine + 2}.`);
