// Dashboard Cards - Quick Insights

function renderInfoTooltip(text, id, isClickable = false) {
    const clickHandler = isClickable ? `onclick="showDashboardGuide()"` : '';
    const hoverHandlers = isClickable ? '' : `onmouseenter="showTooltip('${id}')" onmouseleave="hideTooltip('${id}')"`;
    
    return `
        <button class="info-tooltip-trigger ml-1 text-zinc-400 hover:text-zinc-200 transition-colors" 
                data-tooltip-id="${id}"
                ${hoverHandlers}
                ${clickHandler}>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
        </button>
        <div id="tooltip-${id}" class="tooltip-popup hidden absolute z-50 bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-xs text-zinc-300 shadow-xl max-w-xs">
            ${text}
        </div>
    `;
}

function renderDashboardHelp() {
    return `
        <div class="mb-6 flex items-center justify-between">
            <button onclick="showDashboardGuide()" 
                    class="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 
                           border border-blue-500/30 rounded-lg text-blue-400 text-sm font-medium 
                           transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                How to Read This Dashboard
            </button>
        </div>
    `;
}

function renderDashboardCards(data) {
    if (!data) return '';

    // Calculate stats
    const companies = Object.entries(data.theme_scoring || {});
    const totalCompanies = companies.length;
    
    // Calculate total themes
    const allThemes = new Set();
    companies.forEach(([_, scoring]) => {
        if (scoring.themes) {
            Object.keys(scoring.themes).forEach(theme => allThemes.add(theme));
        }
    });
    const totalThemes = allThemes.size;
    
    // Find max score
    let maxScore = 0;
    companies.forEach(([_, scoring]) => {
        if (scoring.composite_score > maxScore) {
            maxScore = scoring.composite_score;
        }
    });
    
    // Count total supporting evidences
    const totalEvidences = (data.content || []).length;
    
    // Get current date/time
    const runDate = new Date().toLocaleString();
    
    // Calculate theme popularity
    const themePopularity = {};
    companies.forEach(([_, scoring]) => {
        if (scoring.themes) {
            Object.entries(scoring.themes).forEach(([theme, score]) => {
                if (!themePopularity[theme]) themePopularity[theme] = 0;
                themePopularity[theme] += score;
            });
        }
    });
    
    // Sort companies by score
    const sortedCompanies = companies.sort((a, b) => 
        (b[1].composite_score || 0) - (a[1].composite_score || 0)
    );
    
    // Sort themes by popularity
    const sortedThemes = Object.entries(themePopularity)
        .sort((a, b) => b[1] - a[1]);
    
    // Extract current configuration - use values as-is (already display-ready)
    const currentConfig = window.currentConfig || {};
    
    const config = {
        theme: currentConfig.main_theme || currentConfig.theme || 'N/A',
        universe: currentConfig.companies || 'N/A',
        isDemo: currentConfig.isDemo || false
    };
    
    // Update configuration header
    updateConfigurationHeader(config);
    
    // Check if this is first time and auto-show guide
    checkAndShowFirstTimeGuide();
    
    // Return the 3 cards HTML for Overview tab
    return `
        <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold text-white">Overview</h2>
            <button onclick="showDashboardGuide()" 
                    class="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 
                           border border-blue-500/30 rounded-lg text-blue-400 text-sm font-medium 
                           transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                How to Read This Dashboard
            </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            ${renderAtAGlanceCard(totalCompanies, totalThemes, maxScore, totalEvidences, runDate, config, data.theme_scoring)}
            ${renderTopCompaniesCard(sortedCompanies.slice(0, 10))}
            ${renderTopThemesCard(sortedThemes.slice(0, 10), totalCompanies)}
        </div>
    `;
}

function updateConfigurationHeader(config) {
    // Update the sticky configuration header
    const riskScenarioEl = document.getElementById('currentRiskScenario');
    const universeEl = document.getElementById('currentUniverse');
    const demoBadgeEl = document.getElementById('demoModeBadge');
    
    if (riskScenarioEl) {
        riskScenarioEl.textContent = config.theme;
    }
    
    if (universeEl) {
        universeEl.textContent = config.universe;
    }
    
    if (demoBadgeEl) {
        if (config.isDemo) {
            demoBadgeEl.classList.remove('hidden');
        } else {
            demoBadgeEl.classList.add('hidden');
        }
    }
}

function generateScoreHistogram(themeScoring) {
    if (!themeScoring) return '<div class="text-xs text-zinc-500">No data available</div>';
    
    // Extract all composite scores
    const scores = Object.values(themeScoring)
        .map(scoring => scoring.composite_score || 0)
        .filter(score => score > 0);
    
    if (scores.length === 0) return '<div class="text-xs text-zinc-500">No scores available</div>';
    
    // Create histogram bins
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const binCount = Math.min(8, Math.max(4, Math.floor(scores.length / 2))); // 4-8 bins
    const binWidth = (maxScore - minScore) / binCount;
    
    const bins = [];
    for (let i = 0; i < binCount; i++) {
        const binStart = minScore + i * binWidth;
        const binEnd = minScore + (i + 1) * binWidth;
        bins.push({
            start: binStart,
            end: binEnd,
            count: 0,
            scores: []
        });
    }
    
    // Distribute scores into bins
    scores.forEach(score => {
        const binIndex = Math.min(Math.floor((score - minScore) / binWidth), binCount - 1);
        bins[binIndex].count++;
        bins[binIndex].scores.push(score);
    });
    
    const maxCount = Math.max(...bins.map(bin => bin.count));
    
    // Generate histogram HTML
    return bins.map(bin => {
        const barWidth = maxCount > 0 ? Math.round((bin.count / maxCount) * 100) : 0;
        const avgScore = bin.scores.length > 0 ? (bin.scores.reduce((a, b) => a + b, 0) / bin.scores.length).toFixed(1) : '0.0';
        
        return `
            <div class="flex items-center justify-between text-xs">
                <div class="flex items-center gap-2 w-20">
                    <span class="text-zinc-400">${bin.start.toFixed(0)}-${bin.end.toFixed(0)}</span>
                </div>
                <div class="flex-1 mx-2">
                    <div class="w-full bg-zinc-700 rounded-full h-2 overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300" 
                             style="width: ${barWidth}%"></div>
                    </div>
                </div>
                <div class="flex items-center gap-1 w-16">
                    <span class="text-zinc-300">${bin.count}</span>
                    <span class="text-zinc-500">(${avgScore})</span>
                </div>
            </div>
        `;
    }).join('');
}

function calculateMedian(scores) {
    if (scores.length === 0) return 0;
    
    const sortedScores = [...scores].sort((a, b) => a - b);
    const mid = Math.floor(sortedScores.length / 2);
    
    if (sortedScores.length % 2 === 0) {
        return (sortedScores[mid - 1] + sortedScores[mid]) / 2;
    } else {
        return sortedScores[mid];
    }
}

function generateScoreHistogram(themeScoring) {
    if (!themeScoring) return '<div class="text-xs text-zinc-500">No data available</div>';
    
    // Extract all composite scores
    const scores = Object.values(themeScoring)
        .map(scoring => scoring.composite_score || 0)
        .filter(score => score > 0);
    
    if (scores.length === 0) return '<div class="text-xs text-zinc-500">No scores available</div>';
    
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const scoreRange = maxScore - minScore;
    
    // Create smooth PDF using kernel density estimation
    const points = 50; // Number of points for smooth curve
    const bandwidth = scoreRange * 0.15; // Smoothing parameter
    
    const xValues = [];
    const yValues = [];
    
    for (let i = 0; i <= points; i++) {
        const x = minScore + (i / points) * scoreRange;
        xValues.push(x);
        
        // Calculate kernel density
        let density = 0;
        scores.forEach(score => {
            const diff = (x - score) / bandwidth;
            density += Math.exp(-0.5 * diff * diff) / (bandwidth * Math.sqrt(2 * Math.PI));
        });
        yValues.push(density);
    }
    
    // Normalize to 0-100 for display
    const maxDensity = Math.max(...yValues);
    const normalizedY = yValues.map(y => (y / maxDensity) * 100);
    
    // Create SVG path for smooth area chart
    const pathData = xValues.map((x, i) => {
        const xPercent = ((x - minScore) / scoreRange) * 100;
        const yPercent = 100 - normalizedY[i]; // Flip Y axis for SVG
        return `${i === 0 ? 'M' : 'L'} ${xPercent} ${yPercent}`;
    }).join(' ');
    
    const areaPath = `${pathData} L 100 100 L 0 100 Z`;
    
    return `
        <div class="relative">
            <div class="text-xs text-zinc-400 mb-2">
                Score Range: ${minScore.toFixed(1)} - ${maxScore.toFixed(1)}
            </div>
            <div class="relative h-16 bg-zinc-800/30 rounded-lg overflow-hidden">
                <svg class="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:0.8" />
                            <stop offset="50%" style="stop-color:#8b5cf6;stop-opacity:0.6" />
                            <stop offset="100%" style="stop-color:#ec4899;stop-opacity:0.4" />
                        </linearGradient>
                    </defs>
                    <path d="${areaPath}" 
                          fill="url(#scoreGradient)" 
                          stroke="none" />
                    <path d="${pathData}" 
                          fill="none" 
                          stroke="#60a5fa" 
                          stroke-width="0.5" 
                          opacity="0.8" />
                </svg>
            </div>
            <div class="flex justify-between text-xs text-zinc-500 mt-1">
                <span>${minScore.toFixed(0)}</span>
                <span>${((minScore + maxScore) / 2).toFixed(0)}</span>
                <span>${maxScore.toFixed(0)}</span>
            </div>
            <div class="text-xs text-zinc-400 mt-2 text-center">
                ${scores.length} companies • Mean: ${(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)} • Median: ${calculateMedian(scores).toFixed(1)}
            </div>
        </div>
    `;
}

function renderAtAGlanceCard(totalCompanies, totalThemes, maxScore, totalEvidences, runDate, config, themeScoring) {
    
    return `
        <div class="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 rounded-xl border border-zinc-700 p-6 hover:shadow-xl transition-all">
            <div class="flex items-center gap-3 mb-4">
                <div class="w-12 h-12 bg-zinc-700/50 rounded-lg flex items-center justify-center">
                    <svg class="w-7 h-7 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                </div>
                <h3 class="text-xl font-bold text-white">At a Glance</h3>
            </div>
            <div class="space-y-3">
                <div class="flex justify-between items-center">
                    <span class="text-zinc-300">Companies Exposed</span>
                    <span class="text-2xl font-bold text-zinc-200">${totalCompanies}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-zinc-300">Risk Factors Identified</span>
                    <span class="text-2xl font-bold text-orange-400">${totalThemes}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-zinc-300">Highest Company Score${renderInfoTooltip('Score = sum of text chunks found and labeled in documents for this company', 'highest-score')}</span>
                    <span class="text-2xl font-bold text-red-400">${maxScore}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-zinc-300">Supporting Evidences${renderInfoTooltip('Number of text chunks found and labeled in documents', 'supporting-evidences')}</span>
                    <span class="text-2xl font-bold text-amber-400">${totalEvidences}</span>
                </div>
                
                <!-- Report Information Section -->
                <div class="pt-4 mt-4 border-t-2 border-zinc-600/50">
                    <h4 class="text-sm font-bold text-zinc-300 mb-3 tracking-wide">Report Information</h4>
                    <div class="space-y-2">
                        <div class="flex justify-between items-center">
                            <span class="text-xs text-zinc-400">Source</span>
                            <span class="text-sm font-medium text-zinc-200">News</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-xs text-zinc-400">Period</span>
                            <span class="text-sm font-medium text-zinc-200">Last month</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span class="text-xs text-zinc-400">Report generated on</span>
                            <span class="text-sm font-medium text-zinc-200">10/15/2025</span>
                            </div>
                            </div>
                            </div>
                
                <!-- Score Distribution Section -->
                <div class="pt-4 mt-4 border-t-2 border-zinc-600/50">
                    <h4 class="text-sm font-bold text-zinc-300 mb-3 tracking-wide">Company Risk Score Distribution${renderInfoTooltip('Shows how risk scores are distributed across all companies', 'score-distribution')}</h4>
                    <div class="space-y-1">
                        ${generateScoreHistogram(themeScoring)}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderTopCompaniesCard(topCompanies) {
    const medalColors = ['text-yellow-400', 'text-gray-300', 'text-amber-600'];
    
    let companiesHTML = topCompanies.map(([companyName, scoring], idx) => {
        const medalColor = idx < 3 ? medalColors[idx] : 'text-zinc-400';
        const themesArray = Object.entries(scoring.themes || {}).filter(([_, score]) => score > 0);
        const themeCount = themesArray.length;
        
        return `
            <div class="dashboard-company-item border-b border-zinc-700 last:border-b-0" data-company="${escapeHtml(companyName)}">
                <div class="grid grid-cols-12 gap-2 px-4 py-2 hover:bg-zinc-700/30 transition-colors cursor-pointer"
                     onclick="filterByCompany('${escapeHtml(companyName)}')">
                    <!-- Rank Column -->
                    <div class="col-span-1 flex items-center justify-center">
                        <div class="flex items-center justify-center w-6 h-6 ${medalColor} font-bold text-sm">
                        ${idx + 1}
                        </div>
                    </div>
                    <!-- Company Column -->
                    <div class="col-span-5 flex items-center gap-2 min-w-0">
                            <span class="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-mono">${escapeHtml(scoring.ticker || 'N/A')}</span>
                            <span class="text-white text-sm truncate">${escapeHtml(companyName)}</span>
                        </div>
                    <!-- Score Column -->
                    <div class="col-span-2 flex items-center justify-center">
                        <div class="text-lg font-bold text-red-400">${scoring.composite_score}</div>
                    </div>
                    <!-- Risks Column -->
                    <div class="col-span-2 flex items-center justify-center">
                    <button onclick="toggleDashboardCompanyThemes(this, event)" 
                            class="px-2 py-1 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded text-orange-400 text-xs font-medium transition-colors flex items-center gap-1">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                        </svg>
                        ${themeCount}
                    </button>
                    </div>
                    <!-- Insights Column -->
                    <div class="col-span-2 flex items-center justify-center">
                    <button onclick="toggleDashboardCompanyInsights(this, event)" 
                            class="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded text-amber-400 text-xs font-medium transition-colors flex items-center gap-1">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                        </svg>
                        Insights
                    </button>
                    </div>
                </div>
                <div class="themes-section hidden bg-zinc-900/30 px-4 py-2">
                    <div class="grid grid-cols-2 gap-1">
                        ${themesArray.map(([theme, score]) => {
                            const intensity = score > 5 ? 'high' : score > 2 ? 'medium' : 'low';
                            const colorClasses = {
                                high: 'bg-red-500 text-white border-red-400',
                                medium: 'bg-red-700 text-red-100 border-red-600',
                                low: 'bg-red-900 text-red-300 border-red-800'
                            };
                            return `
                                <div class="flex items-center justify-between ${colorClasses[intensity]} border rounded px-2 py-1 cursor-pointer hover:opacity-80 transition-opacity"
                                     onclick="filterByCompanyAndTheme('${escapeHtml(companyName)}', '${escapeHtml(theme)}')">
                                    <span class="text-xs font-medium truncate flex-1 mr-1" title="${escapeHtml(theme)}">${escapeHtml(theme)}</span>
                                    <span class="font-bold text-xs flex-shrink-0">${score}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                <div class="insights-section hidden bg-zinc-900/30 px-4 py-2">
                    <div class="text-zinc-300 text-xs leading-relaxed">
                        ${escapeHtml(scoring.motivation || 'No insights available')}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    return `
        <div class="bg-gradient-to-br from-red-900/20 to-red-800/10 rounded-xl border border-red-700/30 p-6 hover:shadow-xl transition-all">
            <div class="flex items-center gap-3 mb-4">
                <div class="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <svg class="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                    </svg>
                </div>
                <h3 class="text-xl font-bold text-white">Top 10 Exposed Companies${renderInfoTooltip('Companies ranked by risk score (sum of text chunks found and labeled)', 'top-companies')}</h3>
            </div>
            <!-- Column Headers -->
            <div class="grid grid-cols-12 gap-2 px-4 py-2 bg-zinc-800/30 border-b border-zinc-600 text-xs font-semibold text-zinc-400 mb-2">
                <div class="col-span-1 text-center">Rank</div>
                <div class="col-span-5">Company</div>
                <div class="col-span-2 text-center">Score</div>
                <div class="col-span-2 text-center">Risks</div>
                <div class="col-span-2 text-center">Insights</div>
            </div>
            <div class="space-y-0">
                ${companiesHTML}
            </div>
        </div>
    `;
}

function renderTopThemesCard(topThemes, totalCompanies) {
    const medalColors = ['text-yellow-400', 'text-gray-300', 'text-amber-600'];
    
    let themesHTML = topThemes.map(([theme, totalScore], idx) => {
        const medalColor = idx < 3 ? medalColors[idx] : 'text-zinc-400';
        const barWidth = Math.min((totalScore / (topThemes[0]?.[1] || 1)) * 100, 100);
        
        return `
            <div class="border-b border-zinc-700 last:border-b-0 hover:bg-zinc-700/30 transition-colors cursor-pointer"
                 onclick="filterByTheme('${escapeHtml(theme)}')">
                <div class="grid grid-cols-12 gap-2 px-4 py-2">
                    <!-- Rank Column -->
                    <div class="col-span-1 flex items-center justify-center">
                        <div class="flex items-center justify-center w-6 h-6 ${medalColor} font-bold text-sm">
                        ${idx + 1}
                        </div>
                    </div>
                    <!-- Risk Factor Column -->
                    <div class="col-span-8 flex flex-col min-w-0">
                        <div class="text-white text-sm truncate" title="${escapeHtml(theme)}">${escapeHtml(theme)}</div>
                        <div class="mt-1">
                            <div class="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                                <div class="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full transition-all duration-500"
                                     style="width: ${barWidth}%"></div>
                            </div>
                        </div>
                    </div>
                    <!-- Score Column -->
                    <div class="col-span-3 flex items-center justify-center">
                        <span class="text-lg font-bold text-orange-400">${totalScore}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    return `
        <div class="bg-gradient-to-br from-orange-900/20 to-orange-800/10 rounded-xl border border-orange-700/30 p-6 hover:shadow-xl transition-all">
            <div class="flex items-center gap-3 mb-4">
                <div class="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <svg class="w-7 h-7 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.964-1.333-2.732 0L3.082 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                </div>
                <h3 class="text-xl font-bold text-white">Top 10 Risk Factors${renderInfoTooltip('Score = sum of text chunks found and labeled across all companies exposed to this risk', 'top-themes')}</h3>
            </div>
            <!-- Column Headers -->
            <div class="grid grid-cols-12 gap-2 px-4 py-2 bg-zinc-800/30 border-b border-zinc-600 text-xs font-semibold text-zinc-400 mb-2">
                <div class="col-span-1 text-center">Rank</div>
                <div class="col-span-8">Risk Factor</div>
                <div class="col-span-3 text-center">Score</div>
            </div>
            <div class="space-y-0">
                ${themesHTML}
            </div>
        </div>
    `;
}

// Toggle functions for dashboard companies
function toggleDashboardCompanyThemes(button, event) {
    event.stopPropagation();
    const item = button.closest('.dashboard-company-item');
    const themesSection = item.querySelector('.themes-section');
    const insightsSection = item.querySelector('.insights-section');
    
    // Close insights if open
    if (insightsSection && !insightsSection.classList.contains('hidden')) {
        insightsSection.classList.add('hidden');
    }
    
    // Toggle themes
    if (themesSection) {
        themesSection.classList.toggle('hidden');
    }
}

function toggleDashboardCompanyInsights(button, event) {
    event.stopPropagation();
    const item = button.closest('.dashboard-company-item');
    const themesSection = item.querySelector('.themes-section');
    const insightsSection = item.querySelector('.insights-section');
    
    // Close themes if open
    if (themesSection && !themesSection.classList.contains('hidden')) {
        themesSection.classList.add('hidden');
    }
    
    // Toggle insights
    if (insightsSection) {
        insightsSection.classList.toggle('hidden');
    }
}

// Helper functions
function filterByTheme(theme) {
    // Switch to evidence tab and apply theme filter
    if (window.tabController) {
        window.tabController.switchTab('evidence');
    }
    // Wait for tab to render, then apply filter
    setTimeout(() => {
        const themeFilter = document.getElementById('filterTheme');
        const companyFilter = document.getElementById('filterCompany');
        if (themeFilter) {
            themeFilter.value = theme;
            // Clear company filter when selecting only theme
            if (companyFilter) {
                companyFilter.value = '';
            }
            if (window.applyEvidenceFilters) {
                window.applyEvidenceFilters();
            }
        }
    }, 300);
}

function filterByCompany(company) {
    // Switch to evidence tab and apply company filter
    if (window.tabController) {
        window.tabController.switchTab('evidence');
    }
    // Wait for tab to render, then apply filter
    setTimeout(() => {
        const companyFilter = document.getElementById('filterCompany');
        const themeFilter = document.getElementById('filterTheme');
        if (companyFilter) {
            companyFilter.value = company;
            // Clear theme filter when selecting only company
            if (themeFilter) {
                themeFilter.value = '';
            }
            if (window.applyEvidenceFilters) {
                window.applyEvidenceFilters();
            }
        }
    }, 300);
}

function filterByCompanyAndTheme(company, theme) {
    // Switch to evidence tab and apply both company and theme filters
    if (window.tabController) {
        window.tabController.switchTab('evidence');
    }
    // Wait for tab to render, then apply filters
    setTimeout(() => {
        const companyFilter = document.getElementById('filterCompany');
        const themeFilter = document.getElementById('filterTheme');
        if (companyFilter && themeFilter) {
            companyFilter.value = company;
            themeFilter.value = theme;
            if (window.applyEvidenceFilters) {
                window.applyEvidenceFilters();
            }
        }
    }, 300);
}

// Tooltip functions
function showTooltip(id) {
    const tooltip = document.getElementById(`tooltip-${id}`);
    if (tooltip) {
        tooltip.classList.remove('hidden');
    }
}

function hideTooltip(id) {
    const tooltip = document.getElementById(`tooltip-${id}`);
    if (tooltip) {
        tooltip.classList.add('hidden');
    }
}

function showDashboardGuide() {
    // Create modal if it doesn't exist
    let modal = document.getElementById('dashboardGuideModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'dashboardGuideModal';
        modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-bold text-white">How to Read This Dashboard</h3>
                    <button onclick="hideDashboardGuide()" class="text-zinc-400 hover:text-white transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                <div class="space-y-6 text-zinc-300">
                    <div>
                        <h4 class="text-lg font-semibold text-white mb-3">Understanding Scores</h4>
                        <p class="text-sm leading-relaxed">
                            <strong>Company Scores:</strong> Each company's risk score is the sum of all supporting evidences (text chunks found and labeled in documents) that mention risk factors affecting that company. Higher scores indicate more evidence of risk exposure.
                        </p>
                    </div>
                    <div>
                        <h4 class="text-lg font-semibold text-white mb-3">Risk Factor Scores</h4>
                        <p class="text-sm leading-relaxed">
                            <strong>Risk Factor Scores:</strong> Each risk factor's score is the sum of text chunks found and labeled across all companies exposed to that specific risk. This shows which risks are most prevalent across your universe.
                        </p>
                    </div>
                    <div>
                        <h4 class="text-lg font-semibold text-white mb-3">Score Distribution Chart</h4>
                        <p class="text-sm leading-relaxed">
                            The distribution chart shows how risk scores are spread across all companies. It helps identify if most companies have low risk (left side) or if there are many high-risk companies (right side).
                        </p>
                    </div>
                    <div>
                        <h4 class="text-lg font-semibold text-white mb-3">What "Exposed" Means</h4>
                        <p class="text-sm leading-relaxed">
                            A company is "exposed" to a risk factor when there are text chunks found and labeled in documents that indicate the risk affects that company. The more text chunks found, the higher the exposure score.
                        </p>
                    </div>
                    <div>
                        <h4 class="text-lg font-semibold text-white mb-3">Supporting Evidence</h4>
                        <p class="text-sm leading-relaxed">
                            Supporting evidences are chunks of text found and labeled in documents (news articles, financial reports, etc.) that mention specific risk factors affecting companies in your analysis universe.
                        </p>
                    </div>
                </div>
                <div class="mt-6 flex justify-end">
                    <button onclick="hideDashboardGuide()" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
                        Got it
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    modal.classList.remove('hidden');
}

function hideDashboardGuide() {
    const modal = document.getElementById('dashboardGuideModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function checkAndShowFirstTimeGuide() {
    // Check if user has seen the guide before
    const hasSeenGuide = localStorage.getItem('riskAnalyzer_hasSeenGuide');
    
    if (!hasSeenGuide) {
        // Show guide immediately for first-time users
        showDashboardGuide();
        // Mark as seen
        localStorage.setItem('riskAnalyzer_hasSeenGuide', 'true');
    }
}


// Make functions globally accessible
window.renderDashboardCards = renderDashboardCards;
window.updateConfigurationHeader = updateConfigurationHeader;
window.filterByTheme = filterByTheme;
window.filterByCompany = filterByCompany;
window.filterByCompanyAndTheme = filterByCompanyAndTheme;
window.toggleDashboardCompanyThemes = toggleDashboardCompanyThemes;
window.toggleDashboardCompanyInsights = toggleDashboardCompanyInsights;
window.showTooltip = showTooltip;
window.hideTooltip = hideTooltip;
window.showDashboardGuide = showDashboardGuide;
window.hideDashboardGuide = hideDashboardGuide;
window.checkAndShowFirstTimeGuide = checkAndShowFirstTimeGuide;

