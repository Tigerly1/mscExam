import json,glob,re
base=json.load(open('/home/claude/mscExam/data/questions.json'))
orig={q['id']:q for q in base['questions']}
qs=[];gloss={};expl={};flips=[]
for f in sorted(glob.glob('out/S*.json')):
    d=json.load(open(f))
    for g in d['glossary']:
        g=dict(g); g['related']=[r for r in g.get('related',[])]
        gloss.setdefault(g['id'],g)
    for q in d['questions']:
        o=orig[q['id']]
        opts=[]
        for i,x in enumerate(q['options']):
            t=x['text'].replace('[POSITION-DEPENDENT]','').strip()
            pd=('[POSITION-DEPENDENT]' in x['text']) or bool(re.search(r'żadn[ea] z (pozostałych|powyższych)|wszystkie (powyższe|pozostałe)',t,re.I))
            opts.append({'key':chr(97+i),'text':t,'correct':x['correct'],'extra':bool(x.get('extra')),**({'fixed':True} if pd else {})})
        for i,x in enumerate(o['options']):
            if q['options'][i]['correct']!=x['correct']: flips.append((q['id'],x['text'][:70],x['correct'],q['options'][i]['correct']))
        nq={k:o[k] for k in ('id','topic','semester','courseName')}
        nq.update(question=q['question'],options=opts,terms=q['terms'])
        qs.append(nq); expl[str(q['id'])]=q['explanation']
for g in gloss.values(): g['related']=[r for r in g['related'] if r in gloss]
# glossary backlinks
for q in qs:
    for t in q['terms']: gloss[t].setdefault('questions',[]).append(q['id'])
qs.sort(key=lambda q:q['id'])
json.dump({'metadata':{'version':2,'total':len(qs)},'questions':qs},open('/home/claude/mscExam/data/questions.json','w'),ensure_ascii=False,indent=1)
json.dump(sorted(gloss.values(),key=lambda g:g['term'].lower()),open('/home/claude/mscExam/data/glossary.json','w'),ensure_ascii=False,indent=1)
json.dump(expl,open('/home/claude/mscExam/data/explanations.json','w'),ensure_ascii=False,indent=1)
json.dump(flips,open('flips.json','w'),ensure_ascii=False,indent=0)
print(len(qs),'questions',len(gloss),'glossary',len(flips),'flips', sum(len(q['options']) for q in qs),'options')
