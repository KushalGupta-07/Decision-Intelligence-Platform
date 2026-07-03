/**
 * CivicPulse AI - AI Conversational Core
 * Handles RAG keyword matching, local NLP rule router, and live Gemini REST integrations.
 */

import { PREPACKAGED_RESPONSES } from './data.js';

/**
 * Perform a keyword-similarity search (Mock Vector RAG) across documents.
 * @param {string} query 
 * @param {Array} documents 
 */
export function performRAGSearch(query, documents) {
    const tokens = query.toLowerCase().split(/\W+/).filter(t => t.length > 2);
    if (tokens.length === 0) return [];

    const results = documents.map(doc => {
        let score = 0;
        const textLower = doc.text.toLowerCase();
        const titleLower = doc.title.toLowerCase();

        tokens.forEach(token => {
            // Match in title gives higher weight
            const titleMatches = (titleLower.match(new RegExp(token, 'g')) || []).length;
            score += titleMatches * 3.0;

            // Match in content
            const textMatches = (textLower.match(new RegExp(token, 'g')) || []).length;
            score += textMatches * 1.0;
        });

        // Normalize by document length and search terms
        const wordCount = doc.text.split(/\s+/).length;
        const rawScore = score / (tokens.length * 2 + Math.log(wordCount));
        const finalScore = Math.min(0.98, Math.round(rawScore * 100) / 100);

        return {
            ...doc,
            score: finalScore
        };
    });

    // Return matches with reasonable confidence sorted by score
    return results
        .filter(doc => doc.score > 0.08)
        .sort((a, b) => b.score - a.score)
        .slice(0, 2);
}

/**
 * Triggers the AI request, selecting local or live modes.
 */
export async function queryAI(userPrompt, options = {}) {
    const {
        metrics = {},
        policies = {},
        documents = [],
        apiKey = "",
        model = "gemini-2.5-flash",
        isLiveMode = false
    } = options;

    // 1. Run vector search
    const ragChunks = performRAGSearch(userPrompt, documents);

    if (isLiveMode && apiKey) {
        try {
            return await queryLiveGemini(userPrompt, ragChunks, metrics, policies, apiKey, model);
        } catch (error) {
            console.error("Live Gemini Error. Falling back to local engine:", error);
            // Fallback to local
            const localResult = queryLocalEngine(userPrompt, ragChunks, metrics, policies);
            return {
                ...localResult,
                answer: `*⚠️ Live Gemini API error: ${error.message}. Falling back to Local Simulation Engine.*\n\n${localResult.answer}`
            };
        }
    } else {
        // Run Local Engine
        return queryLocalEngine(userPrompt, ragChunks, metrics, policies);
    }
}

/**
 * Local simulation heuristics for natural language analytics.
 */
function queryLocalEngine(query, ragChunks, metrics, policies) {
    const queryLower = query.toLowerCase();

    // Check pre-packaged responses
    let match = null;
    let maxOverlap = 0;

    for (const response of PREPACKAGED_RESPONSES) {
        let overlap = 0;
        response.keywords.forEach(keyword => {
            if (queryLower.includes(keyword)) overlap++;
        });

        if (overlap > maxOverlap) {
            maxOverlap = overlap;
            match = response;
        }
    }

    if (match) {
        let formattedAnswer = match.answer
            .replace(/{mobility}/g, metrics.mobility)
            .replace(/{emissions}/g, metrics.emissions)
            .replace(/{energy}/g, metrics.energy)
            .replace(/{energy_solar_share}/g, policies.solar ? 47 : 32)
            .replace(/{safety}/g, metrics.safety)
            .replace(/{citizen}/g, metrics.citizen);

        return {
            answer: formattedAnswer,
            ragChunks: ragChunks,
            chartToRender: match.chartType || null
        };
    }

    // Dynamic generated fallback when no prepackaged response fits
    let activePoliciesText = Object.keys(policies).filter(k => policies[k]).join(', ');
    activePoliciesText = activePoliciesText ? `active policies: ${activePoliciesText}` : "standard baseline parameters";

    let chunkRef = "";
    if (ragChunks.length > 0) {
        chunkRef = `Based on retrieved records in "${ragChunks[0].title}":\n\n> *"${ragChunks[0].text.substring(0, 160)}..."*\n\n`;
    }

    let defaultAnswer = `### Civic Inquiry Response
Regarding your question about **"${query}"** in the context of the current community state:

${chunkRef}
* **Current Operations:** The city is running under **${activePoliciesText}**.
* **Primary Indicator:** The Mobility Index is **${metrics.mobility}%**, and environmental AQI sits at **${metrics.emissions}**.

To optimize these indices, try enabling complimentary policies in the **Scenario Simulator** tab (e.g., *Smart Traffic Signals* for transit blockages or *Urban Micro-Forests* for pollution spikes).`;

    // Try to guess a chart based on words
    let chartToRender = null;
    if (queryLower.includes("traffic") || queryLower.includes("commute") || queryLower.includes("mobility")) chartToRender = "mobility";
    else if (queryLower.includes("air") || queryLower.includes("pollution") || queryLower.includes("aqi")) chartToRender = "aqi";
    else if (queryLower.includes("solar") || queryLower.includes("energy") || queryLower.includes("power")) chartToRender = "energy";
    else if (queryLower.includes("safety") || queryLower.includes("crime") || queryLower.includes("emergency")) chartToRender = "safety";

    return {
        answer: defaultAnswer,
        ragChunks: ragChunks,
        chartToRender: chartToRender
    };
}

/**
 * Connects directly to Google's Gemini models using API key.
 */
async function queryLiveGemini(query, ragChunks, metrics, policies, apiKey, model) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // System context to ensure Gemini behaves as a proper agent
    const activePoliciesList = Object.keys(policies).filter(k => policies[k]).join(', ') || 'None (Baseline City)';
    const ragContext = ragChunks.map((chunk, idx) => `[RAG Chunk #${idx+1} from "${chunk.title}"]: "${chunk.text}"`).join('\n\n') || "No matching vector documents found.";

    const systemContext = `
You are the AI Civic Assistant for CivicPulse, a Decision Intelligence Platform.
Here is the current state of the city:
- Mobility Index: ${metrics.mobility}% (${metrics.mobilitySub})
- Air Quality: ${metrics.emissions} AQI (${metrics.emissionsSub})
- Grid Efficiency: ${metrics.energy}% (${metrics.energySub})
- Public Safety: ${metrics.safety}% (${metrics.safetySub})
- Citizen Satisfaction: ${metrics.citizen}% (${metrics.citizenSub})
Active policies simulated: ${activePoliciesList}

Here is the retrieved vector document context (RAG):
${ragContext}

INSTRUCTIONS:
1. Respond to the user's inquiry in a highly analytical, clear, and professional tone.
2. Use Markdown headings (e.g. ### Title), bolding, lists, and quotes where appropriate.
3. Keep the answer concise (under 300 words).
4. If the user's question relates to a specific dashboard chart, you can trigger an inline chart display inside your response message by ending your response with exactly: [RENDER_CHART: type] where type is one of: mobility, aqi, energy, safety. Example: "[RENDER_CHART: mobility]". Do not render multiple chart tags.
    `;

    const requestBody = {
        contents: [
            {
                role: "user",
                parts: [
                    { text: `${systemContext}\n\nUser Question: ${query}` }
                ]
            }
        ],
        generationConfig: {
            temperature: 0.25,
            maxOutputTokens: 600
        }
    };

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error?.message || response.statusText);
    }

    const resJson = await response.json();
    const fullText = resJson.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";

    // Parse out [RENDER_CHART: type] command if any
    let chartToRender = null;
    const chartRegex = /\[RENDER_CHART:\s*(mobility|aqi|energy|safety)\]/i;
    const match = fullText.match(chartRegex);
    let cleanedText = fullText;

    if (match) {
        chartToRender = match[1].toLowerCase();
        cleanedText = fullText.replace(chartRegex, "").trim();
    }

    return {
        answer: cleanedText,
        ragChunks: ragChunks,
        chartToRender: chartToRender
    };
}
