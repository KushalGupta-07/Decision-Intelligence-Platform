/**
 * CivicPulse AI - Automation Hub
 * Drives real-time alerts, AI root cause analysis, and asynchronous terminal logs for automated playbooks.
 */

import { ANOMALIES } from './data.js';

// Deep clone anomalies into active state
let activeAnomalies = JSON.parse(JSON.stringify(ANOMALIES));

/**
 * Returns all anomalies.
 */
export function getAnomalies() {
    return activeAnomalies;
}

/**
 * Adds a new custom anomaly (e.g. if simulated).
 */
export function addAnomaly(anomaly) {
    activeAnomalies.unshift(anomaly);
}

/**
 * Reset anomalies to default.
 */
export function resetAnomalies() {
    activeAnomalies = JSON.parse(JSON.stringify(ANOMALIES));
}

/**
 * Calculates current active penalty metrics from all UNRESOLVED anomalies.
 * E.g., if Route 9 gridlock is active, subtracts 18% from mobility.
 */
export function getAnomalyPenalies() {
    const penalties = { mobility: 0, emissions: 0, energy: 0, safety: 0, citizen: 0 };
    
    activeAnomalies.forEach(anomaly => {
        if (anomaly.status === 'active' && anomaly.impact) {
            for (const metric in anomaly.impact) {
                if (metric in penalties) {
                    penalties[metric] += anomaly.impact[metric];
                }
            }
        }
    });

    return penalties;
}

/**
 * Simulates the execution of a playbook with callbacks for logs.
 * @param {string} anomalyId 
 * @param {function} onLogCallback - Receives (text, type)
 * @param {function} onCompleteCallback - Fired when playbook finishes
 */
export function executePlaybook(anomalyId, onLogCallback, onCompleteCallback) {
    const anomaly = activeAnomalies.find(a => a.id === anomalyId);
    if (!anomaly || !anomaly.playbook) return;

    const logs = anomaly.playbook.logs;
    let logIndex = 0;
    
    // Clear old state
    anomaly.status = 'resolving';

    const intervalId = setInterval(() => {
        if (logIndex < logs.length) {
            const rawLine = logs[logIndex];
            let type = 'info';

            if (rawLine.includes('[ACTION]')) {
                type = 'action';
            } else if (rawLine.includes('[WARNING]')) {
                type = 'warning';
            } else if (rawLine.includes('[SUCCESS]')) {
                type = 'success';
            } else if (rawLine.includes('[ERROR]')) {
                type = 'error';
            }

            // Clean log prefix for prettier terminal representation
            const cleanLine = rawLine.replace(/\[(INFO|ACTION|WARNING|SUCCESS|ERROR)\]\s*/g, '');
            onLogCallback(cleanLine, type);
            
            logIndex++;
        } else {
            // Finished
            clearInterval(intervalId);
            anomaly.status = 'resolved';
            
            // Invoke complete
            onCompleteCallback();
        }
    }, 900); // Emits a line every 900ms to feel realistic
}

// Dynamic templates for background anomalies
const ANOMALY_TEMPLATES = [
    {
        title: "Water Main Break (Sector 2)",
        priority: "critical",
        category: "safety",
        description: "Water line ruptured on Elm Ave, causing partial flooding, low tap pressure, and lane closures.",
        rca: "A rupture in the 12-inch cast-iron municipal water line under Elm Ave has flooded the street. Traffic is diverted. Water pressure in the grid has dropped by 18%.",
        impact: { mobility: -10, safety: -6, citizen: -4 },
        playbook: {
            title: "Water Utility Emergency Playbook",
            logs: [
                "[INFO] Initializing Water Utility Emergency Protocol ID: wat-201.",
                "[ACTION] Remotely shutting off isolation valves V-12 and V-14 to halt water flow.",
                "[WARNING] Pressure drops detected at adjacent nodes. Notifying local fire department of lower hydrant pressure.",
                "[ACTION] Dispatching utility crews for excavation and pipe replacement.",
                "[ACTION] Transmitting traffic alerts to municipal signage networks to avoid Elm Ave.",
                "[SUCCESS] Valve shutoff complete. Flooding subsided. Maintenance crew arrived. Incident resolved."
            ]
        }
    },
    {
        title: "Power Grid Surge (Sector 4)",
        priority: "warning",
        category: "energy",
        description: "High air-conditioner usage has overloaded local transformer 4A. Potential localized brownout threat.",
        rca: "Ambient temperature of 38C has led to peak residential HVAC load, pushing transformer 4A load to 118% capacity. Transformer temperature exceeds 90C.",
        impact: { energy: -12, safety: -3, citizen: -2 },
        playbook: {
            title: "Grid Load Rebalancing Playbook",
            logs: [
                "[INFO] Initializing Electrical Grid Balance Protocol ID: elc-505.",
                "[ACTION] Verifying substation telemetry. Load is 4.8MW on a 4.0MW rated transformer.",
                "[WARNING] Peak heat window active. Thermal runaway danger.",
                "[ACTION] Discharging Sector 4 solar batteries to inject 800kW into local loop.",
                "[ACTION] Sending demand-response signals to participating smart thermostats to raise setpoints by 1.5C.",
                "[SUCCESS] Load dropped to 3.9MW. Temperature stabilized at 82C. Grid balance restored."
            ]
        }
    },
    {
        title: "Smart Camera Offline (Sector 8)",
        priority: "info",
        category: "safety",
        description: "Power drop at sensor pole 12 has disconnected municipal CCTV security streams.",
        rca: "Local electrical breaker trip on pole 12 has cut power to the camera and environmental sensor cluster. Backhaul cellular modem is also unresponsive.",
        impact: { safety: -6, citizen: -1 },
        playbook: {
            title: "Hardware Remote Diagnostics Playbook",
            logs: [
                "[INFO] Initializing Hardware Diagnostic Protocol ID: hw-808.",
                "[ACTION] Pinging network switch and cellular gateway. 100% packet loss.",
                "[WARNING] CCTV coverage gap confirmed in high-traffic cross-street.",
                "[ACTION] Triggering automated remote breaker reset switch.",
                "[INFO] Breaker reset sent. Waiting for equipment boot cycle (approx. 45 seconds).",
                "[SUCCESS] Ping returned. Video stream restored. Incident marked as RESOLVED."
            ]
        }
    },
    {
        title: "Double Parking Congestion (Sector 1)",
        priority: "warning",
        category: "mobility",
        description: "Delivery vehicles blocking northbound lanes on Broadway, causing traffic delays.",
        rca: "Commercial delivery trucks double-parked during peak hour, narrowing Broadway to a single lane and causing a 1.2km traffic crawl.",
        impact: { mobility: -8, citizen: -2 },
        playbook: {
            title: "Broadway Traffic Enforcement Playbook",
            logs: [
                "[INFO] Initializing Traffic Enforcement Protocol ID: trf-102.",
                "[ACTION] Identifying parked vehicles via smart street camera CAM-8.",
                "[WARNING] Blockage is affecting transit line 8 schedule.",
                "[ACTION] Dispatched parking enforcement motorcycle unit to issue warnings.",
                "[INFO] Notifying transit control to redirect line 8 buses to bypass street.",
                "[SUCCESS] Parking unit cleared delivery vehicles. Traffic flow returned to normal speed. Playbook finished."
            ]
        }
    }
];

export function spawnRandomAnomaly() {
    // Pick a random template
    const template = ANOMALY_TEMPLATES[Math.floor(Math.random() * ANOMALY_TEMPLATES.length)];
    
    // Create actual anomaly instance
    const id = `anomaly-dyn-${Date.now()}`;
    const newAnomaly = {
        id: id,
        title: template.title,
        priority: template.priority,
        category: template.category,
        description: template.description,
        time: "Just now",
        status: "active",
        rca: template.rca,
        impact: { ...template.impact },
        playbook: {
            title: template.playbook.title,
            logs: [ ...template.playbook.logs ]
        }
    };
    
    // Add to front of activeAnomalies
    activeAnomalies.unshift(newAnomaly);
    return newAnomaly;
}
