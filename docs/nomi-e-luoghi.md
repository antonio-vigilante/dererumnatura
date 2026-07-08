# Indice dei nomi e dei luoghi — guida rapida

Rimanda al **verso esatto** in cui compare un nome proprio o un luogo
(a differenza dell'indice tematico, che rimanda all'intero brano).

## 1. Registra il nome

In `src/data/nomi-luoghi.ts`:

```ts
{ chiave: 'venere', etichetta: 'Venere', tipo: 'divinita' },
```

- `chiave` — minuscola, univoca: è il riferimento usato nei versi.
- `etichetta` — la forma mostrata nell'indice.
- `tipo` — una tra `persona` · `divinita` · `luogo` · `popolo`.

Una sezione dell'indice (es. "Luoghi") compare solo quando contiene
almeno una voce registrata **e** effettivamente marcata in un verso.

## 2. Marca l'occorrenza nel verso

- `[[Testo]]` — se la parola nel verso coincide (a meno di maiuscole)
  con la `chiave` registrata.
- `[[Testo|chiave]]` — se la forma nel verso è diversa, tipicamente un
  caso latino declinato.

```yaml
latino:
  - "[[Veneris|venere]] genetrix, hominum divumque voluptas,"
italiano:
  - "O madre degli Eneadi, o benefica [[Venere]]"
```

Nel testo pubblicato resta solo "Testo": il marcatore non è visibile.
Puoi marcare la stessa occorrenza sia nel latino sia nell'italiano;
compariranno nell'indice come due rimandi distinti (lat. / it.).

## Da tenere a mente

- **Non è obbligatorio marcare ogni occorrenza** — solo quelle che
  vuoi rendere raggiungibili dall'indice.
- Se usi una `chiave` non registrata, **la build fallisce** con un
  errore che indica file e verso — niente link rotti in silenzio.
- Voce completa, con esempi, anche in `/guida/#nomi-e-luoghi` sul sito.
