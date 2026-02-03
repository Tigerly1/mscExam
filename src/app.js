// MSc Exam Drill - Main Application

class ExamDrill {
    constructor() {
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.selectedAnswers = new Set();
        this.answered = false;
        this.score = { correct: 0, total: 0 };
        this.sessionQuestions = [];
        this.explanationCache = {};
        this.stats = {
            byTopic: {},
            totalAnswered: 0,
            totalCorrect: 0
        };

        this.loadData();
    }

    async loadData() {
        try {
            // Load questions
            const questionsResponse = await fetch('data/questions.json');
            const questionsData = await questionsResponse.json();
            this.questions = questionsData.questions;
            this.metadata = questionsData.metadata;

            // Load cached explanations
            try {
                const cacheResponse = await fetch('data/ai_cache.json');
                this.explanationCache = await cacheResponse.json();
            } catch (e) {
                this.explanationCache = {};
            }

            // Load stats from localStorage
            const savedStats = localStorage.getItem('examDrillStats');
            if (savedStats) {
                this.stats = JSON.parse(savedStats);
            }

            this.renderHome();
        } catch (error) {
            console.error('Error loading data:', error);
            document.getElementById('app').innerHTML = `
                <div class="card">
                    <h2>Error Loading Questions</h2>
                    <p>Please make sure questions.json exists in the data folder.</p>
                    <p>Run: <code>node src/parser.js</code></p>
                </div>
            `;
        }
    }

    getTopicDisplayName(topic) {
        const names = {
            algorithms: 'Algorithms & Complexity',
            digital_systems: 'Digital Systems & FPGA',
            transmission: 'Transmission',
            databases: 'Databases & SQL',
            software_engineering: 'Software Engineering',
            functional_programming: 'Functional Programming',
            java: 'Java',
            c_cpp: 'C/C++',
            numerical_methods: 'Numerical Methods',
            networks: 'Computer Networks',
            operating_systems: 'Operating Systems',
            oop_design: 'OOP Design',
            formal_languages: 'Formal Languages',
            concurrent_programming: 'Concurrent Programming',
            unix_admin: 'Unix Administration',
            number_representation: 'Number Representation',
            programming_basics: 'Programming Basics',
            other: 'Other'
        };
        return names[topic] || topic;
    }

    renderHome() {
        const topicCounts = {};
        this.questions.forEach(q => {
            topicCounts[q.topic] = (topicCounts[q.topic] || 0) + 1;
        });

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="header">
                <h1>MSc Exam Drill</h1>
                <p>AGH ISI - Computer Science & Intelligent Systems</p>
                <p>${this.questions.length} questions available</p>
            </div>

            <div class="card">
                <h3>Quiz Settings</h3>

                <div class="question-count-select">
                    <label for="questionCount">Number of questions:</label>
                    <input type="number" id="questionCount" value="20" min="1" max="${this.questions.length}">
                </div>

                <div class="filters">
                    <div class="filter-group">
                        <label>Semester</label>
                        <select id="semesterFilter">
                            <option value="all">All Semesters</option>
                            <option value="1">Semester 1</option>
                            <option value="2">Semester 2</option>
                            <option value="3">Semester 3</option>
                            <option value="4">Semester 4</option>
                            <option value="5">Semester 5</option>
                            <option value="6">Semester 6</option>
                            <option value="7">Semester 7</option>
                        </select>
                    </div>
                </div>

                <div class="filter-group">
                    <label>Topics (select multiple)</label>
                    <div class="topic-filters" id="topicFilters">
                        ${Object.entries(topicCounts).map(([topic, count]) => `
                            <label class="topic-checkbox">
                                <input type="checkbox" name="topic" value="${topic}" checked>
                                <span>${this.getTopicDisplayName(topic)}</span>
                                <span class="count">(${count})</span>
                            </label>
                        `).join('')}
                    </div>
                </div>

                <div class="home-actions">
                    <button class="btn btn-primary" onclick="app.startQuiz()">
                        Start Quiz
                    </button>
                    <button class="btn btn-secondary" onclick="app.showStats()">
                        View Statistics
                    </button>
                </div>
            </div>
        `;
    }

    startQuiz() {
        const count = parseInt(document.getElementById('questionCount').value) || 20;
        const semester = document.getElementById('semesterFilter').value;
        const selectedTopics = Array.from(document.querySelectorAll('input[name="topic"]:checked'))
            .map(cb => cb.value);

        // Filter questions
        let filtered = this.questions.filter(q => {
            if (semester !== 'all' && q.semester !== parseInt(semester)) return false;
            if (!selectedTopics.includes(q.topic)) return false;
            return true;
        });

        if (filtered.length === 0) {
            alert('No questions match your filters. Please adjust your selection.');
            return;
        }

        // Shuffle and select
        filtered = this.shuffle(filtered);
        this.sessionQuestions = filtered.slice(0, Math.min(count, filtered.length));
        this.currentQuestionIndex = 0;
        this.score = { correct: 0, total: 0 };

        this.renderQuestion();
    }

    shuffle(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    renderQuestion() {
        if (this.currentQuestionIndex >= this.sessionQuestions.length) {
            this.renderResults();
            return;
        }

        const question = this.sessionQuestions[this.currentQuestionIndex];
        this.selectedAnswers = new Set();
        this.answered = false;

        const progress = ((this.currentQuestionIndex) / this.sessionQuestions.length) * 100;
        const inputType = question.multipleCorrect ? 'checkbox' : 'radio';

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="progress-container">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                <div class="progress-text">
                    <span>Question ${this.currentQuestionIndex + 1} of ${this.sessionQuestions.length}</span>
                    <span>Score: ${this.score.correct}/${this.score.total}</span>
                </div>
            </div>

            <div class="card question-container active">
                <div class="question-header">
                    <span class="question-number">Question #${question.id}</span>
                    <div class="question-meta">
                        <span class="badge badge-topic">${this.getTopicDisplayName(question.topic)}</span>
                        ${question.semester ? `<span class="badge badge-semester">Sem ${question.semester}</span>` : ''}
                        ${question.multipleCorrect ? '<span class="badge badge-multi">Multiple answers</span>' : ''}
                    </div>
                </div>

                <div class="question-text">${this.formatText(question.question)}</div>

                <ul class="options-list" id="optionsList">
                    ${question.options.map(opt => `
                        <li class="option-item">
                            <label class="option-label" data-key="${opt.key}" onclick="app.selectOption('${opt.key}')">
                                <input type="${inputType}"
                                       class="option-input"
                                       name="answer"
                                       value="${opt.key}">
                                <span class="option-key">${opt.key})</span>
                                <span class="option-text">${this.formatText(opt.text)}</span>
                            </label>
                        </li>
                    `).join('')}
                </ul>

                <div class="question-actions">
                    <button class="btn btn-primary" id="submitBtn" onclick="app.submitAnswer()">
                        Submit Answer
                    </button>
                    <button class="btn btn-secondary" id="explainBtn" onclick="app.showExplanation()">
                        Show Explanation
                    </button>
                    <button class="btn btn-secondary" onclick="app.renderHome()">
                        Exit Quiz
                    </button>
                </div>

                <div class="explanation-panel" id="explanationPanel">
                    <h4>📚 Explanation</h4>
                    <div class="explanation-content" id="explanationContent"></div>
                </div>
            </div>
        `;

        // Re-render MathJax if available
        if (window.MathJax) {
            MathJax.typesetPromise();
        }
    }

    formatText(text) {
        // Convert ^^...^^ to MathJax inline math
        text = text.replace(/\^\^([^^]+)\^\^/g, '\\($1\\)');
        return text;
    }

    selectOption(key) {
        if (this.answered) return;

        const question = this.sessionQuestions[this.currentQuestionIndex];
        const label = document.querySelector(`.option-label[data-key="${key}"]`);
        const input = label.querySelector('input');

        if (question.multipleCorrect) {
            if (this.selectedAnswers.has(key)) {
                this.selectedAnswers.delete(key);
                label.classList.remove('selected');
                input.checked = false;
            } else {
                this.selectedAnswers.add(key);
                label.classList.add('selected');
                input.checked = true;
            }
        } else {
            // Single choice - clear previous selection
            document.querySelectorAll('.option-label').forEach(l => l.classList.remove('selected'));
            document.querySelectorAll('.option-input').forEach(i => i.checked = false);
            this.selectedAnswers.clear();
            this.selectedAnswers.add(key);
            label.classList.add('selected');
            input.checked = true;
        }
    }

    submitAnswer() {
        if (this.answered || this.selectedAnswers.size === 0) return;

        this.answered = true;
        const question = this.sessionQuestions[this.currentQuestionIndex];
        const correctKeys = new Set(question.options.filter(o => o.correct).map(o => o.key));

        // Check if answer is correct
        const isCorrect = this.setsEqual(this.selectedAnswers, correctKeys);

        // Update score
        this.score.total++;
        if (isCorrect) {
            this.score.correct++;
        }

        // Update stats
        this.updateStats(question.topic, isCorrect);

        // Visual feedback
        document.querySelectorAll('.option-label').forEach(label => {
            const key = label.dataset.key;
            if (correctKeys.has(key)) {
                label.classList.add('correct');
            } else if (this.selectedAnswers.has(key)) {
                label.classList.add('incorrect');
            }
        });

        // Mark missed correct answers
        correctKeys.forEach(key => {
            if (!this.selectedAnswers.has(key)) {
                const label = document.querySelector(`.option-label[data-key="${key}"]`);
                if (label) label.classList.add('missed');
            }
        });

        // Update button
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.textContent = 'Next Question';
        submitBtn.onclick = () => this.nextQuestion();

        // Show explanation if wrong
        if (!isCorrect) {
            this.showExplanation();
        }

        // Update progress text
        document.querySelector('.progress-text span:last-child').textContent =
            `Score: ${this.score.correct}/${this.score.total}`;
    }

    setsEqual(a, b) {
        if (a.size !== b.size) return false;
        for (const item of a) {
            if (!b.has(item)) return false;
        }
        return true;
    }

    nextQuestion() {
        this.currentQuestionIndex++;
        this.renderQuestion();
    }

    async showExplanation() {
        const panel = document.getElementById('explanationPanel');
        const content = document.getElementById('explanationContent');
        panel.classList.add('visible');

        const question = this.sessionQuestions[this.currentQuestionIndex];
        const cacheKey = `q_${question.id}`;

        // Check cache
        if (this.explanationCache[cacheKey]) {
            content.innerHTML = this.formatExplanation(this.explanationCache[cacheKey].explanation);
            if (window.MathJax) MathJax.typesetPromise();
            return;
        }

        // Show loading
        content.innerHTML = `
            <div class="explanation-loading">
                <div class="spinner"></div>
                <span>Generating explanation...</span>
            </div>
        `;

        try {
            const explanation = await this.generateExplanation(question);

            // Cache it
            this.explanationCache[cacheKey] = {
                explanation: explanation,
                generatedAt: new Date().toISOString()
            };

            // Save cache (in a real app, this would go to a server)
            localStorage.setItem('explanationCache', JSON.stringify(this.explanationCache));

            content.innerHTML = this.formatExplanation(explanation);
            if (window.MathJax) MathJax.typesetPromise();
        } catch (error) {
            content.innerHTML = `
                <p><strong>Unable to generate explanation.</strong></p>
                <p>Correct answer(s): ${question.options.filter(o => o.correct).map(o => o.key).join(', ')}</p>
                <p style="margin-top: 12px; color: var(--text-muted);">
                    To enable AI explanations, configure your API key in the settings.
                </p>
            `;
        }
    }

    async generateExplanation(question) {
        // Check if API key is configured
        const apiKey = localStorage.getItem('aiApiKey');

        if (!apiKey) {
            // Generate a basic explanation without AI
            return this.generateBasicExplanation(question);
        }

        const prompt = `You are an expert computer science tutor helping a student prepare for their MSc exam.

Question: ${question.question}

Options:
${question.options.map(o => `${o.key}) ${o.text} ${o.correct ? '(CORRECT)' : ''}`).join('\n')}

Topic: ${this.getTopicDisplayName(question.topic)}

Please provide a clear, educational explanation of:
1. Why the correct answer(s) is/are correct
2. Why the incorrect options are wrong
3. Any important concepts the student should understand

Keep the explanation concise but thorough. Use technical terms appropriately.`;

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-haiku-20240307',
                max_tokens: 1024,
                messages: [{ role: 'user', content: prompt }]
            })
        });

        if (!response.ok) {
            throw new Error('API request failed');
        }

        const data = await response.json();
        return data.content[0].text;
    }

    generateBasicExplanation(question) {
        const correct = question.options.filter(o => o.correct);
        const incorrect = question.options.filter(o => !o.correct);

        let explanation = `**Correct answer(s):** ${correct.map(o => `${o.key}) ${o.text}`).join(', ')}\n\n`;

        if (incorrect.length > 0) {
            explanation += `**Incorrect options:** ${incorrect.map(o => o.key).join(', ')}\n\n`;
        }

        explanation += `**Topic:** ${this.getTopicDisplayName(question.topic)}\n\n`;
        explanation += `*To get AI-powered detailed explanations, add your API key in Settings.*`;

        return explanation;
    }

    formatExplanation(text) {
        // Convert markdown-like formatting to HTML
        return text
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/^/, '<p>')
            .replace(/$/, '</p>');
    }

    updateStats(topic, isCorrect) {
        if (!this.stats.byTopic[topic]) {
            this.stats.byTopic[topic] = { correct: 0, total: 0 };
        }
        this.stats.byTopic[topic].total++;
        this.stats.totalAnswered++;

        if (isCorrect) {
            this.stats.byTopic[topic].correct++;
            this.stats.totalCorrect++;
        }

        localStorage.setItem('examDrillStats', JSON.stringify(this.stats));
    }

    renderResults() {
        const percentage = this.score.total > 0
            ? Math.round((this.score.correct / this.score.total) * 100)
            : 0;

        const gradePoints = this.score.correct > 0
            ? (4 * this.score.correct / this.score.total).toFixed(2)
            : '0.00';

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="card results-panel">
                <h2>Quiz Complete!</h2>

                <div class="results-score">${percentage}%</div>

                <div class="results-details">
                    <div class="result-stat">
                        <div class="result-stat-value" style="color: var(--success)">${this.score.correct}</div>
                        <div class="result-stat-label">Correct</div>
                    </div>
                    <div class="result-stat">
                        <div class="result-stat-value" style="color: var(--danger)">${this.score.total - this.score.correct}</div>
                        <div class="result-stat-label">Incorrect</div>
                    </div>
                    <div class="result-stat">
                        <div class="result-stat-value">${this.score.total}</div>
                        <div class="result-stat-label">Total</div>
                    </div>
                    <div class="result-stat">
                        <div class="result-stat-value">${gradePoints}</div>
                        <div class="result-stat-label">Points (max 4)</div>
                    </div>
                </div>

                <div class="home-actions">
                    <button class="btn btn-primary" onclick="app.startQuiz()">
                        Try Again
                    </button>
                    <button class="btn btn-secondary" onclick="app.renderHome()">
                        Back to Home
                    </button>
                    <button class="btn btn-secondary" onclick="app.showStats()">
                        View Statistics
                    </button>
                </div>
            </div>
        `;
    }

    showStats() {
        const topicStats = Object.entries(this.stats.byTopic)
            .map(([topic, data]) => ({
                topic,
                ...data,
                percentage: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0
            }))
            .sort((a, b) => a.percentage - b.percentage);

        const overallPercentage = this.stats.totalAnswered > 0
            ? Math.round((this.stats.totalCorrect / this.stats.totalAnswered) * 100)
            : 0;

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="header">
                <h1>Statistics</h1>
                <p>Your learning progress</p>
            </div>

            <div class="card">
                <h3>Overall Performance</h3>
                <div class="results-details">
                    <div class="result-stat">
                        <div class="result-stat-value">${overallPercentage}%</div>
                        <div class="result-stat-label">Accuracy</div>
                    </div>
                    <div class="result-stat">
                        <div class="result-stat-value">${this.stats.totalAnswered}</div>
                        <div class="result-stat-label">Questions Answered</div>
                    </div>
                    <div class="result-stat">
                        <div class="result-stat-value">${this.stats.totalCorrect}</div>
                        <div class="result-stat-label">Correct Answers</div>
                    </div>
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <h4>Performance by Topic</h4>
                    <ul class="stat-list">
                        ${topicStats.length > 0 ? topicStats.map(s => `
                            <li>
                                <span>${this.getTopicDisplayName(s.topic)}</span>
                                <span style="color: ${s.percentage >= 70 ? 'var(--success)' : s.percentage >= 50 ? 'var(--warning)' : 'var(--danger)'}">
                                    ${s.percentage}% (${s.correct}/${s.total})
                                </span>
                            </li>
                        `).join('') : '<li>No data yet</li>'}
                    </ul>
                </div>

                <div class="stat-card">
                    <h4>Weak Areas</h4>
                    <ul class="stat-list">
                        ${topicStats.filter(s => s.percentage < 70).length > 0
                            ? topicStats.filter(s => s.percentage < 70).slice(0, 5).map(s => `
                                <li>
                                    <span>${this.getTopicDisplayName(s.topic)}</span>
                                    <span style="color: var(--danger)">${s.percentage}%</span>
                                </li>
                            `).join('')
                            : '<li>Great job! No weak areas detected.</li>'
                        }
                    </ul>
                </div>
            </div>

            <div class="card" style="margin-top: 20px;">
                <h3>Settings</h3>
                <div class="filter-group">
                    <label for="apiKey">AI API Key (for explanations)</label>
                    <input type="password" id="apiKey" placeholder="Enter your Anthropic API key"
                           value="${localStorage.getItem('aiApiKey') || ''}"
                           style="width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: 6px;">
                </div>
                <div class="home-actions">
                    <button class="btn btn-primary" onclick="app.saveApiKey()">Save API Key</button>
                    <button class="btn btn-danger btn-small" onclick="app.clearStats()">Clear Statistics</button>
                    <button class="btn btn-secondary" onclick="app.renderHome()">Back to Home</button>
                </div>
            </div>
        `;
    }

    saveApiKey() {
        const apiKey = document.getElementById('apiKey').value;
        if (apiKey) {
            localStorage.setItem('aiApiKey', apiKey);
            alert('API key saved!');
        } else {
            localStorage.removeItem('aiApiKey');
            alert('API key removed.');
        }
    }

    clearStats() {
        if (confirm('Are you sure you want to clear all statistics?')) {
            this.stats = { byTopic: {}, totalAnswered: 0, totalCorrect: 0 };
            localStorage.removeItem('examDrillStats');
            localStorage.removeItem('explanationCache');
            this.explanationCache = {};
            this.showStats();
        }
    }
}

// Initialize app
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new ExamDrill();
});
