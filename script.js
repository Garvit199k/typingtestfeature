// Client-side JavaScript for Typing Test Application

// Elements
const loginTab = document.getElementById('login-tab');
const registerTab = document.getElementById('register-tab');
const authForm = document.getElementById('auth-form');
const authMessage = document.getElementById('auth-message');
const authSubmit = document.getElementById('auth-submit');
const themeSelect = document.getElementById('theme-select');

const authSection = document.getElementById('auth-section');
const typingTestSection = document.getElementById('typing-test-section');

const difficultySelect = document.getElementById('difficulty');
const timerSelect = document.getElementById('timer');
const startTestBtn = document.getElementById('start-test');
const testTextDiv = document.getElementById('test-text');
const inputArea = document.getElementById('input-area');
const timerDisplay = document.getElementById('timer-display');
const wpmDisplay = document.getElementById('wpm-display');
const tryAgainBtn = document.getElementById('try-again');

const leaderboardList = document.getElementById('leaderboard-list');

let isLoginMode = true;
let timer = null;
let timeLeft = 0;
let totalTime = 0;
let testStarted = false;
let startTime = null;
let currentText = '';
let errors = 0;
let intervalId = null;
let user = null;

// Sounds
const beepSound = new Audio('https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg');
const victorySound = new Audio('https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg');

// Utility Functions
function setTheme(theme) {
    document.body.classList.remove('theme-male-professional', 'theme-female-kawaii');
    if (theme === 'male-professional') {
        document.body.classList.add('theme-male-professional');
    } else if (theme === 'female-kawaii') {
        document.body.classList.add('theme-female-kawaii');
    }
    localStorage.setItem('theme', theme);
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'male-professional';
    themeSelect.value = savedTheme;
    setTheme(savedTheme);
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

function saveUser(username, password) {
    let users = JSON.parse(localStorage.getItem('users') || '{}');
    users[username] = password;
    localStorage.setItem('users', JSON.stringify(users));
}

function validateUser(username, password) {
    let users = JSON.parse(localStorage.getItem('users') || '{}');
    return users[username] === password;
}

function showAuthMessage(message, isError = true) {
    authMessage.textContent = message;
    authMessage.style.color = isError ? 'red' : 'green';
}

async function generateRandomText(difficulty) {
    try {
        const response = await fetch(`/api/random-text?difficulty=${difficulty}`);
        if (!response.ok) throw new Error('Failed to fetch text');
        const data = await response.json();
        return data.text;
    } catch (error) {
        console.error('Error fetching random text:', error);
        return 'Error loading text. Please try again.';
    }
}

function updateTimer() {
    if (timeLeft <= 0) {
        endTest();
        return;
    }
    timerDisplay.textContent = `Time: ${timeLeft}s`;
    timeLeft--;
}

function calculateWPM() {
    const elapsedMinutes = (totalTime - timeLeft) / 60;
    const wordsTyped = inputArea.value.trim().split(/\s+/).length;
    return Math.round(wordsTyped / elapsedMinutes) || 0;
}

let beepPlayed = false;
function highlightText() {
    const input = inputArea.value;
    let html = '';
    errors = 0;
    let errorFound = false;
    for (let i = 0; i < currentText.length; i++) {
        const char = currentText[i];
        const typedChar = input[i];
        if (typedChar == null) {
            html += `<span>${char}</span>`;
        } else if (typedChar === char) {
            html += `<span class="correct">${char}</span>`;
        } else {
            html += `<span class="incorrect">${char}</span>`;
            errors++;
            errorFound = true;
        }
    }
    testTextDiv.innerHTML = html;
    if (errorFound) {
        if (!beepPlayed) {
            beepSound.play();
            beepPlayed = true;
        }
    } else {
        beepPlayed = false;
    }
}

async function startTest() {
    currentText = await generateRandomText(difficultySelect.value);
    testTextDiv.textContent = currentText;
    inputArea.value = '';
    inputArea.disabled = false;
    inputArea.focus();
    totalTime = parseInt(timerSelect.value, 10);
    timeLeft = totalTime;
    timerDisplay.textContent = `Time: ${timeLeft}s`;
    wpmDisplay.textContent = 'WPM: 0';
    tryAgainBtn.classList.add('hidden');
    testStarted = true;
    startTime = Date.now();
    beepPlayed = false;
    pauseTestBtn.style.display = 'inline-block';

    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(() => {
        updateTimer();
        highlightText();
        wpmDisplay.textContent = `WPM: ${calculateWPM()}`;
    }, 1000);
}

function endTest() {
    testStarted = false;
    inputArea.disabled = true;
    clearInterval(intervalId);
    highlightText();
    wpmDisplay.textContent = `WPM: ${calculateWPM()}`;
    if (errors === 0) {
        victorySound.play();
    }
    tryAgainBtn.classList.remove('hidden');
    saveScore(user.username, calculateWPM());
    loadLeaderboard();
}

function saveScore(username, wpm) {
    let leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');
    leaderboard.push({ username, wpm, date: new Date().toISOString() });
    leaderboard.sort((a, b) => b.wpm - a.wpm);
    if (leaderboard.length > 10) leaderboard = leaderboard.slice(0, 10);
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
}

function loadLeaderboard() {
    let leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');
    leaderboardList.innerHTML = '';
    leaderboard.forEach(entry => {
        const li = document.createElement('li');
        li.textContent = `${entry.username} - ${entry.wpm} WPM`;
        leaderboardList.appendChild(li);
    });
}

const leaderboardButton = document.getElementById('leaderboard-button');
leaderboardButton.addEventListener('click', () => {
    window.location.href = 'leaderboard.html';
});

function tryAgain() {
    startTest();
}

function loginUser(username, password) {
    if (validateUser(username, password)) {
        user = { username };
        showAuthMessage('Login successful!', false);
        setTimeout(() => {
            authSection.classList.add('hidden');
            typingTestSection.classList.remove('hidden');
            loadTheme();
            loadLeaderboard();
        }, 1000);
    } else {
        showAuthMessage('Invalid username or password.');
    }
}

function registerUser(username, password) {
    let users = JSON.parse(localStorage.getItem('users') || '{}');
    if (users[username]) {
        showAuthMessage('Username already exists.');
        return;
    }
    saveUser(username, password);
    showAuthMessage('Registration successful! You can now login.', false);
    switchMode(true);
}

function handleAuthSubmit(e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const theme = themeSelect.value;
    setTheme(theme);

    if (isLoginMode) {
        loginUser(username, password);
    } else {
        registerUser(username, password);
    }
}

let pauseTestBtn = document.getElementById('pause-test');
let isPaused = false;
let pauseStartTime = null;
let pauseElapsed = 0;

function showSuccessMessage(message) {
    authMessage.textContent = message;
    authMessage.style.color = 'green';
}

function pauseTest() {
    if (!testStarted) return;
    if (!isPaused) {
        // Pause the test
        isPaused = true;
        pauseTestBtn.textContent = 'Resume';
        inputArea.disabled = true;
        clearInterval(intervalId);
        pauseStartTime = Date.now();
    } else {
        // Resume the test
        isPaused = false;
        pauseTestBtn.textContent = 'Pause';
        inputArea.disabled = false;
        // Adjust timeLeft based on pause duration
        pauseElapsed += (Date.now() - pauseStartTime) / 1000;
        intervalId = setInterval(() => {
            updateTimer();
            highlightText();
            wpmDisplay.textContent = `WPM: ${calculateWPM()}`;
        }, 1000);
    }
    // Show or hide pause button based on test state
    pauseTestBtn.style.display = testStarted ? 'inline-block' : 'none';
}

function loginUser(username, password) {
    if (validateUser(username, password)) {
        user = { username };
        showSuccessMessage('Successfully logged in!');
        setTimeout(() => {
            authSection.classList.add('hidden');
            typingTestSection.classList.remove('hidden');
            loadTheme();
            loadLeaderboard();
        }, 1000);
    } else {
        showAuthMessage('Invalid username or password.');
    }
}

function registerUser(username, password) {
    let users = JSON.parse(localStorage.getItem('users') || '{}');
    if (users[username]) {
        showAuthMessage('Username already exists.');
        return;
    }
    saveUser(username, password);
    showSuccessMessage('Successfully registered! You can now login.');
    switchMode(true);
}

pauseTestBtn.addEventListener('click', pauseTest);
loginTab.addEventListener('click', () => switchMode(true));
registerTab.addEventListener('click', () => switchMode(false));
authForm.addEventListener('submit', handleAuthSubmit);
startTestBtn.addEventListener('click', () => {
    if (!testStarted) startTest();
});
tryAgainBtn.addEventListener('click', tryAgain);
themeSelect.addEventListener('change', (e) => setTheme(e.target.value));
inputArea.addEventListener('input', highlightText);

// Initialize
switchMode(true);
loadTheme();
