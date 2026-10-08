# Second-pass verification of one slice (Polish MSc exam drill, AGH ISI)

A student will LEARN from this material, so every statement marked true must really be true, every statement marked
false must really be false, and glossary/explanations must contain no factual errors.

Input (read-only): `review/out/<SLICE>.json` — `{questions:[{id,question,options:[{key,text,correct,extra?}],terms,explanation,changes}], glossary:[{id,term,topic,short,details,related}]}`.
(Paths are relative to /home/claude/mscExam.)

## What to check
1. Every option of every question: is the `correct` flag right for this stem? Options are shown SHUFFLED and as a RANDOM
   SUBSET, each judged on its own as true/false. Watch for: wrong flags, statements that are ambiguous/half-true
   (fix the wording so it is unambiguous, or remove it), extra options that duplicate another option's meaning,
   options whose truth depends on other options ("żadne z...", "a i b").
   Bare fragments (e.g. "Warstwa sesji", "PATCH") are judged as "is this a correct answer to the stem?".
   For code questions compile/run (gcc, g++, javac/java, node, python3 available). Compute numbers.
2. Question text: typos, truncation, garbled formulas (math uses `^^...^^` inline LaTeX).
3. `explanation`: factually correct, consistent with final flags, no references to option letters.
4. Glossary entries (`short`, `details`): factually correct, Polish, no misleading statements.
Do NOT rewrite things that are correct just for style. Be rigorous; when you change something, be sure.

## Output
Write `review/fixes/<SLICE>.json`:
```json
{
 "options":   [{"id": 123, "key": "c", "correct": true, "text": "only if text changes", "reason": "krótko"}],
 "remove":    [{"id": 123, "key": "f", "reason": "duplikat / niejednoznaczne"}],
 "questions": [{"id": 123, "question": "pełny poprawiony tekst", "reason": "..."}],
 "explanations": [{"id": 123, "explanation": "pełny nowy tekst (markdown, po polsku)"}],
 "glossary":  [{"id": "slug", "short": "optional new", "details": "optional full new text"}]
}
```
Only list what changes (empty arrays are fine). Use `remove` only for EXTRA options (`extra: true`); for wrong original
options fix the flag/text instead. After removals each question must still keep >= 1 correct and >= 1 incorrect
option and >= 5 options. If you flip a flag, also update that question's explanation if it contradicts the flip.

Efficiency: read the input file once (it is large; read it in 2–3 chunks with Read offset/limit if needed), write the
fixes file with one python3 heredoc script, then run `python3 review/apply_fixes.py <SLICE> --check` (must print OK).
Final reply: max 15 lines — counts per category and the list of flag changes (id: text → T/F, reason).
