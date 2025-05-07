const messageArea = document.getElementById('message-area');

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
}

difficultySelect.addEventListener('change', async (e) => {
    const newDifficulty = e.target.value;
    if (testStarted) {
        const confirmChange = confirm('Changing difficulty will reset the current test. Do you want to continue?');
        if (!confirmChange) {
            // Revert to previous difficulty
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

function endTest() {
    testStarted = false;
    inputArea.disabled = true;
    clearInterval(intervalId);
    highlightText();
    wpmDisplay.textContent = `WPM: ${calculateWPM()}`;
    if (errors === 0) {
        victorySound.play();
        messageArea.textContent = '🎉 Congratulations! Perfect typing! 🎉';
        messageArea.style.color = '#28a745';
    } else {
        messageArea.textContent = 'Test completed! Try again to improve your score.';
        messageArea.style.color = '#007bff';
    }
    tryAgainBtn.classList.remove('hidden');
    saveScore(user.username, calculateWPM());
    loadLeaderboard();
}

tryAgainBtn.addEventListener('click', () => {
    displayTextForDifficulty(difficultySelect.value);
    messageArea.textContent = '';
});

window.addEventListener('load', () => {
    displayTextForDifficulty(difficultySelect.value);
});

