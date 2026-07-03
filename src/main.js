/**
 * CivicPulse AI - Main Controller
 * Orchestrates navigation, simulation events, AI conversational UI, terminal logs, and system settings.
 */

import { initCharts, updateCharts, redrawChartsForTheme } from './charts.js';
import { setPolicy, resetPolicies, getActivePolicies, calculateMetrics, generateSimulationSummary } from './simulator.js';
import { queryAI } from './ai.js';
import { getAnomalies, getAnomalyPenalies, executePlaybook, addAnomaly, resetAnomalies, spawnRandomAnomaly } from './automation.js';
import { DOCUMENTS } from './data.js';

// Cache active Chart instances
let activeCharts = null;
let currentActiveAnomalyId = null;
let liveHeartbeatOffsets = { mobility: 0, emissions: 0, energy: 0, safety: 0, citizen: 0 };

// Initialize app on DOM load
document.addEventListener('DOMContentLoaded', () => {
    // 1. Navigation Routing
    initNavigation();

    // 2. Initialize Charts
    activeCharts = initCharts();

    // 3. Theme Setup
    initTheme();

    // 4. Load Saved API Configs
    loadSavedSettings();

    // 5. Connect Simulator Controls
    initSimulator();

    // 6. Connect Chat controls
    initChat();

    // 7. Connect Automation controls
    initAutomation();

    // 8. Connect Data Explorer controls
    initDataExplorer();

    // 9. Run initial state calculation
    updateGlobalState();

    // 10. Start simulation clock
    startClock();

    // 11. Initialize Telemetry feed
    initTelemetryFeed();

    // 12. Start live metrics heartbeat
    startLiveMetricsHeartbeat();

    // 13. Start background alert spawner
    startAlertSpawner();
});

/* ==========================================================================
   1. NAVIGATION & ROUTING
   ========================================================================== */
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    const pageTitle = document.getElementById('page-title');

    // Sidebar navigation clicks
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = item.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // Handle cross-tab links (e.g. "Manage Alerts" link on dashboard)
    document.addEventListener('click', (e) => {
        const link = e.target.closest('[data-tab-go]');
        if (link) {
            e.preventDefault();
            const tabId = link.getAttribute('data-tab-go');
            switchTab(tabId);
        }
    });
}

function switchTab(tabId) {
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    const pageTitle = document.getElementById('page-title');

    navItems.forEach(nav => nav.classList.remove('active'));
    tabContents.forEach(tab => tab.classList.remove('active'));

    const activeNav = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
    const activeTab = document.getElementById(`${tabId}-tab`);

    if (activeNav && activeTab) {
        activeNav.classList.add('active');
        activeTab.classList.add('active');
        
        // Update header title
        const titles = {
            'dashboard': 'Executive Dashboard',
            'simulator': 'Predictive Scenario Simulator',
            'chat': 'AI Civic Analytics Assistant',
            'automation': 'Orchestration & Automation Hub',
            'data-explorer': 'Vector RAG Document Center',
            'settings': 'Platform Configurations'
        };
        pageTitle.textContent = titles[tabId] || 'Decision Platform';
    }
}

/* ==========================================================================
   2. DYNAMIC APP CLOCK
   ========================================================================== */
function startClock() {
    const timeSpan = document.getElementById('simulation-time');
    
    // Updates simulation clock every few seconds to represent a dynamic city state
    setInterval(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        if (timeSpan) {
            timeSpan.textContent = `${year}-${month}-${day} ${hours}:${minutes}`;
        }
    }, 5000);
}

/* ==========================================================================
   3. SIMULATOR & GLOBAL STATE SYNCHRONIZATION
   ========================================================================== */
function initSimulator() {
    const switches = ['signals', 'transit', 'solar', 'greenery', 'crisis'];
    
    switches.forEach(sw => {
        const input = document.getElementById(`policy-${sw}`);
        if (input) {
            input.addEventListener('change', () => {
                setPolicy(sw, input.checked);
                updateGlobalState();
            });
        }
    });

    const resetBtn = document.getElementById('reset-policies-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            resetPolicies();
            switches.forEach(sw => {
                const input = document.getElementById(`policy-${sw}`);
                if (input) input.checked = false;
            });
            updateGlobalState();
        });
    }

    // Connect mini actions on dashboard
    const actionSignal = document.getElementById('quick-action-signal');
    if (actionSignal) {
        actionSignal.addEventListener('click', () => {
            const input = document.getElementById('policy-signals');
            if (input) {
                input.checked = true;
                setPolicy('signals', true);
                updateGlobalState();
                switchTab('simulator');
            }
        });
    }

    const actionSolar = document.getElementById('quick-action-solar');
    if (actionSolar) {
        actionSolar.addEventListener('click', () => {
            const input = document.getElementById('policy-solar');
            if (input) {
                input.checked = true;
                setPolicy('solar', true);
                updateGlobalState();
                switchTab('simulator');
            }
        });
    }
}

/**
 * Calculates current metrics (Policies + Active Anomalies penalties),
 * updates KPI cards, refreshes charts, and generates summaries.
 */
export function updateGlobalState() {
    // 1. Fetch simulator baseline adjustments
    const baseSimulated = calculateMetrics();

    // 2. Fetch penalties from active unresolved anomalies
    const penalties = getAnomalyPenalies();

    // 3. Composite final values (incorporating live heartbeat offsets)
    const finalMetrics = {
        mobility: Math.max(10, Math.min(99, baseSimulated.mobility + penalties.mobility + (liveHeartbeatOffsets.mobility || 0))),
        emissions: Math.max(15, Math.min(250, baseSimulated.emissions + penalties.emissions + (liveHeartbeatOffsets.emissions || 0))),
        energy: Math.max(10, Math.min(99, baseSimulated.energy + penalties.energy + (liveHeartbeatOffsets.energy || 0))),
        safety: Math.max(10, Math.min(99, baseSimulated.safety + penalties.safety + (liveHeartbeatOffsets.safety || 0))),
        citizen: Math.max(10, Math.min(99, baseSimulated.citizen + penalties.citizen + (liveHeartbeatOffsets.citizen || 0))),
        mobilitySub: baseSimulated.mobilitySub,
        emissionsSub: baseSimulated.emissionsSub,
        energySub: baseSimulated.energySub,
        safetySub: baseSimulated.safetySub,
        citizenSub: baseSimulated.citizenSub
    };

    // Re-verify emission label if penalized AQI is higher
    if (finalMetrics.emissions > 100) finalMetrics.emissionsSub = "Unhealthy Alert";
    else if (finalMetrics.emissions > 50) finalMetrics.emissionsSub = "Moderate";
    
    // 4. Update KPI stat cards on Dashboard
    document.getElementById('stat-val-mobility').textContent = `${finalMetrics.mobility}%`;
    document.getElementById('stat-sub-mobility').textContent = finalMetrics.mobilitySub;
    updateTrendArrow('mobility', finalMetrics.mobility - 72);

    document.getElementById('stat-val-emissions').textContent = `${finalMetrics.emissions} AQI`;
    const emissionsSubEl = document.getElementById('stat-sub-emissions');
    emissionsSubEl.textContent = finalMetrics.emissionsSub;
    // Set dynamic text color classes
    emissionsSubEl.className = finalMetrics.emissions <= 50 ? 'status-good' : (finalMetrics.emissions <= 100 ? 'status-warn' : 'status-danger');
    updateTrendArrow('emissions', 45 - finalMetrics.emissions); // Positive means drop in AQI (which is good)

    document.getElementById('stat-val-energy').textContent = `${finalMetrics.energy}%`;
    document.getElementById('stat-sub-energy').textContent = finalMetrics.energySub;
    updateTrendArrow('energy', finalMetrics.energy - 86);

    document.getElementById('stat-val-safety').textContent = `${finalMetrics.safety}%`;
    document.getElementById('stat-sub-safety').textContent = finalMetrics.safetySub;
    updateTrendArrow('safety', finalMetrics.safety - 94);

    document.getElementById('stat-val-citizen').textContent = `${finalMetrics.citizen}%`;
    document.getElementById('stat-sub-citizen').textContent = finalMetrics.citizenSub;
    updateTrendArrow('citizen', finalMetrics.citizen - 81);

    // 5. Update Charts
    updateCharts(finalMetrics, getActivePolicies());

    // 6. Update Simulator outcomes progress indicators
    updateSimulatorResults(finalMetrics);

    // 7. Update active scenario header label
    updateActiveScenarioLabel();

    // 8. Re-render anomalies widgets
    renderAnomalies();
}

function updateTrendArrow(metricId, delta) {
    const trendSpan = document.getElementById(`stat-trend-${metricId}`);
    if (!trendSpan) return;

    if (delta > 0) {
        trendSpan.className = "stat-trend trend-up";
        trendSpan.innerHTML = `<i class="fa-solid fa-caret-up"></i> +${Math.round(delta * 10) / 10}%`;
    } else if (delta < 0) {
        trendSpan.className = "stat-trend trend-down";
        trendSpan.innerHTML = `<i class="fa-solid fa-caret-down"></i> ${Math.round(delta * 10) / 10}%`;
    } else {
        trendSpan.className = "stat-trend neutral";
        trendSpan.innerHTML = `<i class="fa-solid fa-minus"></i> Stable`;
    }
}

function updateSimulatorResults(metrics) {
    const deltaMob = metrics.mobility - 72;
    const deltaEm = 45 - metrics.emissions;
    const deltaEn = metrics.energy - 86;
    const deltaCit = metrics.citizen - 81;

    setProgressBar('mobility', deltaMob, 72);
    setProgressBar('emissions', deltaEm, 45);
    setProgressBar('energy', deltaEn, 86);
    setProgressBar('citizen', deltaCit, 81);

    // Update AI text report
    const summaryContainer = document.getElementById('sim-ai-summary');
    if (summaryContainer) {
        summaryContainer.innerHTML = generateSimulationSummary(metrics);
    }
}

function setProgressBar(id, delta, base) {
    const label = document.getElementById(`sim-delta-${id}`);
    const bar = document.getElementById(`bar-${id}`);
    if (!label || !bar) return;

    // Format output
    if (delta > 0) {
        label.className = "val better";
        label.textContent = `+${Math.round(delta * 10) / 10}%`;
    } else if (delta < 0) {
        label.className = "val worse";
        label.textContent = `${Math.round(delta * 10) / 10}%`;
    } else {
        label.className = "val neutral";
        label.textContent = "0%";
    }

    // Progress bar width from 10% to 100%
    const currentPercent = base + delta;
    bar.style.width = `${Math.max(10, Math.min(100, currentPercent))}%`;
}

function updateActiveScenarioLabel() {
    const policies = getActivePolicies();
    const activeList = Object.keys(policies).filter(k => policies[k]);
    const label = document.getElementById('current-scenario-name');

    if (activeList.includes('crisis')) {
        label.textContent = "Crisis Operations";
        label.style.color = "var(--color-mobility)";
    } else if (activeList.length === 0) {
        label.textContent = "Baseline City";
        label.style.color = "var(--color-primary)";
    } else {
        label.textContent = `Policy Mix (${activeList.length})`;
        label.style.color = "var(--color-environment)";
    }
}

/* ==========================================================================
   4. AI CONVERSATIONAL ASSISTANT (CHAT)
   ========================================================================== */
function initChat() {
    const sendBtn = document.getElementById('chat-send-btn');
    const input = document.getElementById('chat-user-input');
    const clearBtn = document.getElementById('clear-chat-btn');
    const chatContainer = document.getElementById('chat-messages-container');

    if (sendBtn && input) {
        sendBtn.addEventListener('click', handleUserMessage);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleUserMessage();
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            chatContainer.innerHTML = `
                <div class="message system-msg">
                    <div class="msg-content">
                        Chat history cleared. I am ready for new civic queries.
                    </div>
                </div>
            `;
            // Clear RAG panel
            updateRAGVisualizer([], false);
        });
    }

    // Connect quick queries click
    document.querySelectorAll('.quick-query-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (input) {
                input.value = btn.textContent;
                handleUserMessage();
            }
        });
    });
}

async function handleUserMessage() {
    const input = document.getElementById('chat-user-input');
    const chatContainer = document.getElementById('chat-messages-container');
    const query = input.value.trim();

    if (!query) return;

    // 1. Add User Bubble
    appendMessage(query, 'user', 'You');
    input.value = '';

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // 2. Add Typing Indicator
    const typingId = appendTypingIndicator();
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // 3. Gather options
    const isLiveMode = document.getElementById('toggle-live-api').checked;
    const apiKey = document.getElementById('gemini-api-key').value;
    const model = document.getElementById('gemini-model-select').value;
    
    // Get actual current composite metrics
    const simulated = calculateMetrics();
    const penalties = getAnomalyPenalies();
    const compositeMetrics = {
        mobility: simulated.mobility + penalties.mobility,
        emissions: simulated.emissions + penalties.emissions,
        energy: simulated.energy + penalties.energy,
        safety: simulated.safety + penalties.safety,
        citizen: simulated.citizen + penalties.citizen,
        mobilitySub: simulated.mobilitySub,
        emissionsSub: simulated.emissionsSub,
        energySub: simulated.energySub,
        safetySub: simulated.safetySub,
        citizenSub: simulated.citizenSub
    };

    // 4. Query AI Layer
    const result = await queryAI(query, {
        metrics: compositeMetrics,
        policies: getActivePolicies(),
        documents: DOCUMENTS,
        apiKey: apiKey,
        model: model,
        isLiveMode: isLiveMode
    });

    // 5. Remove typing indicator
    removeTypingIndicator(typingId);

    // 6. Append Empty AI Message and Stream text
    const aiMsgId = appendEmptyMessage('ai', isLiveMode && apiKey ? 'Gemini Live' : 'AI Core');
    const bubble = document.querySelector(`#${aiMsgId} .msg-bubble`);
    
    await streamResponseText(bubble, result.answer, chatContainer);

    // 7. Render inline charts if triggered
    if (result.chartToRender) {
        appendInlineChartToBubble(aiMsgId, result.chartToRender, compositeMetrics);
    }

    // 8. Update RAG Visualizer
    updateRAGVisualizer(result.ragChunks, result.ragChunks.length > 0);

    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function appendMessage(text, sender, senderName, isMarkdown = false) {
    const chatContainer = document.getElementById('chat-messages-container');
    const msgId = `msg-${Date.now()}`;
    
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;
    msgDiv.id = msgId;

    let contentHtml = text;
    if (isMarkdown) {
        contentHtml = formatMarkdownToHTML(text);
    }

    msgDiv.innerHTML = `
        <div class="message-sender">${senderName}</div>
        <div class="msg-bubble">${contentHtml}</div>
    `;

    chatContainer.appendChild(msgDiv);
    return msgId;
}

function appendEmptyMessage(sender, senderName) {
    const chatContainer = document.getElementById('chat-messages-container');
    const msgId = `msg-${Date.now()}`;
    
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;
    msgDiv.id = msgId;
    msgDiv.innerHTML = `
        <div class="message-sender">${senderName}</div>
        <div class="msg-bubble"></div>
    `;

    chatContainer.appendChild(msgDiv);
    return msgId;
}

function streamResponseText(bubbleElement, fullText, scrollContainer) {
    return new Promise((resolve) => {
        const words = fullText.split(' ');
        let currentText = "";
        let index = 0;
        
        const intervalId = setInterval(() => {
            if (index < words.length) {
                // Ensure element still exists in DOM (has not been cleared)
                if (!bubbleElement || !bubbleElement.parentNode) {
                    clearInterval(intervalId);
                    resolve();
                    return;
                }
                currentText += (index === 0 ? "" : " ") + words[index];
                bubbleElement.innerHTML = formatMarkdownToHTML(currentText);
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
                index++;
            } else {
                clearInterval(intervalId);
                resolve();
            }
        }, 30); // 30ms per word typing speed
    });
}

// Real-time sensor messages database
const SENSOR_MESSAGES = [
    { text: "Traffic sensor S-342 (Route 9): flow volume", getVal: () => `${Math.round(20 + Math.random() * 60)}%` },
    { text: "Air sensor S-821 (Sector 5): PM2.5 concentrations", getVal: () => `${Math.round(25 + Math.random() * 45)} ppm` },
    { text: "Solar INV-4 (Admin Building): electrical generation", getVal: () => `${(2.5 + Math.random() * 8.5).toFixed(1)} kW` },
    { text: "Battery reserve B-12 (Substation 4B): load level", getVal: () => `${Math.round(55 + Math.random() * 43)}%` },
    { text: "Traffic camera CAM-4 (High St): average speed", getVal: () => `${Math.round(30 + Math.random() * 35)} km/h` },
    { text: "Water level sensor W-21 (Drainage corridor): depth", getVal: () => `${(0.04 + Math.random() * 0.14).toFixed(2)} m` },
    { text: "Grid substation Sub-8 (Industrial): power draw", getVal: () => `${(10.2 + Math.random() * 8.2).toFixed(1)} MW` },
    { text: "Loop detector L-94 (Cross-street 4): flow index", getVal: () => `${Math.round(8 + Math.random() * 40)} veh/min` },
    { text: "Building HVAC filtration (Sector 5): filter status", getVal: () => "NORMAL", status: "normal" },
    { text: "Emergency unit dispatch (Substation 2): backup mode", getVal: () => "STANDBY", status: "normal" }
];

function initTelemetryFeed() {
    const listEl = document.getElementById('live-telemetry-list');
    if (!listEl) return;
    
    // Add 4 initial random lines
    for (let i = 0; i < 4; i++) {
        appendTelemetryLine();
    }
    
    // Ticker to append a new line periodically
    setInterval(() => {
        appendTelemetryLine();
    }, 2500);
}

function appendTelemetryLine() {
    const listEl = document.getElementById('live-telemetry-list');
    if (!listEl) return;
    
    const msg = SENSOR_MESSAGES[Math.floor(Math.random() * SENSOR_MESSAGES.length)];
    const val = msg.getVal();
    
    let statusClass = "normal";
    if (msg.status) {
        statusClass = msg.status;
    } else {
        // Classify value dynamically
        if (val.includes('%')) {
            const num = parseInt(val);
            statusClass = num > 75 ? "warn" : "normal";
        } else if (val.includes('ppm')) {
            const num = parseInt(val);
            statusClass = num > 60 ? "warn" : "normal";
        } else if (val.includes('m') && !val.includes('MW') && !val.includes('km')) {
            const num = parseFloat(val);
            statusClass = num > 0.13 ? "warn" : "normal";
        }
    }
    
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    const lineDiv = document.createElement('div');
    lineDiv.className = 'telemetry-line';
    lineDiv.innerHTML = `
        <span class="telemetry-time">[${timeStr}]</span>
        <span class="telemetry-text">${msg.text}</span>
        <span class="telemetry-value ${statusClass}">${val}</span>
    `;
    
    // Prepend to top
    listEl.insertBefore(lineDiv, listEl.firstChild);
    
    // Cap log lines
    while (listEl.children.length > 12) {
        listEl.removeChild(listEl.lastChild);
    }
}

function startLiveMetricsHeartbeat() {
    setInterval(() => {
        // Add random micro fluctuations to city metrics
        liveHeartbeatOffsets.mobility = (Math.random() - 0.5) * 1.6;
        liveHeartbeatOffsets.emissions = Math.round((Math.random() - 0.5) * 4);
        liveHeartbeatOffsets.energy = (Math.random() - 0.5) * 1.4;
        liveHeartbeatOffsets.safety = (Math.random() - 0.5) * 0.8;
        liveHeartbeatOffsets.citizen = (Math.random() - 0.5) * 1.2;
        
        updateGlobalState();
    }, 3000);
}

function startAlertSpawner() {
    // Check every 45 seconds to see if alert spawner is enabled and spawn an anomaly
    setInterval(() => {
        const toggleSpawner = document.getElementById('toggle-alert-spawner');
        if (toggleSpawner && !toggleSpawner.checked) return;
        
        // Spawn
        const newAnomaly = spawnRandomAnomaly();
        
        // Sound and toast
        playDynamicAlertTone(newAnomaly.priority);
        showToastNotification(newAnomaly);
        
        // Refresh dashboard metrics immediately
        updateGlobalState();
    }, 45000);
}

function playDynamicAlertTone(priority) {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        if (priority === 'critical') {
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
            oscillator.frequency.setValueAtTime(554.37, audioCtx.currentTime + 0.12); // C#5
            oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.24); // E5
            
            gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
            
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.5);
        } else {
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
            oscillator.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
            
            gainNode.gain.setValueAtTime(0.04, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
            
            oscillator.start(audioCtx.currentTime);
            oscillator.stop(audioCtx.currentTime + 0.35);
        }
    } catch (e) {
        console.warn("Web Audio chime blocked/unavailable:", e);
    }
}

function showToastNotification(anomaly) {
    const container = document.getElementById('toast-alerts-container');
    if (!container) return;
    
    const toastId = `toast-${Date.now()}`;
    const toastDiv = document.createElement('div');
    toastDiv.className = `toast-alert ${anomaly.priority}`;
    toastDiv.id = toastId;
    
    const iconHTML = anomaly.priority === 'critical' ? 
        '<i class="fa-solid fa-triangle-exclamation"></i>' : 
        (anomaly.priority === 'warning' ? '<i class="fa-solid fa-circle-exclamation"></i>' : '<i class="fa-solid fa-circle-info"></i>');
    
    toastDiv.innerHTML = `
        <div class="toast-alert-icon">${iconHTML}</div>
        <div class="toast-alert-content">
            <h4>[NEW REPORT] ${anomaly.title}</h4>
            <p>${anomaly.description}</p>
        </div>
        <button class="toast-alert-close" onclick="document.getElementById('${toastId}').remove()">&times;</button>
    `;
    
    // Add click to navigate to Automation tab and focus on this incident
    toastDiv.addEventListener('click', (e) => {
        if (e.target.className === 'toast-alert-close') return;
        switchTab('automation');
        // Let lists re-render and click on card
        setTimeout(() => {
            const card = document.querySelector(`.alert-card-item[data-id="${anomaly.id}"]`);
            if (card) card.click();
        }, 100);
        toastDiv.remove();
    });
    
    container.appendChild(toastDiv);
    
    // Auto remove toast
    setTimeout(() => {
        const el = document.getElementById(toastId);
        if (el) {
            el.style.opacity = '0';
            el.style.transform = 'translateX(120%)';
            setTimeout(() => el.remove(), 400);
        }
    }, 7000);
}

function appendTypingIndicator() {
    const chatContainer = document.getElementById('chat-messages-container');
    const indicatorId = `typing-${Date.now()}`;

    const typingDiv = document.createElement('div');
    typingDiv.className = 'message ai typing-indicator-bubble';
    typingDiv.id = indicatorId;
    typingDiv.innerHTML = `
        <div class="message-sender">AI Core</div>
        <div class="msg-bubble">
            <span class="dot-typing"></span>
            <span class="dot-typing"></span>
            <span class="dot-typing"></span>
        </div>
    `;

    chatContainer.appendChild(typingDiv);
    return indicatorId;
}

function removeTypingIndicator(indicatorId) {
    const el = document.getElementById(indicatorId);
    if (el) el.remove();
}

/**
 * Renders a small reactive Chart.js instance directly inside the message bubble.
 */
function appendInlineChartToBubble(messageId, chartType, metrics) {
    const bubble = document.querySelector(`#${messageId} .msg-bubble`);
    if (!bubble) return;

    const chartWrapper = document.createElement('div');
    chartWrapper.className = 'chat-inline-chart';
    
    const canvasId = `inline-canvas-${Date.now()}`;
    chartWrapper.innerHTML = `<canvas id="${canvasId}"></canvas>`;
    bubble.appendChild(chartWrapper);

    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // Configuration definitions
    let config = {};
    if (chartType === 'mobility') {
        config = {
            type: 'bar',
            data: {
                labels: ['Transit Speed (km/h)', 'Commute Delays (%)'],
                datasets: [{
                    data: [Math.max(12, Math.round(45 * metrics.mobility / 72)), Math.max(10, 100 - metrics.mobility)],
                    backgroundColor: ['#7b61ff', '#ff6b6b'],
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { min: 0, max: 100 } }
            }
        };
    } else if (chartType === 'aqi') {
        config = {
            type: 'line',
            data: {
                labels: ['PM2.5', 'NO2', 'O3'],
                datasets: [{
                    data: [metrics.emissions, Math.round(metrics.emissions * 0.8), Math.round(metrics.emissions * 0.4)],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { min: 0, max: 150 } }
            }
        };
    } else if (chartType === 'energy') {
        const solarPct = document.getElementById('policy-solar')?.checked ? 47 : 32;
        config = {
            type: 'doughnut',
            data: {
                labels: ['Solar Solar', 'Fossil Import'],
                datasets: [{
                    data: [solarPct, 100 - solarPct],
                    backgroundColor: ['#f59e0b', 'rgba(255,255,255,0.08)'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { boxWidth: 10 } } }
            }
        };
    } else if (chartType === 'safety') {
        config = {
            type: 'bar',
            data: {
                labels: ['Safety Score (%)', 'Dispatch speed (min)'],
                datasets: [{
                    data: [metrics.safety, Math.round(5.2 * 10) / 10],
                    backgroundColor: ['#3b82f6', '#ff6b6b'],
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { min: 0, max: 100 } }
            }
        };
    }

    new Chart(ctx, config);
}

function updateRAGVisualizer(chunks, isActive) {
    const status = document.getElementById('rag-status');
    const content = document.getElementById('rag-visualizer-content');
    
    if (!status || !content) return;

    if (!isActive || chunks.length === 0) {
        status.textContent = 'Idle';
        status.className = 'rag-status-tag';
        content.innerHTML = `<p class="empty-state">When you submit a query, the RAG engine searches semantic embeddings of city guidelines and reports, showing similarity scores and document chunks here.</p>`;
        return;
    }

    status.textContent = 'Active Retrieval';
    status.className = 'rag-status-tag active';

    let html = '<div class="rag-retrieval-list">';
    chunks.forEach(chunk => {
        html += `
            <div class="rag-chunk-card">
                <header>
                    <span class="title">${chunk.title}</span>
                    <span class="score"><i class="fa-solid fa-bullseye"></i> ${Math.round(chunk.score * 100)}% match</span>
                </header>
                <p>"${chunk.text}"</p>
            </div>
        `;
    });
    html += '</div>';
    content.innerHTML = html;
}

// Simple markdown formatter helper
function formatMarkdownToHTML(text) {
    let html = text;
    // Replace headings (### Title)
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
    // Replace bold (**bold**)
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
    // Replace bullet points
    html = html.replace(/^\*\s(.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>');
    // Clean nested lists
    html = html.replace(/<\/ul>\s*<ul>/gim, '');
    
    // Replace quotes
    html = html.replace(/^>\s(.*$)/gim, '<blockquote>$1</blockquote>');
    // Replace code blocks
    html = html.replace(/`(.*?)`/gim, '<code>$1</code>');
    
    // Replace breaks
    html = html.replace(/\n/g, '<br>');
    return html;
}

/* ==========================================================================
   5. AUTOMATION HUB (ALERTS & PLAYBOOKS)
   ========================================================================== */
function initAutomation() {
    const executeBtn = document.getElementById('execute-playbook-btn');
    
    if (executeBtn) {
        executeBtn.addEventListener('click', () => {
            if (!currentActiveAnomalyId) return;

            const terminal = document.getElementById('automation-terminal-logs');
            terminal.innerHTML = '<div class="log-line info">> Script initialization authorized. Spawning background workers...</div>';
            executeBtn.disabled = true;

            // Run playbook loop
            executePlaybook(currentActiveAnomalyId, 
                (logLine, type) => {
                    // Log Callback
                    const logEl = document.createElement('div');
                    logEl.className = `log-line ${type}`;
                    logEl.textContent = `> ${logLine}`;
                    terminal.appendChild(logEl);
                    terminal.scrollTop = terminal.scrollHeight;
                }, 
                () => {
                    // Complete Callback
                    executeBtn.disabled = false;
                    
                    // Trigger sound / notification effect
                    triggerAlertCompleteEffect();
                    
                    // Update stats
                    updateGlobalState();

                    // Re-render
                    renderAnomalies();
                }
            );
        });
    }
}

function renderAnomalies() {
    const miniList = document.getElementById('mini-anomalies-list');
    const fullList = document.getElementById('anomalies-full-list');
    const badge = document.getElementById('anomaly-badge');

    const anomalies = getAnomalies();
    const activeCount = anomalies.filter(a => a.status === 'active').length;

    // Update Nav badge count
    if (badge) {
        badge.textContent = activeCount;
        badge.style.display = activeCount > 0 ? 'inline-block' : 'none';
    }

    // Notification bell icon badge on header
    const bellIndicator = document.getElementById('bell-indicator');
    if (bellIndicator) {
        if (activeCount > 0) {
            bellIndicator.classList.remove('hide');
        } else {
            bellIndicator.classList.add('hide');
        }
    }

    // Render Dashboard Mini Feed
    if (miniList) {
        let miniHtml = "";
        const activeFeed = anomalies.slice(0, 3);
        
        activeFeed.forEach(anomaly => {
            const statusLabel = anomaly.status === 'resolved' ? 'RESOLVED' : 'ACTIVE';
            miniHtml += `
                <div class="mini-anomaly-item ${anomaly.priority}">
                    <div class="anomaly-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
                    <div class="anomaly-details">
                        <h4>${anomaly.title}</h4>
                        <p>${anomaly.description}</p>
                    </div>
                    <div class="anomaly-meta-time">${anomaly.time}</div>
                </div>
            `;
        });

        if (anomalies.length === 0) {
            miniHtml = '<p class="text-muted" style="text-align:center; padding:10px;">Zero active incidents logged.</p>';
        }
        miniList.innerHTML = miniHtml;
    }

    // Render Full Automation Page Grid
    if (fullList) {
        let fullHtml = "";
        
        anomalies.forEach(anomaly => {
            const isSelected = anomaly.id === currentActiveAnomalyId ? 'selected' : '';
            const priorityBadge = `badge-${anomaly.priority}`;
            const statusBadge = anomaly.status === 'resolved' ? 'badge-status-resolved' : (anomaly.status === 'resolving' ? 'badge-status-active' : 'badge-status-active');
            const statusText = anomaly.status.toUpperCase();

            fullHtml += `
                <div class="alert-card-item ${isSelected}" data-id="${anomaly.id}">
                    <div class="alert-card-header">
                        <span class="alert-title-block">
                            <i class="fa-solid fa-circle-exclamation"></i> ${anomaly.title}
                        </span>
                        <span class="badge ${priorityBadge}">${anomaly.priority}</span>
                    </div>
                    <p>${anomaly.description}</p>
                    <div class="alert-card-footer">
                        <span><i class="fa-solid fa-clock"></i> ${anomaly.time}</span>
                        <span class="${statusBadge}">${statusText}</span>
                    </div>
                </div>
            `;
        });
        
        fullList.innerHTML = fullHtml;

        // Add click events to alert cards
        document.querySelectorAll('.alert-card-item').forEach(card => {
            card.addEventListener('click', () => {
                const anomalyId = card.getAttribute('data-id');
                selectAnomaly(anomalyId);
            });
        });
    }
}

function selectAnomaly(anomalyId) {
    currentActiveAnomalyId = anomalyId;
    
    // Highlight correct list items
    document.querySelectorAll('.alert-card-item').forEach(card => {
        if (card.getAttribute('data-id') === anomalyId) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });

    const anomalies = getAnomalies();
    const anomaly = anomalies.find(a => a.id === anomalyId);

    const emptyConsole = document.getElementById('empty-console-state');
    const activeConsole = document.getElementById('active-console-content');

    if (!anomaly) return;

    // Show panel content
    emptyConsole.classList.add('hide');
    activeConsole.classList.remove('hide');

    // Populate incident console details
    document.getElementById('active-incident-label').textContent = anomaly.title;
    document.getElementById('active-incident-label').className = `badge badge-${anomaly.priority}`;
    document.getElementById('rca-description').textContent = anomaly.rca;
    document.getElementById('playbook-title').textContent = anomaly.playbook.title;

    // Impact badges
    const rcaImpactContainer = document.getElementById('rca-impact-tags');
    let impactHtml = "";
    for (const key in anomaly.impact) {
        const val = anomaly.impact[key];
        const labelText = key.toUpperCase();
        if (val > 0) {
            impactHtml += `<span class="impact-tag good">${labelText} +${val}</span>`;
        } else {
            impactHtml += `<span class="impact-tag bad">${labelText} ${val}</span>`;
        }
    }
    rcaImpactContainer.innerHTML = impactHtml;

    // Clear / reset terminal log
    const terminal = document.getElementById('automation-terminal-logs');
    const execBtn = document.getElementById('execute-playbook-btn');
    
    if (anomaly.status === 'resolved') {
        execBtn.disabled = true;
        terminal.innerHTML = `
            <div class="log-line success">> PLAYBOOK EXECUTED SUCCESSFULLY</div>
            <div class="log-line info">> All associated microservice actions completed. Incidents resolved.</div>
        `;
    } else if (anomaly.status === 'resolving') {
        execBtn.disabled = true;
        terminal.innerHTML = `<div class="log-line warning">> Playbook script currently running. Please wait...</div>`;
    } else {
        execBtn.disabled = false;
        terminal.innerHTML = `<div class="log-line text-muted">> Ready to execute automated actions...</div>`;
    }
}

function triggerAlertCompleteEffect() {
    // Sound mock: flash alert console
    const consolePanel = document.querySelector('.console-panel');
    if (consolePanel) {
        consolePanel.style.borderColor = 'var(--color-environment)';
        consolePanel.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.3)';
        
        setTimeout(() => {
            consolePanel.style.borderColor = '';
            consolePanel.style.boxShadow = '';
        }, 1500);
    }
}

/* ==========================================================================
   6. RAG & DATA EXPLORER
   ========================================================================== */
function initDataExplorer() {
    const uploadForm = document.getElementById('upload-doc-form');
    renderDocumentsList();

    if (uploadForm) {
        uploadForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const title = document.getElementById('upload-title').value;
            const category = document.getElementById('upload-category').value;
            const contentText = document.getElementById('upload-content').value;

            // Add new simulated document
            const newDoc = {
                id: `doc-${Date.now()}`,
                title: title,
                category: category,
                text: contentText
            };
            
            DOCUMENTS.push(newDoc);
            
            // Show Success Notification
            const successBox = document.getElementById('upload-success-msg');
            successBox.classList.remove('hide');
            
            // Reset form
            uploadForm.reset();
            
            // Re-render
            renderDocumentsList();
            
            setTimeout(() => {
                successBox.classList.add('hide');
            }, 4000);
        });
    }
}

function renderDocumentsList() {
    const list = document.getElementById('documents-list-container');
    if (!list) return;

    let html = "";
    DOCUMENTS.forEach(doc => {
        const words = doc.text.split(/\s+/).length;
        html += `
            <div class="document-item">
                <div class="document-item-header">
                    <span class="document-title">${doc.title}</span>
                    <span class="badge badge-info">${doc.category}</span>
                </div>
                <p class="document-item-body">"${doc.text.substring(0, 180)}..."</p>
                <div class="document-item-footer">
                    <span><i class="fa-solid fa-file-word"></i> ${words} words</span>
                    <span><i class="fa-solid fa-server"></i> Vector Chunks: ${Math.ceil(words / 40)}</span>
                </div>
            </div>
        `;
    });
    
    list.innerHTML = html;
}

/* ==========================================================================
   7. PLATFORM SETTINGS
   ========================================================================== */
function initTheme() {
    const cards = document.querySelectorAll('.theme-card');

    // Click handler for theme preview cards
    cards.forEach(card => {
        card.addEventListener('click', () => {
            const chosenTheme = card.getAttribute('data-theme');
            setGlobalTheme(chosenTheme);
        });
    });

    // Load theme cache
    const savedTheme = localStorage.getItem('civicpulse-theme') || 'theme-glass-dark';
    setGlobalTheme(savedTheme);
}

function setGlobalTheme(themeClass) {
    // Clear all existing theme classes from body
    document.body.className = '';
    document.body.classList.add(themeClass);

    // Update active highlight card in settings
    document.querySelectorAll('.theme-card').forEach(card => {
        if (card.getAttribute('data-theme') === themeClass) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    });

    // Save to localStorage
    localStorage.setItem('civicpulse-theme', themeClass);

    // Redraw charts with correct styling rules
    redrawChartsForTheme(themeClass);
}

function loadSavedSettings() {
    const toggleLive = document.getElementById('toggle-live-api');
    const apiKeyInput = document.getElementById('gemini-api-key');
    const modelSelect = document.getElementById('gemini-model-select');
    const apiIndicator = document.getElementById('api-status-badge');

    const keyContainer = document.getElementById('api-key-container');

    const saveBtn = document.getElementById('save-settings-btn');
    const saveStatus = document.getElementById('save-settings-status');

    // Retrieve cached values
    const savedKey = localStorage.getItem('gemini-api-key') || '';
    const isLive = localStorage.getItem('gemini-live-mode') === 'true';
    const savedModel = localStorage.getItem('gemini-model-name') || 'gemini-2.5-flash';
    const spawnerActive = localStorage.getItem('civicpulse-alert-spawner') !== 'false';

    const toggleSpawner = document.getElementById('toggle-alert-spawner');
    if (toggleSpawner) toggleSpawner.checked = spawnerActive;

    if (apiKeyInput) apiKeyInput.value = savedKey;
    if (toggleLive) {
        toggleLive.checked = isLive;
        // Hide API key input if disabled
        if (keyContainer) {
            keyContainer.style.display = isLive ? 'flex' : 'none';
        }
    }
    if (modelSelect) modelSelect.value = savedModel;

    updateHeaderAPIStatus(isLive, savedKey);

    // Toggle key input visibility based on live api switch
    if (toggleLive) {
        toggleLive.addEventListener('change', () => {
            if (keyContainer) {
                keyContainer.style.display = toggleLive.checked ? 'flex' : 'none';
            }
        });
    }

    // Toggle API Key password text visibility
    const visBtn = document.getElementById('toggle-api-key-vis');
    if (visBtn && apiKeyInput) {
        visBtn.addEventListener('click', () => {
            const isPassword = apiKeyInput.getAttribute('type') === 'password';
            apiKeyInput.setAttribute('type', isPassword ? 'text' : 'password');
            visBtn.querySelector('i').className = isPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
        });
    }

    // Save config handler
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const keyVal = apiKeyInput.value.trim();
            const liveModeVal = toggleLive.checked;
            const modelVal = modelSelect.value;

            localStorage.setItem('gemini-api-key', keyVal);
            localStorage.setItem('gemini-live-mode', String(liveModeVal));
            localStorage.setItem('gemini-model-name', modelVal);
            
            const spawnerVal = toggleSpawner ? toggleSpawner.checked : true;
            localStorage.setItem('civicpulse-alert-spawner', String(spawnerVal));

            // Update status badge
            updateHeaderAPIStatus(liveModeVal, keyVal);

            if (saveStatus) {
                saveStatus.textContent = "Configurations Saved Successfully!";
                saveStatus.className = "save-status-text success";
                setTimeout(() => {
                    saveStatus.textContent = "";
                }, 3000);
            }
        });
    }
}

function updateHeaderAPIStatus(isLiveMode, key) {
    const badge = document.getElementById('api-status-badge');
    const chatSubStatus = document.getElementById('chat-sub-status');
    if (!badge) return;

    if (isLiveMode && key) {
        badge.className = 'api-indicator online';
        badge.querySelector('.text').textContent = 'Gemini Live';
        if (chatSubStatus) chatSubStatus.textContent = 'Live Mode | Connection: Google Gemini v1beta API';
    } else {
        badge.className = 'api-indicator offline';
        badge.querySelector('.text').textContent = 'Local Engine';
        if (chatSubStatus) chatSubStatus.textContent = 'Ready | Context: City Baseline Data';
    }
}
