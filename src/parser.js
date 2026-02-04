// Question Parser - Converts drill .txt files to JSON format
// Supports both original (drill copy.txt) and new (nowe_pytania_isi.txt) question banks

const fs = require('fs');
const path = require('path');

// ── ORIGINAL questions (drill copy.txt) ID mappings ──

const origTopicMap = {
    algorithms: [1, 2, 3, 227, 228, 229, 230, 231, 232, 233],
    digital_systems: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
    transmission: [19],
    databases: range(34, 52),
    software_engineering: range(53, 79),
    functional_programming: [80, 81, 82, 83, 84, 85],
    java: [86, 87, 88, 89, 90, 91],
    c_cpp: range(92, 101),
    numerical_methods: range(102, 131),
    networks: range(132, 163),
    operating_systems: range(164, 176),
    oop_design: [177, 178, 179, 180, 181],
    formal_languages: range(182, 195),
    concurrent_programming: [196, 197, 198, 199, 200, 201],
    unix_admin: [202, 203, 204, 205, 206, 207],
    number_representation: range(208, 222),
    programming_basics: [223, 224, 225, 226]
};

const origSemesterMap = {
    1: [...range(1, 19), ...range(208, 222)],
    2: [223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 80, 81, 82, 83, 84, 85],
    3: [...range(34, 52), ...range(182, 195), ...range(102, 131)],
    4: [...range(132, 176)],
    5: range(53, 79),
    6: [...range(86, 101), ...range(177, 181)],
    7: range(196, 207)
};

// ── NEW questions (nowe_pytania_isi.txt) ID mappings ──
// New questions get IDs 1001+ (original file ID + 1000 offset)

const newTopicMap = {
    algorithms:            [...range(1001, 1012), ...range(1282, 1293)],
    logic:                 range(1013, 1024),
    math:                  [...range(1025, 1036), ...range(1051, 1074)],
    numerical_methods:     range(1037, 1050),
    formal_languages:      [...range(1075, 1089), ...range(1114, 1125)],
    digital_systems:       range(1090, 1101),
    databases:             range(1102, 1113),
    computer_graphics:     range(1126, 1137),
    operating_systems:     range(1138, 1149),
    compilation:           range(1150, 1163),
    programming_basics:    range(1164, 1166),
    number_representation: range(1167, 1169),
    image_processing:      [1170],
    unix_admin:            range(1171, 1183),
    software_engineering:  range(1184, 1205),
    c_cpp:                 range(1206, 1230),
    web_programming:       [...range(1231, 1241), ...range(1257, 1266)],
    java:                  range(1242, 1256),
    networks:              range(1267, 1281),
    machine_learning:      [...range(1294, 1356)]
};

const newSemesterMap = {
    1: [...range(1001, 1012), ...range(1013, 1024), ...range(1025, 1036), ...range(1164, 1169)],
    2: [...range(1051, 1074), ...range(1090, 1101), ...range(1206, 1217)],
    3: [...range(1037, 1050), ...range(1075, 1089), ...range(1102, 1125), ...range(1138, 1149), ...range(1171, 1183), ...range(1218, 1230)],
    4: [...range(1150, 1163), ...range(1184, 1205), ...range(1242, 1256), ...range(1267, 1281), ...range(1282, 1293)],
    5: [...range(1126, 1137), ...range(1231, 1266)],
    6: [1170],
    7: [...range(1294, 1356)]
};

// ── Course name mapping ──

const topicCourseMap = {
    algorithms: 'Algorytmy i struktury danych',
    digital_systems: 'Podstawy techniki cyfrowej',
    transmission: 'Podstawy techniki cyfrowej',
    databases: 'Bazy danych',
    software_engineering: 'Inżynieria oprogramowania',
    functional_programming: 'Podstawy programowania',
    java: 'Programowanie zaawansowane (Java)',
    c_cpp: 'Programowanie zaawansowane (C/C++)',
    numerical_methods: 'Metody numeryczne',
    networks: 'Sieci komputerowe',
    operating_systems: 'Systemy operacyjne',
    oop_design: 'Programowanie obiektowe',
    formal_languages: 'Lingwistyka formalna i automaty',
    concurrent_programming: 'Programowanie współbieżne',
    unix_admin: 'Systemy uniksowe',
    number_representation: 'Wstęp do informatyki',
    programming_basics: 'Podstawy programowania',
    logic: 'Logika',
    math: 'Matematyka (dyskretna, prawdopodobieństwo, grafy)',
    compilation: 'Teoria kompilacji i kompilatory',
    computer_graphics: 'Grafika komputerowa',
    image_processing: 'Przetwarzanie obrazów cyfrowych',
    web_programming: 'Programowanie aplikacji webowych',
    machine_learning: 'Uczenie maszynowe / Sztuczna inteligencja',
    other: ''
};

// ── Helper ──

function range(start, end) {
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function getTopicForId(id) {
    const maps = id >= 1000 ? newTopicMap : origTopicMap;
    for (const [topic, ids] of Object.entries(maps)) {
        if (ids.includes(id)) return topic;
    }
    return 'other';
}

function getSemesterForId(id) {
    const maps = id >= 1000 ? newSemesterMap : origSemesterMap;
    for (const [sem, ids] of Object.entries(maps)) {
        if (ids.includes(id)) return parseInt(sem);
    }
    return null;
}

// ── Parser ──

function parseQuestions(content, idOffset = 0) {
    const questions = [];
    content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = content.split('\n');

    let currentQuestion = null;
    let questionText = '';
    let options = [];
    let seenKeys = new Set();

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;
        if (line.startsWith('<options>')) break;

        // Question start: [#N] or [#N] (#N)
        const questionMatch = line.match(/^\[#(\d+)\]\s*(?:\(#\d+\)\s*)?(.*)$/);
        if (questionMatch) {
            if (currentQuestion !== null && questionText.trim()) {
                const finalId = currentQuestion + idOffset;
                const topic = getTopicForId(finalId);
                questions.push({
                    id: finalId,
                    question: questionText.trim(),
                    options,
                    topic,
                    semester: getSemesterForId(finalId),
                    courseName: topicCourseMap[topic] || '',
                    multipleCorrect: options.filter(o => o.correct).length > 1
                });
            }

            currentQuestion = parseInt(questionMatch[1]);
            questionText = questionMatch[2];
            options = [];
            seenKeys = new Set();
            continue;
        }

        // Option line
        const optionMatch = line.match(/^(>>)?([a-z])\)(.*)$/);
        if (optionMatch && currentQuestion !== null) {
            const isCorrect = optionMatch[1] === '>>';
            const key = optionMatch[2];
            const text = optionMatch[3].trim();

            if (seenKeys.has(key)) {
                if (isCorrect) {
                    const idx = options.findIndex(o => o.key === key);
                    if (idx !== -1) options[idx] = { key, text, correct: true };
                }
                continue;
            }

            seenKeys.add(key);
            options.push({ key, text, correct: isCorrect });
            continue;
        }

        // Multi-line question text
        if (currentQuestion !== null && line && !line.match(/^(>>)?[a-z]\)/)) {
            questionText += ' ' + line;
        }
    }

    // Last question
    if (currentQuestion !== null && questionText.trim()) {
        const finalId = currentQuestion + idOffset;
        const topic = getTopicForId(finalId);
        questions.push({
            id: finalId,
            question: questionText.trim(),
            options,
            topic,
            semester: getSemesterForId(finalId),
            courseName: topicCourseMap[topic] || '',
            multipleCorrect: options.filter(o => o.correct).length > 1
        });
    }

    return questions;
}

// ── Main ──

function main() {
    const origPath = path.join(__dirname, '..', 'drill copy.txt');
    const newPath = path.join(__dirname, '..', 'nowe_pytania_isi.txt');
    const outputPath = path.join(__dirname, '..', 'data', 'questions.json');

    let allQuestions = [];

    // Parse original file (IDs stay as-is: 1-233)
    if (fs.existsSync(origPath)) {
        console.log('Parsing:', origPath);
        const origContent = fs.readFileSync(origPath, 'utf-8');
        const origQuestions = parseQuestions(origContent, 0);
        console.log(`  -> ${origQuestions.length} questions (IDs 1-233)`);
        allQuestions.push(...origQuestions);
    }

    // Parse new file (IDs offset by 1000: 1001-1356)
    if (fs.existsSync(newPath)) {
        console.log('Parsing:', newPath);
        const newContent = fs.readFileSync(newPath, 'utf-8');
        const newQuestions = parseQuestions(newContent, 1000);
        console.log(`  -> ${newQuestions.length} questions (IDs 1001-1356)`);
        allQuestions.push(...newQuestions);
    }

    console.log(`\nTotal: ${allQuestions.length} questions`);

    // Stats
    const stats = {
        total: allQuestions.length,
        byTopic: {},
        bySemester: {},
        multipleChoice: allQuestions.filter(q => q.multipleCorrect).length,
        singleChoice: allQuestions.filter(q => !q.multipleCorrect).length
    };

    allQuestions.forEach(q => {
        stats.byTopic[q.topic] = (stats.byTopic[q.topic] || 0) + 1;
        if (q.semester) {
            stats.bySemester[q.semester] = (stats.bySemester[q.semester] || 0) + 1;
        }
    });

    const output = {
        metadata: {
            generatedAt: new Date().toISOString(),
            sources: ['drill copy.txt (IDs 1-233)', 'nowe_pytania_isi.txt (IDs 1001-1356)'],
            stats
        },
        questions: allQuestions
    };

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
    console.log('\nSaved to:', outputPath);
    console.log('Topics:', JSON.stringify(stats.byTopic, null, 2));
    console.log('Semesters:', JSON.stringify(stats.bySemester, null, 2));
}

if (require.main === module) {
    main();
}

module.exports = { parseQuestions, getTopicForId, getSemesterForId };
