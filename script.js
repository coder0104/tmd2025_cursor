// DOM 요소들
const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
const analyzeBtn = document.getElementById('analyzeBtn');
const resetBtn = document.getElementById('resetBtn');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const resultContainer = document.getElementById('resultContainer');
const resultPercentage = document.getElementById('resultPercentage');
const resultText = document.getElementById('resultText');
const resultDescription = document.getElementById('resultDescription');

// 캔버스 그리기 상태
let isDrawing = false;
let clickCount = 0;

// 캔버스 초기 설정
ctx.strokeStyle = '#333';
ctx.lineWidth = 3;
ctx.lineCap = 'round';
ctx.lineJoin = 'round';

// 캔버스 그리기 이벤트
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

// 터치 이벤트 (모바일 지원)
canvas.addEventListener('touchstart', handleTouch);
canvas.addEventListener('touchmove', handleTouch);
canvas.addEventListener('touchend', stopDrawing);

function startDrawing(e) {
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function draw(e) {
    if (!isDrawing) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
}

function stopDrawing() {
    isDrawing = false;
    ctx.beginPath();
}

function handleTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 
                                    e.type === 'touchmove' ? 'mousemove' : 'mouseup', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}

// 분석 버튼 클릭 이벤트
analyzeBtn.addEventListener('click', function() {
    clickCount++;
    
    if (clickCount === 1) {
        // 첫 번째 클릭: 10% 언저리 결과
        showProgress(5000, () => {
            const percentage = getRandomPercentage(5, 15); // 5-15% 범위
            showResult(percentage, '낮음');
        });
    } else if (clickCount === 2) {
        // 두 번째 클릭: 40% 언저리 결과
        showProgress(5000, () => {
            const percentage = getRandomPercentage(35, 45); // 35-45% 범위
            showResult(percentage, '높음');
        });
    }
});

// 리셋 버튼 클릭 이벤트
resetBtn.addEventListener('click', function() {
    // 캔버스 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 상태 초기화
    clickCount = 0;
    
    // UI 초기화
    progressContainer.classList.add('hidden');
    resultContainer.classList.add('hidden');
    
    // 버튼 텍스트 초기화
    analyzeBtn.textContent = '분석 시작';
});

// 진행바 표시 함수
function showProgress(duration, callback) {
    progressContainer.classList.remove('hidden');
    resultContainer.classList.add('hidden');
    
    let progress = 0;
    const increment = 100 / (duration / 50); // 50ms마다 업데이트
    
    const interval = setInterval(() => {
        progress += increment;
        progressBar.style.width = Math.min(progress, 100) + '%';
        
        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                progressContainer.classList.add('hidden');
                callback();
            }, 200);
        }
    }, 50);
}

// 랜덤 퍼센트 생성 함수
function getRandomPercentage(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 결과 표시 함수
function showResult(percentage, level) {
    resultContainer.classList.remove('hidden');
    
    // 애니메이션으로 숫자 증가
    animateNumber(0, percentage, 1000, (value) => {
        resultPercentage.textContent = Math.round(value);
    });
    
    resultText.textContent = '치매 가능성';
    
    // 결과에 따른 설명 텍스트
    let description = '';
    if (level === '낮음') {
        description = '현재 상태는 양호합니다. 정기적인 검진을 통해 건강을 유지하세요.';
    } else {
        description = '의료진과 상담을 권장합니다. 조기 발견과 치료가 중요합니다.';
    }
    
    resultDescription.textContent = description;
    
    // 버튼 텍스트 변경
    analyzeBtn.textContent = '다시 분석';
}

// 숫자 애니메이션 함수
function animateNumber(start, end, duration, callback) {
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const current = start + (end - start) * easeOutCubic(progress);
        callback(current);
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// 이징 함수
function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

// 캔버스 크기 조정 (반응형)
function resizeCanvas() {
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth;
    const aspectRatio = 600 / 400;
    
    if (containerWidth < 600) {
        canvas.width = containerWidth - 20;
        canvas.height = (containerWidth - 20) / aspectRatio;
    } else {
        canvas.width = 600;
        canvas.height = 400;
    }
}

// 윈도우 리사이즈 이벤트
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
