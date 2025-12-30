// Monkeytype Clone - Core Functionality
class TypingTest {
    constructor() {
        this.text = '';
        this.inputValue = '';
        this.currentIndex = 0;
        this.startTime = null;
        this.endTime = null;
        this.errors = 0;
        this.totalChars = 0;
        this.isActive = false;
        this.mode = 'timer'; // 'timer' or 'words'
        this.timerDuration = 60; // seconds
        this.wordsTarget = 50;
        this.timer = null;
        this.remainingTime = this.timerDuration;
        this.wordsTyped = 0;

        this.init();
    }

    init() {
        this.generateText();
        this.setupEventListeners();
        this.updateDisplay();
    }

    generateText() {
        // Common words for typing tests
        const words = [
            'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'I',
            'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
            'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
            'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
            'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
            'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
            'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
            'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
            'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
            'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us'
        ];

        let generatedText = '';
        const targetLength = this.mode === 'words' ? this.wordsTarget : 200;

        while (generatedText.split(' ').length < targetLength) {
            const randomWord = words[Math.floor(Math.random() * words.length)];
            generatedText += randomWord + ' ';
        }

        this.text = generatedText.trim();
    }

    setupEventListeners() {
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleGlobalKeydown(e));
    }



    handleGlobalKeydown(e) {
        // Handle global keyboard shortcuts
        const key = e.key.toLowerCase();

        // Tab to restart
        if (key === 'tab') {
            e.preventDefault();
            this.restart();
            return;
        }

        // Space to start test (when not typing)
        if (key === ' ' && !this.isActive) {
            e.preventDefault();
            this.inputValue = '';
            this.startTest();
            return;
        }

        // Escape to stop test
        if (key === 'escape' && this.isActive) {
            e.preventDefault();
            this.endTest();
            return;
        }

        // Number keys for modes and settings
        if (!this.isActive && !isNaN(parseInt(key)) && key !== ' ') {
            const num = parseInt(key);
            if (num === 1) {
                this.setMode('timer');
            } else if (num === 2) {
                this.setMode('words');
            }
            return;
        }

        // Handle typing input
        if (this.isActive) {
            if (key === 'backspace') {
                e.preventDefault();
                // Check if Ctrl key is pressed for whole word deletion
                if (e.ctrlKey) {
                    // Delete the entire word backwards (including following space)
                    this.inputValue = this.deleteWordBackward(this.inputValue);
                } else {
                    // Delete single character
                    this.inputValue = this.inputValue.slice(0, -1);
                }
                this.validateInput();
                this.updateStats();
            } else if (key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
                // Regular character input
                e.preventDefault();
                this.inputValue += e.key;
                this.validateInput();
                this.updateStats();

                // Check if test is complete
                if (this.isTestComplete()) {
                    this.endTest();
                }
            }
        } else if (!this.isActive && /^[a-zA-Z]$/.test(e.key)) {
            // If not active and user types a letter, start the test automatically
            this.inputValue = e.key;
            this.startTest();
            this.validateInput();
            this.updateStats();
        }
    }

    validateInput() {
        const textDisplay = document.getElementById('text-display');
        let html = '';

        for (let i = 0; i < this.text.length; i++) {
            let className = 'char';

            if (i < this.inputValue.length) {
                if (this.inputValue[i] === this.text[i]) {
                    className += ' correct';
                } else {
                    className += ' incorrect';
                    if (i >= this.currentIndex) this.errors++;
                }
            } else if (i === this.inputValue.length) {
                className += ' current';
                this.currentIndex = i;
            }

            html += `<span class="${className}">${this.text[i]}</span>`;
        }

        textDisplay.innerHTML = html;

        // Scroll to keep current character in view
        this.scrollToCurrentChar();
    }


    scrollToCurrentChar() {
        if (this.currentIndex <= 0) return;

        const textDisplay = document.getElementById('text-display');
        const currentCharElement = textDisplay.querySelector('.current');

        if (currentCharElement) {
            // Calculate position of current character within the text display
            const charTop = currentCharElement.offsetTop;
            const containerHeight = textDisplay.clientHeight;
            const scrollTop = textDisplay.scrollTop;

            // Calculate the position of the last fully visible line
            // We want to scroll early when reaching the beginning of the final visible line
            const finalVisibleLineThreshold = scrollTop + containerHeight - (containerHeight / 3); // At 2/3 of the container height

            // If the current character is approaching the end of the visible area, scroll to show next line
            if (charTop > finalVisibleLineThreshold) {
                // Scroll so that the current character is about 1/3 down the container
                textDisplay.scrollTop = charTop - (containerHeight / 3);
            }
            // If the current character is above the visible area, scroll up
            else if (charTop < scrollTop) {
                textDisplay.scrollTop = charTop;
            }
        }
    }

    updateStats() {
        const elapsed = (Date.now() - this.startTime) / 1000 / 60; // minutes
        const typedChars = this.inputValue.length;

        // Calculate WPM (words per minute)
        const wordsTyped = typedChars / 5; // standard: 5 chars = 1 word
        const wpm = Math.round(wordsTyped / elapsed);

        // Calculate accuracy
        const accuracy = typedChars > 0 ? Math.round(((typedChars - this.errors) / typedChars) * 100) : 100;

        document.getElementById('wpm').textContent = wpm || 0;
        document.getElementById('accuracy').textContent = `${accuracy}%`;
    }

    // Helper method to delete a word backward from the input string
    deleteWordBackward(input) {
        // Find the last space character from the end
        const lastSpaceIndex = input.lastIndexOf(' ');

        if (lastSpaceIndex >= 0) {
            // If there's a space, delete from the end to the beginning of the last word (including the space)
            return input.substring(0, lastSpaceIndex);
        } else {
            // If there's no space, delete the entire string (single word)
            return '';
        }
    }

    updateTimeDisplay() {
        const timeWordsValue = document.getElementById('time-words-value');

        if (this.mode === 'timer') {
            timeWordsValue.textContent = `${this.remainingTime}`;
        } else {
            timeWordsValue.textContent = `${this.wordsTarget - this.wordsTyped}`;
        }
    }

    startTest() {
        if (this.isActive) return;

        this.isActive = true;
        this.startTime = Date.now();
        this.currentIndex = 0;
        this.errors = 0;
        this.wordsTyped = 0;

        const textDisplay = document.getElementById('text-display');
        const stats = document.querySelector('.stats');

        textDisplay.classList.add('active');
        stats.classList.add('active');

        if (this.mode === 'timer') {
            this.startTimer();
        }

    }

    startTimer() {
        this.remainingTime = this.timerDuration;
        this.updateTimeDisplay();

        this.timer = setInterval(() => {
            this.remainingTime--;
            this.updateTimeDisplay();

            if (this.remainingTime <= 0) {
                this.endTest();
            }
        }, 1000);
    }

    endTest() {
        this.isActive = false;
        this.endTime = Date.now();

        clearInterval(this.timer);

        const textDisplay = document.getElementById('text-display');
        const stats = document.querySelector('.stats');

        textDisplay.classList.remove('active');
        stats.classList.remove('active');

        this.updateStats();
    }

    isTestComplete() {
        if (this.mode === 'words') {
            return this.wordsTyped >= this.wordsTarget;
        }
        return this.currentIndex >= this.text.length;
    }

    restart() {
        this.endTest();
        this.inputValue = '';
        this.generateText();
        this.updateDisplay();
        this.remainingTime = this.timerDuration;
        this.updateTimeDisplay();
    }

    setMode(mode) {
        this.mode = mode;
        this.restart();
    }


    updateDisplay() {
        const textDisplay = document.getElementById('text-display');
        let html = '';

        for (let char of this.text) {
            html += `<span class="char">${char}</span>`;
        }

        textDisplay.innerHTML = html;
        this.updateTimeDisplay();
    }
}

// Initialize the typing test
document.addEventListener('DOMContentLoaded', () => {
    new TypingTest();
});
