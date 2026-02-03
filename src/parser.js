// Question Parser - Converts drill copy.txt to JSON format

const fs = require('fs');
const path = require('path');

// Topic mapping based on question ranges
const topicMapping = {
    algorithms: [1, 2, 3, 227, 228, 229, 230, 231, 232, 233],
    digital_systems: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
    transmission: [19],
    databases: Array.from({length: 19}, (_, i) => 34 + i), // 34-52
    software_engineering: Array.from({length: 27}, (_, i) => 53 + i), // 53-79
    functional_programming: [80, 81, 82, 83, 84, 85],
    java: [86, 87, 88, 89, 90, 91],
    c_cpp: Array.from({length: 10}, (_, i) => 92 + i), // 92-101
    numerical_methods: Array.from({length: 30}, (_, i) => 102 + i), // 102-131
    networks: Array.from({length: 31}, (_, i) => 133 + i), // 133-163
    operating_systems: Array.from({length: 13}, (_, i) => 164 + i), // 164-176
    oop_design: [177, 178, 179, 180, 181],
    formal_languages: Array.from({length: 14}, (_, i) => 182 + i), // 182-195
    concurrent_programming: [196, 197, 198, 199, 200, 201],
    unix_admin: [202, 203, 204, 205, 206, 207],
    number_representation: Array.from({length: 15}, (_, i) => 208 + i), // 208-222
    programming_basics: [223, 224, 225, 226]
};

// Semester mapping (approximate based on curriculum)
const semesterMapping = {
    1: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222],
    2: [223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 80, 81, 82, 83, 84, 85],
    3: [34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131],
    4: [133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176],
    5: [53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79],
    6: [86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 177, 178, 179, 180, 181],
    7: [196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207]
};

function getTopic(questionId) {
    for (const [topic, ids] of Object.entries(topicMapping)) {
        if (ids.includes(questionId)) {
            return topic;
        }
    }
    return 'other';
}

function getSemester(questionId) {
    for (const [semester, ids] of Object.entries(semesterMapping)) {
        if (ids.includes(questionId)) {
            return parseInt(semester);
        }
    }
    return null;
}

function parseQuestions(content) {
    const questions = [];
    // Normalize line endings (Windows CRLF to LF)
    content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = content.split('\n');

    let currentQuestion = null;
    let questionText = '';
    let options = [];

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();

        // Skip empty lines
        if (!line) continue;

        // Check for new question start
        const questionMatch = line.match(/^\[#(\d+)\]\s*(.*)$/);
        if (questionMatch) {
            // Save previous question if exists
            if (currentQuestion !== null && questionText.trim()) {
                questions.push({
                    id: currentQuestion,
                    question: questionText.trim(),
                    options: options,
                    topic: getTopic(currentQuestion),
                    semester: getSemester(currentQuestion),
                    multipleCorrect: options.filter(o => o.correct).length > 1
                });
            }

            currentQuestion = parseInt(questionMatch[1]);
            questionText = questionMatch[2];
            options = [];
            continue;
        }

        // Check for option line
        const optionMatch = line.match(/^(>>)?([a-z])\)(.*)$/);
        if (optionMatch && currentQuestion !== null) {
            const isCorrect = optionMatch[1] === '>>';
            const key = optionMatch[2];
            const text = optionMatch[3].trim();

            options.push({
                key: key,
                text: text,
                correct: isCorrect
            });
            continue;
        }

        // Check for options marker (skip it)
        if (line.trim().startsWith('<options>') || line.trim().startsWith('{')) {
            break;
        }

        // Append to question text if we're in a question and it's not an option
        if (currentQuestion !== null && line && !line.match(/^(>>)?[a-z]\)/)) {
            questionText += ' ' + line;
        }
    }

    // Don't forget the last question
    if (currentQuestion !== null && questionText.trim()) {
        questions.push({
            id: currentQuestion,
            question: questionText.trim(),
            options: options,
            topic: getTopic(currentQuestion),
            semester: getSemester(currentQuestion),
            multipleCorrect: options.filter(o => o.correct).length > 1
        });
    }

    return questions;
}

function main() {
    const inputPath = path.join(__dirname, '..', 'drill copy.txt');
    const outputPath = path.join(__dirname, '..', 'data', 'questions.json');

    console.log('Reading questions from:', inputPath);
    const content = fs.readFileSync(inputPath, 'utf-8');

    const questions = parseQuestions(content);
    console.log(`Parsed ${questions.length} questions`);

    // Create statistics
    const stats = {
        total: questions.length,
        byTopic: {},
        bySemester: {},
        multipleChoice: questions.filter(q => q.multipleCorrect).length,
        singleChoice: questions.filter(q => !q.multipleCorrect).length
    };

    questions.forEach(q => {
        stats.byTopic[q.topic] = (stats.byTopic[q.topic] || 0) + 1;
        if (q.semester) {
            stats.bySemester[q.semester] = (stats.bySemester[q.semester] || 0) + 1;
        }
    });

    const output = {
        metadata: {
            generatedAt: new Date().toISOString(),
            sourceFile: 'drill copy.txt',
            stats: stats
        },
        questions: questions
    };

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
    console.log('Questions saved to:', outputPath);
    console.log('Statistics:', JSON.stringify(stats, null, 2));
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { parseQuestions, getTopic, getSemester };
