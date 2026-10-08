import json,sys,os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
s=sys.argv[1]; check='--check' in sys.argv
d=json.load(open(f'out/{s}.json')); f=json.load(open(f'fixes/{s}.json'))
Q={q['id']:q for q in d['questions']}; G={g['id']:g for g in d['glossary']}
err=[]
def opt(i,k):
    for o in Q[i]['options']:
        if o['key']==k: return o
    err.append(f'no option {i}{k}')
for x in f.get('options',[]):
    if x['id'] not in Q: err.append(f"bad id {x['id']}"); continue
    o=opt(x['id'],x['key'])
    if o:
        if 'correct' in x: o['correct']=bool(x['correct'])
        if x.get('text'): o['text']=x['text']
        Q[x['id']]['changes'].append('weryfikacja: '+x['key']+' '+x.get('reason',''))
for x in f.get('remove',[]):
    if x['id'] not in Q: err.append(f"bad id {x['id']}"); continue
    o=opt(x['id'],x['key'])
    if o and not o.get('extra'): err.append(f"remove non-extra {x['id']}{x['key']}")
    elif o: Q[x['id']]['options'].remove(o)
for x in f.get('questions',[]):
    if x['id'] in Q: Q[x['id']]['question']=x['question']
    else: err.append(f"bad id {x['id']}")
for x in f.get('explanations',[]):
    if x['id'] in Q: Q[x['id']]['explanation']=x['explanation']
    else: err.append(f"bad id {x['id']}")
for x in f.get('glossary',[]):
    if x['id'] not in G: err.append(f"bad slug {x['id']}"); continue
    for k in ('short','details','term'):
        if x.get(k): G[x['id']][k]=x[k]
for q in d['questions']:
    o=q['options']
    if not any(a['correct'] for a in o) or all(a['correct'] for a in o) or len(o)<5: err.append(f"q{q['id']}: needs >=1 T, >=1 F, >=5 options")
if err: print('\n'.join(err)); sys.exit(1)
if not check: json.dump(d,open(f'out/{s}.json','w'),ensure_ascii=False,indent=1)
print('OK', s, {k:len(v) for k,v in f.items()})
