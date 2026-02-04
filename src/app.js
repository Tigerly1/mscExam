// MSc Exam Drill - Main Application

class ExamDrill {
    constructor() {
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.selectedAnswers = new Set();
        this.answered = false;
        this.score = { correct: 0, total: 0 };
        this.sessionQuestions = [];
        this.wrongAnswers = [];
        this.explanationCache = {};
        this.stats = { byTopic: {}, totalAnswered: 0, totalCorrect: 0 };
        this.currentView = 'home';

        this.initTheme();
        this.loadData();
        this.setupKeyboard();
    }

    // ── Theme ──

    initTheme() {
        const saved = localStorage.getItem('theme');
        if (saved) {
            document.documentElement.setAttribute('data-theme', saved);
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }

    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
    }

    // ── Data Loading ──

    async loadData() {
        try {
            const resp = await fetch('data/questions.json');
            const data = await resp.json();
            this.questions = data.questions;
            this.metadata = data.metadata;

            // Load pre-cached explanations from server
            try {
                const cacheResp = await fetch('data/ai_cache.json');
                const serverCache = await cacheResp.json();
                this.explanationCache = serverCache || {};
            } catch (e) {
                this.explanationCache = {};
            }

            // Merge with localStorage cache
            const localCache = localStorage.getItem('explanationCache');
            if (localCache) {
                const parsed = JSON.parse(localCache);
                Object.assign(this.explanationCache, parsed);
            }

            // Load stats
            const savedStats = localStorage.getItem('examDrillStats');
            if (savedStats) this.stats = JSON.parse(savedStats);

            this.renderHome();
        } catch (error) {
            console.error('Error loading data:', error);
            document.getElementById('app').innerHTML = `
                <div class="card" style="text-align:center; padding: 40px;">
                    <h2>Failed to load questions</h2>
                    <p style="color:var(--text-muted); margin-top:12px;">Make sure questions.json exists in the data folder.</p>
                    <p style="margin-top:8px;"><code>node src/parser.js</code></p>
                </div>`;
        }
    }

    // ── Topic Names ──

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

    // ── Home Screen ──

    renderHome() {
        this.currentView = 'home';
        const topicCounts = {};
        this.questions.forEach(q => {
            topicCounts[q.topic] = (topicCounts[q.topic] || 0) + 1;
        });

        const accuracy = this.stats.totalAnswered > 0
            ? Math.round((this.stats.totalCorrect / this.stats.totalAnswered) * 100) : 0;
        const cachedCount = Object.keys(this.explanationCache).length;

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="home-hero">
                <h1>MSc Exam Drill</h1>
                <p>AGH ISI - Computer Science & Intelligent Systems</p>
                <div class="home-stats-row">
                    <div class="home-stat">
                        <div class="home-stat-value">${this.questions.length}</div>
                        <div class="home-stat-label">Questions</div>
                    </div>
                    <div class="home-stat">
                        <div class="home-stat-value">${this.stats.totalAnswered}</div>
                        <div class="home-stat-label">Answered</div>
                    </div>
                    <div class="home-stat">
                        <div class="home-stat-value">${accuracy}%</div>
                        <div class="home-stat-label">Accuracy</div>
                    </div>
                    <div class="home-stat">
                        <div class="home-stat-value">${cachedCount}</div>
                        <div class="home-stat-label">AI Cached</div>
                    </div>
                </div>
            </div>

            <div class="quick-actions">
                <div class="quick-action-btn" onclick="app.quickStart('all')">
                    <div class="qa-icon">&#x1F3AF;</div>
                    <div class="qa-title">Quick Quiz (20)</div>
                    <div class="qa-desc">Random 20 questions from all topics</div>
                </div>
                <div class="quick-action-btn" onclick="app.quickStart('weak')">
                    <div class="qa-icon">&#x1F4AA;</div>
                    <div class="qa-title">Weak Areas</div>
                    <div class="qa-desc">Focus on topics below 70%</div>
                </div>
                <div class="quick-action-btn" onclick="app.quickStart('full')">
                    <div class="qa-icon">&#x1F4DA;</div>
                    <div class="qa-title">Full Exam</div>
                    <div class="qa-desc">All ${this.questions.length} questions</div>
                </div>
            </div>

            <div class="card">
                <h3>Custom Quiz</h3>

                <div class="filters">
                    <div class="filter-group">
                        <label>Semester</label>
                        <select id="semesterFilter">
                            <option value="all">All Semesters</option>
                            ${[1,2,3,4,5,6,7].map(s => `<option value="${s}">Semester ${s}</option>`).join('')}
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Questions</label>
                        <input type="number" id="questionCount" value="20" min="1" max="${this.questions.length}">
                    </div>
                </div>

                <div class="filter-group">
                    <label>Topics</label>
                    <div class="topic-select-actions">
                        <button class="btn btn-small btn-secondary" onclick="app.selectAllTopics(true)">Select All</button>
                        <button class="btn btn-small btn-secondary" onclick="app.selectAllTopics(false)">Deselect All</button>
                    </div>
                    <div class="topic-filters" id="topicFilters">
                        ${Object.entries(topicCounts)
                            .sort((a, b) => b[1] - a[1])
                            .map(([topic, count]) => `
                            <label class="topic-checkbox">
                                <input type="checkbox" name="topic" value="${topic}" checked>
                                <span>${this.getTopicDisplayName(topic)}</span>
                                <span class="count">${count}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>

                <div class="actions-row">
                    <button class="btn btn-primary btn-large" onclick="app.startQuiz()">Start Custom Quiz</button>
                </div>
            </div>`;
    }

    selectAllTopics(checked) {
        document.querySelectorAll('input[name="topic"]').forEach(cb => cb.checked = checked);
    }

    quickStart(mode) {
        if (mode === 'all') {
            this.sessionQuestions = this.shuffle([...this.questions]).slice(0, 20);
        } else if (mode === 'full') {
            this.sessionQuestions = this.shuffle([...this.questions]);
        } else if (mode === 'weak') {
            const weakTopics = Object.entries(this.stats.byTopic)
                .filter(([, d]) => d.total > 0 && (d.correct / d.total) < 0.7)
                .map(([t]) => t);
            let filtered = weakTopics.length > 0
                ? this.questions.filter(q => weakTopics.includes(q.topic))
                : [...this.questions];
            this.sessionQuestions = this.shuffle(filtered).slice(0, 20);
        }

        this.currentQuestionIndex = 0;
        this.score = { correct: 0, total: 0 };
        this.wrongAnswers = [];
        this.renderQuestion();
    }

    startQuiz() {
        const count = parseInt(document.getElementById('questionCount').value) || 20;
        const semester = document.getElementById('semesterFilter').value;
        const selectedTopics = Array.from(document.querySelectorAll('input[name="topic"]:checked'))
            .map(cb => cb.value);

        let filtered = this.questions.filter(q => {
            if (semester !== 'all' && q.semester !== parseInt(semester)) return false;
            if (!selectedTopics.includes(q.topic)) return false;
            return true;
        });

        if (filtered.length === 0) {
            this.showToast('No questions match your filters', 'error');
            return;
        }

        this.sessionQuestions = this.shuffle(filtered).slice(0, Math.min(count, filtered.length));
        this.currentQuestionIndex = 0;
        this.score = { correct: 0, total: 0 };
        this.wrongAnswers = [];
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

    // ── Quiz ──

    renderQuestion() {
        this.currentView = 'quiz';
        if (this.currentQuestionIndex >= this.sessionQuestions.length) {
            this.renderResults();
            return;
        }

        const question = this.sessionQuestions[this.currentQuestionIndex];
        this.selectedAnswers = new Set();
        this.answered = false;

        const progress = (this.currentQuestionIndex / this.sessionQuestions.length) * 100;
        const inputType = question.multipleCorrect ? 'checkbox' : 'radio';

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="progress-container">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                <div class="progress-text">
                    <span>Question ${this.currentQuestionIndex + 1} / ${this.sessionQuestions.length}</span>
                    <span>Score: ${this.score.correct}/${this.score.total}</span>
                </div>
            </div>

            <div class="card">
                <div class="question-header">
                    <span class="question-number">#${question.id}</span>
                    <div class="question-meta">
                        <span class="badge badge-topic">${this.getTopicDisplayName(question.topic)}</span>
                        ${question.semester ? `<span class="badge badge-semester">Sem ${question.semester}</span>` : ''}
                        ${question.multipleCorrect ? '<span class="badge badge-multi">Multiple</span>' : ''}
                    </div>
                </div>

                <div class="question-text">${this.formatText(question.question)}</div>

                <ul class="options-list" id="optionsList">
                    ${question.options.map((opt, idx) => `
                        <li class="option-item">
                            <label class="option-label" data-key="${opt.key}" onclick="app.selectOption('${opt.key}')">
                                <input type="${inputType}" class="option-input" name="answer" value="${opt.key}">
                                <span class="option-key">${opt.key})</span>
                                <span class="option-text">${this.formatText(opt.text)}</span>
                                <span class="kbd">${idx + 1}</span>
                            </label>
                        </li>
                    `).join('')}
                </ul>

                <div id="answerResult"></div>

                <div class="question-actions">
                    <button class="btn btn-primary" id="submitBtn" onclick="app.submitAnswer()">
                        Submit <span class="kbd">Enter</span>
                    </button>
                    <button class="btn btn-outline" id="explainBtn" onclick="app.showExplanation()">
                        Explain <span class="kbd">E</span>
                    </button>
                    <button class="btn btn-secondary" onclick="app.renderHome()">
                        Exit
                    </button>
                </div>

                <div class="explanation-panel" id="explanationPanel">
                    <h4>Explanation</h4>
                    <div class="explanation-content" id="explanationContent"></div>
                </div>
            </div>`;

        if (window.MathJax) MathJax.typesetPromise();
        window.scrollTo(0, 0);
    }

    formatText(text) {
        if (!text) return '';
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
            document.querySelectorAll('.option-label').forEach(l => l.classList.remove('selected'));
            document.querySelectorAll('.option-input').forEach(i => i.checked = false);
            this.selectedAnswers.clear();
            this.selectedAnswers.add(key);
            label.classList.add('selected');
            input.checked = true;
        }
    }

    submitAnswer() {
        if (this.answered) {
            this.nextQuestion();
            return;
        }
        if (this.selectedAnswers.size === 0) {
            this.showToast('Select an answer first', 'info');
            return;
        }

        this.answered = true;
        const question = this.sessionQuestions[this.currentQuestionIndex];
        const correctKeys = new Set(question.options.filter(o => o.correct).map(o => o.key));
        const isCorrect = this.setsEqual(this.selectedAnswers, correctKeys);

        this.score.total++;
        if (isCorrect) this.score.correct++;
        else this.wrongAnswers.push(question);

        this.updateStats(question.topic, isCorrect);

        // Visual feedback on options
        document.querySelectorAll('.option-label').forEach(label => {
            const key = label.dataset.key;
            label.style.cursor = 'default';
            if (correctKeys.has(key)) {
                label.classList.add('correct');
            } else if (this.selectedAnswers.has(key)) {
                label.classList.add('incorrect');
            }
        });

        correctKeys.forEach(key => {
            if (!this.selectedAnswers.has(key)) {
                const label = document.querySelector(`.option-label[data-key="${key}"]`);
                if (label) label.classList.add('missed');
            }
        });

        // Result banner
        const resultDiv = document.getElementById('answerResult');
        resultDiv.innerHTML = `
            <div class="answer-result ${isCorrect ? 'result-correct' : 'result-incorrect'}">
                ${isCorrect ? 'Correct!' : `Incorrect - correct: ${[...correctKeys].join(', ')}`}
            </div>`;

        // Update button
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.innerHTML = 'Next <span class="kbd">Enter</span>';

        // Update score display
        document.querySelector('.progress-text span:last-child').textContent =
            `Score: ${this.score.correct}/${this.score.total}`;

        // Auto-show explanation on wrong answer
        if (!isCorrect) {
            this.showExplanation();
        }
    }

    setsEqual(a, b) {
        if (a.size !== b.size) return false;
        for (const item of a) if (!b.has(item)) return false;
        return true;
    }

    nextQuestion() {
        this.currentQuestionIndex++;
        this.renderQuestion();
    }

    // ── AI Explanation System ──

    async showExplanation() {
        const panel = document.getElementById('explanationPanel');
        const content = document.getElementById('explanationContent');
        if (!panel || !content) return;
        panel.classList.add('visible');

        const question = this.sessionQuestions[this.currentQuestionIndex];
        const cacheKey = `q_${question.id}`;

        // Check cache (server + local)
        if (this.explanationCache[cacheKey]) {
            const cached = this.explanationCache[cacheKey];
            content.innerHTML = this.renderExplanation(cached.explanation);
            const source = cached.model ? `AI: ${cached.model}` : 'Cached';
            content.innerHTML += `<div class="explanation-source">Source: ${source} | Cached: ${cached.generatedAt || 'yes'}</div>`;
            if (window.MathJax) MathJax.typesetPromise();
            return;
        }

        // Check if API key is available
        const apiKey = localStorage.getItem('aiApiKey');
        if (!apiKey) {
            content.innerHTML = this.renderBasicExplanation(question);
            content.innerHTML += `<div class="explanation-source">Add your OpenRouter API key in Settings for AI-powered explanations</div>`;
            if (window.MathJax) MathJax.typesetPromise();
            return;
        }

        // Generate with AI
        content.innerHTML = `
            <div class="explanation-loading">
                <div class="spinner"></div>
                <span>Generating AI explanation...</span>
            </div>`;

        try {
            const explanation = await this.callAI(question, apiKey);

            // Cache it
            this.explanationCache[cacheKey] = {
                explanation: explanation,
                generatedAt: new Date().toISOString(),
                model: 'claude-3-haiku (OpenRouter)'
            };
            this.saveLocalCache();

            content.innerHTML = this.renderExplanation(explanation);
            content.innerHTML += `<div class="explanation-source">Source: AI (OpenRouter) | Just generated & cached</div>`;
            if (window.MathJax) MathJax.typesetPromise();
        } catch (error) {
            console.error('AI API error:', error);
            content.innerHTML = this.renderBasicExplanation(question);
            content.innerHTML += `<div class="explanation-source" style="color:var(--danger);">AI generation failed: ${error.message}</div>`;
            if (window.MathJax) MathJax.typesetPromise();
        }
    }

    async callAI(question, apiKey) {
        const correctOpts = question.options.filter(o => o.correct);

        const prompt = `You are a computer science tutor helping a student prepare for their MSc exam at AGH University (ISI - Computer Science & Intelligent Systems program).

Question #${question.id} (Topic: ${this.getTopicDisplayName(question.topic)}, Semester: ${question.semester || 'N/A'}):
${question.question}

Options:
${question.options.map(o => `${o.correct ? '>> ' : '   '}${o.key}) ${o.text}`).join('\n')}

Correct answer(s): ${correctOpts.map(o => o.key).join(', ')}

Provide a clear, educational explanation in this format:
1. **Why the correct answer(s) are right** - explain the underlying concept
2. **Why each wrong option is incorrect** - briefly explain what makes it wrong
3. **Key concept to remember** - a concise takeaway for exam prep

Use technical terms appropriately. If relevant, include formulas or code examples. Keep it concise but thorough. Respond in English.`;

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': window.location.href,
                'X-Title': 'MSc Exam Drill'
            },
            body: JSON.stringify({
                model: 'anthropic/claude-3-haiku',
                max_tokens: 1024,
                messages: [{ role: 'user', content: prompt }]
            })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error?.message || `API returned ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    renderBasicExplanation(question) {
        const correct = question.options.filter(o => o.correct);
        const incorrect = question.options.filter(o => !o.correct);

        let html = '<div>';
        html += `<p><strong>Correct answer(s):</strong></p><ul>`;
        correct.forEach(o => {
            html += `<li><strong>${o.key})</strong> ${this.formatText(o.text)}</li>`;
        });
        html += '</ul>';

        if (incorrect.length > 0) {
            html += `<p><strong>Incorrect options:</strong> ${incorrect.map(o => o.key).join(', ')}</p>`;
        }

        html += `<p><strong>Topic:</strong> ${this.getTopicDisplayName(question.topic)}`;
        if (question.courseName) {
            html += ` (${question.courseName})`;
        }
        html += '</p>';
        html += '</div>';
        return html;
    }

    renderExplanation(text) {
        if (typeof marked !== 'undefined' && marked.parse) {
            return marked.parse(text);
        }
        // Fallback markdown
        return text
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/^/, '<p>')
            .replace(/$/, '</p>');
    }

    saveLocalCache() {
        try {
            localStorage.setItem('explanationCache', JSON.stringify(this.explanationCache));
        } catch (e) {
            console.warn('localStorage full, cache not saved');
        }
    }

    // ── Results ──

    renderResults() {
        this.currentView = 'results';
        const percentage = this.score.total > 0
            ? Math.round((this.score.correct / this.score.total) * 100) : 0;
        const gradePoints = this.score.total > 0
            ? (4 * this.score.correct / this.score.total).toFixed(2) : '0.00';

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="card results-panel">
                <h2>Quiz Complete</h2>
                <div class="results-score">${percentage}%</div>
                <div class="results-grade">Grade points: ${gradePoints} / 4.00</div>

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
                </div>

                <div class="actions-row" style="justify-content: center;">
                    <button class="btn btn-primary btn-large" onclick="app.retryQuiz()">Try Again</button>
                    <button class="btn btn-secondary" onclick="app.renderHome()">Home</button>
                </div>
            </div>

            ${this.wrongAnswers.length > 0 ? `
            <div class="card">
                <h3>Review Wrong Answers (${this.wrongAnswers.length})</h3>
                <div class="review-list">
                    ${this.wrongAnswers.map((q, i) => `
                        <div class="review-item" onclick="app.reviewQuestion(${i})">
                            <div class="review-item-q">#${q.id}: ${q.question.substring(0, 100)}${q.question.length > 100 ? '...' : ''}</div>
                            <div class="review-item-info">
                                <span>${this.getTopicDisplayName(q.topic)}</span>
                                <span>Correct: ${q.options.filter(o => o.correct).map(o => o.key).join(', ')}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="actions-row" style="margin-top:16px;">
                    <button class="btn btn-outline" onclick="app.retryWrong()">Retry Wrong Answers Only</button>
                </div>
            </div>` : ''}`;
    }

    retryQuiz() {
        this.sessionQuestions = this.shuffle(this.sessionQuestions);
        this.currentQuestionIndex = 0;
        this.score = { correct: 0, total: 0 };
        this.wrongAnswers = [];
        this.renderQuestion();
    }

    retryWrong() {
        this.sessionQuestions = this.shuffle([...this.wrongAnswers]);
        this.currentQuestionIndex = 0;
        this.score = { correct: 0, total: 0 };
        this.wrongAnswers = [];
        this.renderQuestion();
    }

    reviewQuestion(index) {
        const q = this.wrongAnswers[index];
        this.sessionQuestions = [q];
        this.currentQuestionIndex = 0;
        this.answered = false;
        this.selectedAnswers = new Set();
        this.renderReviewQuestion(q);
    }

    renderReviewQuestion(question) {
        this.currentView = 'review';
        const correctKeys = new Set(question.options.filter(o => o.correct).map(o => o.key));

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="card">
                <div class="question-header">
                    <span class="question-number">Review - #${question.id}</span>
                    <div class="question-meta">
                        <span class="badge badge-topic">${this.getTopicDisplayName(question.topic)}</span>
                        ${question.semester ? `<span class="badge badge-semester">Sem ${question.semester}</span>` : ''}
                    </div>
                </div>

                <div class="question-text">${this.formatText(question.question)}</div>

                <ul class="options-list">
                    ${question.options.map(opt => `
                        <li class="option-item">
                            <label class="option-label ${correctKeys.has(opt.key) ? 'correct' : ''}" style="cursor:default;">
                                <span class="option-key">${opt.key})</span>
                                <span class="option-text">${this.formatText(opt.text)}</span>
                                ${correctKeys.has(opt.key) ? '<strong style="color:var(--success);">&#x2713;</strong>' : ''}
                            </label>
                        </li>
                    `).join('')}
                </ul>

                <div class="question-actions">
                    <button class="btn btn-outline" onclick="app.showReviewExplanation(${question.id})">
                        Show Explanation
                    </button>
                    <button class="btn btn-secondary" onclick="app.renderResults()">
                        Back to Results
                    </button>
                </div>

                <div class="explanation-panel" id="explanationPanel">
                    <h4>Explanation</h4>
                    <div class="explanation-content" id="explanationContent"></div>
                </div>
            </div>`;

        if (window.MathJax) MathJax.typesetPromise();
    }

    async showReviewExplanation(questionId) {
        const question = this.questions.find(q => q.id === questionId);
        if (!question) return;

        // Temporarily set for showExplanation
        const originalQuestions = this.sessionQuestions;
        const originalIndex = this.currentQuestionIndex;
        this.sessionQuestions = [question];
        this.currentQuestionIndex = 0;

        await this.showExplanation();

        this.sessionQuestions = originalQuestions;
        this.currentQuestionIndex = originalIndex;
    }

    // ── Statistics ──

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

    showStats() {
        this.currentView = 'stats';
        const topicStats = Object.entries(this.stats.byTopic)
            .map(([topic, data]) => ({
                topic, ...data,
                percentage: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0
            }))
            .sort((a, b) => a.percentage - b.percentage);

        const overallPct = this.stats.totalAnswered > 0
            ? Math.round((this.stats.totalCorrect / this.stats.totalAnswered) * 100) : 0;

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="card">
                <h2>Statistics</h2>
                <div class="results-details">
                    <div class="result-stat">
                        <div class="result-stat-value">${overallPct}%</div>
                        <div class="result-stat-label">Accuracy</div>
                    </div>
                    <div class="result-stat">
                        <div class="result-stat-value">${this.stats.totalAnswered}</div>
                        <div class="result-stat-label">Answered</div>
                    </div>
                    <div class="result-stat">
                        <div class="result-stat-value">${this.stats.totalCorrect}</div>
                        <div class="result-stat-label">Correct</div>
                    </div>
                    <div class="result-stat">
                        <div class="result-stat-value">${Object.keys(this.stats.byTopic).length}</div>
                        <div class="result-stat-label">Topics Tried</div>
                    </div>
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <h4>Performance by Topic</h4>
                    <ul class="stat-list">
                        ${topicStats.length > 0 ? topicStats.map(s => {
                            const color = s.percentage >= 70 ? 'var(--success)' : s.percentage >= 50 ? 'var(--warning)' : 'var(--danger)';
                            return `<li>
                                <span>${this.getTopicDisplayName(s.topic)}</span>
                                <div class="stat-bar-container">
                                    <div class="stat-bar">
                                        <div class="stat-bar-fill" style="width:${s.percentage}%; background:${color};"></div>
                                    </div>
                                    <span style="color:${color}; font-weight:600; min-width:70px; text-align:right;">
                                        ${s.percentage}% (${s.correct}/${s.total})
                                    </span>
                                </div>
                            </li>`;
                        }).join('') : '<li>No data yet - start a quiz!</li>'}
                    </ul>
                </div>

                <div class="stat-card">
                    <h4>Weak Areas (below 70%)</h4>
                    <ul class="stat-list">
                        ${topicStats.filter(s => s.percentage < 70 && s.total > 0).length > 0
                            ? topicStats.filter(s => s.percentage < 70 && s.total > 0).map(s => `
                                <li>
                                    <span>${this.getTopicDisplayName(s.topic)}</span>
                                    <span style="color: var(--danger); font-weight:600;">${s.percentage}%</span>
                                </li>
                            `).join('')
                            : '<li style="color:var(--success);">No weak areas - keep it up!</li>'
                        }
                    </ul>
                    ${topicStats.filter(s => s.percentage < 70 && s.total > 0).length > 0 ? `
                        <div style="margin-top: 12px;">
                            <button class="btn btn-small btn-outline" onclick="app.quickStart('weak')">Practice Weak Areas</button>
                        </div>
                    ` : ''}
                </div>
            </div>

            <div class="card" style="margin-top: 20px;">
                <div class="actions-row">
                    <button class="btn btn-secondary" onclick="app.renderHome()">Back to Home</button>
                    <button class="btn btn-danger btn-small" onclick="app.clearStats()">Clear Statistics</button>
                </div>
            </div>`;
    }

    // ── Settings ──

    showSettings() {
        this.currentView = 'settings';
        const apiKey = localStorage.getItem('aiApiKey');
        const cachedCount = Object.keys(this.explanationCache).length;

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="card">
                <h2>Settings</h2>

                <div class="settings-section">
                    <h4>AI Explanations</h4>
                    <p style="color:var(--text-muted); font-size:14px; margin-bottom:12px;">
                        Add your OpenRouter API key to get AI-powered explanations for each question.
                        Explanations are cached so each question is only generated once.
                    </p>
                    <div class="filter-group">
                        <label>OpenRouter API Key</label>
                        <input type="password" id="apiKeyInput" placeholder="sk-or-v1-..."
                               value="${apiKey || ''}"
                               style="font-family: monospace;">
                    </div>
                    <div class="actions-row">
                        <button class="btn btn-primary btn-small" onclick="app.saveApiKey()">Save Key</button>
                        ${apiKey ? '<button class="btn btn-danger btn-small" onclick="app.removeApiKey()">Remove Key</button>' : ''}
                    </div>
                    <div style="margin-top:12px;">
                        <span class="api-key-status ${apiKey ? 'configured' : 'not-configured'}">
                            ${apiKey ? 'API Key Configured' : 'No API Key'}
                        </span>
                        <span style="margin-left:12px; font-size:13px; color:var(--text-muted);">
                            ${cachedCount} explanations cached
                        </span>
                    </div>
                </div>

                <div class="settings-section">
                    <h4>Cache Management</h4>
                    <p style="color:var(--text-muted); font-size:14px; margin-bottom:12px;">
                        Export your cached explanations to share or back up, or import from a file.
                    </p>
                    <div class="actions-row">
                        <button class="btn btn-small btn-secondary" onclick="app.exportCache()">Export Cache (JSON)</button>
                        <button class="btn btn-small btn-secondary" onclick="document.getElementById('importFile').click()">Import Cache</button>
                        <input type="file" id="importFile" accept=".json" style="display:none" onchange="app.importCache(event)">
                        <button class="btn btn-small btn-danger" onclick="app.clearCache()">Clear Cache</button>
                    </div>
                </div>

                <div class="settings-section">
                    <h4>Keyboard Shortcuts</h4>
                    <ul class="stat-list">
                        <li><span>Select option</span><span><span class="kbd">1</span> - <span class="kbd">9</span></span></li>
                        <li><span>Submit / Next</span><span class="kbd">Enter</span></li>
                        <li><span>Show explanation</span><span class="kbd">E</span></li>
                        <li><span>Go home</span><span class="kbd">Esc</span></li>
                    </ul>
                </div>

                <div class="actions-row">
                    <button class="btn btn-secondary" onclick="app.renderHome()">Back to Home</button>
                </div>
            </div>`;
    }

    saveApiKey() {
        const key = document.getElementById('apiKeyInput').value.trim();
        if (key) {
            localStorage.setItem('aiApiKey', key);
            this.showToast('API key saved', 'success');
            this.showSettings();
        } else {
            this.showToast('Enter a valid API key', 'error');
        }
    }

    removeApiKey() {
        localStorage.removeItem('aiApiKey');
        this.showToast('API key removed', 'info');
        this.showSettings();
    }

    exportCache() {
        const data = JSON.stringify(this.explanationCache, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ai_cache_export.json';
        a.click();
        URL.revokeObjectURL(url);
        this.showToast(`Exported ${Object.keys(this.explanationCache).length} explanations`, 'success');
    }

    importCache(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                const count = Object.keys(imported).length;
                Object.assign(this.explanationCache, imported);
                this.saveLocalCache();
                this.showToast(`Imported ${count} explanations`, 'success');
                this.showSettings();
            } catch (err) {
                this.showToast('Invalid JSON file', 'error');
            }
        };
        reader.readAsText(file);
    }

    clearCache() {
        if (confirm('Clear all cached AI explanations?')) {
            this.explanationCache = {};
            localStorage.removeItem('explanationCache');
            this.showToast('Cache cleared', 'info');
            this.showSettings();
        }
    }

    clearStats() {
        if (confirm('Clear all statistics? This cannot be undone.')) {
            this.stats = { byTopic: {}, totalAnswered: 0, totalCorrect: 0 };
            localStorage.removeItem('examDrillStats');
            this.showToast('Statistics cleared', 'info');
            this.showStats();
        }
    }

    // ── Keyboard ──

    setupKeyboard() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' && e.target.type !== 'radio' && e.target.type !== 'checkbox') return;
            if (e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;

            if (this.currentView === 'quiz') {
                // Number keys to select options
                const num = parseInt(e.key);
                if (num >= 1 && num <= 9 && !this.answered) {
                    const question = this.sessionQuestions[this.currentQuestionIndex];
                    if (num <= question.options.length) {
                        e.preventDefault();
                        this.selectOption(question.options[num - 1].key);
                    }
                }

                // Enter to submit/next
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.submitAnswer();
                }

                // E to show explanation
                if (e.key === 'e' || e.key === 'E') {
                    e.preventDefault();
                    this.showExplanation();
                }
            }

            // Escape to go home
            if (e.key === 'Escape') {
                e.preventDefault();
                this.renderHome();
            }
        });
    }

    // ── Toast ──

    showToast(message, type = 'info') {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            toast.style.transition = 'all 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Initialize
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new ExamDrill();
});
