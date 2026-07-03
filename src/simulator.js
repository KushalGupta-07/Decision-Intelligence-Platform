/**
 * CivicPulse AI - Simulator Engine
 * Computes predictive outputs for What-If municipal policy models.
 */

import { BASE_METRICS, SCENARIOS } from './data.js';

let activePolicies = {
    signals: false,
    transit: false,
    solar: false,
    greenery: false,
    crisis: false
};

/**
 * Toggle a policy option on or off.
 * @param {string} policyId 
 * @param {boolean} isActive 
 */
export function setPolicy(policyId, isActive) {
    if (policyId in activePolicies) {
        activePolicies[policyId] = isActive;
    }
}

/**
 * Reset all policy switches.
 */
export function resetPolicies() {
    for (const key in activePolicies) {
        activePolicies[key] = false;
    }
}

/**
 * Get active policy statuses.
 */
export function getActivePolicies() {
    return { ...activePolicies };
}

/**
 * Computes the simulated metrics based on active toggles.
 */
export function calculateMetrics() {
    const metrics = { ...BASE_METRICS };
    
    // We adjust starting from base values
    for (const policy in activePolicies) {
        if (activePolicies[policy]) {
            const scenario = SCENARIOS[policy];
            if (scenario && scenario.metrics) {
                for (const metric in scenario.metrics) {
                    if (metric in metrics) {
                        metrics[metric] += scenario.metrics[metric];
                    }
                }
            }
        }
    }

    // Clamp values to realistic ranges
    metrics.mobility = Math.max(10, Math.min(99, metrics.mobility));
    metrics.emissions = Math.max(15, Math.min(250, metrics.emissions)); // AQI (Lower is better)
    metrics.energy = Math.max(10, Math.min(99, metrics.energy));
    metrics.safety = Math.max(10, Math.min(99, metrics.safety));
    metrics.citizen = Math.max(10, Math.min(99, metrics.citizen));

    // Dynamic description updates based on scores
    metrics.mobilitySub = `${Math.round(24.5 * (100 - metrics.mobility) / 28 * 10) / 10}m avg. commute`;
    
    if (metrics.emissions <= 35) metrics.emissionsSub = "Excellent";
    else if (metrics.emissions <= 50) metrics.emissionsSub = "Good";
    else if (metrics.emissions <= 100) metrics.emissionsSub = "Moderate";
    else metrics.emissionsSub = "Unhealthy Alert";

    // Solar share adjusts with solar toggle
    const baseSolar = 32;
    let solarShare = baseSolar;
    if (activePolicies.solar) solarShare += 15;
    if (activePolicies.crisis) solarShare -= 10;
    metrics.energySub = `${solarShare}% Solar Grid Share`;

    // Response time adjusts with safety score
    metrics.safetySub = `${Math.round(5.2 * (100 / metrics.safety) * 10) / 10}m response time`;

    // Feedback adjusts with citizen satisfaction
    metrics.citizenSub = `${Math.round(1248 * (metrics.citizen / 81))} weekly reports`;

    return metrics;
}

/**
 * Generates an AI textual summary of the simulation results.
 */
export function generateSimulationSummary(metrics) {
    const activeNames = Object.keys(activePolicies)
        .filter(k => activePolicies[k])
        .map(k => SCENARIOS[k].name);

    if (activeNames.length === 0) {
        return `
            <p><strong>Baseline Scenario Active:</strong> The community is operating under standard protocols. Traffic congestion levels remain average. Solar grids represent 32% of total utility supply. Air quality index is good.</p>
            <p class="text-muted" style="font-size: 11px; margin-top: 8px;"><i class="fa-solid fa-circle-info"></i> Select policies on the left panel to begin simulating predicted benefits.</p>
        `;
    }

    let summaryText = "";
    
    // Core analysis
    if (activePolicies.crisis) {
        summaryText += `
            <p><span class="status-danger"><strong>CRITICAL FLOOD WARNING ACTIVE:</strong></span> Extreme storm runoff has closed low-lying streets. Mobilities are severely congested. Emergency responses are hampered despite active transit adjustments.</p>
        `;
        if (activePolicies.signals || activePolicies.transit) {
            summaryText += `
                <p><em>Mitigation Benefit:</em> AI traffic controllers and transit increases are saving commuters up to 10 minutes in detours, but safety infrastructure remains stressed.</p>
            `;
        }
    } else {
        summaryText += `<p><strong>Simulating Policy Integration:</strong> <code>${activeNames.join(', ')}</code>.</p>`;
        
        if (activePolicies.signals && activePolicies.transit) {
            summaryText += `
                <p><i class="fa-solid fa-square-poll-vertical text-good"></i> <strong>Multi-modal Synergy:</strong> Syncing traffic lights while boosting public transit frequency has a compounding effect. We predict a <strong>${metrics.mobility - BASE_METRICS.mobility}% improvement</strong> in mobility efficiency and a reduction in carbon output.</p>
            `;
        } else if (activePolicies.signals) {
            summaryText += `
                <p><strong>Traffic Corridor Optimization:</strong> Upgrading signal patterns using real-time loop feedback relieves arterial bottleneck bottlenecks. Emitting idle smoke is reduced.</p>
            `;
        } else if (activePolicies.transit) {
            summaryText += `
                <p><strong>Transit Decarbonization:</strong> Boosted frequency drives a modal shift of commuters away from private vehicles, lowering core city transit stress.</p>
            `;
        }

        if (activePolicies.solar && activePolicies.greenery) {
            summaryText += `
                <p><i class="fa-solid fa-seedling text-good"></i> <strong>Sustainability Compounding:</strong> Solar rooftops coupled with pocket parks significantly lower heat island effects and lower regional grid energy stress while achieving an excellent AQI index of <strong>${metrics.emissions}</strong>.</p>
            `;
        } else if (activePolicies.solar) {
            summaryText += `
                <p><strong>Solar Storage Balance:</strong> Peak solar charging offsets afternoon brownouts, elevating utility efficiency. Peak energy grid imports fall.</p>
            `;
        } else if (activePolicies.greenery) {
            summaryText += `
                <p><strong>Carbon Sinking:</strong> Micro-forest expansions scrub PM2.5 particles, yielding a cleaner breathing atmosphere and improving local aesthetic rankings (+8% citizen score).</p>
            `;
        }
    }

    return summaryText;
}
