document.addEventListener('DOMContentLoaded', () => {
    const englishWordsList = document.getElementById('english-words');
    const chineseWordsList = document.getElementById('chinese-words');
    const timerDisplay = document.getElementById('timer');
    const startButton = document.getElementById('start-button');
    const messageDisplay = document.getElementById('message');
    const accuracyDisplay = document.getElementById('accuracy');
    const wordFileInput = document.getElementById('word-file');

    let timerInterval;
    let timeLeft = 60;
    let selectedEnglish = null;
    let selectedChinese = null;
    let allWords = [];
    let displayedWords = [];
    let matchedWords = [];
    let currentWordIndex = 0;
    let clickCount = 0;
    let correctMatchCount = 0;

    let initialWords = []; // 移除预设单词数据

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function getUnusedWords() {
        return allWords.filter(word => !matchedWords.some(match => match.en === word.en));
    }

    function getNext5Words() {
        const nextWords = allWords.slice(currentWordIndex, currentWordIndex + 5);
        currentWordIndex += 5;
        return nextWords;
    }

    function updateDisplayedWords() {
        const englishWords = displayedWords.map(pair => pair.en);
        const chineseWords = displayedWords.map(pair => pair.cn);
        shuffleArray(chineseWords);

        englishWordsList.innerHTML = englishWords.map(word => `<li data-word="${word}">${word}</li>`).join('');
        chineseWordsList.innerHTML = chineseWords.map(word => `<li data-word="${word}">${word}</li>`).join('');

        englishWordsList.querySelectorAll('li').forEach(item => {
            item.addEventListener('click', selectEnglishWord);
        });

        chineseWordsList.querySelectorAll('li').forEach(item => {
            item.addEventListener('click', selectChineseWord);
        });
    }

    function selectEnglishWord(event) {
        if (!timerInterval) return;
        if (selectedEnglish) {
            selectedEnglish.classList.remove('selected');
        }
        selectedEnglish = event.target;
        selectedEnglish.classList.add('selected');
        checkMatch();
    }

    function selectChineseWord(event) {
        if (!timerInterval) return;
        if (selectedChinese) {
            selectedChinese.classList.remove('selected');
        }
        selectedChinese = event.target;
        selectedChinese.classList.add('selected');
        checkMatch();
    }

    function checkMatch() {
        if (selectedEnglish && selectedChinese) {
            clickCount++;

            const englishWord = selectedEnglish.dataset.word;
            const chineseWord = selectedChinese.dataset.word;

            const correctPair = displayedWords.find(pair => pair.en === englishWord && pair.cn === chineseWord);

            if (correctPair) {
                selectedEnglish.style.backgroundColor = 'lightgreen';
                selectedChinese.style.backgroundColor = 'lightgreen';

                matchedWords.push(correctPair);

                selectedEnglish.removeEventListener('click', selectEnglishWord);
                selectedChinese.removeEventListener('click', selectChineseWord);

                selectedEnglish = null;
                selectedChinese = null;

                correctMatchCount++;

                if (matchedWords.length % 5 === 0) {
                    if (currentWordIndex < allWords.length) {
                        displayedWords = getNext5Words();
                        updateDisplayedWords();
                    } else {
                        endGame("恭喜你！全部匹配成功！");
                    }
                }

                if (matchedWords.length === allWords.length) {
                    endGame("恭喜你！全部匹配成功！");
                }
            } else {
                selectedEnglish.classList.add('wrong');
                selectedChinese.classList.add('wrong');
                setTimeout(() => {
                    if (selectedEnglish) {
                        selectedEnglish.classList.remove('wrong');
                    }
                    if (selectedChinese) {
                        selectedChinese.classList.remove('wrong');
                    }
                    selectedEnglish = null;
                    selectedChinese = null;
                }, 500);
            }
        }
    }

    function updateTimer() {
        timeLeft--;
        timerDisplay.textContent = timeLeft;
        if (timeLeft <= 0) {
            endGame("时间到！");
        }
    }

    function startGame() {
        timeLeft = 60;
        timerDisplay.textContent = timeLeft;
        messageDisplay.textContent = '';
        selectedEnglish = null;
        selectedChinese = null;
        allWords = [...initialWords];
        matchedWords = [];
        displayedWords = [];
        currentWordIndex = 0;
        clickCount = 0;
        correctMatchCount = 0;

        shuffleArray(allWords);

        if (allWords.length < 5) {
            messageDisplay.textContent = "可用单词少于 5 组，请上传包含单词数据的文本文件。";
            startButton.disabled = true;
            startButton.style.backgroundColor = '#ccc';
            startButton.style.cursor = 'not-allowed';
            return;
        }

        displayedWords = getNext5Words();
        updateDisplayedWords();
        timerInterval = setInterval(updateTimer, 1000);
        startButton.disabled = true;
    }

    function endGame(message) {
        clearInterval(timerInterval);
        timerInterval = null;

        const accuracy = clickCount > 0 ? Math.round((correctMatchCount / clickCount) * 100) : 0;
        messageDisplay.textContent = `正确率：${accuracy}%`;

        englishWordsList.innerHTML = '';
        chineseWordsList.innerHTML = '';

        startButton.disabled = false;
    }

    function parseTxt(fileContent) {
        const lines = fileContent.split('\n');
        return lines.map(line => {
            const parts = line.split(/\s+/);
            return { en: parts[0], cn: parts[1] };
        }).filter(word => word.en && word.cn);
    }

    function parseCsv(fileContent) {
        const lines = fileContent.split('\n');
        return lines.map(line => {
            const parts = line.split(',');
            return { en: parts[0], cn: parts[1] };
        }).filter(word => word.en && word.cn);
    }

    wordFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const fileContent = e.target.result;
                let words = [];
                if (file.name.endsWith('.txt')) {
                    words = parseTxt(fileContent);
                } else if (file.name.endsWith('.csv')) {
                    words = parseCsv(fileContent);
                } else {
                    messageDisplay.textContent = "不支持的文件格式，请上传 .txt 或 .csv 文件。";
                    return;
                }

                if (words.length > 0 && words.every(word => word.en && word.cn)) {
                    initialWords = words;
                    startGame();
                } else {
                    messageDisplay.textContent = "文件格式错误，请上传包含正确单词数据的文本文件。";
                }
            };
            reader.readAsText(file);
        }
    });

    startButton.addEventListener('click', startGame);

    messageDisplay.textContent = "请上传单词文件";
    startButton.disabled = true;
    startButton.style.backgroundColor = '#ccc';
    startButton.style.cursor = 'not-allowed';
});