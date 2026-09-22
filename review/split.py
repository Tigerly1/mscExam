import json, collections
d = json.load(open('/home/claude/mscExam/data/questions.json'))
qs = d['questions']
by = collections.defaultdict(list)
for q in qs: by[q['topic']].append(q)
ml = sorted(by['machine_learning'], key=lambda q: q['id'])
slices = {
 'S01': by['algorithms'] + by['programming_basics'],
 'S02': by['digital_systems'] + by['transmission'] + by['number_representation'],
 'S03': by['databases'] + by['computer_graphics'] + by['image_processing'],
 'S04': by['software_engineering'],
 'S05': by['java'] + by['oop_design'] + by['concurrent_programming'] + by['functional_programming'],
 'S06': by['c_cpp'],
 'S07': by['numerical_methods'],
 'S08': by['networks'],
 'S09': by['operating_systems'] + by['unix_admin'],
 'S10': by['formal_languages'],
 'S11': by['logic'] + by['math'],
 'S12': by['web_programming'] + by['compilation'],
 'S13': ml[:32],
 'S14': ml[32:],
}
tot = 0
for name, lst in slices.items():
    out = [{'id': q['id'], 'topic': q['topic'], 'courseName': q['courseName'], 'question': q['question'],
            'options': [{'key': o['key'], 'text': o['text'], 'correct': o['correct']} for o in q['options']]} for q in lst]
    json.dump(out, open(f'slices/{name}.json', 'w'), ensure_ascii=False, indent=1)
    tot += len(out)
    print(name, len(out), collections.Counter(q['topic'] for q in lst))
print('total', tot)
