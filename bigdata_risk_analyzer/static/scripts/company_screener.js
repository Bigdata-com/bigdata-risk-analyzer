// Company Screener - Tabular Layout with Advanced Filtering and Export
let currentScreenerData = null;
let currentScreenerSortField = 'composite';
let currentScreenerSortDirection = 'desc';

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function renderCompanyScreener(themeScoring) {
    const container = document.querySelector('[data-tab-content="screener"] .tab-actual-content');
    if (!container || !themeScoring) return;

    const companies = Object.entries(themeScoring);
    if (companies.length === 0) {
        container.innerHTML = '<p class="text-zinc-400">No company data available</p>';
        return;
    }

    // Get all unique themes for risk factor filtering
    const allThemes = new Set();
    companies.forEach(([_, scoring]) => {
        if (scoring.themes) {
            Object.keys(scoring.themes).forEach(theme => allThemes.add(theme));
        }
    });

    // Get unique sectors and industries
    const sectors = [...new Set(companies.map(([_, scoring]) => scoring.sector).filter(Boolean))].sort();
    const industries = [...new Set(companies.map(([_, scoring]) => scoring.industry).filter(Boolean))].sort();

    // Calculate coverage and intensity scores
    const coverageIntensity = calculateCoverageAndIntensity(companies, Array.from(allThemes));
    
    // Store data globally for filtering and sorting
    currentScreenerData = {
        companies,
        themes: Array.from(allThemes),
        sectors,
        industries,
        coverageIntensity
    };

    // Sort companies by composite score (descending) by default
    companies.sort((a, b) => (b[1].composite_score || 0) - (a[1].composite_score || 0));

    let html = `
        <div class="mb-6">
            <div class="flex justify-between items-center mb-4">
                <div>
                    <h3 class="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                        </svg>
                        Company Screener
                    </h3>
                    <p class="text-zinc-400 text-sm">Filter, sort, and export companies by risk exposure</p>
                </div>
                <div class="flex gap-2">
                    <button onclick="exportCSV()" 
                            class="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        Export CSV
                    </button>
                    <button onclick="exportJSON()" 
                            class="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        Export JSON
                    </button>
                    <button onclick="showScreenerGuide()" 
                            class="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 
                                   border border-blue-500/30 rounded-lg text-blue-400 text-sm font-medium 
                                   transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        Info
                    </button>
                </div>
            </div>
            
            <!-- Filter Chips Display -->
            <div class="mb-6">
                <div class="flex items-center justify-between mb-3">
                    <h4 class="text-sm font-semibold text-zinc-300">Active Filters</h4>
                    <button onclick="clearAllFilters()" 
                            class="text-xs text-zinc-400 hover:text-white transition-colors">
                        Clear All
                    </button>
                </div>
                <div id="filter-chips" class="flex flex-wrap gap-2 min-h-[40px] p-3 bg-zinc-800/30 rounded-lg">
                    <div class="text-sm text-zinc-500 italic">No filters applied</div>
                </div>
            </div>
            
            <!-- Main Content Layout -->
            <div class="flex gap-6">
                <!-- Filter Sidebar -->
                <div class="w-80 bg-zinc-800/50 rounded-lg p-4 h-fit">
                    <h3 class="text-lg font-semibold text-white mb-4">Screen Companies</h3>
                    
                    <!-- Search -->
                    <div class="mb-6">
                        <label class="block text-sm font-medium text-zinc-300 mb-2">Search</label>
                        <div class="relative">
                            <input type="text" id="searchCompany" placeholder="Company name or ticker..."
                                   class="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                   onkeyup="handleSearchInput()">
                        </div>
                    </div>
                    
                    <!-- Top N Filter -->
                    <div class="mb-6">
                        <label class="block text-sm font-medium text-zinc-300 mb-2">Show Results</label>
                        <select id="filterTopN" onchange="handleFilterChange()" 
                                class="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white text-sm">
                            <option value="">All Companies</option>
                            <option value="10">Top 10</option>
                            <option value="20">Top 20</option>
                            <option value="50">Top 50</option>
                            <option value="100">Top 100</option>
                        </select>
                    </div>
                    
                    <!-- Sector Filter -->
                    <div class="mb-8">
                        <label class="block text-sm font-medium text-zinc-300 mb-3">Sector</label>
                        <div class="space-y-2 max-h-32 overflow-y-auto">
                            ${sectors.map(sector => `
                                <label class="flex items-center space-x-2 cursor-pointer hover:bg-zinc-700/50 p-1 rounded">
                                    <input type="checkbox" class="sector-filter" value="${escapeHtml(sector)}" onchange="handleFilterChange()">
                                    <span class="text-sm text-zinc-300">${escapeHtml(sector)}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                    
                    <!-- Industry Filter -->
                    <div class="mb-8">
                        <label class="block text-sm font-medium text-zinc-300 mb-3">Industry</label>
                        <div class="space-y-2 max-h-32 overflow-y-auto">
                            ${industries.map(industry => `
                                <label class="flex items-center space-x-2 cursor-pointer hover:bg-zinc-700/50 p-1 rounded">
                                    <input type="checkbox" class="industry-filter" value="${escapeHtml(industry)}" onchange="handleFilterChange()">
                                    <span class="text-sm text-zinc-300">${escapeHtml(industry)}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                    
                    <!-- Risk Factors -->
                    <div class="mb-8">
                        <label class="block text-sm font-medium text-zinc-300 mb-3">Risk Factors</label>
                        <div class="space-y-2 max-h-32 overflow-y-auto">
                            ${Array.from(allThemes).map(theme => `
                                <label class="flex items-center space-x-2 cursor-pointer hover:bg-zinc-700/50 p-1 rounded">
                                    <input type="checkbox" class="risk-filter" value="${escapeHtml(theme)}" onchange="handleFilterChange()">
                                    <span class="text-sm text-zinc-300">${escapeHtml(theme)}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                    
                </div>
                
                <!-- Main Content Area -->
                <div class="flex-1">
                    <div id="screenerCount" class="text-sm text-zinc-400 mb-4">Showing ${companies.length} of ${companies.length} companies</div>
            
            <!-- Table -->
            <div class="overflow-x-auto">
                <table class="w-full border-collapse">
                    <thead>
                        <tr class="bg-zinc-800">
                            <th onclick="sortScreener('name')" class="px-4 py-3 text-left text-sm font-semibold text-white border-b-2 border-zinc-600 cursor-pointer hover:bg-zinc-700/50">
                                Company ↕
                            </th>
                            <th onclick="sortScreener('ticker')" class="px-3 py-3 text-left text-sm font-semibold text-white border-b-2 border-zinc-600 cursor-pointer hover:bg-zinc-700/50">
                                Ticker
                            </th>
                            <th onclick="sortScreener('sector')" class="px-3 py-3 text-left text-sm font-semibold text-white border-b-2 border-zinc-600 cursor-pointer hover:bg-zinc-700/50">
                                Sector
                            </th>
                            <th onclick="sortScreener('industry')" class="px-3 py-3 text-left text-sm font-semibold text-white border-b-2 border-zinc-600 cursor-pointer hover:bg-zinc-700/50">
                                Industry
                            </th>
                            <th onclick="sortScreener('composite')" class="px-3 py-3 text-center text-sm font-semibold text-white border-b-2 border-zinc-600 cursor-pointer hover:bg-zinc-700/50">
                                Composite Score ↕
                            </th>
                            <th onclick="sortScreener('coverage')" class="px-3 py-3 text-center text-sm font-semibold text-white border-b-2 border-zinc-600 cursor-pointer hover:bg-zinc-700/50">
                                Coverage Score ↕
                            </th>
                            <th onclick="sortScreener('intensity')" class="px-3 py-3 text-center text-sm font-semibold text-white border-b-2 border-zinc-600 cursor-pointer hover:bg-zinc-700/50">
                                Intensity Score ↕
                            </th>
                            <th onclick="sortScreener('risks')" class="px-3 py-3 text-center text-sm font-semibold text-white border-b-2 border-zinc-600 cursor-pointer hover:bg-zinc-700/50">
                                Risk Count ↕
                            </th>
                            <th class="px-3 py-3 text-center text-sm font-semibold text-white border-b-2 border-zinc-600">
                                Risk Breakdown
                            </th>
                            <th class="px-3 py-3 text-center text-sm font-semibold text-white border-b-2 border-zinc-600">
                                Insights
                            </th>
                        </tr>
                    </thead>
                    <tbody id="screenerTableBody">
    `;

    // Render table rows
    companies.forEach(([companyName, scoring], index) => {
        const bgClass = index % 2 === 0 ? 'bg-zinc-900/50' : 'bg-zinc-800/30';
        const coverageData = coverageIntensity[companyName];
        const riskCount = Object.values(scoring.themes || {}).filter(score => score > 0).length;
        
        // Color coding for composite score (matching dashboard cards)
        let scoreColor = 'text-zinc-400';
        if (scoring.composite_score > 20) scoreColor = 'text-red-400';
        else if (scoring.composite_score > 10) scoreColor = 'text-yellow-400';
        else if (scoring.composite_score > 0) scoreColor = 'text-green-400';
        
        // Get themes for expandable section
        const themesArray = Object.entries(scoring.themes || {}).filter(([_, score]) => score > 0);
        
        html += `
            <tr class="${bgClass} hover:bg-zinc-700/50 transition-colors screener-company-item" data-company="${escapeHtml(companyName)}">
                <td class="px-4 py-3 text-sm font-medium text-white border-b border-zinc-700">
                    <div class="flex items-center gap-2">
                        <span class="font-semibold">${escapeHtml(companyName)}</span>
                    </div>
                </td>
                <td class="px-3 py-3 text-sm text-zinc-300 border-b border-zinc-700">
                    ${escapeHtml(scoring.ticker || 'N/A')}
                </td>
                <td class="px-3 py-3 text-sm text-zinc-300 border-b border-zinc-700">
                    ${escapeHtml(scoring.sector || 'N/A')}
                </td>
                <td class="px-3 py-3 text-sm text-zinc-300 border-b border-zinc-700">
                    ${escapeHtml(scoring.industry || 'N/A')}
                </td>
                <td class="px-3 py-3 text-center text-sm font-bold ${scoreColor} border-b border-zinc-700">
                    ${scoring.composite_score || 0}
                </td>
                <td class="px-3 py-3 text-center text-sm font-medium text-blue-400 border-b border-zinc-700">
                    ${(coverageData.coverage * 100).toFixed(0)}%
                </td>
                <td class="px-3 py-3 text-center text-sm font-medium text-purple-400 border-b border-zinc-700">
                    ${(coverageData.intensity * 100).toFixed(0)}%
                </td>
                <td class="px-3 py-3 text-center text-sm font-medium text-zinc-300 border-b border-zinc-700">
                    ${riskCount}
                </td>
                <td class="px-3 py-3 text-center border-b border-zinc-700">
                    <button onclick="toggleScreenerCompanyThemes(this, event)" 
                        class="px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded text-orange-400 text-sm font-medium transition-colors flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                        </svg>
                        Risks
                    </button>
                </td>
                <td class="px-3 py-3 text-center border-b border-zinc-700">
                    <button onclick="toggleScreenerCompanyInsights(this, event)" 
                        class="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded text-amber-400 text-sm font-medium transition-colors flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                        </svg>
                        Insights
                    </button>
                </td>
            </tr>
            <tr class="screener-themes-section hidden bg-zinc-900/30">
                <td colspan="10" class="px-4 py-2">
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
                </td>
            </tr>
            <tr class="screener-insights-section hidden bg-zinc-900/30">
                <td colspan="10" class="px-4 py-2">
                    <div class="text-zinc-300 text-base leading-relaxed">
                        ${escapeHtml(scoring.motivation || 'No insights available')}
                    </div>
                </td>
            </tr>
        `;
    });

    html += `
                    </tbody>
                </table>
            </div>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

// Calculate coverage and intensity scores (reused from heatmap)
function calculateCoverageAndIntensity(companies, themes) {
    const K = themes.length;
    const results = {};
    
    // Find max evidence per risk
    const maxPerRisk = {};
    themes.forEach(theme => {
        maxPerRisk[theme] = 0;
        companies.forEach(([_, scoring]) => {
            const score = (scoring.themes && scoring.themes[theme]) || 0;
            if (score > maxPerRisk[theme]) maxPerRisk[theme] = score;
        });
    });
    
    // Calculate for each company
    companies.forEach(([companyName, scoring]) => {
        let riskCount = 0;
        let intensitySum = 0;
        
        themes.forEach(theme => {
            const score = (scoring.themes && scoring.themes[theme]) || 0;
            if (score > 0) riskCount++;
            if (maxPerRisk[theme] > 0) {
                intensitySum += score / maxPerRisk[theme];
            }
        });
        
        results[companyName] = {
            coverage: K > 0 ? riskCount / K : 0,
            intensity: K > 0 ? intensitySum / K : 0,
            riskCount: riskCount
        };
    });
    
    return results;
}


// Sort companies
function sortCompanies(companies, field, direction) {
    companies.sort((a, b) => {
        const [nameA, scoringA] = a;
        const [nameB, scoringB] = b;
        
        let valueA, valueB;
        
        switch (field) {
            case 'name':
                valueA = nameA.toLowerCase();
                valueB = nameB.toLowerCase();
                break;
            case 'ticker':
                valueA = (scoringA.ticker || '').toLowerCase();
                valueB = (scoringB.ticker || '').toLowerCase();
                break;
            case 'sector':
                valueA = (scoringA.sector || '').toLowerCase();
                valueB = (scoringB.sector || '').toLowerCase();
                break;
            case 'industry':
                valueA = (scoringA.industry || '').toLowerCase();
                valueB = (scoringB.industry || '').toLowerCase();
                break;
            case 'composite':
                // Convert to numbers for proper sorting
                valueA = Number(scoringA.composite_score) || 0;
                valueB = Number(scoringB.composite_score) || 0;
                break;
            case 'coverage':
                valueA = currentScreenerData.coverageIntensity[nameA].coverage;
                valueB = currentScreenerData.coverageIntensity[nameB].coverage;
                break;
            case 'intensity':
                valueA = currentScreenerData.coverageIntensity[nameA].intensity;
                valueB = currentScreenerData.coverageIntensity[nameB].intensity;
                break;
            case 'risks':
                valueA = Object.values(scoringA.themes || {}).filter(score => score > 0).length;
                valueB = Object.values(scoringB.themes || {}).filter(score => score > 0).length;
                break;
            default:
                return 0;
        }
        
        if (direction === 'asc') {
            return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
        } else {
            return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
        }
    });
}

// Sort screener
function sortScreener(field) {
    if (!currentScreenerData) return;
    
    // Toggle sort direction if same field
    if (currentScreenerSortField === field) {
        currentScreenerSortDirection = currentScreenerSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentScreenerSortField = field;
        currentScreenerSortDirection = 'desc';
    }
    
    // Re-apply filters with new sorting
    filterScreener();
}

// Render screener table
function renderScreenerTable(companies) {
    const tbody = document.getElementById('screenerTableBody');
    if (!tbody) return;
    
    let html = '';
    
    companies.forEach(([companyName, scoring], index) => {
        const bgClass = index % 2 === 0 ? 'bg-zinc-900/50' : 'bg-zinc-800/30';
        const riskCount = Object.values(scoring.themes || {}).filter(score => score > 0).length;
        
        // Use static coverage and intensity scores
        const coverageData = currentScreenerData.coverageIntensity[companyName];
        
        // Color coding for composite score
        let scoreColor = 'text-zinc-400';
        if (scoring.composite_score > 20) scoreColor = 'text-red-400';
        else if (scoring.composite_score > 10) scoreColor = 'text-yellow-400';
        else if (scoring.composite_score > 0) scoreColor = 'text-green-400';
        
        // Get themes for expandable section
        const themesArray = Object.entries(scoring.themes || {}).filter(([_, score]) => score > 0);
        
        html += `
            <tr class="${bgClass} hover:bg-zinc-700/50 transition-colors screener-company-item" data-company="${escapeHtml(companyName)}">
                <td class="px-4 py-3 text-sm font-medium text-white border-b border-zinc-700">
                    <div class="flex items-center gap-2">
                        <span class="font-semibold">${escapeHtml(companyName)}</span>
                    </div>
                </td>
                <td class="px-3 py-3 text-sm text-zinc-300 border-b border-zinc-700">
                    ${escapeHtml(scoring.ticker || 'N/A')}
                </td>
                <td class="px-3 py-3 text-sm text-zinc-300 border-b border-zinc-700">
                    ${escapeHtml(scoring.sector || 'N/A')}
                </td>
                <td class="px-3 py-3 text-sm text-zinc-300 border-b border-zinc-700">
                    ${escapeHtml(scoring.industry || 'N/A')}
                </td>
                <td class="px-3 py-3 text-center text-sm font-bold ${scoreColor} border-b border-zinc-700">
                    ${scoring.composite_score || 0}
                </td>
                <td class="px-3 py-3 text-center text-sm font-medium text-blue-400 border-b border-zinc-700">
                    ${(coverageData.coverage * 100).toFixed(0)}%
                </td>
                <td class="px-3 py-3 text-center text-sm font-medium text-purple-400 border-b border-zinc-700">
                    ${(coverageData.intensity * 100).toFixed(0)}%
                </td>
                <td class="px-3 py-3 text-center text-sm font-medium text-zinc-300 border-b border-zinc-700">
                    ${riskCount}
                </td>
                <td class="px-3 py-3 text-center border-b border-zinc-700">
                    <button onclick="toggleScreenerCompanyThemes(this, event)" 
                        class="px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded text-orange-400 text-sm font-medium transition-colors flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                        </svg>
                        Risks
                    </button>
                </td>
                <td class="px-3 py-3 text-center border-b border-zinc-700">
                    <button onclick="toggleScreenerCompanyInsights(this, event)" 
                        class="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded text-amber-400 text-sm font-medium transition-colors flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                        </svg>
                        Insights
                    </button>
                </td>
            </tr>
            <tr class="screener-themes-section hidden bg-zinc-900/30">
                <td colspan="10" class="px-4 py-2">
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
                </td>
            </tr>
            <tr class="screener-insights-section hidden bg-zinc-900/30">
                <td colspan="10" class="px-4 py-2">
                    <div class="text-zinc-300 text-base leading-relaxed">
                        ${escapeHtml(scoring.motivation || 'No insights available')}
                    </div>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// Clear all filters
function clearFilters() {
    // Use the new clearAllFilters function
    clearAllFilters();
}

// Export to CSV
function exportCSV() {
    if (!currentScreenerData) return;
    
    const searchTerm = document.getElementById('searchCompany').value.toLowerCase();
    const sectorFilter = document.getElementById('filterSector').value;
    const industryFilter = document.getElementById('filterIndustry').value;
    const riskFilter = document.getElementById('filterRisk').value;
    const topN = document.getElementById('filterTopN').value;
    
    // Apply same filters as display
    let filteredCompanies = currentScreenerData.companies.filter(([companyName, scoring]) => {
        if (searchTerm && !companyName.toLowerCase().includes(searchTerm)) return false;
        if (sectorFilter && scoring.sector !== sectorFilter) return false;
        if (industryFilter && scoring.industry !== industryFilter) return false;
        if (riskFilter && (!scoring.themes || !scoring.themes[riskFilter] || scoring.themes[riskFilter] <= 0)) return false;
        return true;
    });
    
    // Apply sorting
    sortCompanies(filteredCompanies, currentScreenerSortField, currentScreenerSortDirection);
    
    // Apply Top N
    if (topN && topN !== '') {
        filteredCompanies = filteredCompanies.slice(0, parseInt(topN));
    }
    
    // Create CSV content
    const headers = ['Company', 'Ticker', 'Sector', 'Industry', 'Composite Score', 'Coverage %', 'Intensity %', 'Risk Count'];
    const rows = filteredCompanies.map(([companyName, scoring]) => {
        const coverageData = currentScreenerData.coverageIntensity[companyName];
        const riskCount = Object.values(scoring.themes || {}).filter(score => score > 0).length;
        
        return [
            companyName,
            scoring.ticker || 'N/A',
            scoring.sector || 'N/A',
            scoring.industry || 'N/A',
            scoring.composite_score || 0,
            (coverageData.coverage * 100).toFixed(0),
            (coverageData.intensity * 100).toFixed(0),
            riskCount
        ];
    });
    
    const csvContent = [headers, ...rows].map(row => 
        row.map(field => `"${field.toString().replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `company_screener_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Export to JSON
function exportJSON() {
    if (!currentScreenerData) return;
    
    const searchTerm = document.getElementById('searchCompany').value.toLowerCase();
    const sectorFilter = document.getElementById('filterSector').value;
    const industryFilter = document.getElementById('filterIndustry').value;
    const riskFilter = document.getElementById('filterRisk').value;
    const topN = document.getElementById('filterTopN').value;
    
    // Apply same filters as display
    let filteredCompanies = currentScreenerData.companies.filter(([companyName, scoring]) => {
        if (searchTerm && !companyName.toLowerCase().includes(searchTerm)) return false;
        if (sectorFilter && scoring.sector !== sectorFilter) return false;
        if (industryFilter && scoring.industry !== industryFilter) return false;
        if (riskFilter && (!scoring.themes || !scoring.themes[riskFilter] || scoring.themes[riskFilter] <= 0)) return false;
        return true;
    });
    
    // Apply sorting
    sortCompanies(filteredCompanies, currentScreenerSortField, currentScreenerSortDirection);
    
    // Apply Top N
    if (topN && topN !== '') {
        filteredCompanies = filteredCompanies.slice(0, parseInt(topN));
    }
    
    // Create JSON content
    const jsonData = filteredCompanies.map(([companyName, scoring]) => {
        const coverageData = currentScreenerData.coverageIntensity[companyName];
        const riskCount = Object.values(scoring.themes || {}).filter(score => score > 0).length;
        
        return {
            company: companyName,
            ticker: scoring.ticker || 'N/A',
            sector: scoring.sector || 'N/A',
            industry: scoring.industry || 'N/A',
            composite_score: scoring.composite_score || 0,
            coverage_percent: parseFloat((coverageData.coverage * 100).toFixed(0)),
            intensity_percent: parseFloat((coverageData.intensity * 100).toFixed(0)),
            risk_count: riskCount,
            themes: scoring.themes || {}
        };
    });
    
    // Download file
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `company_screener_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}


function getTopRisks(themes, limit = 3) {
    return Object.entries(themes)
        .filter(([_, score]) => score > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([name, score]) => ({ name, score }));
}

function getCompanyInsights(scoring) {
    const riskCount = Object.values(scoring.themes || {}).filter(score => score > 0).length;
    const totalRisks = Object.keys(scoring.themes || {}).length;
    const avgScore = scoring.composite_score / Math.max(riskCount, 1);
    
    let summary = '';
    let details = '';
    
    if (riskCount === 0) {
        summary = 'No risk exposure detected';
        details = 'Company shows no evidence of risk factors';
    } else if (riskCount === 1) {
        summary = 'Single risk exposure';
        details = 'Company exposed to 1 risk factor';
    } else if (riskCount <= 3) {
        summary = 'Low risk exposure';
        details = `Exposed to ${riskCount} risk factors`;
    } else if (riskCount <= 6) {
        summary = 'Moderate risk exposure';
        details = `Exposed to ${riskCount} risk factors`;
    } else {
        summary = 'High risk exposure';
        details = `Exposed to ${riskCount} risk factors`;
    }
    
    return { summary, details };
}

// Multi-select filter handling
function updateFilterCounts() {
    const sectorSelect = document.getElementById('filterSector');
    const industrySelect = document.getElementById('filterIndustry');
    const riskSelect = document.getElementById('filterRisk');
    
    if (sectorSelect) {
        const sectorCount = sectorSelect.selectedOptions.length;
        const sectorCountEl = document.getElementById('sectorCount');
        if (sectorCountEl) {
            sectorCountEl.textContent = sectorCount;
            sectorCountEl.style.display = sectorCount > 0 ? 'block' : 'none';
        }
    }
    
    if (industrySelect) {
        const industryCount = industrySelect.selectedOptions.length;
        const industryCountEl = document.getElementById('industryCount');
        if (industryCountEl) {
            industryCountEl.textContent = industryCount;
            industryCountEl.style.display = industryCount > 0 ? 'block' : 'none';
        }
    }
    
    if (riskSelect) {
        const riskCount = riskSelect.selectedOptions.length;
        const riskCountEl = document.getElementById('riskCount');
        if (riskCountEl) {
            riskCountEl.textContent = riskCount;
            riskCountEl.style.display = riskCount > 0 ? 'block' : 'none';
        }
    }
}

// Enhanced filter function with multi-select support
function filterScreener() {
    if (!currentScreenerData) return;
    
    const searchTerm = filterState.search.toLowerCase();
    const selectedSectors = filterState.sectors;
    const selectedIndustries = filterState.industries;
    const selectedRisks = filterState.risks;
    const topN = filterState.topN;
    
    let filteredCompanies = currentScreenerData.companies.filter(([companyName, scoring]) => {
        // Search filter
        if (searchTerm && !companyName.toLowerCase().includes(searchTerm)) {
            return false;
        }
        
        // Sector filter
        if (selectedSectors.length > 0 && !selectedSectors.includes(scoring.sector)) {
            return false;
        }
        
        // Industry filter
        if (selectedIndustries.length > 0 && !selectedIndustries.includes(scoring.industry)) {
            return false;
        }
        
        // Risk factor filter
        if (selectedRisks.length > 0) {
            const hasAnySelectedRisk = selectedRisks.some(risk => 
                scoring.themes && scoring.themes[risk] && scoring.themes[risk] > 0
            );
            if (!hasAnySelectedRisk) return false;
        }
        
        return true;
    });
    
    // Apply sorting
    sortCompanies(filteredCompanies, currentScreenerSortField, currentScreenerSortDirection);
    
    // Apply Top N filter
    if (topN && topN !== '') {
        filteredCompanies = filteredCompanies.slice(0, parseInt(topN));
    }
    
    // Update count
    document.getElementById('screenerCount').textContent = 
        `Showing ${filteredCompanies.length} of ${currentScreenerData.companies.length} companies`;
    
    // Re-render table
    renderScreenerTable(filteredCompanies);
    
    // Update filter counts
    updateFilterCounts();
}

// Screener guide modal
function showScreenerGuide() {
    const modal = document.getElementById('screenerGuideModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function hideScreenerGuide() {
    const modal = document.getElementById('screenerGuideModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Toggle functions for expandable sections
function toggleScreenerCompanyThemes(button, event) {
    event.stopPropagation();
    
    const companyRow = button.closest('.screener-company-item');
    const themesSection = companyRow.nextElementSibling;
    const insightsSection = themesSection.nextElementSibling;
    
    // Toggle themes section
    themesSection.classList.toggle('hidden');
    
    // Hide insights section if it's open
    if (!insightsSection.classList.contains('hidden')) {
        insightsSection.classList.add('hidden');
    }
    
    // Update button appearance
    if (themesSection.classList.contains('hidden')) {
        button.classList.remove('bg-orange-500/20');
        button.classList.add('bg-orange-500/10');
    } else {
        button.classList.remove('bg-orange-500/10');
        button.classList.add('bg-orange-500/20');
    }
}

function toggleScreenerCompanyInsights(button, event) {
    event.stopPropagation();
    
    const companyRow = button.closest('.screener-company-item');
    const themesSection = companyRow.nextElementSibling;
    const insightsSection = themesSection.nextElementSibling;
    
    // Toggle insights section
    insightsSection.classList.toggle('hidden');
    
    // Hide themes section if it's open
    if (!themesSection.classList.contains('hidden')) {
        themesSection.classList.add('hidden');
    }
    
    // Update button appearance
    if (insightsSection.classList.contains('hidden')) {
        button.classList.remove('bg-amber-500/20');
        button.classList.add('bg-amber-500/10');
    } else {
        button.classList.remove('bg-amber-500/10');
        button.classList.add('bg-amber-500/20');
    }
}

// Filter state management
let filterState = {
    search: '',
    sectors: [],
    industries: [],
    risks: [],
    topN: ''
};

// Handle search input with debouncing
let searchTimeout;
function handleSearchInput() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        const searchValue = document.getElementById('searchCompany').value;
        if (filterState.search !== searchValue) {
            filterState.search = searchValue;
            updateFilterChips();
            filterScreener();
        }
    }, 300);
}

// Handle filter changes
function handleFilterChange() {
    // Small delay to ensure DOM has updated
    setTimeout(() => {
        // Update filter state - use a more reliable method
        const allSectorCheckboxes = document.querySelectorAll('.sector-filter');
        const allIndustryCheckboxes = document.querySelectorAll('.industry-filter');
        const allRiskCheckboxes = document.querySelectorAll('.risk-filter');
        const topNSelect = document.getElementById('filterTopN');
    
        // Get only the checked ones
        const newSectors = Array.from(allSectorCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);
        const newIndustries = Array.from(allIndustryCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);
        const newRisks = Array.from(allRiskCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);
        const newTopN = topNSelect ? topNSelect.value : '';
        
        filterState.sectors = newSectors;
        filterState.industries = newIndustries;
        filterState.risks = newRisks;
        filterState.topN = newTopN;
        
        updateFilterChips();
        filterScreener();
    }, 10); // Small delay to ensure DOM has updated
}

// Update filter chips display
function updateFilterChips() {
    const chipsContainer = document.getElementById('filter-chips');
    if (!chipsContainer) return;
    
    const chips = [];
    
    // Search chip
    if (filterState.search) {
        const escapedSearch = filterState.search.replace(/'/g, "\\'").replace(/"/g, '\\"');
        chips.push(`
            <div class="filter-chip bg-green-500/20 border border-green-500/30 text-green-300 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                <span>Search: "${escapeHtml(filterState.search)}"</span>
                <button onclick="removeFilter('search', '${escapedSearch}')" class="hover:text-green-100">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        `);
    }
    
    // Sector chips
    (filterState.sectors || []).forEach(sector => {
        const escapedSector = sector.replace(/'/g, "\\'").replace(/"/g, '\\"');
        chips.push(`
            <div class="filter-chip bg-blue-500/20 border border-blue-500/30 text-blue-300 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                <span>Sector: ${escapeHtml(sector)}</span>
                <button onclick="removeFilter('sector', '${escapedSector}')" class="hover:text-blue-100">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        `);
    });
    
    // Industry chips
    (filterState.industries || []).forEach(industry => {
        const escapedIndustry = industry.replace(/'/g, "\\'").replace(/"/g, '\\"');
        chips.push(`
            <div class="filter-chip bg-purple-500/20 border border-purple-500/30 text-purple-300 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                <span>Industry: ${escapeHtml(industry)}</span>
                <button onclick="removeFilter('industry', '${escapedIndustry}')" class="hover:text-purple-100">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        `);
    });
    
    // Risk chips
    (filterState.risks || []).forEach(risk => {
        const escapedRisk = risk.replace(/'/g, "\\'").replace(/"/g, '\\"');
        chips.push(`
            <div class="filter-chip bg-red-500/20 border border-red-500/30 text-red-300 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                <span>Risk: ${escapeHtml(risk)}</span>
                <button onclick="removeFilter('risk', '${escapedRisk}')" class="hover:text-red-100">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        `);
    });
    
    // Top N chip
    if (filterState.topN) {
        const escapedTopN = filterState.topN.replace(/'/g, "\\'").replace(/"/g, '\\"');
        chips.push(`
            <div class="filter-chip bg-orange-500/20 border border-orange-500/30 text-orange-300 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                <span>Top ${filterState.topN}</span>
                <button onclick="removeFilter('topN', '${escapedTopN}')" class="hover:text-orange-100">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        `);
    }
    
    if (chips.length === 0) {
        chipsContainer.innerHTML = '<div class="text-sm text-zinc-500 italic">No filters applied</div>';
    } else {
        chipsContainer.innerHTML = chips.join('');
    }
}

// Remove individual filter
function removeFilter(type, value) {
    if (type === 'search') {
        filterState.search = '';
        const searchInput = document.getElementById('searchCompany');
        if (searchInput) searchInput.value = '';
    } else if (type === 'topN') {
        filterState.topN = '';
        const topNSelect = document.getElementById('filterTopN');
        if (topNSelect) topNSelect.value = '';
    } else {
        // Map the type to the correct property name
        const propertyMap = {
            'sector': 'sectors',
            'industry': 'industries', 
            'risk': 'risks'
        };
        const propertyName = propertyMap[type] || type;
        
        // Ensure the filter array exists before calling filter
        if (!filterState[propertyName]) {
            filterState[propertyName] = [];
        }
        
        // Ensure we have a proper array to work with
        if (!Array.isArray(filterState[propertyName])) {
            filterState[propertyName] = [];
        }
        
        filterState[propertyName] = filterState[propertyName].filter(item => item !== value);
        
        // Uncheck the corresponding checkbox
        // The value passed to removeFilter is already escaped from the chip onclick
        // So we need to unescape it to find the original checkbox value
        const unescapedValue = value.replace(/\\'/g, "'").replace(/\\"/g, '"');
        let checkbox = document.querySelector(`.${type}-filter[value="${unescapedValue}"]`);
        
        // If not found with unescaped value, try with the original escaped value
        if (!checkbox) {
            checkbox = document.querySelector(`.${type}-filter[value="${value}"]`);
        }
        
        if (checkbox) {
            checkbox.checked = false;
        } else {
            // Fallback: find by iterating through all checkboxes
            const allCheckboxes = document.querySelectorAll(`.${type}-filter`);
            for (const cb of allCheckboxes) {
                if (cb.value === unescapedValue || cb.value === value) {
                    cb.checked = false;
                    break;
                }
            }
        }
    }
    
    updateFilterChips();
    filterScreener();
}

// Clear all filters
function clearAllFilters() {
    filterState.search = '';
    filterState.sectors = [];
    filterState.industries = [];
    filterState.risks = [];
    filterState.topN = '';
    
    // Clear form elements
    document.getElementById('searchCompany').value = '';
    document.getElementById('filterTopN').value = '';
    document.querySelectorAll('.sector-filter, .industry-filter, .risk-filter').forEach(cb => cb.checked = false);
    
    updateFilterChips();
    filterScreener();
}

// Make functions globally accessible
window.renderCompanyScreener = renderCompanyScreener;
window.filterScreener = filterScreener;
window.sortScreener = sortScreener;
window.clearFilters = clearFilters;
window.exportCSV = exportCSV;
window.exportJSON = exportJSON;
window.showScreenerGuide = showScreenerGuide;
window.hideScreenerGuide = hideScreenerGuide;
window.toggleScreenerCompanyThemes = toggleScreenerCompanyThemes;
window.toggleScreenerCompanyInsights = toggleScreenerCompanyInsights;
window.handleSearchInput = handleSearchInput;
window.handleFilterChange = handleFilterChange;
window.removeFilter = removeFilter;
window.clearAllFilters = clearAllFilters;
