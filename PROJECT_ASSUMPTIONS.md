# MSc Exam Drill - Project Assumptions

## Project Overview
Browser-based multiple choice test learning assistant for AGH University ISI (Computer Science and Intelligent Systems) MSc exam preparation.

## Core Features

### 1. Quiz/Drill System
- Multiple choice questions loaded from parsed exam question bank
- Support for single and multiple correct answers (indicated by `>>` prefix)
- Random question order with optional topic filtering
- Progress tracking within session

### 2. AI-Powered Learning Assistance
- On wrong answer OR clicking "Explain" button: show AI-generated explanation
- Explanations cached to JSON database (file-based initially)
- Cache key: question ID
- If cached explanation exists, load from cache; otherwise generate and store

### 3. Question Sources
- `drill copy.txt` - 233 parsed exam questions with answers
- `opracowanie_2020_2021.pdf` - Past exam materials (for reference)
- `Wykaz_pytanISI (1).pdf` - Official question list

### 4. Curriculum Coverage (Semesters 1-7)
Based on AGH ISI syllabus (scraped from sylabusy.agh.edu.pl):

**Semester 1 (30 ECTS):**
- Linear Algebra & Analytic Geometry (5 ECTS)
- Mathematical Analysis 1 (7 ECTS)
- Introduction to Computer Science (2 ECTS)
- Logic (4 ECTS)
- Programming Fundamentals 1 (5 ECTS)
- Digital Technology Basics (2 ECTS)
- Unix Systems Introduction (3 ECTS)
- Graph Theory (2 ECTS)

**Semester 2 (30 ECTS):**
- Physics 1 (5 ECTS)
- Discrete Mathematics (3 ECTS)
- Programming Fundamentals 2 (5 ECTS)
- Probability & Statistics (4 ECTS)
- Algorithms & Data Structures (4 ECTS)
- Intelligent Systems Introduction (2 ECTS)
- Computer Graphics Basics (3 ECTS)
- Programmer's Workshop (3 ECTS)

**Semester 3 (29 ECTS):**
- Physics 2 (4 ECTS)
- Databases (4 ECTS)
- Formal Linguistics & Automata (3 ECTS)
- Advanced Programming 1 (4 ECTS)
- Artificial Intelligence Basics (2 ECTS)
- Numerical Methods (4 ECTS)
- Software Engineering (3 ECTS)
- Data Engineering (2 ECTS)

**Semester 4 (31 ECTS):**
- Computer Networks (4 ECTS)
- Machine Learning (4 ECTS)
- Compilation Theory & Compilers (4 ECTS)
- Advanced Programming 2 (4 ECTS)
- Software Production Models (3 ECTS)
- Operations Research (3 ECTS)
- Operating Systems (2 ECTS)

**Semester 5 (30 ECTS):**
- Design Studio 1 (3 ECTS)
- Web Application Programming (4 ECTS)
- Discrete Systems Simulation (2 ECTS)
- Intelligent Signal Processing (2 ECTS)
- Digital Image Processing (3 ECTS)
- Electives: Constraint Programming, Design Patterns, Cybersecurity, Logic Programming, NLP

**Semester 6 (30 ECTS):**
- Professional Practice (4 ECTS)
- Software Engineering Team Project (2 ECTS)
- Design Studio 2 (3 ECTS)
- Computation Theory (4 ECTS)
- Electives: Deep Learning, Graph Neural Networks, Real-Time Systems, IoT

**Semester 7 (30 ECTS):**
- Engineering Diploma Workshop (1 ECTS)
- Diploma Project (15 ECTS)
- Electives: ERP Systems, Mobile Programming, Cryptography, AI Applications

## Technical Stack

### Frontend
- HTML5, CSS3, JavaScript (Vanilla or lightweight framework)
- Responsive design for mobile/desktop
- MathJax for mathematical formulas rendering
- Local storage for session progress

### Backend (Minimal)
- Static file serving (can run from file:// or simple HTTP server)
- JSON-based data storage for questions and AI cache
- Optional: Node.js/Express for AI API integration

### AI Integration
- Provider: OpenAI API / Anthropic Claude API (configurable)
- Caching: JSON file storage (`data/ai_cache.json`)
- Prompt template for generating educational explanations

## Data Format

### Question Format (from drill copy.txt)
```
[#N] Question text
a) Option A
>>b) Option B (correct - marked with >>)
c) Option C
>>d) Option D (also correct if multiple)
```

### Parsed JSON Format
```json
{
  "id": 1,
  "question": "Question text",
  "options": [
    {"key": "a", "text": "Option A", "correct": false},
    {"key": "b", "text": "Option B", "correct": true}
  ],
  "topic": "algorithms",
  "semester": 1
}
```

### AI Cache Format
```json
{
  "1": {
    "explanation": "Detailed explanation...",
    "generatedAt": "2024-01-01T00:00:00Z",
    "model": "claude-3"
  }
}
```

## Topic Categories (Mapped to Questions)

1. **Algorithms & Complexity** (#1-3, #227-233)
2. **Digital Systems & FPGA** (#4-18)
3. **Computer Architecture** (#19)
4. **Databases & SQL** (#34-52)
5. **Software Engineering** (#53-79)
6. **Functional Programming / Haskell** (#80-85)
7. **Java Programming** (#86-92)
8. **C/C++ Programming** (#93-101)
9. **Numerical Methods** (#102-131)
10. **Computer Networks** (#133-163)
11. **Operating Systems** (#164-176)
12. **Cryptography & Security** (#170)
13. **Object-Oriented Design** (#177-181)
14. **Formal Languages & Automata** (#182-195)
15. **Concurrent Programming** (#196-201)
16. **Unix/Linux Administration** (#202-207)
17. **Number Representation** (#208-222)
18. **Programming Paradigms** (#223-226)

## User Interface Flow

1. **Home Screen**
   - Start new quiz
   - Select topics/semesters
   - View statistics

2. **Quiz Screen**
   - Question display with MathJax rendering
   - Answer selection (checkbox for multi, radio for single)
   - Submit answer button
   - "Show Explanation" button (always visible)
   - Next question navigation

3. **Result Feedback**
   - Correct: Green highlight, optional AI elaboration
   - Wrong: Red highlight, AI explanation auto-displayed
   - Score tracking

4. **Statistics Screen**
   - Questions answered
   - Accuracy by topic
   - Weak areas identification

## Implementation Phases

### Phase 1: Core Quiz Engine
- Parse questions from drill copy.txt
- Basic HTML/CSS/JS quiz interface
- Answer validation and scoring

### Phase 2: AI Integration
- Set up AI API connection
- Implement explanation generation
- JSON cache system

### Phase 3: Enhanced Features
- Topic filtering
- Progress persistence
- Statistics dashboard
- MathJax integration for formulas

### Phase 4: Polish
- Mobile responsiveness
- Keyboard navigation
- Print/export functionality

## File Structure
```
mscExam/
├── PROJECT_ASSUMPTIONS.md
├── index.html
├── src/
│   ├── styles.css
│   ├── app.js
│   ├── parser.js
│   └── ai-service.js
├── data/
│   ├── questions.json
│   └── ai_cache.json
├── public/
└── [original files]
    ├── drill copy.txt
    ├── opracowanie_2020_2021.pdf
    └── Wykaz_pytanISI (1).pdf
```

## Configuration
```json
{
  "aiProvider": "anthropic",
  "apiKey": "ENV_VARIABLE",
  "cacheEnabled": true,
  "questionsPerSession": 20,
  "showExplanationOnWrong": true,
  "mathJaxEnabled": true
}
```

## Notes
- Questions use Polish language
- Some questions have mathematical notation (use MathJax)
- Grading formula from original: `incorrect ? 0 : 4 * correct / total`
- Support for `repeatIncorrect` mode (show wrong questions again)

---

## Latest User Request (2026-02-03)

> I want you to go to this path and create project there. I want you to create there md file for project assumptions so you can recall them. First this project should create drill like (Browser-based multiple choice test learning assistant.) that you will develop for me basing on the files I provided in the mscExam folder. Also you should scrape the https://sylabusy.agh.edu.pl/pl/1/2/21/1/4/16/140#nav-tab-info for the full information of the knowledge that has been shared in 1-7 semester. Create tests basing on the topics. The main feature that I would like to have would be that in case of wrong answer or clicking for knowledge you would implement AI answer (that will be cached to db, or just json db id for now) so I could also learn about the topic while doing the test.

**Additional request:** Deploy the website to WAN network so user can join it and check development progress.
