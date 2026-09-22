#!/usr/bin/env python3
"""Validate an agent output slice against its input slice.

Usage: python3 validate_slice.py S01
Reads  slices/S01.json (input) and out/S01.json (output).
Exit code 0 = OK (warnings allowed), 1 = errors.
"""
import json, re, sys, os

TOPICS = {
    'algorithms','digital_systems','transmission','databases','software_engineering',
    'functional_programming','java','c_cpp','numerical_methods','networks','operating_systems',
    'oop_design','formal_languages','concurrent_programming','unix_admin','number_representation',
    'programming_basics','logic','math','compilation','computer_graphics','image_processing',
    'web_programming','machine_learning','other'
}
SLUG = re.compile(r'^[a-z0-9]+(-[a-z0-9]+)*$')

def main(name):
    base = os.path.dirname(os.path.abspath(__file__))
    inp_path = os.path.join(base, 'slices', f'{name}.json')
    out_path = os.path.join(base, 'out', f'{name}.json')
    errors, warnings = [], []
    inp = {q['id']: q for q in json.load(open(inp_path))}
    try:
        out = json.load(open(out_path))
    except Exception as e:
        print(f'ERROR: out/{name}.json is not valid JSON: {e}')
        return 1
    if not isinstance(out, dict) or 'questions' not in out or 'glossary' not in out:
        print('ERROR: output must be an object with keys "questions" and "glossary"')
        return 1

    gloss = {}
    for g in out['glossary']:
        gid = g.get('id')
        if not isinstance(gid, str) or not SLUG.match(gid):
            errors.append(f'glossary: bad slug id {gid!r}'); continue
        if gid in gloss:
            errors.append(f'glossary: duplicate id {gid}')
        gloss[gid] = g
        for k in ('term', 'topic', 'short', 'details'):
            if not isinstance(g.get(k), str) or not g[k].strip():
                errors.append(f'glossary[{gid}]: missing/empty field {k}')
        if g.get('topic') not in TOPICS:
            errors.append(f'glossary[{gid}]: unknown topic {g.get("topic")!r}')
        if isinstance(g.get('short'), str) and len(g['short']) < 40:
            errors.append(f'glossary[{gid}]: "short" too short (<40 chars)')
        if isinstance(g.get('details'), str) and len(g['details']) < 600:
            errors.append(f'glossary[{gid}]: "details" too short ({len(g["details"])} chars, need >= 600)')
        rel = g.get('related', [])
        if not isinstance(rel, list):
            errors.append(f'glossary[{gid}]: related must be a list')
    for g in out['glossary']:
        for r in g.get('related', []) if isinstance(g.get('related'), list) else []:
            if r not in gloss:
                warnings.append(f'glossary[{g.get("id")}]: related slug {r!r} not defined in this slice (will be dropped if not found globally)')

    seen = set()
    for q in out['questions']:
        qid = q.get('id')
        if qid not in inp:
            errors.append(f'q{qid}: id not in input slice'); continue
        if qid in seen:
            errors.append(f'q{qid}: duplicated'); continue
        seen.add(qid)
        orig = inp[qid]
        tag = f'q{qid}'
        changes = q.get('changes')
        if not isinstance(changes, list):
            errors.append(f'{tag}: "changes" must be a list (may be empty)'); changes = []
        if not isinstance(q.get('question'), str) or not q['question'].strip():
            errors.append(f'{tag}: empty question text')
        elif q['question'] != orig['question'] and not changes:
            errors.append(f'{tag}: question text changed but "changes" is empty')
        opts = q.get('options')
        if not isinstance(opts, list) or not opts:
            errors.append(f'{tag}: options missing'); continue
        # original options must come first, same keys, same order
        n0 = len(orig['options'])
        if len(opts) < n0:
            errors.append(f'{tag}: fewer options than input'); continue
        flag_changed = False
        for i, oo in enumerate(orig['options']):
            o = opts[i]
            if o.get('key') != oo['key']:
                errors.append(f'{tag}: option {i} key {o.get("key")!r} != original {oo["key"]!r} (keep original order/keys)')
            if o.get('extra'):
                errors.append(f'{tag}: original option {oo["key"]} marked extra')
            if not isinstance(o.get('text'), str) or not o['text'].strip():
                errors.append(f'{tag}: option {oo["key"]} empty text')
            if not isinstance(o.get('correct'), bool):
                errors.append(f'{tag}: option {oo["key"]} correct must be boolean')
            elif o['correct'] != oo['correct']:
                flag_changed = True
            if isinstance(o.get('text'), str) and o['text'] != oo['text'] and not changes:
                errors.append(f'{tag}: option {oo["key"]} text changed but "changes" is empty')
        if flag_changed and not changes:
            errors.append(f'{tag}: correct flags changed but "changes" is empty')
        extras = opts[n0:]
        expected_keys = [chr(97 + n0 + i) for i in range(len(extras))]
        for i, o in enumerate(extras):
            if not o.get('extra'):
                errors.append(f'{tag}: new option {o.get("key")} must have "extra": true')
            if o.get('key') != expected_keys[i]:
                errors.append(f'{tag}: new option key {o.get("key")!r} should be {expected_keys[i]!r} (sequential)')
            if not isinstance(o.get('text'), str) or len(o['text'].strip()) < 2:
                errors.append(f'{tag}: new option {o.get("key")} has empty text')
            if not isinstance(o.get('correct'), bool):
                errors.append(f'{tag}: new option {o.get("key")} correct must be boolean')
        if len(extras) < 3:
            errors.append(f'{tag}: only {len(extras)} extra options, need >= 3')
        if len(opts) < 7:
            errors.append(f'{tag}: total pool {len(opts)} < 7')
        texts = [re.sub(r'\W+', ' ', o.get('text', '')).strip().lower() for o in opts]
        dups = {t for t in texts if texts.count(t) > 1}
        if dups:
            errors.append(f'{tag}: duplicate option texts: {sorted(dups)[:3]}')
        ncor = sum(1 for o in opts if o.get('correct') is True)
        ninc = sum(1 for o in opts if o.get('correct') is False)
        if ncor == 0: errors.append(f'{tag}: no correct option')
        if ninc == 0: errors.append(f'{tag}: no incorrect option')
        if sum(1 for o in extras if o.get('correct') is False) < 2:
            errors.append(f'{tag}: need >= 2 extra INCORRECT options')
        if sum(1 for o in extras if o.get('correct') is True) < 1:
            warnings.append(f'{tag}: no extra CORRECT option (ok only if impossible without ambiguity)')
        terms = q.get('terms')
        if not isinstance(terms, list) or not (1 <= len(terms) <= 6):
            errors.append(f'{tag}: terms must be a list of 1..6 slugs')
        else:
            for t in terms:
                if t not in gloss:
                    errors.append(f'{tag}: term {t!r} not defined in glossary')
        ex = q.get('explanation')
        if not isinstance(ex, str) or len(ex) < 250:
            errors.append(f'{tag}: explanation missing or too short (< 250 chars)')
    missing = set(inp) - seen
    if missing:
        errors.append(f'missing questions: {sorted(missing)}')

    for w in warnings: print('WARN:', w)
    for e in errors: print('ERROR:', e)
    print(f'{name}: {len(out["questions"])} questions, {len(gloss)} glossary entries, {len(errors)} errors, {len(warnings)} warnings')
    return 1 if errors else 0

if __name__ == '__main__':
    sys.exit(main(sys.argv[1]))
