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

// 손글씨 분석 데이터
let strokeData = {
    points: [],
    timestamps: [],
    pressures: [],
    speeds: [],
    accelerations: [],
    jerks: []
};
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
    
    // 새로운 스트로크 시작 - 데이터 초기화
    strokeData = {
        points: [],
        timestamps: [],
        pressures: [],
        speeds: [],
        accelerations: [],
        jerks: []
    };
    
    // 첫 번째 포인트 추가
    const timestamp = Date.now();
    strokeData.points.push({x, y});
    strokeData.timestamps.push(timestamp);
    strokeData.pressures.push(1.0); // 기본 압력값
    
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function draw(e) {
    if (!isDrawing) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 포인트 데이터 수집
    const timestamp = Date.now();
    const prevPoint = strokeData.points[strokeData.points.length - 1];
    
    if (prevPoint) {
        // 거리 계산
        const distance = Math.sqrt((x - prevPoint.x) ** 2 + (y - prevPoint.y) ** 2);
        const timeDiff = timestamp - strokeData.timestamps[strokeData.timestamps.length - 1];
        
        // 속도 계산
        const speed = timeDiff > 0 ? distance / timeDiff : 0;
        strokeData.speeds.push(speed);
        
        // 가속도 계산
        if (strokeData.speeds.length > 1) {
            const prevSpeed = strokeData.speeds[strokeData.speeds.length - 2];
            const acceleration = timeDiff > 0 ? (speed - prevSpeed) / timeDiff : 0;
            strokeData.accelerations.push(acceleration);
        }
        
        // 저크 계산 (가속도의 변화율)
        if (strokeData.accelerations.length > 1) {
            const prevAcceleration = strokeData.accelerations[strokeData.accelerations.length - 2];
            const jerk = timeDiff > 0 ? (strokeData.accelerations[strokeData.accelerations.length - 1] - prevAcceleration) / timeDiff : 0;
            strokeData.jerks.push(jerk);
        }
    }
    
    // 포인트 추가
    strokeData.points.push({x, y});
    strokeData.timestamps.push(timestamp);
    strokeData.pressures.push(1.0); // 기본 압력값
    
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
            const basePercentage = getRandomPercentage(5, 15); // 5-15% 범위
            const adjustedPercentage = adjustPercentageByHandwriting(basePercentage, '낮음');
            showResult(adjustedPercentage, '낮음');
        });
    } else if (clickCount === 2) {
        // 두 번째 클릭: 40% 언저리 결과
        showProgress(5000, () => {
            const basePercentage = getRandomPercentage(35, 45); // 35-45% 범위
            const adjustedPercentage = adjustPercentageByHandwriting(basePercentage, '높음');
            showResult(adjustedPercentage, '높음');
        });
    }
});

// 리셋 버튼 클릭 이벤트
resetBtn.addEventListener('click', function() {
    // 캔버스 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 상태 초기화
    clickCount = 0;
    strokeData = {
        points: [],
        timestamps: [],
        pressures: [],
        speeds: [],
        accelerations: [],
        jerks: []
    };
    
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

// 손글씨 분석을 통한 확률 조정 함수
function adjustPercentageByHandwriting(basePercentage, level) {
    if (strokeData.points.length < 3) {
        return basePercentage; // 데이터가 부족하면 기본값 반환
    }
    
    const analysis = analyzeHandwriting();
    let adjustment = 0;
    
    // 속도 일관성 분석
    if (analysis.speedConsistency < 0.3) {
        adjustment += 15; // 속도가 불규칙하면 위험도 증가
    } else if (analysis.speedConsistency > 0.7) {
        adjustment -= 5; // 속도가 일정하면 위험도 감소
    }
    
    // 선의 직선성 분석
    if (analysis.straightness < 0.4) {
        adjustment += 20; // 선이 삐뚤하면 위험도 증가
    } else if (analysis.straightness > 0.8) {
        adjustment -= 8; // 선이 곧으면 위험도 감소
    }
    
    // 가속도 변동성 분석
    if (analysis.accelerationVariability > 0.6) {
        adjustment += 12; // 가속도가 불규칙하면 위험도 증가
    } else if (analysis.accelerationVariability < 0.2) {
        adjustment -= 3; // 가속도가 일정하면 위험도 감소
    }
    
    // 저크 분석 (손떨림)
    if (analysis.jerkLevel > 0.5) {
        adjustment += 18; // 저크가 높으면 위험도 증가
    } else if (analysis.jerkLevel < 0.1) {
        adjustment -= 5; // 저크가 낮으면 위험도 감소
    }
    
    // 전체적인 안정성
    if (analysis.overallStability < 0.3) {
        adjustment += 25; // 전반적으로 불안정하면 위험도 증가
    } else if (analysis.overallStability > 0.8) {
        adjustment -= 10; // 전반적으로 안정하면 위험도 감소
    }
    
    const adjustedPercentage = Math.max(0, Math.min(100, basePercentage + adjustment));
    return Math.round(adjustedPercentage);
}

// 손글씨 분석 함수
function analyzeHandwriting() {
    const analysis = {
        speedConsistency: 0,
        straightness: 0,
        accelerationVariability: 0,
        jerkLevel: 0,
        overallStability: 0
    };
    
    if (strokeData.speeds.length < 2) {
        return analysis;
    }
    
    // 속도 일관성 계산
    const meanSpeed = strokeData.speeds.reduce((a, b) => a + b, 0) / strokeData.speeds.length;
    const speedVariance = strokeData.speeds.reduce((sum, speed) => sum + Math.pow(speed - meanSpeed, 2), 0) / strokeData.speeds.length;
    const speedStdDev = Math.sqrt(speedVariance);
    analysis.speedConsistency = Math.max(0, 1 - (speedStdDev / (meanSpeed + 0.001))); // 0-1 범위로 정규화
    
    // 선의 직선성 계산 (첫 점과 마지막 점을 잇는 직선과의 편차)
    if (strokeData.points.length > 2) {
        const firstPoint = strokeData.points[0];
        const lastPoint = strokeData.points[strokeData.points.length - 1];
        const totalDistance = Math.sqrt(Math.pow(lastPoint.x - firstPoint.x, 2) + Math.pow(lastPoint.y - firstPoint.y, 2));
        
        if (totalDistance > 0) {
            let totalDeviation = 0;
            for (let i = 1; i < strokeData.points.length - 1; i++) {
                const point = strokeData.points[i];
                const t = i / (strokeData.points.length - 1);
                const expectedX = firstPoint.x + t * (lastPoint.x - firstPoint.x);
                const expectedY = firstPoint.y + t * (lastPoint.y - firstPoint.y);
                const deviation = Math.sqrt(Math.pow(point.x - expectedX, 2) + Math.pow(point.y - expectedY, 2));
                totalDeviation += deviation;
            }
            const avgDeviation = totalDeviation / (strokeData.points.length - 2);
            analysis.straightness = Math.max(0, 1 - (avgDeviation / (totalDistance + 0.001))); // 0-1 범위로 정규화
        }
    }
    
    // 가속도 변동성 계산
    if (strokeData.accelerations.length > 1) {
        const meanAcceleration = strokeData.accelerations.reduce((a, b) => a + b, 0) / strokeData.accelerations.length;
        const accelVariance = strokeData.accelerations.reduce((sum, accel) => sum + Math.pow(accel - meanAcceleration, 2), 0) / strokeData.accelerations.length;
        const accelStdDev = Math.sqrt(accelVariance);
        analysis.accelerationVariability = Math.min(1, accelStdDev / (Math.abs(meanAcceleration) + 0.001)); // 0-1 범위로 정규화
    }
    
    // 저크 레벨 계산
    if (strokeData.jerks.length > 0) {
        const meanJerk = strokeData.jerks.reduce((a, b) => a + b, 0) / strokeData.jerks.length;
        const jerkMagnitude = Math.abs(meanJerk);
        analysis.jerkLevel = Math.min(1, jerkMagnitude / 0.01); // 0-1 범위로 정규화
    }
    
    // 전체적인 안정성 계산 (모든 지표의 가중 평균)
    analysis.overallStability = (
        analysis.speedConsistency * 0.3 +
        analysis.straightness * 0.3 +
        (1 - analysis.accelerationVariability) * 0.2 +
        (1 - analysis.jerkLevel) * 0.2
    );
    
    return analysis;
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
