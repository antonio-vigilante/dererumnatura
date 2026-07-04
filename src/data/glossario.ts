/**
 * Glossario dei concetti epicurei ricorrenti nel De Rerum Natura.
 * Ogni voce può essere richiamata dai brani tramite i "temi".
 */
export interface VoceGlossario {
  termine: string;
  greco?: string;
  latino?: string;
  categoria: 'fisica' | 'etica' | 'gnoseologia' | 'teologia';
  definizione: string;
}

export const glossario: VoceGlossario[] = [
  {
    termine: 'Atomo',
    greco: 'ἄτομος',
    latino: 'primordia, semina rerum, corpora prima',
    categoria: 'fisica',
    definizione:
      'Il costituente ultimo, indivisibile ed eterno della realtà. Lucrezio non usa il grecismo «atomo» ma perifrasi latine («principi delle cose», «semi»). Atomi e vuoto sono i soli due princìpi del reale.',
  },
  {
    termine: 'Vuoto',
    greco: 'κενόν',
    latino: 'inane',
    categoria: 'fisica',
    definizione:
      'Lo spazio vuoto in cui gli atomi si muovono. Senza vuoto non vi sarebbe movimento: è la condizione fisica del divenire.',
  },
  {
    termine: 'Clinamen',
    greco: 'παρέγκλισις',
    latino: 'clinamen, declinatio',
    categoria: 'fisica',
    definizione:
      'La «deviazione» minima e imprevedibile con cui gli atomi, cadendo nel vuoto, si scostano dalla verticale. Rende possibili gli urti (e dunque i mondi) e fonda, sul piano etico, la libertà del volere (libera voluntas).',
  },
  {
    termine: 'Voluptas',
    greco: 'ἡδονή',
    latino: 'voluptas',
    categoria: 'etica',
    definizione:
      'Il piacere, fine naturale del vivente. Non è sfrenatezza ma piacere «catastematico»: assenza di dolore nel corpo e di turbamento nell’animo.',
  },
  {
    termine: 'Atarassia',
    greco: 'ἀταραξία',
    latino: 'animi pax, tranquillitas',
    categoria: 'etica',
    definizione:
      'L’imperturbabilità della mente, libera da paure e affanni. È lo scopo della fisica epicurea: conoscere la natura per non temere gli dèi e la morte.',
  },
  {
    termine: 'Aponia',
    greco: 'ἀπονία',
    latino: 'dolore corporis vacare',
    categoria: 'etica',
    definizione:
      'L’assenza di dolore fisico. Insieme all’atarassia costituisce la piena felicità epicurea.',
  },
  {
    termine: 'Foedera naturae',
    latino: 'foedera naturae',
    categoria: 'fisica',
    definizione:
      'I «patti» o leggi immutabili della natura, che fissano ciò che ogni cosa può o non può fare (in opposizione ai foedera fati, il destino). Ogni specie nasce dai propri semi e resta sé stessa.',
  },
  {
    termine: 'Simulacra',
    greco: 'εἴδωλα',
    latino: 'simulacra, imagines',
    categoria: 'gnoseologia',
    definizione:
      'Le sottilissime pellicole di atomi che si staccano di continuo dalla superficie dei corpi e, colpendo i sensi, producono la visione, i sogni e le immagini mentali.',
  },
  {
    termine: 'Prolessi',
    greco: 'πρόληψις',
    latino: 'notities, anticipatio',
    categoria: 'gnoseologia',
    definizione:
      'La nozione anticipata, formatasi per accumulo di sensazioni, che permette di riconoscere le cose. Insieme alla sensazione è criterio di verità.',
  },
  {
    termine: 'Isonomia',
    greco: 'ἰσονομία',
    latino: 'aequa distributio',
    categoria: 'fisica',
    definizione:
      'Il principio di «pari distribuzione»: nell’infinito, ogni tipo di cosa esiste in numero infinito, e le forze contrarie si bilanciano. Fonda la pluralità dei mondi.',
  },
  {
    termine: 'Intermundia',
    greco: 'μετακόσμια',
    latino: 'intermundia',
    categoria: 'teologia',
    definizione:
      'Gli spazi tra i mondi dove dimorano gli dèi epicurei: beati, immortali e del tutto indifferenti alle vicende umane. Non creano né governano il cosmo.',
  },
];
