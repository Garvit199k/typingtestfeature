const messageArea = document.getElementById('message-area');
const testTextDiv = document.getElementById('test-text');
const inputArea = document.getElementById('input-area');
const wpmDisplay = document.getElementById('wpm-display');
const timerDisplay = document.getElementById('timer-display');
const tryAgainBtn = document.getElementById('try-again');
const difficultySelect = document.getElementById('difficulty');
const startTestBtn = document.getElementById('start-test');
const pauseTestBtn = document.getElementById('pause-test');

const authForm = document.getElementById('auth-form');
const authSubmit = document.getElementById('auth-submit');
const authMessage = document.getElementById('auth-message');

const loginTab = document.getElementById('login-tab');
const registerTab = document.getElementById('register-tab');
const themeSelect = document.getElementById('theme-select');

let currentText = '';
let testStarted = false;
let intervalId = null;
let timeLeft = 0;
let errors = 0;
let user = null;
let isLoginMode = true;

const beepSound = new Audio('beep.mp3');
const victorySound = new Audio('victory.mp3');

// Unlock audio playback on first user interaction
function unlockAudio() {
    beepSound.play().then(() => {
        beepSound.pause();
        beepSound.currentTime = 0;
    }).catch(() => {});
    victorySound.play().then(() => {
        victorySound.pause();
        victorySound.currentTime = 0;
    }).catch(() => {});
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
}

window.addEventListener('click', unlockAudio);
window.addEventListener('keydown', unlockAudio);

async function generateRandomText(difficulty) {
    try {
        const response = await fetch(`/api/random-text?difficulty=${difficulty}`);
        if (!response.ok) throw new Error('API response not ok');
        const data = await response.json();
        return data.text;
    } catch (error) {
        console.error('Error fetching random text:', error);
        // Fallback text
        const fallbackWords = {
            easy: ['cat', 'dog', 'sun', 'tree', 'book', 'car', 'pen', 'cup', 'hat', 'ball'],
            medium: ['computer', 'javascript', 'keyboard', 'monitor', 'internet', 'function', 'variable', 'object', 'array', 'string'],
            hard: ['asynchronous', 'polymorphism', 'encapsulation', 'inheritance', 'abstraction', 'algorithm', 'optimization', 'synchronization', 'multithreading', 'recursion']
        };
        const wordList = fallbackWords[difficulty] || fallbackWords.medium;
        let text = '';
        for (let i = 0; i < 50; i++) {
            const word = wordList[Math.floor(Math.random() * wordList.length)];
            text += word + (i === 49 ? '' : ' ');
        }
        return text;
    }
}

async function displayTextForDifficulty(difficulty) {
    currentText = await generateRandomText(difficulty);
    const words = currentText.split(' ');
    testTextDiv.innerHTML = words.map(word => `<span class="word">${word}</span>`).join(' ');
    inputArea.value = '';
    inputArea.disabled = true;
    wpmDisplay.textContent = 'WPM: 0';
    timerDisplay.textContent = 'Time: 0s';
    tryAgainBtn.classList.add('hidden');
    messageArea.textContent = '';
    testStarted = false;
    errors = 0;
    timeLeft = parseInt(document.getElementById('timer').value, 10);
    pauseTestBtn.classList.add('hidden');
}

difficultySelect.addEventListener('change', async (e) => {
    const newDifficulty = e.target.value;
    if (testStarted) {
        const confirmChange = confirm('Changing difficulty will reset the current test. Do you want to continue?');
        if (!confirmChange) {
            difficultySelect.value = difficultySelect.getAttribute('data-prev') || 'medium';
            return;
        }
    }
    difficultySelect.setAttribute('data-prev', newDifficulty);
    await displayTextForDifficulty(newDifficulty);
});

startTestBtn.addEventListener('click', () => {
    if (!testStarted) {
        startTest();
        messageArea.textContent = '';
    }
});

pauseTestBtn.addEventListener('click', () => {
    if (testStarted) {
        clearInterval(intervalId);
        testStarted = false;
        pauseTestBtn.classList.add('hidden');
        startTestBtn.style.display = 'inline-block';
        messageArea.textContent = 'Test paused.';
    }
});

tryAgainBtn.addEventListener('click', () => {
    displayTextForDifficulty(difficultySelect.value);
    messageArea.textContent = '';
});

window.addEventListener('load', () => {
    localStorage.removeItem('currentUser');
    user = null;
    showAuthSection();

    displayTextForDifficulty(difficultySelect.value);
    const savedTheme = localStorage.getItem('selectedTheme') || themeSelect.value;
    setTheme(savedTheme);
    themeSelect.value = savedTheme;

const leaderboardButton = document.getElementById('leaderboard-button');
const leaderboardSection = document.getElementById('leaderboard-section');
const backButton = document.getElementById('back-button');

if (leaderboardButton && leaderboardSection && backButton) {
    leaderboardButton.addEventListener('click', () => {
        loadLeaderboard();
        leaderboardSection.classList.remove('hidden');
        document.getElementById('typing-test-section').classList.add('hidden');
    });

    backButton.addEventListener('click', () => {
        leaderboardSection.classList.add('hidden');
        document.getElementById('typing-test-section').classList.remove('hidden');
    });
}
});

const logoutButton = document.getElementById('logout-button');
logoutButton.addEventListener('click', () => {
    localStorage.removeItem('currentUser');
    user = null;
    showAuthSection();
    authMessage.textContent = 'Logged out successfully.';
    inputArea.disabled = true;
    startTestBtn.style.display = 'inline-block';
    pauseTestBtn.classList.add('hidden');
});

function startTest() {
    if (!user) {
        alert('Please login or register to start the test.');
        return;
    }
    testStarted = true;
    inputArea.disabled = false;
    inputArea.focus();
    startTestBtn.style.display = 'none';
    pauseTestBtn.classList.remove('hidden');
    timeLeft = parseInt(document.getElementById('timer').value, 10);
    timerDisplay.textContent = `Time: ${timeLeft}s`;
    errors = 0;
    inputArea.value = '';
    intervalId = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = `Time: ${timeLeft}s`;
        if (timeLeft <= 0) {
            endTest();
        }
    }, 1000);
}

function endTest() {
    testStarted = false;
    inputArea.disabled = true;
    clearInterval(intervalId);
    highlightText();
    const wpm = calculateWPM();
    wpmDisplay.textContent = `WPM: ${wpm}`;
    if (errors === 0) {
        victorySound.play();
        messageArea.textContent = '🎉 Congratulations! Perfect typing! 🎉';
        messageArea.style.color = '#28a745';
    } else {
        messageArea.textContent = 'Test completed! Try again to improve your score.';
        messageArea.style.color = '#007bff';
    }
    tryAgainBtn.classList.remove('hidden');
    saveScore(user.username, wpm);
    loadLeaderboard();
    startTestBtn.style.display = 'inline-block';
    pauseTestBtn.classList.add('hidden');
}

function highlightText() {
    const wordSpans = testTextDiv.querySelectorAll('span.word');
    const inputWords = inputArea.value.trim().split(/\s+/);
    for (let i = 0; i < wordSpans.length; i++) {
        if (inputWords[i] == null) {
            wordSpans[i].classList.remove('correct', 'incorrect');
        } else if (inputWords[i] === wordSpans[i].textContent) {
            wordSpans[i].classList.add('correct');
            wordSpans[i].classList.remove('incorrect');
        } else {
            wordSpans[i].classList.add('incorrect');
            wordSpans[i].classList.remove('correct');
        }
    }
}

inputArea.addEventListener('input', () => {
    if (!testStarted) return;
    const inputWords = inputArea.value.split(/\s+/);
    const wordSpans = testTextDiv.querySelectorAll('span.word');
    errors = 0;
    let playedBeep = false;
    for (let i = 0; i < wordSpans.length; i++) {
        const currentWord = wordSpans[i].textContent;
        const typedWord = inputWords[i] || '';
        if (typedWord.length === 0) {
            wordSpans[i].classList.remove('correct', 'incorrect');
        } else if (typedWord === currentWord) {
            wordSpans[i].classList.add('correct');
            wordSpans[i].classList.remove('incorrect');
        } else if (currentWord.startsWith(typedWord)) {
            // Partial correct word (typing in progress)
            wordSpans[i].classList.remove('correct', 'incorrect');
        } else {
            wordSpans[i].classList.add('incorrect');
            wordSpans[i].classList.remove('correct');
            errors++;
            if (!playedBeep) {
                beepSound.play();
                playedBeep = true;
            }
        }
    }
    const wpm = calculateWPM();
    wpmDisplay.textContent = `WPM: ${wpm}`;
});

function calculateWPM() {
    const wordsTyped = inputArea.value.trim().split(/\s+/).length;
    const minutes = (parseInt(document.getElementById('timer').value, 10)) / 60;
    return Math.round(wordsTyped / minutes);
}

function saveScore(username, wpm) {
    if (!username || !wpm) return;
    let leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');
    leaderboard = leaderboard.filter(entry => entry.username !== username);
    leaderboard.push({ username, wpm });
    leaderboard.sort((a, b) => b.wpm - a.wpm);
    leaderboard = leaderboard.slice(0, 10);
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
}

function loadLeaderboard() {
    const leaderboardList = document.getElementById('leaderboard-list');
    if (!leaderboardList) return;
    let leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');
    leaderboardList.innerHTML = '';
    if (leaderboard.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No scores yet.';
        leaderboardList.appendChild(li);
        return;
    }
    leaderboard.forEach((entry, index) => {
        const li = document.createElement('li');
        let medal = '';
        if (index === 0) medal = '🥇 ';
        else if (index === 1) medal = '🥈 ';
        else if (index === 2) medal = '🥉 ';
        li.textContent = `${medal}${entry.username} - ${entry.wpm} WPM`;
        leaderboardList.appendChild(li);
    });
}

function setTheme(theme) {
    document.body.classList.remove('theme-male-professional', 'theme-female-kawaii', 'theme-dark-mode');
    if (theme === 'male-professional') {
        document.body.classList.add('theme-male-professional');
    } else if (theme === 'female-kawaii') {
        document.body.classList.add('theme-female-kawaii');
    } else if (theme === 'dark-mode') {
        document.body.classList.add('theme-dark-mode');
    }
    localStorage.setItem('selectedTheme', theme);
}

themeSelect.addEventListener('change', (e) => {
    setTheme(e.target.value);
});

function showTypingTestSection() {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('typing-test-section').classList.remove('hidden');
    authMessage.textContent = '';
    authForm.reset();
}

function showAuthSection() {
    document.getElementById('auth-section').classList.remove('hidden');
    document.getElementById('typing-test-section').classList.add('hidden');
}

function switchMode(login) {
    isLoginMode = login;
    if (login) {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        authSubmit.textContent = 'Login';
    } else {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        authSubmit.textContent = 'Register';
    }
    authMessage.textContent = '';
    authForm.reset();
}

loginTab.addEventListener('click', () => switchMode(true));
registerTab.addEventListener('click', () => switchMode(false));

authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
        authMessage.textContent = 'Please enter username and password.';
        return;
    }

    let users = JSON.parse(localStorage.getItem('users') || '[]');
    if (!Array.isArray(users)) {
        users = [];
        localStorage.setItem('users', JSON.stringify(users));
    }

    if (isLoginMode) {
        const existingUser = users.find(u => u.username === username && u.password === password);
        if (existingUser) {
            user = existingUser;
            localStorage.setItem('currentUser', JSON.stringify(user));
            authMessage.textContent = '';
            showTypingTestSection();
        } else {
            authMessage.textContent = 'Invalid username or password.';
        }
    } else {
        const userExists = users.some(u => u.username === username);
        if (userExists) {
            authMessage.textContent = 'Username already exists.';
            return;
        }
        const newUser = { username, password };
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        authMessage.textContent = 'Registration successful. Please login.';
        switchMode(true);
    }
});
