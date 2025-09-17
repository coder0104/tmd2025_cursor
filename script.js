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
const resourcesSection = document.getElementById('resourcesSection');
const resourcesList = document.getElementById('resourcesList');
const trendSection = document.getElementById('trendSection');
const trendCanvas = document.getElementById('trendChart');
const exportHistoryBtn = document.getElementById('exportHistoryBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

// 캔버스 그리기 상태
let isDrawing = false;
let clickCount = 0;
let trendChartInstance = null;

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
    
    resultText.textContent = '경도인지장애(MCI) 가능성';
    
    // 결과에 따른 설명 텍스트
    let description = '';
    if (level === '낮음') {
        description = '현재 상태는 양호합니다. 정기적인 검진을 통해 건강을 유지하세요.';
    } else {
        description = '의료진과 상담을 권장합니다. 조기 발견과 치료가 중요합니다.';
    }
    
    resultDescription.textContent = description;
    
    // 리소스 표시
    renderResources(level);
    
    // 이력 저장 및 차트 업데이트
    saveHistory({
        timestamp: new Date().toISOString(),
        percentage,
        level
    });
    renderTrendChart();
    
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

// 도움 리소스 데이터
const SUPPORT_RESOURCES = [
    {
        label: '보건복지부 보건복지상담센터',
        phone: '129',
        url: 'https://www.mohw.go.kr',
        note: '24시간 상담 (국번없이 129)'
    },
    {
        label: '치매상담콜센터',
        phone: '1899-9988',
        url: 'https://www.nid.or.kr',
        note: '국가치매관리사업 안내'
    },
    {
        label: '중앙치매센터',
        phone: '02-719-7575',
        url: 'https://www.nid.or.kr/info/dementia_info_list.aspx',
        note: '치매 정보/지원 서비스'
    },
    {
        label: '치매안심센터 안내',
        phone: null,
        url: 'https://www.nid.or.kr/info/dementia_safe_center_list.aspx',
        note: '지역별 치매안심센터 찾기'
    },
    {
        label: '정신건강위기 상담전화',
        phone: '1577-0199',
        url: 'https://www.mentalhealth.go.kr',
        note: '자살예방·정신건강 위기 지원'
    }
];

function renderResources(level) {
    if (!resourcesSection || !resourcesList) return;
    resourcesList.innerHTML = '';
    
    SUPPORT_RESOURCES.forEach((item) => {
        const li = document.createElement('li');
        const left = document.createElement('div');
        const right = document.createElement('div');
        left.className = 'label';
        right.className = 'meta';

        left.textContent = item.label;

        const parts = [];
        if (item.phone) {
            const phoneLink = document.createElement('a');
            phoneLink.href = `tel:${item.phone.replace(/[^0-9]/g, '')}`;
            phoneLink.textContent = item.phone;
            parts.push(phoneLink);
        }
        if (item.url) {
            const urlLink = document.createElement('a');
            urlLink.href = item.url;
            urlLink.target = '_blank';
            urlLink.rel = 'noopener noreferrer';
            urlLink.textContent = '웹사이트';
            parts.push(urlLink);
        }

        const note = document.createElement('span');
        note.textContent = item.note ? ` · ${item.note}` : '';

        parts.forEach((el, idx) => {
            if (idx > 0) {
                const sep = document.createElement('span');
                sep.textContent = ' | ';
                right.appendChild(sep);
            }
            right.appendChild(el);
        });
        right.appendChild(note);

        li.appendChild(left);
        li.appendChild(right);
        resourcesList.appendChild(li);
    });

    resourcesSection.style.display = 'block';
}

// ----- 추이: 로컬스토리지 이력 관리 -----
const HISTORY_KEY = 'mci_history_v1';

// 초기 이력 시드 (비어있을 때만 1회 주입)
function daysAgoISO(days) {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - days);
    return d.toISOString();
}

function seedHistoryIfEmpty() {
    const existing = loadHistory();
    if (existing.length > 0) return;
    const seed = [
        { timestamp: daysAgoISO(28), percentage: 56, level: '낮음' },
        { timestamp: daysAgoISO(21), percentage: 63,  level: '낮음' },
        { timestamp: daysAgoISO(14), percentage: 43, level: '낮음' },
        { timestamp: daysAgoISO(7),  percentage: 57, level: '높음' },
        { timestamp: daysAgoISO(3),  percentage: 44, level: '높음' }
    ];
    localStorage.setItem(HISTORY_KEY, JSON.stringify(seed));
}

function loadHistory() {
    try {
        const raw = localStorage.getItem(HISTORY_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        return [];
    }
}

function saveHistory(entry) {
    const history = loadHistory();
    history.push(entry);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function clearHistory() {
    localStorage.removeItem(HISTORY_KEY);
}

function formatDateLabel(isoString) {
    const d = new Date(isoString);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${mm}/${dd} ${hh}:${mi}`;
}

function renderTrendChart() {
    if (!trendCanvas || !window.Chart) return;
    const history = loadHistory();
    const labels = history.map(h => formatDateLabel(h.timestamp));
    const data = history.map(h => h.percentage);
    
    if (trendChartInstance) {
        trendChartInstance.data.labels = labels;
        trendChartInstance.data.datasets[0].data = data;
        trendChartInstance.update();
        return;
    }
    
    trendChartInstance = new Chart(trendCanvas, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'MCI 가능성(%)',
                data,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102,126,234,0.15)',
                fill: true,
                tension: 0.3,
                pointRadius: 3,
                pointBackgroundColor: '#667eea'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true }
            },
            scales: {
                y: { beginAtZero: true, max: 100, ticks: { stepSize: 10 } }
            }
        }
    });
}

// 초기 렌더
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        seedHistoryIfEmpty();
        renderTrendChart();
    });
} else {
    seedHistoryIfEmpty();
    renderTrendChart();
}

// 컨트롤 버튼 이벤트
if (exportHistoryBtn) {
    exportHistoryBtn.addEventListener('click', () => {
        const history = loadHistory();
        const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        a.href = url;
        a.download = `mci_history_${y}${m}${d}.json`;
        a.click();
        URL.revokeObjectURL(url);
    });
}

if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', () => {
        if (!confirm('저장된 이력을 모두 삭제할까요?')) return;
        clearHistory();
        if (trendChartInstance) {
            trendChartInstance.data.labels = [];
            trendChartInstance.data.datasets[0].data = [];
            trendChartInstance.update();
        }
    });
}
