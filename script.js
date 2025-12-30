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
        this.timerDuration = 30;
        this.wordsTarget = 50;
        this.timer = null;
        this.remainingTime = this.timerDuration;
        this.wordsTyped = 0;

        this.typingCursor = null;

        this.init();
    }

    async init() {
        await this.generateText();
        this.setupEventListeners();
        this.updateDisplay();
    }

    // Load language data with error handling
    async loadLanguageData(language = 'english') {
        try {
            // Determine which file to load based on the target text length
            let filename = `data/${language}.json`;
            const targetLength = this.mode === 'words' ? this.wordsTarget : 200;

            // For longer texts, use larger word lists if available
            if (targetLength > 500) {
                const largeFiles = [
                    `data/${language}_450k.json`,
                    `data/${language}_650k.json`,
                    `data/${language}_500k.json`,
                    `data/${language}_250k.json`,
                    `data/${language}_100k.json`,
                    `data/${language}_10k.json`
                ];
                for (const file of largeFiles) {
                    try {
                        const response = await fetch(file);
                        if (response.ok) {
                            filename = file;
                            break;
                        }
                    } catch (e) {
                        continue; // Try next file
                    }
                }
            } else if (targetLength > 100) {
                const mediumFiles = [
                    `data/${language}_10k.json`,
                    `data/${language}_5k.json`,
                    `data/${language}_2k.json`,
                    `data/${language}_1k.json`
                ];
                for (const file of mediumFiles) {
                    try {
                        const response = await fetch(file);
                        if (response.ok) {
                            filename = file;
                            break;
                        }
                    } catch (e) {
                        continue; // Try next file
                    }
                }
            }

            const response = await fetch(filename);
            if (!response.ok) {
                throw new Error(`Failed to load language data from ${filename}`);
            }
            const data = await response.json();
            return data.words || [];
        } catch (error) {
            console.error('Error loading language data:', error);
            // Fallback to a simple word list if loading fails
            return [
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
        }
    }

    // Generate text using Zipf's Law for weighted random sampling
    async generateText() {
        const words = await this.loadLanguageData('english');
        if (words.length === 0) {
            console.error('No words loaded, using fallback');
            return;
        }

        let generatedText = '';
        const targetLength = this.mode === 'words' ? this.wordsTarget : 200;

        // Initialize recent usage tracker
        this.recentUsage = new Map();

        while (generatedText.split(' ').length < targetLength) {
            const randomWord = this.selectWordWithDiversity(words);
            generatedText += randomWord + ' ';
        }

        this.text = generatedText.trim();
    }

    // Create prefix sum array for modified weighted selection
    createZipfWeightedPrefixSum(n) {
        // Use a method that reduces the dominance of very frequent words
        // This creates a more natural distribution with less repetition of words like "the"
        const weights = [];
        let sum = 0;
        const prefixSum = [];

        for (let i = 0; i < n; i++) {
            // Use linear scaling to make the distribution more even between ranks
            // This gives more variety while preserving some frequency-based selection
            const rankFactor = (i + 1);
            // Use a linear combination to reduce dominance of top words
            const weight = 1.0 / (1 + 0.1 * rankFactor);  // This creates a more even distribution
            weights.push(weight);
            sum += weight;
            prefixSum.push(sum);
        }

        return prefixSum;
    }

    // Select a word using weighted random sampling based on Zipf's Law with diversity
    selectWordZipfWeightedWithDiversity(words, prefixSum, recentWords) {
        // Generate a random value between 0 and the total sum
        const totalWeight = prefixSum[prefixSum.length - 1];
        const randomValue = Math.random() * totalWeight;

        // Binary search to find the position where randomValue fits in prefixSum
        let left = 0;
        let right = prefixSum.length - 1;
        let index = 0;

        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            if (prefixSum[mid] >= randomValue) {
                index = mid;
                right = mid - 1;
            } else {
                left = mid + 1;
            }
        }

        // Ensure index is within bounds
        index = Math.min(index, words.length - 1);
        let selectedWord = words[index];

        // If the selected word was recently used, try to find an alternative
        // But don't loop indefinitely - if all options are exhausted, use the selected word
        if (recentWords.has(selectedWord) && words.length > 1) {
            // Try to find a different word that wasn't recently used
            const attempts = Math.min(5, words.length); // Limit attempts to avoid performance issues
            let attemptsCount = 0;

            while (attemptsCount < attempts) {
                // Randomly select another word from the top 50% of the frequency list
                // to maintain some naturalness while avoiding repetition
                const randomIndex = Math.floor(Math.random() * Math.min(words.length, 50 + Math.floor(words.length * 0.1)));
                if (!recentWords.has(words[randomIndex])) {
                    selectedWord = words[randomIndex];
                    break;
                }
                attemptsCount++;
            }
        }

        return selectedWord;
    }

    // Create prefix sum array for modified weighted selection that reduces dominance of top words
    createZipfWeightedPrefixSum(n) {
        // Create a more spread-out distribution that reduces dominance of most frequent words
        const weights = [];
        let sum = 0;
        const prefixSum = [];

        for (let i = 0; i < n; i++) {
            // Use square root function to make the distribution less steep
            // This reduces the probability of the most frequent words
            const weight = 1.0 / Math.sqrt(i + 1);  // Square root creates a more gradual decline
            weights.push(weight);
            sum += weight;
            prefixSum.push(sum);
        }

        return prefixSum;
    }

    // Select a word using weighted random sampling but reducing repetition
    selectWordWithDiversity(words) {
        // Generate adjusted weights that penalize recently used words
        if (!this.diversityPrefixSum || this.diversityPrefixSum.length !== words.length) {
            this.diversityPrefixSum = this.createZipfWeightedPrefixSum(words.length);
        }

        // Create temporary adjusted weights based on recent usage
        const adjustedWeights = [];
        const baseWeights = [];

        // Calculate base weights from the prefix sum
        for (let i = 0; i < words.length; i++) {
            if (i === 0) {
                baseWeights.push(this.diversityPrefixSum[0]);
            } else {
                baseWeights.push(this.diversityPrefixSum[i] - this.diversityPrefixSum[i-1]);
            }
        }

        // Apply penalty to recently used words
        for (let i = 0; i < words.length; i++) {
            let penalty = 1.0; // no penalty by default
            const usageCount = this.recentUsage.get(words[i]) || 0;

            // Apply stronger penalty for more frequent recent usage
            if (usageCount > 0) {
                penalty = 1.0 / (1.0 + usageCount * 0.5); // Reduce weight by up to 50% based on usage
            }

            adjustedWeights.push(baseWeights[i] * penalty);
        }

        // Create adjusted prefix sum
        const adjustedPrefixSum = [];
        let sum = 0;
        for (let i = 0; i < adjustedWeights.length; i++) {
            sum += adjustedWeights[i];
            adjustedPrefixSum.push(sum);
        }

        // Generate a random value between 0 and the adjusted total sum
        const totalWeight = adjustedPrefixSum[adjustedPrefixSum.length - 1];
        if (totalWeight <= 0) {
            // Fallback to simple random selection if all weights are zero
            const randomIndex = Math.floor(Math.random() * words.length);
            this.updateRecentUsage(words[randomIndex]);
            return words[randomIndex];
        }

        const randomValue = Math.random() * totalWeight;

        // Binary search to find the position where randomValue fits in adjustedPrefixSum
        let left = 0;
        let right = adjustedPrefixSum.length - 1;
        let index = 0;

        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            if (adjustedPrefixSum[mid] >= randomValue) {
                index = mid;
                right = mid - 1;
            } else {
                left = mid + 1;
            }
        }

        // Ensure index is within bounds
        index = Math.min(index, words.length - 1);

        // Update recent usage
        this.updateRecentUsage(words[index]);

        return words[index];
    }

    // Update recent usage map, keeping only recent entries
    updateRecentUsage(word) {
        this.recentUsage.set(word, (this.recentUsage.get(word) || 0) + 1);

        // Keep only the most recent entries (limit to 20 total usage counts)
        if (this.recentUsage.size > 20) {
            // Simple approach: reduce all counts by 1, removing those that reach 0
            const newMap = new Map();
            for (const [w, count] of this.recentUsage) {
                const newCount = Math.max(0, count - 0.2); // Gradually reduce usage
                if (newCount > 0) {
                    newMap.set(w, newCount);
                }
            }
            this.recentUsage = newMap;
        }
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
            // Only start the test if input is empty, otherwise add space to input
            if (this.inputValue === '') {
                this.startTest();
            } else {
                this.inputValue += e.key;
                this.validateInput();
            }
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
        // Reset errors to recount
        this.errors = 0;
        const textDisplay = document.getElementById('text-display');
        let html = '';

        // Track word boundaries properly
        let inTypedWord = false;
        let wordStartIndex = 0;

        for (let i = 0; i < this.text.length; i++) {
            let className = 'char';
            let charToDisplay = this.text[i];

            if (i < this.inputValue.length) {
                if (this.inputValue[i] === this.text[i]) {
                    className += ' correct';

                    // Check if this completes a word
                    if (this.text[i] !== ' ' && i + 1 < this.text.length && this.text[i + 1] === ' ') {
                        const wordStart = this.findWordStart(i);
                        if (this.isWordCorrect(wordStart, i)) {
                            // Mark this entire word as correct-word
                            className += ' correct-word';
                        }
                    }
                } else {
                    // Character is incorrect
                    className += ' incorrect';
                    // Don't replace the character underneath the cursor, show original text
                    charToDisplay = this.text[i];

                    if (i >= this.currentIndex) this.errors++;
                }

            } else if (i === this.inputValue.length) {
                // Current position
                className += ' current';
                this.currentIndex = i;
            }

            html += `<span class="${className}">${charToDisplay}</span>`;
        }

        textDisplay.innerHTML = html;

        // Scroll to keep current character in view
        this.scrollToCurrentChar();
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

    }

    isTestComplete() {
        if (this.mode === 'words') {
            return this.wordsTyped >= this.wordsTarget;
        }
        return this.currentIndex >= this.text.length;
    }

    async restart() {
        this.endTest();
        this.inputValue = '';
        await this.generateText();
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
