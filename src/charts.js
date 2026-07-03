/**
 * CivicPulse AI - Chart Controller
 * Handles initialization and dynamic updates of Chart.js dashboards.
 */

let charts = {};

// Helper to generate a baseline hour-by-hour traffic flow array (24 hours)
function getMobilityData(multiplier = 1.0) {
    const baseFlow = [20, 15, 12, 10, 18, 35, 65, 90, 85, 60, 55, 58, 62, 59, 65, 75, 95, 88, 70, 50, 42, 35, 28, 22];
    return baseFlow.map(val => Math.max(5, Math.round(val * multiplier)));
}

export function initCharts() {
    // 1. Mobility & Transit Flow Chart (Line)
    const mobilityCtx = document.getElementById('chart-mobility-flow')?.getContext('2d');
    if (mobilityCtx) {
        charts.mobility = new Chart(mobilityCtx, {
            type: 'line',
            data: {
                labels: Array.from({length: 24}, (_, i) => `${String(i).padStart(2, '0')}:00`),
                datasets: [
                    {
                        label: 'Baseline Congestion (%)',
                        data: getMobilityData(1.0),
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        pointRadius: 0,
                        tension: 0.4
                    },
                    {
                        label: 'Simulated Congestion (%)',
                        data: getMobilityData(1.0),
                        borderColor: '#7b61ff',
                        backgroundColor: 'rgba(123, 97, 255, 0.05)',
                        borderWidth: 3,
                        pointRadius: 2,
                        pointBackgroundColor: '#7b61ff',
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#9ca3af', font: { family: 'Outfit' } }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#9ca3af', font: { family: 'Outfit', size: 10 } }
                    },
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#9ca3af', font: { family: 'Outfit' } },
                        min: 0,
                        max: 100
                    }
                }
            }
        });
    }

    // 2. Energy Grid Load Chart (Grouped Bar)
    const energyCtx = document.getElementById('chart-energy-grid')?.getContext('2d');
    if (energyCtx) {
        charts.energy = new Chart(energyCtx, {
            type: 'bar',
            data: {
                labels: ['08:00', '12:00', '16:00', '20:00'],
                datasets: [
                    {
                        label: 'Solar & Renewables (MW)',
                        data: [4.2, 10.5, 5.8, 1.2],
                        backgroundColor: '#f59e0b',
                        borderWidth: 0,
                        borderRadius: 4
                    },
                    {
                        label: 'Fossil Grid Import (MW)',
                        data: [12.4, 8.1, 14.2, 15.8],
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 0,
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#9ca3af', font: { family: 'Outfit' } }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: '#9ca3af', font: { family: 'Outfit' } }
                    },
                    y: {
                        stacked: true,
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#9ca3af', font: { family: 'Outfit' } }
                    }
                }
            }
        });
    }

    // 3. AQI Trends Chart (Area Line)
    const aqiCtx = document.getElementById('chart-aqi-trends')?.getContext('2d');
    if (aqiCtx) {
        charts.aqi = new Chart(aqiCtx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'PM2.5 Index (AQI)',
                    data: [52, 48, 55, 42, 46, 38, 45],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3,
                    pointRadius: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: '#9ca3af', font: { family: 'Outfit' } }
                    },
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#9ca3af', font: { family: 'Outfit' } },
                        min: 0,
                        max: 100
                    }
                }
            }
        });
    }

    // 4. Citizen Sentiment Chart (Doughnut)
    const sentimentCtx = document.getElementById('chart-citizen-sentiment')?.getContext('2d');
    if (sentimentCtx) {
        charts.sentiment = new Chart(sentimentCtx, {
            type: 'doughnut',
            data: {
                labels: ['Positive', 'Neutral', 'Negative'],
                datasets: [{
                    data: [58, 23, 19],
                    backgroundColor: [
                        '#10b981', // green
                        'rgba(255, 255, 255, 0.15)', // white-ish
                        '#ff6b6b' // red
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: '#9ca3af', font: { family: 'Outfit' } }
                    }
                },
                cutout: '70%'
            }
        });
    }

    return charts;
}

/**
 * Update charts dynamically to represent simulation changes.
 * @param {Object} metrics Current active metrics
 * @param {Object} policies Active simulator switches
 */
export function updateCharts(metrics, policies = {}) {
    if (!charts.mobility || !charts.energy || !charts.aqi || !charts.sentiment) return;

    // 1. Update Mobility Graph
    // Mobility score goes up when transit/signals are toggled (meaning congestion goes down)
    // If mobility metric is 72%, congestion average factor is (100 - 72)% = 28%
    const mobilityFactor = (100 - metrics.mobility) / 28;
    charts.mobility.data.datasets[1].data = getMobilityData(mobilityFactor);
    charts.mobility.update('none');

    // 2. Update Energy Grid Graph
    // If solar is toggled, solar output increases and grid import decreases
    let solarBoost = policies.solar ? 3.5 : 0;
    if (policies.crisis) solarBoost -= 1.5; // crisis lowers solar slightly due to clouds
    charts.energy.data.datasets[0].data = [4.2 + solarBoost, 10.5 + (solarBoost * 1.5), 5.8 + solarBoost, 1.2 + (solarBoost * 0.2)].map(v => Math.max(0.1, Math.round(v * 10) / 10));
    charts.energy.data.datasets[1].data = [12.4 - solarBoost, 8.1 - (solarBoost * 1.2), 14.2 - solarBoost, 15.8 - (solarBoost * 0.1)].map(v => Math.max(0.5, Math.round(v * 10) / 10));
    charts.energy.update('none');

    // 3. Update AQI Graph
    // Metrics.emissions is the AQI. Base is 45. Let's scale historical AQI.
    const aqiFactor = metrics.emissions / 45;
    const baseAqiData = [52, 48, 55, 42, 46, 38, 45];
    charts.aqi.data.datasets[0].data = baseAqiData.map(val => Math.max(1, Math.round(val * aqiFactor)));
    
    // Change AQI line color based on severity
    if (metrics.emissions > 60) {
        charts.aqi.data.datasets[0].borderColor = '#ff6b6b';
        charts.aqi.data.datasets[0].backgroundColor = 'rgba(255, 107, 107, 0.1)';
    } else if (metrics.emissions > 45) {
        charts.aqi.data.datasets[0].borderColor = '#f59e0b';
        charts.aqi.data.datasets[0].backgroundColor = 'rgba(245, 158, 11, 0.1)';
    } else {
        charts.aqi.data.datasets[0].borderColor = '#10b981';
        charts.aqi.data.datasets[0].backgroundColor = 'rgba(16, 185, 129, 0.1)';
    }
    charts.aqi.update('none');

    // 4. Update Citizen Sentiment Doughnut
    // Base: 58 Positive, 23 Neutral, 19 Negative
    // Pushed by metrics.citizen (Base: 81)
    const satisfactionDiff = metrics.citizen - 81;
    let positive = Math.max(10, Math.min(95, 58 + satisfactionDiff));
    let negative = Math.max(2, Math.min(80, 19 - (satisfactionDiff * 0.8)));
    let neutral = Math.max(0, 100 - positive - negative);
    charts.sentiment.data.datasets[0].data = [
        Math.round(positive),
        Math.round(neutral),
        Math.round(negative)
    ];
    charts.sentiment.update('none');
}

/**
 * Redraw all charts to apply new global colors from theme changes.
 */
export function redrawChartsForTheme(themeName) {
    if (!charts.mobility || !charts.energy || !charts.aqi || !charts.sentiment) return;
    
    let primaryColor = '#7b61ff';
    let labelColor = '#9ca3af';
    let gridColor = 'rgba(255, 255, 255, 0.05)';

    if (themeName === 'theme-cyberpunk') {
        primaryColor = '#00f0ff';
        labelColor = '#8a8d98';
        gridColor = 'rgba(0, 240, 255, 0.1)';
    } else if (themeName === 'theme-emerald') {
        primaryColor = '#10b981';
        labelColor = '#a7f3d0';
        gridColor = 'rgba(16, 185, 129, 0.08)';
    }

    // Update Mobility Chart options
    charts.mobility.data.datasets[1].borderColor = primaryColor;
    charts.mobility.data.datasets[1].pointBackgroundColor = primaryColor;
    charts.mobility.data.datasets[1].backgroundColor = primaryColor === '#10b981' ? 'rgba(16, 185, 129, 0.05)' : (primaryColor === '#00f0ff' ? 'rgba(0, 240, 255, 0.05)' : 'rgba(123, 97, 255, 0.05)');
    
    // Update axes labels
    [charts.mobility, charts.energy, charts.aqi].forEach(chart => {
        if (chart.options.scales.x) {
            chart.options.scales.x.ticks.color = labelColor;
            chart.options.scales.x.grid.color = gridColor;
        }
        if (chart.options.scales.y) {
            chart.options.scales.y.ticks.color = labelColor;
            chart.options.scales.y.grid.color = gridColor;
        }
        if (chart.options.plugins.legend) {
            chart.options.plugins.legend.labels.color = labelColor;
        }
        chart.update();
    });

    if (charts.sentiment.options.plugins.legend) {
        charts.sentiment.options.plugins.legend.labels.color = labelColor;
    }
    charts.sentiment.update();
}
