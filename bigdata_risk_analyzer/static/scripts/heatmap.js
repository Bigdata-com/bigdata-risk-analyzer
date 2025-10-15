// Heatmap Visualization - Companies vs Themes
function renderHeatmap(themeScoring) {
    const container = document.querySelector('[data-tab-content="summary"] .tab-actual-content');
    if (!container || !themeScoring) return;

    // Extract data
    const companies = Object.entries(themeScoring);
    if (companies.length === 0) {
        container.innerHTML = '<p class="text-zinc-400">No company data available</p>';
        return;
    }

    // Get all unique themes and calculate their popularity (total scores)
    const themePopularity = {};
    companies.forEach(([_, scoring]) => {
        if (scoring.themes) {
            Object.entries(scoring.themes).forEach(([theme, score]) => {
                if (!themePopularity[theme]) themePopularity[theme] = 0;
                themePopularity[theme] += score;
            });
        }
    });

    // Sort themes by popularity (most to least)
    const themes = Object.entries(themePopularity)
        .sort((a, b) => b[1] - a[1])
        .map(([theme, _]) => theme);

    // Sort companies by composite score (descending)
    companies.sort((a, b) => (b[1].composite_score || 0) - (a[1].composite_score || 0));

    // Find max score for color scaling
    let maxScore = 0;
    companies.forEach(([_, scoring]) => {
        if (scoring.themes) {
            Object.values(scoring.themes).forEach(score => {
                if (score > maxScore) maxScore = score;
            });
        }
    });

    // Create HTML with only the heatmap
    let html = `
        <div class="mb-6">
            <h3 class="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"></path>
                </svg>
                Company-Theme Heatmap
            </h3>
            <p class="text-zinc-400 text-sm mb-6">Theme exposure scores across all companies</p>
        </div>

        <!-- Heatmap -->
        <div class="bg-zinc-800/50 rounded-lg border border-zinc-700 p-4">
            <div class="mb-4 flex gap-2 items-center text-xs text-zinc-400 relative z-30">
                <span>Color Scale:</span>
                <div class="flex items-center gap-1">
                    <div class="w-6 h-4 bg-zinc-800 border border-zinc-600 rounded"></div>
                    <span>0</span>
                </div>
                <div class="flex-1 h-4 bg-gradient-to-r from-zinc-800 via-red-700 to-red-400 rounded max-w-xs"></div>
                <div class="flex items-center gap-1">
                    <span>${maxScore}</span>
                    <div class="w-6 h-4 bg-red-400 border border-red-300 rounded"></div>
                </div>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full border-collapse">
                    <thead>
                        <tr>
                            <th class="sticky left-0 z-20 bg-zinc-800 px-4 py-3 text-left text-sm font-semibold text-white border-b-2 border-zinc-600 min-w-[200px]">Company</th>
                            <th class="sticky left-[200px] z-20 bg-zinc-800 px-3 py-3 text-center text-sm font-semibold text-white border-b-2 border-zinc-600 min-w-[80px]">Score</th>
    `;

    // Theme headers (ordered by popularity) - fully vertical with increased font size
    themes.forEach(theme => {
        html += `<th class="bg-zinc-800 px-2 py-3 text-left text-sm font-bold text-zinc-200 border-b-2 border-zinc-600 min-w-[40px] max-w-[40px]">
            <div class="flex justify-center" style="height: 250px;">
                <div class="transform -rotate-90 origin-center whitespace-nowrap flex items-center" style="width: 250px; transform-origin: center center;">
                    ${escapeHtml(theme)}
                </div>
            </div>
        </th>`;
    });

    html += `</tr></thead><tbody>`;

    // Company rows
    companies.forEach(([companyName, scoring], rowIdx) => {
        const bgClass = rowIdx % 2 === 0 ? 'bg-zinc-900/50' : 'bg-zinc-800/30';
        html += `<tr class="${bgClass} hover:bg-zinc-700/50 transition-colors">`;
        
        // Company name (sticky)
        html += `<td class="sticky left-0 z-10 ${bgClass} hover:bg-zinc-700/50 px-4 py-3 text-sm font-medium text-zinc-200 border-b border-zinc-700">
            <div class="flex items-center gap-2">
                <span class="text-xs bg-red-500 text-white px-2 py-0.5 rounded font-mono">${escapeHtml(scoring.ticker || 'N/A')}</span>
                <span class="truncate max-w-[150px]" title="${escapeHtml(companyName)}">${escapeHtml(companyName)}</span>
            </div>
        </td>`;
        
        // Composite score (sticky)
        html += `<td class="sticky left-[200px] z-10 ${bgClass} hover:bg-zinc-700/50 px-3 py-3 text-center text-sm font-bold text-red-400 border-b border-zinc-700">${escapeHtml(scoring.composite_score)}</td>`;
        
        // Theme scores (ordered by popularity)
        themes.forEach(theme => {
            const score = (scoring.themes && theme in scoring.themes) ? scoring.themes[theme] : 0;
            const intensity = maxScore > 0 ? score / maxScore : 0;
            
            // Color calculation: dark (0) to red (high risk)
            let bgColor = 'bg-zinc-800';
            let textColor = 'text-zinc-600';
            let borderColor = 'border-zinc-700';
            
            if (score > 0) {
                const riskShades = [
                    { threshold: 0.2, bg: 'bg-red-900', text: 'text-red-300', border: 'border-red-800' },
                    { threshold: 0.4, bg: 'bg-red-800', text: 'text-red-200', border: 'border-red-700' },
                    { threshold: 0.6, bg: 'bg-red-700', text: 'text-red-100', border: 'border-red-600' },
                    { threshold: 0.8, bg: 'bg-red-600', text: 'text-white', border: 'border-red-500' },
                    { threshold: 1.0, bg: 'bg-red-500', text: 'text-white', border: 'border-red-400' }
                ];
                
                for (const shade of riskShades) {
                    if (intensity <= shade.threshold) {
                        bgColor = shade.bg;
                        textColor = shade.text;
                        borderColor = shade.border;
                        break;
                    }
                }
            }
            
            html += `<td class="px-3 py-3 text-center text-xs font-semibold border-b border-r ${borderColor} ${bgColor} ${textColor} transition-all hover:scale-110 hover:z-30 cursor-pointer" 
                title="${escapeHtml(companyName)}\n${escapeHtml(theme)}: ${score}">
                ${score > 0 ? score : ''}
            </td>`;
        });
        
        html += `</tr>`;
    });

    html += `</tbody></table></div></div>`;

    container.innerHTML = html;
}
