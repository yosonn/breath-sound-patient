// === script.js ===

document.addEventListener('DOMContentLoaded', () => {
    // === 1. 初始化變數與 DOM 元素 ===
    let mediaRecorder;
    let audioChunks = [];
    let isRecording = false;
    let recordingStartTime;
    let timerInterval;

    const recordBtn = document.getElementById('record-btn');
    const timerDisplay = document.getElementById('timer-display');
    const visualizer = document.getElementById('visualizer');
    const fileInput = document.getElementById('audio-upload');
    const historyList = document.getElementById('history-list');

    // Chart.js 實例
    let predictionChart;

    // === 2. 初始化 Chart.js 圖表 ===
    function initChart() {
        const ctx = document.getElementById('predictionChart').getContext('2d');
        predictionChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Normal', 'Wheeze', 'Crackles'],
                datasets: [{
                    label: '預測機率 (%)',
                    data: [0, 0, 0], // 初始值
                    backgroundColor: [
                        'rgba(40, 167, 69, 0.7)',  // Normal Green
                        'rgba(255, 193, 7, 0.7)',  // Wheeze Yellow
                        'rgba(220, 53, 69, 0.7)'   // Crackles Red
                    ],
                    borderColor: [
                        '#28a745',
                        '#ffc107',
                        '#dc3545'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    // === 3. 錄音功能實作 ===
    recordBtn.addEventListener('click', async () => {
        if (!isRecording) {
            // 開始錄音
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];

                mediaRecorder.ondataavailable = (event) => {
                    audioChunks.push(event.data);
                };

                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    // TODO: 未來將 audioBlob 上傳至後端 API /api/analyze
                    console.log("錄音完成，準備分析 Blob 大小:", audioBlob.size);
                    simulateAIAnalysis('microphone');
                };

                mediaRecorder.start();
                isRecording = true;
                startTimer();
                updateRecordUI(true);

            } catch (err) {
                alert("無法存取麥克風，請確認權限設定。");
                console.error(err);
            }
        } else {
            // 停止錄音
            mediaRecorder.stop();
            isRecording = false;
            stopTimer();
            updateRecordUI(false);
        }
    });

    function updateRecordUI(recording) {
        if (recording) {
            recordBtn.innerHTML = '<i class="fa-solid fa-stop"></i> 停止錄音';
            recordBtn.classList.remove('btn-primary');
            recordBtn.classList.add('btn-danger');
            visualizer.classList.add('active');
        } else {
            recordBtn.innerHTML = '<i class="fa-solid fa-microphone"></i> 重新錄音';
            recordBtn.classList.remove('btn-danger');
            recordBtn.classList.add('btn-primary');
            visualizer.classList.remove('active');
        }
    }

    // 計時器邏輯
    function startTimer() {
        recordingStartTime = Date.now();
        timerInterval = setInterval(() => {
            const elapsed = Date.now() - recordingStartTime;
            const date = new Date(elapsed);
            const m = date.getMinutes().toString().padStart(2, '0');
            const s = date.getSeconds().toString().padStart(2, '0');
            timerDisplay.textContent = `${m}:${s}`;
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
    }

    // === 4. 檔案上傳功能 ===
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            // TODO: 未來將 file 上傳至後端 API
            console.log("檔案上傳:", file.name);
            
            // 模擬讀取時間
            timerDisplay.textContent = "分析中...";
            setTimeout(() => {
                simulateAIAnalysis('file');
                timerDisplay.textContent = "00:00";
            }, 1500);
        }
    });

    // === 5. 核心：模擬 AI 分析與 UI 更新 ===
    function simulateAIAnalysis(source) {
        // 產生模擬數據 (讓總和接近 100，但不強制，模擬多標籤分類)
        // 這裡我們隨機決定一種情境：正常、輕微異常、嚴重異常
        
        const rand = Math.random();
        let result = {};

        if (rand > 0.6) {
            // 情境 A: 正常
            result = {
                normal: Math.floor(Math.random() * 20 + 80), // 80-99%
                wheeze: Math.floor(Math.random() * 15),      // 0-15%
                crackles: Math.floor(Math.random() * 10)     // 0-10%
            };
        } else if (rand > 0.3) {
            // 情境 B: Wheeze 異常
            result = {
                normal: Math.floor(Math.random() * 30 + 10),
                wheeze: Math.floor(Math.random() * 40 + 50), // 50-90%
                crackles: Math.floor(Math.random() * 20)
            };
        } else {
            // 情境 C: Crackles 異常
            result = {
                normal: Math.floor(Math.random() * 30 + 10),
                wheeze: Math.floor(Math.random() * 20),
                crackles: Math.floor(Math.random() * 40 + 50) // 50-90%
            };
        }

        updateDashboard(result);
        addHistoryRow(result);
    }

    function updateDashboard(data) {
        // 更新數值顯示
        document.getElementById('val-normal').textContent = data.normal + '%';
        document.getElementById('val-wheeze').textContent = data.wheeze + '%';
        document.getElementById('val-crackles').textContent = data.crackles + '%';

        // 更新進度條寬度
        document.querySelector('.fill.normal').style.width = data.normal + '%';
        document.querySelector('.fill.warning').style.width = data.wheeze + '%';
        document.querySelector('.fill.danger').style.width = data.crackles + '%';

        // 更新 Chart.js
        predictionChart.data.datasets[0].data = [data.normal, data.wheeze, data.crackles];
        predictionChart.update();

        // 判斷最高機率類別並更新 Alert Box
        const maxVal = Math.max(data.normal, data.wheeze, data.crackles);
        const alertBox = document.getElementById('alert-box');
        const alertIcon = alertBox.querySelector('.alert-icon i');
        const alertTitle = alertBox.querySelector('h3');
        const alertText = document.getElementById('ai-summary-text');

        // 清除舊 class
        alertBox.classList.remove('alert-normal', 'alert-warning', 'alert-danger');

        if (maxVal === data.normal) {
            alertBox.classList.add('alert-normal');
            alertIcon.className = 'fa-solid fa-circle-check';
            alertTitle.textContent = "目前狀態：正常 (Normal)";
            alertText.textContent = "AI 分析顯示呼吸音平穩，未偵測到明顯異常特徵。建議保持良好作息。";
        } else if (maxVal === data.wheeze) {
            alertBox.classList.add('alert-warning');
            alertIcon.className = 'fa-solid fa-triangle-exclamation';
            alertTitle.textContent = "警示：偵測到喘鳴音 (Wheeze)";
            alertText.textContent = `喘鳴音機率達 ${data.wheeze}%，可能與氣道狹窄或發炎有關。建議持續監測並諮詢醫師。`;
        } else {
            alertBox.classList.add('alert-danger');
            alertIcon.className = 'fa-solid fa-circle-exclamation';
            alertTitle.textContent = "危險：偵測到爆裂音 (Crackles)";
            alertText.textContent = `爆裂音機率達 ${data.crackles}%，此特徵常見於肺炎或肺水腫。請立即匯出報告並就醫檢查。`;
        }
    }

    // === 6. 歷史紀錄表格處理 ===
    // 預設假資料
    const mockHistory = [
        { time: '2025-11-28 09:30', normal: 88, wheeze: 10, crackles: 2, summary: '正常', status: 'normal' },
        { time: '2025-11-27 20:15', normal: 92, wheeze: 5, crackles: 3, summary: '正常', status: 'normal' },
        { time: '2025-11-26 08:45', normal: 45, wheeze: 52, crackles: 3, summary: '喘鳴音偏高', status: 'warning' },
        { time: '2025-11-25 18:20', normal: 85, wheeze: 12, crackles: 3, summary: '正常', status: 'normal' }
    ];

    function renderHistory() {
        historyList.innerHTML = '';
        mockHistory.forEach(item => {
            const row = createRowHTML(item);
            historyList.innerHTML += row;
        });
    }

    function addHistoryRow(data) {
        // 判斷主要類別
        let status = 'normal';
        let summary = '正常';
        const max = Math.max(data.normal, data.wheeze, data.crackles);
        
        if (max === data.wheeze) { status = 'warning'; summary = '喘鳴音偏高'; }
        if (max === data.crackles) { status = 'danger'; summary = '爆裂音異常'; }

        const now = new Date();
        const timeStr = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getDate().toString().padStart(2,'0')} ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;

        const newItem = {
            time: timeStr,
            normal: data.normal,
            wheeze: data.wheeze,
            crackles: data.crackles,
            summary: summary,
            status: status
        };

        // 新增到陣列開頭
        mockHistory.unshift(newItem);
        // 重新渲染表格
        renderHistory();
    }

    function createRowHTML(item) {
        let badgeClass = 'badge-normal';
        let statusText = '健康';

        if (item.status === 'warning') {
            badgeClass = 'badge-warning';
            statusText = '需注意';
        } else if (item.status === 'danger') {
            badgeClass = 'badge-danger';
            statusText = '異常';
        }

        return `
            <tr>
                <td>${item.time}</td>
                <td>${item.normal}%</td>
                <td>${item.wheeze}%</td>
                <td>${item.crackles}%</td>
                <td>${item.summary}</td>
                <td>系統建議持續追蹤</td>
                <td><span class="badge ${badgeClass}">${statusText}</span></td>
            </tr>
        `;
    }

    // 全域函數供按鈕使用
    window.exportData = function() {
        alert("已匯出 PDF 報告 (模擬功能)");
    };

    // === 7. 啟動初始化 ===
    initChart();
    renderHistory();
});
