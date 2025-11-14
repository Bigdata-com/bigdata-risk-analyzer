// Heatmap Visualization - Companies vs Themes
let currentHeatmapData = null;
let currentSortField = '';
let currentSortDirection = 'desc';
let isRiskView = false; // false = company view, true = risk view
let isSectorAggregated = false; // false = company view, true = sector aggregated view

// Numeric composite score helper (shared)
function getNumericCompositeScore(scoring) {
    const raw = scoring && scoring.composite_score;
    let n = typeof raw === 'string' ? parseFloat(raw.replace(/,/g, '').trim()) : Number(raw);
    if (!Number.isFinite(n)) {
        const themeValues = scoring && scoring.themes ? Object.values(scoring.themes) : [];
        n = themeValues.reduce((sum, v) => sum + (Number(v) || 0), 0);
    }
    return n;
}

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

    // Find max score for color scaling (from individual companies)
    let maxScore = 0;
    companies.forEach(([_, scoring]) => {
        if (scoring.themes) {
            Object.values(scoring.themes).forEach(score => {
                if (score > maxScore) maxScore = score;
            });
        }
    });

    // Calculate Coverage and Intensity scores for each company
    function calculateCoverageAndIntensity(companies, themes, maxScore) {
        const K = themes.length; // Total number of risk types
        const results = {};
        
        // First pass: find max evidence per risk across all companies
        const maxPerRisk = {};
        themes.forEach(theme => {
            maxPerRisk[theme] = 0;
            companies.forEach(([_, scoring]) => {
                const score = (scoring.themes && scoring.themes[theme]) || 0;
                if (score > maxPerRisk[theme]) {
                    maxPerRisk[theme] = score;
                }
            });
        });
        
        // Second pass: calculate Coverage and Intensity for each company
        companies.forEach(([companyName, scoring]) => {
            // Coverage: fraction of risks the company is exposed to
            let riskCount = 0;
            themes.forEach(theme => {
                const score = (scoring.themes && scoring.themes[theme]) || 0;
                if (score > 0) riskCount++;
            });
            const coverage = K > 0 ? riskCount / K : 0;
            
            // Intensity: average normalized evidence per risk
            let intensitySum = 0;
            themes.forEach(theme => {
                const score = (scoring.themes && scoring.themes[theme]) || 0;
                const maxForRisk = maxPerRisk[theme];
                if (maxForRisk > 0) {
                    intensitySum += score / maxForRisk;
                }
            });
            const intensity = K > 0 ? intensitySum / K : 0;
            
            results[companyName] = {
                coverage: coverage,
                intensity: intensity
            };
        });
        
        return results;
    }

    // Aggregate companies by sector
    function aggregateBySector(companies, themes) {
        const sectorGroups = {};
        
        // Group companies by sector
        companies.forEach(([companyName, scoring]) => {
            const sector = scoring.sector || 'Unknown';
            if (!sectorGroups[sector]) {
                sectorGroups[sector] = {
                    companies: [],
                    aggregatedThemes: {},
                    composite_score: 0,
                    sector: sector
                };
            }
            sectorGroups[sector].companies.push(companyName);
            
            // Aggregate theme scores (sum across companies in sector)
            if (scoring.themes) {
                Object.entries(scoring.themes).forEach(([theme, score]) => {
                    if (!sectorGroups[sector].aggregatedThemes[theme]) {
                        sectorGroups[sector].aggregatedThemes[theme] = 0;
                    }
                    sectorGroups[sector].aggregatedThemes[theme] += score || 0;
                });
            }
            
            // Sum composite scores
            const compScore = getNumericCompositeScore(scoring);
            sectorGroups[sector].composite_score += compScore;
        });
        
        // Convert to array format similar to companies array
        const aggregatedCompanies = Object.entries(sectorGroups).map(([sectorName, sectorData]) => {
            return [sectorName, {
                sector: sectorName,
                themes: sectorData.aggregatedThemes,
                composite_score: sectorData.composite_score,
                company_count: sectorData.companies.length,
                companies: sectorData.companies // Store list of companies for reference
            }];
        });
        
        return aggregatedCompanies;
    }

    // Calculate Coverage and Intensity
    const coverageIntensity = calculateCoverageAndIntensity(companies, themes, maxScore);
    
    // Store data globally for sorting (store both original and aggregated)
    const aggregatedSectors = aggregateBySector(companies, themes);
    const aggregatedCoverageIntensity = calculateCoverageAndIntensity(aggregatedSectors, themes, maxScore);
    
    // Calculate max score for aggregated sectors (for color scaling)
    let aggregatedMaxScore = 0;
    aggregatedSectors.forEach(([_, scoring]) => {
        if (scoring.themes) {
            Object.values(scoring.themes).forEach(score => {
                if (score > aggregatedMaxScore) aggregatedMaxScore = score;
            });
        }
    });
    
    currentHeatmapData = { 
        companies, 
        themes, 
        maxScore, 
        aggregatedMaxScore,
        coverageIntensity,
        aggregatedSectors,
        aggregatedCoverageIntensity
    };
    
    // Use aggregated data if sector aggregation is enabled
    const displayData = isSectorAggregated ? aggregatedSectors : companies;
    const displayCoverageIntensity = isSectorAggregated ? aggregatedCoverageIntensity : coverageIntensity;
    
    // Use appropriate maxScore based on aggregation mode
    const displayMaxScore = isSectorAggregated ? aggregatedMaxScore : maxScore;
    
    // Sort companies/sectors by current sort field
    sortHeatmapCompanies(displayData, currentSortField, currentSortDirection);

    // Create HTML with only the heatmap
    let html = `
        <div class="mb-6">
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h3 class="text-2xl font-bold text-white flex items-center gap-2">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"></path>
                        </svg>
                        Company-Risk Heatmap
                    </h3>
                    <p class="text-zinc-400 text-sm mt-1">Risk exposure scores across all companies</p>
                </div>
                <div class="flex items-center gap-3">
                    <button onclick="flipHeatmapView()" 
                            class="flex items-center gap-2 px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 
                                   border border-orange-500/30 rounded-lg text-orange-400 text-sm font-medium 
                                   transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                        </svg>
                        <span id="flipButtonText">View by Risks</span>
                    </button>
                    <button onclick="toggleSectorAggregation()" 
                            class="flex items-center gap-2 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 
                                   border border-green-500/30 rounded-lg text-green-400 text-sm font-medium 
                                   transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                        </svg>
                        <span id="sectorAggButtonText">Aggregate by sector</span>
                    </button>
                    <button onclick="showHeatmapGuide()" 
                            class="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 
                                   border border-blue-500/30 rounded-lg text-blue-400 text-sm font-medium 
                                   transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        Info
                    </button>
                </div>
            </div>
            
            <!-- Tooltips -->
            <div id="heatmap-tooltip-coverage" class="hidden absolute z-50 bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-xs text-zinc-300 shadow-xl max-w-xs" style="top: -80px; left: 50%; transform: translateX(-50%);">
                <strong>Coverage Score:</strong> Breadth of risk exposure. Percentage of risk types that affect this company (number of risks with evidence / total risks).
            </div>
            <div id="heatmap-tooltip-intensity" class="hidden absolute z-50 bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-xs text-zinc-300 shadow-xl max-w-xs" style="top: -80px; left: 50%; transform: translateX(-50%);">
                <strong>Intensity Score:</strong> Depth of risk exposure. Average normalized evidence per risk type, showing how much evidence exists relative to the maximum for each risk.
            </div>
            <div id="heatmap-tooltip-score" class="hidden absolute z-50 bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-xs text-zinc-300 shadow-xl max-w-xs" style="top: -80px; left: 50%; transform: translateX(-50%);">
                <strong>Raw Score:</strong> Total sum of all evidence scores across all risk types for this company. This is the original composite score before normalization.
            </div>
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
                    <span>${displayMaxScore}</span>
                    <div class="w-6 h-4 bg-red-400 border border-red-300 rounded"></div>
                </div>
            </div>
            <!-- Top horizontal scrollbar -->
            <div id="top-scrollbar" class="overflow-x-auto mb-2" style="height: 20px; display: none;">
                <div id="top-scroll-content" style="width: 100%; height: 1px;"></div>
            </div>
            <div id="table-container" class="overflow-x-auto">
                <table class="w-full border-collapse">
                    <thead>
                        <tr>
                            <th class="sticky left-0 z-20 bg-zinc-800 px-4 py-3 text-left text-sm font-semibold text-white border-b-2 border-zinc-600 min-w-[200px]">${isSectorAggregated ? 'Sector' : 'Company'}</th>
                            <th class="sticky left-[200px] z-20 bg-zinc-800 px-2 py-3 text-center text-sm font-semibold text-white border-b-2 border-zinc-600 min-w-[60px] cursor-pointer hover:bg-zinc-700/50" onclick="sortHeatmap('coverage')">
                                Coverage<br>Score
                            </th>
                            <th class="sticky left-[260px] z-20 bg-zinc-800 px-2 py-3 text-center text-sm font-semibold text-white border-b-2 border-zinc-600 min-w-[60px] cursor-pointer hover:bg-zinc-700/50" onclick="sortHeatmap('intensity')">
                                Intensity<br>Score
                            </th>
                            <th class="sticky left-[320px] z-20 bg-zinc-800 px-2 py-3 text-center text-sm font-semibold text-white border-b-2 border-zinc-600 min-w-[60px] cursor-pointer hover:bg-zinc-700/50" onclick="sortHeatmap('score')">
                                Raw<br>Score
                            </th>
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

    // Company/Sector rows
    displayData.forEach(([itemName, scoring], rowIdx) => {
        const bgClass = rowIdx % 2 === 0 ? 'bg-zinc-900/50' : 'bg-zinc-800/30';
        html += `<tr class="${bgClass} hover:bg-zinc-700/50 transition-colors">`;
        
        // Company/Sector name (sticky)
        if (isSectorAggregated) {
            html += `<td class="sticky left-0 z-10 ${bgClass} hover:bg-zinc-700/50 px-4 py-3 text-sm font-medium text-zinc-200 border-b border-zinc-700">
                <div class="flex items-center gap-2">
                    <span class="text-xs bg-green-500 text-white px-2 py-0.5 rounded font-mono">${scoring.company_count || 0}</span>
                    <span class="truncate max-w-[150px]" title="${escapeHtml(itemName)}">${escapeHtml(itemName)}</span>
                </div>
            </td>`;
        } else {
            html += `<td class="sticky left-0 z-10 ${bgClass} hover:bg-zinc-700/50 px-4 py-3 text-sm font-medium text-zinc-200 border-b border-zinc-700">
                <div class="flex items-center gap-2">
                    <span class="text-xs bg-red-500 text-white px-2 py-0.5 rounded font-mono">${escapeHtml(scoring.ticker || 'N/A')}</span>
                    <span class="truncate max-w-[150px]" title="${escapeHtml(itemName)}">${escapeHtml(itemName)}</span>
                </div>
            </td>`;
        }
        
        // Coverage score
        const coverageValue = displayCoverageIntensity[itemName].coverage;
        const coveragePercent = (coverageValue * 100).toFixed(0);
        html += `<td class="sticky left-[200px] z-10 ${bgClass} hover:bg-zinc-700/50 px-2 py-3 text-center text-sm font-medium text-blue-400 border-b border-zinc-700">${coveragePercent}%</td>`;

        // Intensity score
        const intensityValue = displayCoverageIntensity[itemName].intensity;
        const intensityPercent = (intensityValue * 100).toFixed(0);
        html += `<td class="sticky left-[260px] z-10 ${bgClass} hover:bg-zinc-700/50 px-2 py-3 text-center text-sm font-medium text-purple-400 border-b border-zinc-700">${intensityPercent}%</td>`;

        // Composite score (update sticky position)
        const compositeDisplay = getNumericCompositeScore(scoring);
        html += `<td class="sticky left-[320px] z-10 ${bgClass} hover:bg-zinc-700/50 px-2 py-3 text-center text-sm font-bold text-red-400 border-b border-zinc-700">${compositeDisplay}</td>`;
        
        // Theme scores (ordered by popularity)
        themes.forEach(theme => {
            const score = (scoring.themes && theme in scoring.themes) ? scoring.themes[theme] : 0;
            const intensity = displayMaxScore > 0 ? score / displayMaxScore : 0;
            
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
                title="${escapeHtml(itemName)}\n${escapeHtml(theme)}: ${score}"
                onclick="filterByCompanyAndTheme('${escapeHtml(itemName)}', '${escapeHtml(theme)}')">
                ${score > 0 ? score : ''}
            </td>`;
        });
        
        html += `</tr>`;
    });

    html += `</tbody></table></div></div>`;

    container.innerHTML = html;
    
    // Synchronize scrollbars (measure after layout; observe resizes)
    const topScrollbar = document.getElementById('top-scrollbar');
    const tableContainer = document.getElementById('table-container');
    
    if (topScrollbar && tableContainer) {
        // Sync top scrollbar with table scroll
        topScrollbar.addEventListener('scroll', () => {
            tableContainer.scrollLeft = topScrollbar.scrollLeft;
        });
        
        // Sync table scroll with top scrollbar
        tableContainer.addEventListener('scroll', () => {
            topScrollbar.scrollLeft = tableContainer.scrollLeft;
        });
        
        const table = tableContainer.querySelector('table');
        const topScrollContent = document.getElementById('top-scroll-content');
        const measure = () => {
            if (!table) return;
            const tableWidth = table.scrollWidth;
            if (topScrollContent) topScrollContent.style.width = tableWidth + 'px';
            topScrollbar.style.display = tableWidth > tableContainer.clientWidth ? 'block' : 'none';
        };
        requestAnimationFrame(measure);
        if (window.ResizeObserver) {
            const ro = new ResizeObserver(measure);
            ro.observe(tableContainer);
            if (table) ro.observe(table);
        } else {
            window.addEventListener('resize', measure);
        }
    }
}

// Tooltip management for heatmap
function showHeatmapTooltip(type) {
    const tooltip = document.getElementById(`heatmap-tooltip-${type}`);
    if (tooltip) {
        tooltip.classList.remove('hidden');
    }
}

function hideHeatmapTooltip(type) {
    const tooltip = document.getElementById(`heatmap-tooltip-${type}`);
    if (tooltip) {
        tooltip.classList.add('hidden');
    }
}

// Sorting functions
function sortHeatmapCompanies(companies, field, direction) {
    // Do not sort on initial render when no field selected
    if (!field) return;
    
    // Determine which coverage/intensity data to use based on aggregation mode
    const coverageIntensityData = isSectorAggregated 
        ? currentHeatmapData.aggregatedCoverageIntensity 
        : currentHeatmapData.coverageIntensity;
    
    companies.sort((a, b) => {
        let aValue, bValue;
        
        switch (field) {
            case 'coverage':
                aValue = coverageIntensityData[a[0]]?.coverage || 0;
                bValue = coverageIntensityData[b[0]]?.coverage || 0;
                break;
            case 'intensity':
                aValue = coverageIntensityData[a[0]]?.intensity || 0;
                bValue = coverageIntensityData[b[0]]?.intensity || 0;
                break;
            case 'score':
            default:
                // Simple numeric conversion for composite_score
                aValue = Number(a[1].composite_score) || 0;
                bValue = Number(b[1].composite_score) || 0;
                break;
        }
        
        const diff = direction === 'asc' ? (aValue - bValue) : (bValue - aValue);
        if (diff !== 0) return diff;
        // Tie-breaker by company name (stable ordering)
        const nameA = a[0] || '';
        const nameB = b[0] || '';
        return nameA.localeCompare(nameB);
    });
}

function sortHeatmap(field) {
    if (!currentHeatmapData) {
        console.error('No heatmap data available for sorting');
        return;
    }
    
    // Toggle direction if same field, otherwise default to desc
    if (currentSortField === field) {
        currentSortDirection = currentSortDirection === 'desc' ? 'asc' : 'desc';
    } else {
        currentSortField = field;
        currentSortDirection = 'desc';
    }
    
    // Re-sort and re-render (use appropriate data source)
    const displayData = isSectorAggregated ? currentHeatmapData.aggregatedSectors : currentHeatmapData.companies;
    sortHeatmapCompanies(displayData, currentSortField, currentSortDirection);
    renderHeatmapFromData();
}

function renderHeatmapFromData() {
    if (!currentHeatmapData) return;
    
    const container = document.querySelector('[data-tab-content="summary"] .tab-actual-content');
    if (!container) return;
    
    // Re-render with current data
    const { companies, themes, maxScore, aggregatedMaxScore, coverageIntensity, aggregatedSectors, aggregatedCoverageIntensity } = currentHeatmapData;
    
    // Use aggregated data if sector aggregation is enabled
    const displayData = isSectorAggregated ? aggregatedSectors : companies;
    const displayCoverageIntensity = isSectorAggregated ? aggregatedCoverageIntensity : coverageIntensity;
    
    // Use appropriate maxScore based on aggregation mode
    const displayMaxScore = isSectorAggregated ? aggregatedMaxScore : maxScore;
    
    // Sort companies/sectors by current sort field
    sortHeatmapCompanies(displayData, currentSortField, currentSortDirection);

    // Create HTML with only the heatmap
    let html = `
        <div class="mb-6">
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h3 class="text-2xl font-bold text-white flex items-center gap-2">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"></path>
                </svg>
                Company-Risk Heatmap
            </h3>
                    <p class="text-zinc-400 text-sm mt-1">Risk exposure scores across all companies</p>
                </div>
                <div class="flex items-center gap-3">
                    <button onclick="flipHeatmapView()" 
                            class="flex items-center gap-2 px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 
                                   border border-orange-500/30 rounded-lg text-orange-400 text-sm font-medium 
                                   transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                        </svg>
                        <span id="flipButtonText">View by Risks</span>
                    </button>
                    <button onclick="toggleSectorAggregation()" 
                            class="flex items-center gap-2 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 
                                   border border-green-500/30 rounded-lg text-green-400 text-sm font-medium 
                                   transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                        </svg>
                        <span id="sectorAggButtonText">${isSectorAggregated ? 'Aggregate by company' : 'Aggregate by sector'}</span>
                    </button>
                    <button onclick="showHeatmapGuide()" 
                            class="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 
                                   border border-blue-500/30 rounded-lg text-blue-400 text-sm font-medium 
                                   transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        Info
                    </button>
                </div>
            </div>
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
                    <span>${displayMaxScore}</span>
                    <div class="w-6 h-4 bg-red-400 border border-red-300 rounded"></div>
                </div>
            </div>
            <!-- Top horizontal scrollbar -->
            <div id="top-scrollbar" class="overflow-x-auto mb-2" style="height: 20px; display: none;">
                <div id="top-scroll-content" style="width: 100%; height: 1px;"></div>
            </div>
            <div id="table-container" class="overflow-x-auto">
                <table class="w-full border-collapse">
                    <thead>
                        <tr>
                            <th class="sticky left-0 z-20 bg-zinc-800 px-4 py-3 text-left text-sm font-semibold text-white border-b-2 border-zinc-600 min-w-[200px]">${isSectorAggregated ? 'Sector' : 'Company'}</th>
                            <th class="sticky left-[200px] z-20 bg-zinc-800 px-2 py-3 text-center text-sm font-semibold text-white border-b-2 border-zinc-600 min-w-[60px] cursor-pointer hover:bg-zinc-700/50" onclick="sortHeatmap('coverage')">
                                Coverage<br>Score
                            </th>
                            <th class="sticky left-[260px] z-20 bg-zinc-800 px-2 py-3 text-center text-sm font-semibold text-white border-b-2 border-zinc-600 min-w-[60px] cursor-pointer hover:bg-zinc-700/50" onclick="sortHeatmap('intensity')">
                                Intensity<br>Score
                            </th>
                            <th class="sticky left-[320px] z-20 bg-zinc-800 px-2 py-3 text-center text-sm font-semibold text-white border-b-2 border-zinc-600 min-w-[60px] cursor-pointer hover:bg-zinc-700/50" onclick="sortHeatmap('score')">
                                Raw<br>Score
                            </th>
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

    // Company/Sector rows
    displayData.forEach(([itemName, scoring], rowIdx) => {
        const bgClass = rowIdx % 2 === 0 ? 'bg-zinc-900/50' : 'bg-zinc-800/30';
        html += `<tr class="${bgClass} hover:bg-zinc-700/50 transition-colors">`;
        
        // Company/Sector name (sticky)
        if (isSectorAggregated) {
            html += `<td class="sticky left-0 z-10 ${bgClass} hover:bg-zinc-700/50 px-4 py-3 text-sm font-medium text-zinc-200 border-b border-zinc-700">
                <div class="flex items-center gap-2">
                    <span class="text-xs bg-green-500 text-white px-2 py-0.5 rounded font-mono">${scoring.company_count || 0}</span>
                    <span class="truncate max-w-[150px]" title="${escapeHtml(itemName)}">${escapeHtml(itemName)}</span>
                </div>
            </td>`;
        } else {
            html += `<td class="sticky left-0 z-10 ${bgClass} hover:bg-zinc-700/50 px-4 py-3 text-sm font-medium text-zinc-200 border-b border-zinc-700">
                <div class="flex items-center gap-2">
                    <span class="text-xs bg-red-500 text-white px-2 py-0.5 rounded font-mono">${escapeHtml(scoring.ticker || 'N/A')}</span>
                    <span class="truncate max-w-[150px]" title="${escapeHtml(itemName)}">${escapeHtml(itemName)}</span>
                </div>
            </td>`;
        }
        
        // Coverage score
        const coverageValue = displayCoverageIntensity[itemName].coverage;
        const coveragePercent = (coverageValue * 100).toFixed(0);
        html += `<td class="sticky left-[200px] z-10 ${bgClass} hover:bg-zinc-700/50 px-2 py-3 text-center text-sm font-medium text-blue-400 border-b border-zinc-700">${coveragePercent}%</td>`;

        // Intensity score
        const intensityValue = displayCoverageIntensity[itemName].intensity;
        const intensityPercent = (intensityValue * 100).toFixed(0);
        html += `<td class="sticky left-[260px] z-10 ${bgClass} hover:bg-zinc-700/50 px-2 py-3 text-center text-sm font-medium text-purple-400 border-b border-zinc-700">${intensityPercent}%</td>`;

        // Composite score (update sticky position)
        const compositeDisplay2 = getNumericCompositeScore(scoring);
        html += `<td class="sticky left-[320px] z-10 ${bgClass} hover:bg-zinc-700/50 px-2 py-3 text-center text-sm font-bold text-red-400 border-b border-zinc-700">${compositeDisplay2}</td>`;
        
        // Theme scores (ordered by popularity)
        themes.forEach(theme => {
            const score = (scoring.themes && theme in scoring.themes) ? scoring.themes[theme] : 0;
            const intensity = displayMaxScore > 0 ? score / displayMaxScore : 0;
            
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
                title="${escapeHtml(itemName)}\n${escapeHtml(theme)}: ${score}"
                onclick="filterByCompanyAndTheme('${escapeHtml(itemName)}', '${escapeHtml(theme)}')">
                ${score > 0 ? score : ''}
            </td>`;
        });
        
        html += `</tr>`;
    });

    html += `</tbody></table></div></div>`;

    container.innerHTML = html;
    
    // Synchronize scrollbars
    const topScrollbar = document.getElementById('top-scrollbar');
    const tableContainer = document.getElementById('table-container');
    
    if (topScrollbar && tableContainer) {
        // Sync top scrollbar with table scroll
        topScrollbar.addEventListener('scroll', () => {
            tableContainer.scrollLeft = topScrollbar.scrollLeft;
        });
        
        // Sync table scroll with top scrollbar
        tableContainer.addEventListener('scroll', () => {
            topScrollbar.scrollLeft = tableContainer.scrollLeft;
        });
        
        // Update top scrollbar width to match table content
        const table = tableContainer.querySelector('table');
        if (table) {
            const tableWidth = table.scrollWidth;
            const topScrollContent = document.getElementById('top-scroll-content');
            if (topScrollContent) {
                topScrollContent.style.width = tableWidth + 'px';
            }
            
            // Only show top scrollbar if table content is wider than container
            if (tableWidth > tableContainer.clientWidth) {
                topScrollbar.style.display = 'block';
            } else {
                topScrollbar.style.display = 'none';
            }
        }
    }
}

// Heatmap Guide Modal Functions
function showHeatmapGuide() {
    const modal = document.getElementById('heatmapGuideModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function hideHeatmapGuide() {
    const modal = document.getElementById('heatmapGuideModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Flip View Functions
function flipHeatmapView() {
    isRiskView = !isRiskView;
    const buttonText = document.getElementById('flipButtonText');
    if (buttonText) {
        buttonText.textContent = isRiskView ? 'View by Companies' : 'View by Risks';
    }
    
    if (isRiskView) {
        renderRiskView();
    } else {
        renderHeatmapFromData();
    }
}

// Toggle Sector Aggregation
function toggleSectorAggregation() {
    isSectorAggregated = !isSectorAggregated;
    const buttonText = document.getElementById('sectorAggButtonText');
    if (buttonText) {
        buttonText.textContent = isSectorAggregated ? 'Aggregate by company' : 'Aggregate by sector';
    }
    
    // Re-render the current view with updated aggregation
    if (isRiskView) {
        renderRiskView();
    } else {
        renderHeatmapFromData();
    }
}

// Risk-based calculations
function calculateRiskCoverageAndIntensity(companies, themes) {
    const results = {};
    const totalCompanies = companies.length;
    
    themes.forEach(theme => {
        // Coverage: how many companies are exposed to this risk
        let exposedCompanies = 0;
        let totalEvidence = 0;
        let maxEvidence = 0;
        
        companies.forEach(([_, scoring]) => {
            const score = (scoring.themes && scoring.themes[theme]) || 0;
            if (score > 0) {
                exposedCompanies++;
                totalEvidence += score;
            }
            if (score > maxEvidence) {
                maxEvidence = score;
            }
        });
        
        const coverage = totalCompanies > 0 ? exposedCompanies / totalCompanies : 0;
        const intensity = maxEvidence > 0 ? totalEvidence / (maxEvidence * totalCompanies) : 0;
        
        results[theme] = {
            coverage: coverage,
            intensity: intensity,
            totalEvidence: totalEvidence
        };
    });
    
    return results;
}

// Render risk-based view
function renderRiskView() {
    if (!currentHeatmapData) return;
    
    const container = document.querySelector('[data-tab-content="summary"] .tab-actual-content');
    if (!container) return;
    
    const { companies, themes, maxScore, aggregatedMaxScore, aggregatedSectors } = currentHeatmapData;
    
    // Use aggregated data if sector aggregation is enabled
    const displayData = isSectorAggregated ? aggregatedSectors : companies;
    const riskScores = calculateRiskCoverageAndIntensity(displayData, themes);
    
    // Use appropriate maxScore based on aggregation mode
    const displayMaxScore = isSectorAggregated ? aggregatedMaxScore : maxScore;
    
    // Use the themes from currentHeatmapData (they may have been sorted)
    // If not sorted yet, sort by total evidence (descending)
    let sortedRisks;
    if (currentHeatmapData.themes && currentHeatmapData.themes.length === themes.length) {
        // Use already sorted themes
        sortedRisks = currentHeatmapData.themes;
    } else {
        // Sort by total evidence (descending) - create copy to avoid mutation
        sortedRisks = [...themes].sort((a, b) => (riskScores[b].totalEvidence || 0) - (riskScores[a].totalEvidence || 0));
    }
    
    // Create HTML for risk view
    let html = `
        <div class="mb-6">
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h3 class="text-2xl font-bold text-white flex items-center gap-2">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"></path>
                        </svg>
                        Risk-Company Heatmap
                    </h3>
                    <p class="text-zinc-400 text-sm mt-1">Risk exposure scores across all companies</p>
                </div>
                <div class="flex items-center gap-3">
                    <button onclick="flipHeatmapView()" 
                            class="flex items-center gap-2 px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 
                                   border border-orange-500/30 rounded-lg text-orange-400 text-sm font-medium 
                                   transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                        </svg>
                        <span id="flipButtonText">View by Companies</span>
                    </button>
                    <button onclick="toggleSectorAggregation()" 
                            class="flex items-center gap-2 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 
                                   border border-green-500/30 rounded-lg text-green-400 text-sm font-medium 
                                   transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                        </svg>
                        <span id="sectorAggButtonText">Aggregate by sector</span>
                    </button>
                    <button onclick="showHeatmapGuide()" 
                            class="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 
                                   border border-blue-500/30 rounded-lg text-blue-400 text-sm font-medium 
                                   transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        Info
                    </button>
                </div>
            </div>
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
                    <span>${displayMaxScore}</span>
                    <div class="w-6 h-4 bg-red-400 border border-red-300 rounded"></div>
                </div>
            </div>
            <!-- Top horizontal scrollbar -->
            <div id="top-scrollbar" class="overflow-x-auto mb-2" style="height: 20px; display: none;">
                <div id="top-scroll-content" style="width: 100%; height: 1px;"></div>
            </div>
            <div id="table-container" class="overflow-x-auto">
                <table class="w-full border-collapse">
                    <thead>
                        <tr>
                            <th class="sticky left-0 z-20 bg-zinc-800 px-4 py-3 text-left text-sm font-semibold text-white border-b-2 border-zinc-600 min-w-[200px]">Risk Factor</th>
                            <th class="sticky left-[200px] z-20 bg-zinc-800 px-3 py-3 text-center text-sm font-semibold text-white border-b-2 border-zinc-600 min-w-[80px] cursor-pointer hover:bg-zinc-700/50" onclick="sortRiskHeatmap('coverage')">
                                Coverage<br>Score
                            </th>
                            <th class="sticky left-[280px] z-20 bg-zinc-800 px-3 py-3 text-center text-sm font-semibold text-white border-b-2 border-zinc-600 min-w-[80px] cursor-pointer hover:bg-zinc-700/50" onclick="sortRiskHeatmap('intensity')">
                                Intensity<br>Score
                            </th>
                            <th class="sticky left-[360px] z-20 bg-zinc-800 px-3 py-3 text-center text-sm font-semibold text-white border-b-2 border-zinc-600 min-w-[80px] cursor-pointer hover:bg-zinc-700/50" onclick="sortRiskHeatmap('evidence')">
                                Raw<br>Score
                            </th>
    `;

    // Company/Sector headers (horizontal)
    displayData.forEach(([itemName, _], idx) => {
        html += `<th class="bg-zinc-800 px-2 py-3 text-left text-sm font-bold text-zinc-200 border-b-2 border-zinc-600 min-w-[40px] max-w-[40px]">
            <div class="flex justify-center" style="height: 250px;">
                <div class="transform -rotate-90 origin-center whitespace-nowrap flex items-center" style="width: 250px; transform-origin: center center;">
                    ${escapeHtml(itemName)}
                </div>
            </div>
        </th>`;
    });

    html += `</tr></thead><tbody>`;

    // Risk rows
    sortedRisks.forEach((risk, rowIdx) => {
        const bgClass = rowIdx % 2 === 0 ? 'bg-zinc-900/50' : 'bg-zinc-800/30';
        const riskData = riskScores[risk];
        
        html += `<tr class="${bgClass} hover:bg-zinc-700/50 transition-colors">`;
        
        // Risk name (sticky)
        html += `<td class="sticky left-0 z-10 ${bgClass} hover:bg-zinc-700/50 px-4 py-3 text-sm font-medium text-zinc-200 border-b border-zinc-700">
            <span class="truncate max-w-[150px]" title="${escapeHtml(risk)}">${escapeHtml(risk)}</span>
        </td>`;
        
        // Coverage score
        const coveragePercent = (riskData.coverage * 100).toFixed(0);
        html += `<td class="sticky left-[200px] z-10 ${bgClass} hover:bg-zinc-700/50 px-3 py-3 text-center text-sm font-medium text-blue-400 border-b border-zinc-700">${coveragePercent}%</td>`;

        // Intensity score
        const intensityPercent = (riskData.intensity * 100).toFixed(0);
        html += `<td class="sticky left-[280px] z-10 ${bgClass} hover:bg-zinc-700/50 px-3 py-3 text-center text-sm font-medium text-purple-400 border-b border-zinc-700">${intensityPercent}%</td>`;

        // Total evidence
        html += `<td class="sticky left-[360px] z-10 ${bgClass} hover:bg-zinc-700/50 px-3 py-3 text-center text-sm font-bold text-red-400 border-b border-zinc-700">${riskData.totalEvidence}</td>`;
        
        // Company/Sector scores (horizontal)
        displayData.forEach(([itemName, scoring]) => {
            const score = (scoring.themes && scoring.themes[risk]) || 0;
            const intensity = displayMaxScore > 0 ? score / displayMaxScore : 0;
            
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
                title="${escapeHtml(risk)}\n${escapeHtml(itemName)}: ${score}"
                onclick="filterByCompanyAndTheme('${escapeHtml(itemName)}', '${escapeHtml(risk)}')">
                ${score > 0 ? score : ''}
            </td>`;
        });
        
        html += `</tr>`;
    });

    html += `</tbody></table></div></div>`;

    container.innerHTML = html;
    
    // Synchronize scrollbars
    const topScrollbar = document.getElementById('top-scrollbar');
    const tableContainer = document.getElementById('table-container');
    
    if (topScrollbar && tableContainer) {
        // Sync top scrollbar with table scroll
        topScrollbar.addEventListener('scroll', () => {
            tableContainer.scrollLeft = topScrollbar.scrollLeft;
        });
        
        // Sync table scroll with top scrollbar
        tableContainer.addEventListener('scroll', () => {
            topScrollbar.scrollLeft = tableContainer.scrollLeft;
        });
        
        // Update top scrollbar width to match table content
        const table = tableContainer.querySelector('table');
        if (table) {
            const tableWidth = table.scrollWidth;
            const topScrollContent = document.getElementById('top-scroll-content');
            if (topScrollContent) {
                topScrollContent.style.width = tableWidth + 'px';
            }
            
            // Only show top scrollbar if table content is wider than container
            if (tableWidth > tableContainer.clientWidth) {
                topScrollbar.style.display = 'block';
            } else {
                topScrollbar.style.display = 'none';
            }
        }
    }
}

// Risk-based sorting
function sortRiskHeatmap(field) {
    if (!currentHeatmapData) return;
    
    const { companies, themes, aggregatedSectors } = currentHeatmapData;
    const displayData = isSectorAggregated ? aggregatedSectors : companies;
    const riskScores = calculateRiskCoverageAndIntensity(displayData, themes);
    
    // Toggle sort direction if same field
    if (currentSortField === field) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortField = field;
        currentSortDirection = 'desc';
    }
    
    // Sort risks based on field (create a copy to avoid mutating original)
    let sortedRisks;
    if (field === 'coverage') {
        sortedRisks = [...themes].sort((a, b) => {
            const aVal = riskScores[a].coverage;
            const bVal = riskScores[b].coverage;
            return currentSortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        });
    } else if (field === 'intensity') {
        sortedRisks = [...themes].sort((a, b) => {
            const aVal = riskScores[a].intensity;
            const bVal = riskScores[b].intensity;
            return currentSortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        });
    } else if (field === 'evidence') {
        sortedRisks = [...themes].sort((a, b) => {
            const aVal = riskScores[a].totalEvidence;
            const bVal = riskScores[b].totalEvidence;
            return currentSortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        });
    } else {
        sortedRisks = [...themes]; // No change
    }
    
    // Update current data with sorted risks
    currentHeatmapData.themes = sortedRisks;
    
    // Re-render the risk view
    renderRiskView();
}

// Make functions globally accessible
window.renderHeatmap = renderHeatmap;
window.showHeatmapTooltip = showHeatmapTooltip;
window.hideHeatmapTooltip = hideHeatmapTooltip;
window.sortHeatmap = sortHeatmap;
window.showHeatmapGuide = showHeatmapGuide;
window.hideHeatmapGuide = hideHeatmapGuide;
window.flipHeatmapView = flipHeatmapView;
window.toggleSectorAggregation = toggleSectorAggregation;
window.sortRiskHeatmap = sortRiskHeatmap;
