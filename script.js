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

// Utility function to generate random text from API
async function generateRandomText(difficulty) {
    try {
        const response = await fetch(`/api/random-text?difficulty=${difficulty}`);
        const data = await response.json();
        return data.text;
    } catch (error) {
        console.error('Error fetching random text:', error);
        return '';
    }
}

async function displayTextForDifficulty(difficulty) {
    currentText = await generateRandomText(difficulty);
    testTextDiv.textContent = currentText;
    inputArea.value = '';
    inputArea.disabled = true;
    wpmDisplay.textContent = 'WPM: 0';
    timerDisplay.textContent = 'Time: 0s';
    tryAgainBtn.classList.add('hidden');
    messageArea.textContent = '';
    testStarted = false;
    errors = 0;
    timeLeft = parseInt(document.getElementById('timer').value, 10);
    pauseTestBtn.style.display = 'none';
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
        pauseTestBtn.style.display = 'none';
        startTestBtn.style.display = 'inline-block';
        messageArea.textContent = 'Test paused.';
    }
});

tryAgainBtn.addEventListener('click', () => {
    displayTextForDifficulty(difficultySelect.value);
    messageArea.textContent = '';
});

window.addEventListener('load', () => {
    displayTextForDifficulty(difficultySelect.value);
    const savedTheme = localStorage.getItem('selectedTheme') || themeSelect.value;
    setTheme(savedTheme);
    themeSelect.value = savedTheme;
    checkUserLoggedIn();
});

const logoutButton = document.getElementById('logout-button');
logoutButton.addEventListener('click', () => {
    localStorage.removeItem('currentUser');
    user = null;
    showAuthSection();
    authMessage.textContent = 'Logged out successfully.';
    inputArea.disabled = true;
    startTestBtn.style.display = 'inline-block';
    pauseTestBtn.style.display = 'none';
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
    pauseTestBtn.style.display = 'inline-block';
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
    pauseTestBtn.style.display = 'none';
}

function highlightText() {
    // Simple highlight logic: could be improved
    // For now, no changes to text highlighting
}

function calculateWPM() {
    const wordsTyped = inputArea.value.trim().split(/\s+/).length;
    const minutes = (parseInt(document.getElementById('timer').value, 10)) / 60;
    return Math.round(wordsTyped / minutes);
}

function saveScore(username, wpm) {
    let leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');
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
    leaderboard.forEach(entry => {
        const li = document.createElement('li');
        li.textContent = `${entry.username} - ${entry.wpm} WPM`;
        leaderboardList.appendChild(li);
    });
}

function setTheme(theme) {
    document.body.classList.remove('theme-male-professional', 'theme-female-kawaii');
    if (theme === 'male-professional') {
        document.body.classList.add('theme-male-professional');
    } else if (theme === 'female-kawaii') {
        document.body.classList.add('theme-female-kawaii');
    }
    localStorage.setItem('selectedTheme', theme);
}

themeSelect.addEventListener('change', (e) => {
    setTheme(e.target.value);
});

function checkUserLoggedIn() {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        user = JSON.parse(storedUser);
        showTypingTestSection();
    } else {
        showAuthSection();
    }
}

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

    if (isLoginMode) {
        // Login logic
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
        // Registration logic
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
