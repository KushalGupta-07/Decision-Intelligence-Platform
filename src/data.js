/**
 * CivicPulse AI - Local Database Layer
 * Holds baseline city stats, scenario rules, RAG search documents, and anomaly playbooks.
 */

export const BASE_METRICS = {
    mobility: 72,
    mobilitySub: "24.5m avg. commute",
    emissions: 45, // AQI: Lower is better
    emissionsSub: "Excellent",
    energy: 86,
    energySub: "32% Solar Grid Share",
    safety: 94,
    safetySub: "5.2m response time",
    citizen: 81,
    citizenSub: "1,248 weekly reports"
};

export const SCENARIOS = {
    signals: {
        name: "Smart Traffic Signals",
        metrics: { mobility: 8, emissions: -10, safety: 1, citizen: 4 },
        explanation: "AI-synchronized signals reduce delay on main avenues by 18%, decreasing fuel idle emissions and improving driver convenience."
    },
    transit: {
        name: "Transit Frequency Expansion",
        metrics: { mobility: 10, emissions: -12, safety: 3, energy: -2, citizen: 6 },
        explanation: "Increasing bus/metro frequencies by 30% moves commuters from cars to public transit, lowering peak hours travel delay times."
    },
    solar: {
        name: "Solar Grid Mandate",
        metrics: { energy: 8, emissions: -4, citizen: 2 },
        explanation: "Adding solar panel arrays to public administration buildings reduces grid peak pressure and increases local green energy share."
    },
    greenery: {
        name: "Urban Micro-Forests",
        metrics: { emissions: -15, citizen: 8, safety: 0 },
        explanation: "Converting five concrete lots into pocket parks creates urban carbon sinks, decreases PM2.5 particle levels, and enhances neighborhood satisfaction."
    },
    crisis: {
        name: "Severe Flood Warning",
        metrics: { mobility: -30, emissions: 15, safety: -25, energy: -15, citizen: -20 },
        explanation: "Extreme storm flooding blocks multiple low-lying roads, slowing police response, spiking emissions due to idling traffic, and overloading local grids."
    }
};

export const DOCUMENTS = [
    {
        id: "doc-1",
        title: "Municipal Green Space & AQI Plan 2025",
        category: "environment",
        text: "The micro-forest initiative outlines converting parking spots and concrete zones to green spaces. Micro-forests improve air quality (AQI) by absorbing nitrogen oxides and particulate matter, reducing PM2.5 counts by 12% in immediate surrounding blocks. Pocket parks improve resident mental health and raise local citizen satisfaction by 8% to 15%."
    },
    {
        id: "doc-2",
        title: "Smart Transit Integration Framework 2026",
        category: "mobility",
        text: "AI-based signal control on corridors reduces bus delay times by 20%. When transit frequencies are increased by 30%, single-occupant car travel decreases by 11%. This mode shift contributes directly to lower traffic congestion and reduces average commuter delay time by 6 minutes, improving general urban mobility."
    },
    {
        id: "doc-3",
        title: "Distributed Solar Storage Initiative Phase 2",
        category: "energy",
        text: "Deploying solar micro-grids on public administration buildings increases local energy resilience. Phase 2 aims to provide 15MW of total solar generation capacity. Adding grid battery systems allows storing excess midday solar energy and releasing it during peak hours (4 PM - 7 PM), saving up to 18% in peak utility costs and raising general grid energy efficiency."
    },
    {
        id: "doc-4",
        title: "Urban Safety & Incident Response Protocol",
        category: "safety",
        text: "Smart cameras and sensors in Sector 4 and 9 monitor water levels, traffic patterns, and smoke. Implementing automated response triggers decreases emergency dispatch lag times. In high-water anomalies, automated rerouting directives sent to connected transit systems reduce potential safety incidents and minimize transit delays."
    }
];

export const ANOMALIES = [
    {
        id: "anomaly-1",
        title: "Main St Gridlock (Sector 3)",
        priority: "critical",
        category: "mobility",
        description: "Severe bottleneck detected on Route 9 (Downtown Corridor). Average commute speeds dropped below 8 km/h. Sensor malfunction at cross-street 4.",
        time: "10 mins ago",
        status: "active",
        rca: "A physical vehicle breakdown combined with a loop-detector signal failure on Route 9 has caused a 2.5km congestion tailback. Signals are stuck on standard cycling rather than reacting to traffic volume.",
        impact: { mobility: -18, citizen: -6 },
        playbook: {
            title: "Automated Traffic Remediation Playbook",
            logs: [
                "[INFO] Initializing Incident Response Protocol ID: mob-992.",
                "[ACTION] Triggering live camera feed diagnosis on Route 9 cross-street 4.",
                "[WARNING] Detected loop detector signal loss. Reverting controller to adaptive local plan.",
                "[ACTION] Activating Smart Signal Override: extending green light cycle on Route 9 northbound by 30 seconds.",
                "[ACTION] Dispatching emergency towing vehicle to clear stalled truck.",
                "[INFO] Broadcasting congestion alerts to navigation networks (Google Maps, Waze). Rerouting local bus lines 12 & 14.",
                "[SUCCESS] Tow truck arrived. Green-extension cycle successfully reduced tailback by 45%. Incident status set to RESOLVED."
            ]
        }
    },
    {
        id: "anomaly-2",
        title: "Industrial Area AQI Spike",
        priority: "warning",
        category: "environment",
        description: "Environmental sensor #82 reports PM2.5 concentrations exceeding 150 µg/m³ near Sector 5 (Industrial Park).",
        time: "35 mins ago",
        status: "active",
        rca: "Micro-climatic inversion combined with localized stack emissions at the chemical packaging plant has trapped particulate matter. Wind speed is under 2 knots, preventing dispersion.",
        impact: { emissions: 65, citizen: -5 },
        playbook: {
            title: "Air Quality Mitigation Playbook",
            logs: [
                "[INFO] Initializing Environmental Safety Protocol ID: env-104.",
                "[ACTION] Verifying sensor #82 data against adjacent nodes #81 & #83 to exclude sensor defect. Spikes verified.",
                "[ACTION] Requesting telemetry from chemical packaging plant stack sensors.",
                "[WARNING] Plant output within nominal bounds but wind flow vector is zero. Inversion confirmed.",
                "[ACTION] Activating Sector 5 automated HVAC filtration request for municipal buildings.",
                "[ACTION] Transmitting digital signage warning to schools and public spaces in Sector 5 to restrict outdoor activities.",
                "[ACTION] Sending automated notification to plant supervisors requesting voluntary 20% emission dampening for next 3 hours.",
                "[SUCCESS] Plant verified mitigation compliance. Signage active. Dispersion pattern modeling indicates AQI will drop below 60 in 90 minutes."
            ]
        }
    },
    {
        id: "anomaly-3",
        title: "Substation 4B Solar Overload",
        priority: "info",
        category: "energy",
        description: "Solar generation feed spike at Substation 4B (Sector 7) exceeds grid feedback threshold limit by 12%.",
        time: "1 hour ago",
        status: "resolved",
        rca: "Clear skies and exceptionally high solar radiation combined with low residential demand at midday led to reverse current flow toward Substation 4B.",
        impact: { energy: 4, citizen: 1 },
        playbook: {
            title: "Grid Feedback Balancing Playbook",
            logs: [
                "[INFO] Initializing Utility Balancing Protocol ID: utl-402.",
                "[INFO] Overload detected. Solar input: 12.8MW, Residential demand: 8.2MW. Net feedback: +4.6MW.",
                "[ACTION] Directing excess solar generation to Sector 7 Battery Storage Facility.",
                "[INFO] Charging batteries at 4.2MW. Grid feedback reduced to +0.4MW.",
                "[ACTION] Adjusting building automation systems in District 7 municipal offices to pre-cool facilities, utilizing excess energy.",
                "[SUCCESS] Battery state of charge (SoC) reached 74%. Substation loads stabilized. Incident closed."
            ]
        }
    }
];

// Pre-defined NLP mock questions and matching answers
export const PREPACKAGED_RESPONSES = [
    {
        keywords: ["traffic", "congestion", "mobility", "commute", "commuting", "delay"],
        answer: "### Mobility & Congestion Briefing\nBased on real-time city parameters, our **Mobility Index** is standing at **{mobility}%**.\n\n#### Key Findings:\n* Traffic is heaviest on Route 9 (downtown corridor) due to a localized sensor malfunction.\n* Public transit usage has increased slightly since introducing transit frequency expansions.\n\n#### Recommendation:\nActivating **Smart Traffic Signals** is expected to reduce commuting delays by approximately **15%** on major avenues.",
        chartType: "mobility"
    },
    {
        keywords: ["air quality", "aqi", "emissions", "pollution", "pm2.5", "air", "environmental"],
        answer: "### Environmental Status Report\nThe city's **Air Quality Index** is currently **{emissions} AQI**.\n\n#### Summary:\n* Values under 50 are considered 'Good'. Current sensors show positive air dispersion rates across most suburbs.\n* Pocket park conversions are helping sink particulate matters in dense city districts.\n\n#### Recommended Actions:\n* Continue implementing **Urban Micro-Forests** to buffer industrial sectors.\n* Monitor sensor #82 near Sector 5 which showed a localized spike earlier today.",
        chartType: "aqi"
    },
    {
        keywords: ["solar", "energy", "efficiency", "utilities", "grid", "electricity"],
        answer: "### Energy Grid Operations Summary\nOur **Grid Energy Efficiency** is rated at **{energy}%** with **{energy_solar_share}%** solar integration.\n\n#### Solar Harvest Details:\n* Peak production is achieved at 1:00 PM, generating up to 12.5MW.\n* Distributed storage battery cells are currently at 68% charge, preparing for the 4:00 PM evening peak load.\n\n#### Optimization Proposal:\nEnacting the **Solar Grid Mandate** for public buildings will expand local solar share by an estimated **8%** over the next quarter.",
        chartType: "energy"
    },
    {
        keywords: ["safety", "crime", "response", "police", "fire", "emergency"],
        answer: "### Public Safety Assessment\nThe city's **Public Safety Index** is strong at **{safety}%**.\n\n#### Performance Indicators:\n* Average emergency dispatch response time is **5.2 minutes**.\n* Incidents are down by 4% in areas equipped with smart street monitoring.\n\n#### Flood Preparedness Alert:\nIn the event of a **Severe Flood Warning**, response times can degrade by 25%. Rerouting playbooks should be pre-authorized.",
        chartType: "safety"
    },
    {
        keywords: ["report", "solar mandate", "solar initiative", "initiative", "2026 solar"],
        answer: "### Document Synthesis: 2026 Solar Mandate Report\nRetrieved from the **RAG Vector Index**:\n\n* **Local Power Generation:** The distributed solar initiative has deployed 15MW of clean power capacity on public building roofs.\n* **Peak Hour Load Shifting:** Incorporating lithium battery packs enables shaving peak demand spikes between 4 PM and 7 PM, saving up to **18%** in high-tariff utility costs.\n* **Efficiency Benefits:** Enhances overall grid transmission efficiency by reducing peak thermal stress on transformer substations.",
        ragDocs: ["doc-3"]
    },
    {
        keywords: ["pocket parks", "micro-forests", "green spaces", "parks", "trees"],
        answer: "### Document Synthesis: Municipal Green Space Plan 2025\nRetrieved from the **RAG Vector Index**:\n\n* **AQI Mitigation:** Conversion of concrete parking spaces to micro-forests leads to a localized **12% reduction** in PM2.5 dust concentrations.\n* **Social Impact:** Citizen well-being surveys indicate a general happiness increase of **8% to 15%** in neighborhoods within 500m of pocket parks.",
        ragDocs: ["doc-1"]
    }
];
