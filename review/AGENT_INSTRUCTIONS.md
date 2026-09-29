# Task: review + extend one slice of an MSc entrance-exam question bank (AGH, Informatyka i Systemy Inteligentne)

You are an expert computer-science lecturer. You get one slice of multiple-choice questions (Polish) that a
student uses to drill for the *egzamin wstępny na studia II stopnia ISI* at AGH. On the real exam every
question stem appears with MANY different answer statements, each to be judged true/false, and several may
be correct at once. The student reports that some answers in the bank are still wrong, and wants:

1. every option's `correct` flag verified and fixed,
2. more answer options per question (a hidden pool the app samples from),
3. a glossary ("słownik") explaining each concept — what it is and exactly how it works,
4. an offline explanation for every question.

## Files

- Input:  `review/slices/<SLICE>.json` — list of questions `{id, topic, courseName, question, options:[{key,text,correct}]}`
- Output: `review/out/<SLICE>.json` — you create this (schema below).
- Validator: `python3 review/validate_slice.py <SLICE>` — must end with `0 errors`. Warnings are allowed
  but read them. Run it after writing and fix everything it reports. Do not stop until it passes.
- Reference material (optional, only if useful): `/home/claude/mscExam/agh_isi_program_data.md` (syllabus),
  `review/wykaz.txt` (official list of question stems with one sample statement each).

## Output schema (strict)

```json
{
  "questions": [
    {
      "id": 123,
      "question": "text — identical to input unless you fix a typo/truncation (then list it in changes)",
      "options": [
        {"key": "a", "text": "original option text (typo fixes allowed)", "correct": true},
        {"key": "b", "text": "...", "correct": false},
        {"key": "c", "text": "NEW statement", "correct": false, "extra": true},
        {"key": "d", "text": "NEW statement", "correct": true,  "extra": true}
      ],
      "terms": ["slug-1", "slug-2"],
      "explanation": "markdown, po polsku",
      "changes": ["b: false -> true, bo ...", "poprawiono ucięty tekst opcji c"]
    }
  ],
  "glossary": [
    {
      "id": "slug-1",
      "term": "Nazwa pojęcia (English name)",
      "topic": "algorithms",
      "short": "1–2 zdania: co to jest.",
      "details": "markdown, po polsku, 150–400 słów: jak dokładnie działa, właściwości, wzory, przykład, pułapki egzaminacyjne",
      "related": ["slug-2"]
    }
  ]
}
```

Rules enforced by the validator: keep ALL original options first, in the original order, with the original
keys and no `extra` flag; new options are appended with consecutive keys (`e`, `f`, ... after the last
original key) and `"extra": true`; each question needs >= 3 extra options, >= 2 of them incorrect, total pool
>= 7; at least one correct and one incorrect option overall; no duplicate option texts; `terms` 1–6 slugs
that all exist in YOUR glossary; `explanation` >= 250 chars; glossary `short` >= 40 chars, `details` >= 600 chars;
slugs `^[a-z0-9]+(-[a-z0-9]+)*$` (ASCII, no Polish letters, e.g. `zlozonosc-obliczeniowa`, `deadlock`, `tcp-handshake`).
Every question in the input must appear exactly once.

## Part 1 — Verify correctness (the most important part; be rigorous)

For EVERY option decide, with proper reasoning, whether the statement is true in the context of the question
stem. Fix the `correct` flag when the bank is wrong. Typical faults in this bank: a true statement marked false
(especially "generic but true" statements in generated questions), a false statement marked true, a truncated
option, garbled formulas, or a question whose stem asks for a specific value where only one option can be right.

Guidelines:
- Judge each statement on its own merits against the stem ("Które zdania są prawdziwe?" → every true statement is correct,
  even if it looks like filler). If the stem asks for a single specific value/answer, only the matching value is correct.
- Where the truth depends on an ambiguous convention and the original author's intent is clear, keep the original flag
  and mention the ambiguity in `explanation`. Change a flag only when you are confident; write the justification in `changes`.
- Fix obvious typos, truncated text ("musi być zgo") and broken math in question/option text, keeping the meaning.
  Don't rephrase for style. Every text edit must be listed in `changes`.
- Math: inline LaTeX is written between `^^ ... ^^` (the app's MathJax delimiter), e.g. `^^O(n \log n)^^`. Plain text
  like `O(n log n)` is also fine. Do not use `$...$`. Text may contain `<` and `>` freely (the app escapes HTML).
- Unicode is fine (Polish letters, →, ≤, …).

## Part 2 — Extend the answer pool

For every question append new statements so the pool has at least 7 options (aim for 8–10 when the stem allows):
- at least 2 new INCORRECT statements (plausible, exam-style distractors — common misconceptions, swapped
  concepts, wrong complexity/number, inverted condition; NOT obviously silly),
- at least 1 new CORRECT statement whenever possible (a different true fact about the same concept, or a correct
  rephrasing that isn't a trivial paraphrase of an existing correct option). Skip only when any extra correct
  statement would be ambiguous (e.g. stem asks for one numeric value) — the validator then only warns.
- Each new statement must be unambiguously true or false for a competent lecturer, self-contained, in the same
  style/register and language (Polish) as the existing options, not a duplicate/near-duplicate of any other option,
  and consistent with the stem (if the stem asks about property X, statements are about X).
- Never make an extra statement whose truth depends on the *number of other correct options* or on letters of
  other options ("żadne z powyższych", "a i b", "wszystkie powyższe" are forbidden — options are shuffled and sampled).
  If such an option already exists in the original data, keep it (don't delete) but note in `changes` that it is
  position-dependent by adding the phrase `[POSITION-DEPENDENT]`.

## Part 3 — Glossary (słownik)

Identify the concepts the student must understand to answer each question (1–6 per question) and write ONE glossary
entry per concept (shared across questions in your slice — reuse slugs). Prefer concept-level entries
("Algorytm Dijkstry", "Adresowanie otwarte", "Deadlock i warunki Coffmana", "Normalizacja — 3NF", "Metoda bisekcji",
"Trójstopniowe nawiązanie połączenia TCP"), not question-level. Typically 12–30 entries per slice.

Each entry (Polish):
- `term`: Polish name, English name in parentheses when it is commonly used (e.g. "Tablica mieszająca (hash table)").
- `short`: 1–2 sentences — what it is.
- `details`: markdown, 150–400 words: **jak dokładnie działa** (mechanism step by step), key properties/complexities/
  formulas (LaTeX inside `^^...^^`), a compact example, and a section `**Na egzaminie uważaj na:**` listing 2–5 typical
  traps / true-vs-false confusions relevant to the exam statements. Write so that a student who does not know the
  answer can read the entry and then DECIDE the truth of exam statements by themselves. Do not reference option letters
  or question numbers.
- `related`: other slugs from your glossary.
- `topic`: one of the topic ids used in the input (`algorithms`, `databases`, ... — use the question's topic).

## Part 4 — Per-question explanation

`explanation` (markdown, Polish, ~100–250 words): a section **Dlaczego poprawne** (why each correct statement is true),
**Dlaczego błędne** (short, per incorrect statement — group similar ones), and **Zapamiętaj** (one-sentence rule).
Refer to options by quoting/paraphrasing their content, NOT by letter (letters are shuffled in the app). Cover the
extra options too.

## Workflow

1. Read the input slice fully. Think about every option; when unsure, work it out (compute, trace code, recall the
   definition). You may run small snippets (python3/node/gcc/javac are available) to check code-related questions.
2. Write `review/out/<SLICE>.json`. For large slices write the file in parts: first the `glossary` and the
   first ~10 questions, then append further questions with Edit calls — but the final file must be one valid JSON
   document. Keep JSON strings properly escaped (`\n` for newlines inside markdown, `\"` for quotes).
3. Run `python3 review/validate_slice.py <SLICE>` and fix until `0 errors`.
4. Reply with a SHORT report (max 25 lines): number of questions, number of correctness changes, the list of
   changed question ids with a one-line reason each, and anything you were unsure about. Do not paste the JSON.

## BUDGET MODE (overrides sizes above)
Token budget is tight. Be efficient:
- Read the input slice ONCE (one Read call). Do not re-read files you wrote.
- Write the whole output with ONE python3 script (a heredoc that builds the dict and json.dumps it) — no step-by-step Edit calls.
- Sizes: glossary `details` 80–200 words (>= 400 chars), `explanation` 50–120 words (>= 150 chars). 10–20 glossary entries per slice.
- Still >= 3 extra options per question (>= 2 incorrect, >= 1 correct when possible).
- Correctness review stays rigorous — that is the priority.
- Final report: max 12 lines.
