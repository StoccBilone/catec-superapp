import argparse, json, re, zipfile, xml.etree.ElementTree as ET
from pathlib import Path

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description='Read the CATEC fourth-year timetable without modifying the workbook.')
parser.add_argument('workbook', type=Path)
source = parser.parse_args().workbook
ns = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
with zipfile.ZipFile(source) as z:
    strings = [''.join(t.itertext()) for t in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si', ns)]
    sheet = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
    merges = {m.attrib['ref'].split(':')[0]:m.attrib['ref'] for m in sheet.findall('m:mergeCells/m:mergeCell',ns)}
    cells = {}
    for c in sheet.findall('m:sheetData/m:row/m:c', ns):
        v = c.find('m:v', ns)
        if v is not None:
            cells[c.attrib['r']] = strings[int(v.text)] if c.attrib.get('t') == 's' else v.text

groups = [('H','I','П4 А','p4a'),('K','L','П4 Б/У','p4bu'),('N','O','П4 В','p4v'),('Q','R','П4 Г','p4g'),('T','U','П4 К','p4k'),('W','X','ИС4А','is4a'),('Z','AA','СИБ4А/У','sib4au'),('AC','AD','СИБ4Б','sib4b'),('AF','AG','РОБ4А','rob4a'),('AI','AJ','ВМ4А/Б','vm4ab'),('AL','AM','ВТ4А','vt4a'),('AO','AP','ВТ4Б','vt4b')]
blocks = [[19,25,31,37,40],[49,55,61,67,71],[74,80,86,92,96],[100,106,112,118,122],[127,133,139,145,149]]
ends = [[25,31,37,40,46],[55,61,67,71,73],[80,86,92,96,98],[106,112,118,122,126],[133,139,145,149,153]]
bells = [('11:00','12:20'),('12:50','14:10'),('14:20','15:40'),('15:50','17:10'),('17:20','18:40')]
lessons = []
audit = []
clean = lambda s: re.sub(r'\s+', ' ', s).strip()
room_pattern = re.compile(r'(\d+\s*ауд[.ю]?|Спортивный зал|Библиотека|База DOSTI)', re.I)
for day, rows in enumerate(blocks,1):
    for pair, row in enumerate(rows):
        end = ends[day-1][pair]
        for a,b,group,slug in groups:
            subjects = [(col, clean(cells.get(f'{col}{row}', ''))) for col in (a,b)]
            subjects = [(col,s) for col,s in subjects if s and s != 'Телевидение']
            for variant,(col,subject) in enumerate(subjects):
                values = [(f'{col}{r}', clean(cells[f'{col}{r}'])) for r in range(row+1,end) if f'{col}{r}' in cells]
                # TV labels are printed redundantly in the source; preserve as a subject qualifier once.
                if col == 'AI' and any(cells.get(f'{c}{r}') == 'Телевидение' for c in (a,b) for r in range(row,end)):
                    subject += ' · Телевидение'
                rooms, teachers = [], []
                for ref,value in values:
                    if value == 'Телевидение': continue
                    matches = room_pattern.findall(value)
                    rooms.extend(clean(v) for v in matches)
                    teacher = clean(room_pattern.sub('', value))
                    if teacher and teacher not in teachers: teachers.append(teacher)
                rooms = list(dict.fromkeys(rooms))
                merge = merges.get(f'{col}{row}', '')
                separate = len(subjects)>1 or not merge or re.match(r'[A-Z]+',merge.split(':')[-1]).group() == col
                subgroup = 1 if col == a else 2
                lesson = dict(id=f'c-{day}-{pair}-{slug}' + (f'-{subgroup}' if separate else ''),pairNumber=pair,timeStart=bells[pair][0],timeEnd=bells[pair][1],subject=subject,room=' / '.join(rooms),building='',teacher=' / '.join(teachers),group=group,dayOfWeek=day,sourceRange=f'{col}{row}:{col}{end-1}')
                if separate: lesson['variant'] = subgroup
                lessons.append(lesson)
                audit.append(dict(lessonId=lesson['id'], cells=[(f'{col}{row}',cells[f'{col}{row}'])]+values))

(root/'src/data/importedSchedule.ts').write_text('// Extracted from 4 курс 1 семестр 26-27 13.09.xlsx, sheet "I курс 19 групп", H19:AP152.\n// Bell times supplied by the user. Split columns are subgroups, confirmed by the user.\nimport { Lesson } from "../types";\nexport const IMPORTED_LESSONS: Lesson[] = [\n'+',\n'.join('  '+json.dumps(item,ensure_ascii=False) for item in lessons)+'\n];\n',encoding='utf-8')
(root/'work').mkdir(exist_ok=True)
(root/'work/schedule-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2),encoding='utf-8')
print('Lessons:',len(lessons),'Groups:',len(groups),'Variants:',sum('variant' in l for l in lessons))
print('Missing teacher:',sum(not l['teacher'] for l in lessons),'Missing room:',sum(not l['room'] for l in lessons))
print('Untimed source cells: N98, Q98, Z95, Z123; no class number or subject for the latter rooms.')
