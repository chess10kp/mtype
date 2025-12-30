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
        this.mode = 'timer';
        this.timerDuration = 60;
        this.wordsTarget = 50;
        this.timer = null;
        this.remainingTime = this.timerDuration;
        this.wordsTyped = 0;

        this.cursor = null;
        this.typingCursor = null; 
        this.cursorX = 0;
        this.cursorY = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.cursorSpeed = 0.15; 
        this.cursorVelocityX = 0;
        this.cursorVelocityY = 0;
        this.cursorAcceleration = 0.1;
        this.cursorSmoothness = 0.15;

        this.typingCursorTargetX = 0;
        this.typingCursorTargetY = 0;
        this.typingCursorX = 0;
        this.typingCursorY = 0;
        this.typingCursorVisible = false;

        this.init();
    }

    init() {
        this.generateText();
        this.setupEventListeners();
        this.updateDisplay();
        this.initSmoothCursor();
    }

    generateText() {
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
        document.addEventListener('keydown', (e) => this.handleGlobalKeydown(e));
    }



    handleGlobalKeydown(e) {
        const key = e.key.toLowerCase();

        if (key === 'tab') {
            e.preventDefault();
            this.restart();
            return;
        }

        if (key === ' ' && !this.isActive) {
            e.preventDefault();
            this.inputValue = '';
            this.startTest();
            return;
        }

        if (key === 'escape' && this.isActive) {
            e.preventDefault();
            this.endTest();
            return;
        }

        if (!this.isActive && !isNaN(parseInt(key)) && key !== ' ') {
            const num = parseInt(key);
            if (num === 1) {
                this.setMode('timer');
            } else if (num === 2) {
                this.setMode('words');
            }
            return;
        }

        if (this.isActive) {
            if (key === 'backspace') {
                e.preventDefault();
                if (e.ctrlKey) {
                    this.inputValue = this.deleteWordBackward(this.inputValue);
                } else {
                    this.inputValue = this.inputValue.slice(0, -1);
                }
                this.validateInput();
            } else if (key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
                e.preventDefault();
                this.inputValue += e.key;
                this.validateInput();

                if (this.isTestComplete()) {
                    this.endTest();
                }
            }
        } else if (!this.isActive && /^[a-zA-Z]$/.test(e.key)) {
            this.inputValue = e.key;
            this.startTest();
            this.validateInput();
        }
    }

    validateInput() {
        const textDisplay = document.getElementById('text-display');
        let html = '';

        for (let i = 0; i < this.text.length; i++) {
            let className = 'char';

            if (i < this.inputValue.length) {
                if (this.inputValue[i] === this.text[i]) {
                    // Check if this character is part of a completed word
                    if (this.text[i] === ' ' && i > 0) {
                        // This is a space that has been correctly typed - check if the entire word before it is correct
                        const wordStart = this.findWordStart(i - 1);
                        const wordCorrect = this.isWordCorrect(wordStart, i - 1);
                        if (wordCorrect) {
                            className += ' correct-word';
                        } else {
                            className += ' correct';
                        }
                    } else {
                        // Check if we're at the end of a word (before a space) and the word is correct
                        if (i + 1 < this.text.length && this.text[i + 1] === ' ' && i >= 0) {
                            const wordStart = this.findWordStart(i);
                            const wordCorrect = this.isWordCorrect(wordStart, i);
                            if (wordCorrect) {
                                className += ' correct-word';
                            } else {
                                className += ' correct';
                            }
                        } else {
                            // Check if we're at the end of the text and the final word is correct
                            if (i === this.inputValue.length - 1 && i + 1 === this.text.length) {
                                const wordStart = this.findWordStart(i);
                                const wordCorrect = this.isWordCorrect(wordStart, i);
                                if (wordCorrect) {
                                    className += ' correct-word';
                                } else {
                                    className += ' correct';
                                }
                            } else {
                                // Just a regular correctly typed character
                                className += ' correct';
                            }
                        }
                    }
                } else {
                    className += ' incorrect';
                    if (i >= this.currentIndex) this.errors++;
                }
            } else if (i === this.inputValue.length) {
                className += ' current';
                this.currentIndex = i;
            }

            // Show the user's typed character for incorrect characters, otherwise show the original text
            const charToDisplay = className.includes('incorrect') && i < this.inputValue.length ?
                this.inputValue[i] : this.text[i];
            html += `<span class="${className}">${charToDisplay}</span>`;
        }

        textDisplay.innerHTML = html;

        // Scroll to keep current character in view
        this.scrollToCurrentChar();

        // Update smooth cursor position to follow the current character
        this.updateSmoothCursorToCurrentChar();
    }

    // Helper method to find the start of the current word
    findWordStart(endIndex) {
        for (let i = endIndex; i >= 0; i--) {
            if (this.text[i] === ' ') {
                return i + 1; // Return the position after the space
            }
        }
        return 0; // If no space found, the word starts at the beginning
    }

    isWordCorrect(startIndex, endIndex) {
        if (endIndex < startIndex) return false; // Invalid range

        for (let i = startIndex; i <= endIndex; i++) {
            if (i >= this.inputValue.length) return false; // Not fully typed yet
            if (this.inputValue[i] !== this.text[i]) return false; // Incorrect character
        }
        return true; // All characters in the word are correct
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

    updateSmoothCursorToCurrentChar() {
        // Only update typing cursor when the test is active
        if (!this.isActive) return;

        const textDisplay = document.getElementById('text-display');
        const currentCharElement = textDisplay.querySelector('.current');

        if (currentCharElement) {
            // Get the position of the current character element
            const rect = currentCharElement.getBoundingClientRect();
            const containerRect = textDisplay.getBoundingClientRect();

            // Calculate the position relative to the text display container
            this.typingCursorTargetX = rect.left - containerRect.left + rect.width / 2;
            this.typingCursorTargetY = rect.top - containerRect.top + rect.height / 4;

            if (!this.typingCursorVisible) {
                this.typingCursorVisible = true;
                if (this.typingCursor) {
                    this.typingCursor.classList.add('visible');
                }
            }
        }
    }

    updateTypingCursorPosition() {
        if (this.typingCursor) {
            // Apply easing to create smooth movement
            this.typingCursorX += (this.typingCursorTargetX - this.typingCursorX) * 0.3;
            this.typingCursorY += (this.typingCursorTargetY - this.typingCursorY) * 0.3;

            // Apply the position to the element
            this.typingCursor.style.transform = `translate(${this.typingCursorX}px, ${this.typingCursorY}px)`;
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
        // If input is empty, return empty
        if (!input) return '';

        // Find the position where the last word starts
        // First, trim any trailing whitespace
        const trimmed = input.trimEnd();

        // Find the last space in the trimmed string
        const lastSpaceIndex = trimmed.lastIndexOf(' ');

        if (lastSpaceIndex >= 0) {
            // If there's a space, we return the text up to and including the space
            // This removes the last word but keeps the preceding space
            return input.substring(0, lastSpaceIndex + 1);
        } else {
            // If no space exists, it means we have a single word (or just whitespace)
            // So we return empty string
            return input.replace(/\S/g, ''); // Remove all non-whitespace characters, keeping only whitespace
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

        // Start the stats update timer to update WPM every second
        this.statsInterval = setInterval(() => {
            this.updateStats();
        }, 1000);

        // Show the typing cursor when test starts
        if (this.typingCursor) {
            this.typingCursor.classList.add('visible');
            this.typingCursorVisible = true;
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
        clearInterval(this.statsInterval);

        const textDisplay = document.getElementById('text-display');
        const stats = document.querySelector('.stats');

        textDisplay.classList.remove('active');
        stats.classList.remove('active');

        this.updateStats();

        // Hide the typing cursor when test ends
        if (this.typingCursor) {
            this.typingCursor.classList.remove('visible');
            this.typingCursorVisible = false;
        }
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

        // Get reference to the typing cursor element after DOM update
        this.typingCursor = document.getElementById('typing-cursor');
    }

    initSmoothCursor() {
        // Get the smooth cursor element
        this.cursor = document.getElementById('smooth-cursor');

        if (!this.cursor) {
            console.error('Smooth cursor element not found');
            return;
        }

        // Initialize cursor position to current mouse position
        this.cursorX = window.innerWidth / 2;
        this.cursorY = window.innerHeight / 2;
        this.targetX = window.innerWidth / 2;
        this.targetY = window.innerHeight / 2;

        this.updateCursorPosition();

        // Add mouse move listener to track mouse position
        document.addEventListener('mousemove', (e) => {
            // Only update mouse position target when typing test is not active
            if (!this.isActive) {
                this.targetX = e.clientX;
                this.targetY = e.clientY;
            }
        });

        // Add mouse enter/leave events to handle cursor visibility
        document.addEventListener('mouseenter', (e) => {
            if (this.cursor) {
                this.cursor.classList.remove('hidden');
            }
        });

        document.addEventListener('mouseleave', (e) => {
            if (this.cursor) {
                this.cursor.classList.add('hidden');
            }
        });

        // Add click events to make cursor expand
        document.addEventListener('mousedown', () => {
            if (this.cursor) {
                this.cursor.classList.add('expanded');
            }
        });

        document.addEventListener('mouseup', () => {
            if (this.cursor) {
                this.cursor.classList.remove('expanded');
            }
        });

        // Start the animation loop
        this.animateCursor();
    }

    updateCursorPosition() {
        if (this.cursor) {
            this.cursor.style.left = `${this.cursorX}px`;
            this.cursor.style.top = `${this.cursorY}px`;
        }
    }

    animateCursor() {
        // Calculate distance to target for the mouse-following cursor
        const dx = this.targetX - this.cursorX;
        const dy = this.targetY - this.cursorY;

        // Apply easing with velocity-based movement for smoother animation
        this.cursorVelocityX += dx * this.cursorSmoothness;
        this.cursorVelocityY += dy * this.cursorSmoothness;

        // Apply damping to prevent oscillation
        this.cursorVelocityX *= 0.7;
        this.cursorVelocityY *= 0.7;

        // Update position
        this.cursorX += this.cursorVelocityX;
        this.cursorY += this.cursorVelocityY;

        // Update the cursor position
        this.updateCursorPosition();

        // Update typing cursor position if test is active
        if (this.isActive && this.typingCursor) {
            this.updateTypingCursorPosition();
        }

        // Continue the animation
        requestAnimationFrame(() => this.animateCursor());
    }
}

// Initialize the typing test
document.addEventListener('DOMContentLoaded', () => {
    new TypingTest();
});
