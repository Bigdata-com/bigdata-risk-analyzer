// Risk Evolution Time Series Visualization
let riskEvolutionData = [];
let activeSeries = [];
let availableCompanies = [];
let availableRisks = [];
let dateRange = { min: null, max: null };
let selectedDateRange = { start: null, end: null }; // User-selected date range filter
let currentChart = null;
let resizeTimeout = null;


// Color palette for series
const SERIES_COLORS = [
    '#ef4444', // red-500
    '#3b82f6', // blue-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#8b5cf6', // purple-500
    '#ec4899', // pink-500
    '#14b8a6', // teal-500
    '#f97316', // orange-500
    '#06b6d4', // cyan-500
    '#84cc16', // lime-500
];

// Main rendering function
function renderRiskEvolution(content, themeScoring) {
    const container = document.querySelector('[data-tab-content="risk-evolution"] .tab-actual-content');
    if (!container) {
        console.error('Risk Evolution: Container not found');
        return;
    }

    // Handle RootModel structure (content.root) or direct array
    // Note: adaptRiskDataToThemeFormat should have already extracted content.root,
    // but handle both cases for robustness
    let contentArray = content;
    if (content && typeof content === 'object' && !Array.isArray(content)) {
        if (content.root && Array.isArray(content.root)) {
            contentArray = content.root;
        } else {
            console.warn('Risk Evolution: Content is not an array and has no root property', content);
            container.innerHTML = '<p class="text-zinc-400">Invalid content data format</p>';
            return;
        }
    }

    console.log('Risk Evolution: Rendering with content', {
        hasContent: !!content,
        isArray: Array.isArray(contentArray),
        length: Array.isArray(contentArray) ? contentArray.length : 0,
        sampleItem: Array.isArray(contentArray) && contentArray.length > 0 ? contentArray[0] : null
    });

    // Filter out discarded evidence if audit status is available
    if (window.evidenceAuditStatus && Array.isArray(contentArray) && contentArray.length > 0) {
        // Get allEvidenceData from evidence_table.js if available
        const allEvidence = window.allEvidenceData || contentArray;
        
        contentArray = contentArray.filter(item => {
            // Find index in allEvidenceData
            const index = allEvidence.findIndex(ev => 
                ev.company === item.company &&
                ev.date === item.date &&
                ev.quote === item.quote &&
                (ev.sub_scenario || ev.risk_factor || ev.theme) === (item.sub_scenario || item.risk_factor || item.theme)
            );
            
            // If found and audit status exists, check if accepted
            if (index >= 0 && window.evidenceAuditStatus[index] !== undefined) {
                return window.evidenceAuditStatus[index] !== false;
            }
            
            // If not found or no audit status, include by default
            return true;
        });
    }

    if (!contentArray || !Array.isArray(contentArray) || contentArray.length === 0) {
        container.innerHTML = `
            <div class="text-center py-20">
                <p class="text-zinc-400 mb-4">No evidence data available for time series analysis</p>
                <p class="text-zinc-500 text-sm">Add time series to visualize risk evolution over time</p>
            </div>
        `;
        return;
    }

    riskEvolutionData = contentArray;
    activeSeries = [];

    // Extract available companies from content
    availableCompanies = [...new Set(contentArray.map(item => item.company).filter(Boolean))].sort();

    // Extract available risk factors from themeScoring (most granular level, same as heatmap/company screener)
    // These are leaf-level risk factors from the taxonomy, already at the most granular level
    const risksFromThemeScoring = new Set();
    if (themeScoring && typeof themeScoring === 'object' && !Array.isArray(themeScoring)) {
        // Handle RootModel structure (themeScoring.root) or direct object
        const scoringData = themeScoring.root || themeScoring;
        if (scoringData && typeof scoringData === 'object' && !Array.isArray(scoringData)) {
            Object.entries(scoringData).forEach(([_, scoring]) => {
                if (scoring && typeof scoring === 'object' && !Array.isArray(scoring)) {
                    // Extract from themes property (contains risk factors at leaf level)
                    if (scoring.themes && typeof scoring.themes === 'object' && !Array.isArray(scoring.themes)) {
                        Object.keys(scoring.themes).forEach(risk => risksFromThemeScoring.add(risk));
                    }
                    // Also check for risks property (risk analyzer format)
                    if (scoring.risks && typeof scoring.risks === 'object') {
                        // Handle RootModel for risks (risks.root)
                        const risksData = scoring.risks.root || scoring.risks;
                        if (risksData && typeof risksData === 'object' && !Array.isArray(risksData)) {
                            Object.keys(risksData).forEach(risk => risksFromThemeScoring.add(risk));
                        }
                    }
                }
            });
        }
    }
    
    availableRisks = Array.from(risksFromThemeScoring).sort();

    // Debug: Check what risk factors exist in content vs themeScoring
    const riskFactorsInContent = [...new Set(contentArray.map(item => item.risk_factor).filter(Boolean))].sort();
    const subScenariosInContent = [...new Set(contentArray.map(item => item.sub_scenario).filter(Boolean))].sort();
    const themesInContent = [...new Set(contentArray.map(item => item.theme).filter(Boolean))].sort();
    
    console.log('Risk Evolution: Risk factor comparison', {
        fromThemeScoring: availableRisks.slice(0, 10),
        fromContent_risk_factor: riskFactorsInContent.slice(0, 10),
        fromContent_sub_scenario: subScenariosInContent.slice(0, 10),
        fromContent_theme: themesInContent.slice(0, 10),
        themeScoringCount: availableRisks.length,
        contentCount_risk_factor: riskFactorsInContent.length,
        contentCount_sub_scenario: subScenariosInContent.length,
        matches_risk_factor: availableRisks.filter(rf => riskFactorsInContent.includes(rf)).length,
        matches_sub_scenario: availableRisks.filter(rf => subScenariosInContent.includes(rf)).length,
        matches_theme: availableRisks.filter(rf => themesInContent.includes(rf)).length
    });

    // Calculate date range
    const dates = contentArray.map(item => new Date(item.date)).filter(d => !isNaN(d.getTime()));
    if (dates.length > 0) {
        dateRange.min = new Date(Math.min(...dates));
        dateRange.max = new Date(Math.max(...dates));
        // Initialize selected date range to full range
        selectedDateRange.start = new Date(dateRange.min);
        selectedDateRange.end = new Date(dateRange.max);
    }

    // Calculate date range in days
    const dateRangeDays = dateRange.min && dateRange.max 
        ? Math.ceil((dateRange.max - dateRange.min) / (1000 * 60 * 60 * 24))
        : 0;

    // Format date range for display
    const dateRangeText = dateRange.min && dateRange.max
        ? `${dateRange.min.toISOString().split('T')[0]} to ${dateRange.max.toISOString().split('T')[0]}`
        : 'N/A';
    
    // Calculate available range for presets
    const today = new Date();
    const dataStartDate = dateRange.min ? new Date(dateRange.min) : null;
    const dataEndDate = dateRange.max ? new Date(dateRange.max) : null;
    
    // Check which presets are feasible
    const daysSinceStart = dataStartDate ? Math.ceil((today - dataStartDate) / (1000 * 60 * 60 * 24)) : 0;
    const daysSinceEnd = dataEndDate ? Math.ceil((today - dataEndDate) / (1000 * 60 * 60 * 24)) : 0;
    const yearStart = new Date(today.getFullYear(), 0, 1);
    const hasYTD = dataStartDate && dataStartDate <= yearStart;
    
    const canDoLast7 = daysSinceEnd >= 7;
    const canDoLast30 = daysSinceEnd >= 30;
    const canDoLast90 = daysSinceEnd >= 90;

    let html = `
        <div class="mb-6">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                        </svg>
                        Risk Evolution
                    </h3>
                    <p class="text-zinc-400 text-sm">Time series visualization of raw scores over time</p>
                    <p class="text-zinc-400 text-xs mt-1">Available range: ${dateRangeText} (${dateRangeDays} days)</p>
                </div>
                <div class="flex gap-2">
                    <button onclick="exportRiskEvolutionCSV()" 
                        class="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        Export CSV
                    </button>
                    <button onclick="exportRiskEvolutionPNG()" 
                        class="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        Export PNG
                    </button>
                </div>
            </div>

            <!-- Date Range Selection - Compact Single Row -->
            <div class="bg-zinc-800/50 rounded-lg border border-zinc-700 p-3 mb-3">
                <div class="flex flex-wrap items-center gap-3">
                    <span class="text-sm font-medium text-zinc-400">Date Range:</span>
                    <div class="flex flex-wrap gap-1.5">
                        <button onclick="applyDateRangePreset('last7')" 
                            class="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded text-sm font-medium transition-colors ${!canDoLast7 ? 'opacity-50 cursor-not-allowed' : ''}"
                            ${!canDoLast7 ? 'disabled' : ''}>
                            7d
                        </button>
                        <button onclick="applyDateRangePreset('last30')" 
                            class="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded text-sm font-medium transition-colors ${!canDoLast30 ? 'opacity-50 cursor-not-allowed' : ''}"
                            ${!canDoLast30 ? 'disabled' : ''}>
                            30d
                        </button>
                        <button onclick="applyDateRangePreset('last90')" 
                            class="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded text-sm font-medium transition-colors ${!canDoLast90 ? 'opacity-50 cursor-not-allowed' : ''}"
                            ${!canDoLast90 ? 'disabled' : ''}>
                            90d
                        </button>
                        <button onclick="applyDateRangePreset('ytd')" 
                            class="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded text-sm font-medium transition-colors ${!hasYTD ? 'opacity-50 cursor-not-allowed' : ''}"
                            ${!hasYTD ? 'disabled' : ''}>
                            YTD
                        </button>
                        <button onclick="applyDateRangePreset('all')" 
                            class="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded text-sm font-medium transition-colors">
                            All
                        </button>
                    </div>
                    <div class="flex items-center gap-2">
                        <input type="date" id="riskEvolutionStartDate" 
                            value="${selectedDateRange.start ? selectedDateRange.start.toISOString().split('T')[0] : ''}"
                            min="${dateRange.min ? dateRange.min.toISOString().split('T')[0] : ''}"
                            max="${dateRange.max ? dateRange.max.toISOString().split('T')[0] : ''}"
                            class="px-3 py-1.5 bg-zinc-900 border border-zinc-600 rounded text-zinc-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                        <span class="text-zinc-500 text-sm">to</span>
                        <input type="date" id="riskEvolutionEndDate" 
                            value="${selectedDateRange.end ? selectedDateRange.end.toISOString().split('T')[0] : ''}"
                            min="${dateRange.min ? dateRange.min.toISOString().split('T')[0] : ''}"
                            max="${dateRange.max ? dateRange.max.toISOString().split('T')[0] : ''}"
                            class="px-3 py-1.5 bg-zinc-900 border border-zinc-600 rounded text-zinc-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                        <button onclick="applyDateRangeFilter()" 
                            class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors">
                            Apply
                        </button>
                    </div>
                    <div class="ml-auto text-sm text-zinc-400">
                        <span id="activeDateRangeText">
                            ${selectedDateRange.start && selectedDateRange.end 
                                ? `${selectedDateRange.start.toISOString().split('T')[0]} to ${selectedDateRange.end.toISOString().split('T')[0]}`
                                : 'All dates'}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Add Time Series - Compact Single Row -->
            <div class="bg-zinc-800/50 rounded-lg border border-zinc-700 p-3 mb-3">
                <div class="flex flex-wrap items-center gap-3">
                    <span class="text-sm font-medium text-zinc-400">Add Series:</span>
                    <select id="riskEvolutionCompany" 
                        class="px-3 py-1.5 bg-zinc-900 border border-zinc-600 rounded text-zinc-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer">
                        <option value="">All Companies</option>
                        ${availableCompanies.map(company => `<option value="${escapeHtml(company)}">${escapeHtml(company)}</option>`).join('')}
                    </select>
                    <select id="riskEvolutionRisk" 
                        class="px-3 py-1.5 bg-zinc-900 border border-zinc-600 rounded text-zinc-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer">
                        <option value="">All Risk Factors</option>
                        ${availableRisks.map(risk => `<option value="${escapeHtml(risk)}">${escapeHtml(risk)}</option>`).join('')}
                    </select>
                    <select id="riskEvolutionWindow" 
                        class="px-3 py-1.5 bg-zinc-900 border border-zinc-600 rounded text-zinc-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer">
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly" ${dateRangeDays < 30 ? 'disabled' : ''}>Monthly</option>
                    </select>
                    <button onclick="addRiskEvolutionSeries()" 
                        class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors flex items-center gap-1.5">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                        </svg>
                        Add
                    </button>
                </div>
            </div>

            <!-- Active Series List -->
            <div id="riskEvolutionSeriesList" class="bg-zinc-800/50 rounded-lg border border-zinc-700 p-4 mb-4 ${activeSeries.length === 0 ? 'hidden' : ''}">
                <h4 class="text-lg font-semibold text-white mb-3">Active Series (${activeSeries.length})</h4>
                <div id="riskEvolutionSeriesItems" class="space-y-2">
                </div>
            </div>

            <!-- Chart Container -->
            <div id="riskEvolutionChart" class="bg-zinc-800/50 rounded-lg border border-zinc-700 p-4" style="overflow: visible;">
                <svg id="riskEvolutionSvg" style="display: ${activeSeries.length === 0 ? 'none' : 'block'}; overflow: visible;"></svg>
                <div id="riskEvolutionEmptyMessage" class="flex items-center justify-center py-20 text-zinc-400" style="display: ${activeSeries.length === 0 ? 'flex' : 'none'}">
                    <p>Add a time series to visualize risk evolution over time</p>
                </div>
            </div>
        </div>
    `;

    try {
        container.innerHTML = html;
        updateSeriesList();
        
        // Setup window resize handler for responsive chart
        setupResizeHandler();
        
        console.log('Risk Evolution: UI rendered successfully');
    } catch (error) {
        console.error('Risk Evolution: Error rendering UI', error);
        container.innerHTML = `
            <div class="text-center py-20">
                <p class="text-red-400 mb-4">Error rendering Risk Evolution tab</p>
                <p class="text-zinc-500 text-sm">${error.message}</p>
            </div>
        `;
    }
}

// Setup debounced window resize handler for responsive chart
function setupResizeHandler() {
    // Remove existing handler if any
    window.removeEventListener('resize', handleResize);
    
    // Add new debounced resize handler
    window.addEventListener('resize', handleResize);
}

// Debounced resize handler
function handleResize() {
    // Clear existing timeout
    if (resizeTimeout) {
        clearTimeout(resizeTimeout);
    }
    
    // Debounce resize events - wait 250ms after last resize event
    resizeTimeout = setTimeout(() => {
        // Only redraw if Risk Evolution tab is active and has series
        const tabContent = document.querySelector('[data-tab-content="risk-evolution"]');
        if (tabContent && !tabContent.classList.contains('hidden') && activeSeries.length > 0) {
            updateChart();
        }
    }, 250);
}

// Get next available color that isn't already in use
function getNextAvailableColor() {
    const usedColors = new Set(activeSeries.map(s => s.color));
    
    // Try to find an unused color from the palette
    for (const color of SERIES_COLORS) {
        if (!usedColors.has(color)) {
            return color;
        }
    }
    
    // If all colors are used, cycle through them but ensure uniqueness
    // by using a different approach: find the first color that's not in the current set
    // This shouldn't happen with 10 colors, but handle edge case
    for (let i = 0; i < SERIES_COLORS.length; i++) {
        const color = SERIES_COLORS[i];
        if (!usedColors.has(color)) {
            return color;
        }
    }
    
    // Fallback: use modulo but this should be rare
    return SERIES_COLORS[activeSeries.length % SERIES_COLORS.length];
}

// Add a new series
function addRiskEvolutionSeries() {
    const company = document.getElementById('riskEvolutionCompany')?.value || '';
    const risk = document.getElementById('riskEvolutionRisk')?.value || '';
    const windowType = document.getElementById('riskEvolutionWindow')?.value || 'daily';

    // Generate unique identifier
    const seriesId = `${company || 'All'}_${risk || 'All'}_${windowType}`;

    // Check if series already exists
    if (activeSeries.some(s => s.id === seriesId)) {
        alert('This series is already active');
        return;
    }

    // Get next available color that isn't already in use
    const color = getNextAvailableColor();

    // Create series object
    const series = {
        id: seriesId,
        company: company || null,
        risk: risk || null,
        window: windowType,
        color: color
    };

    activeSeries.push(series);
    updateSeriesList();
    
    // Use setTimeout to prevent blocking
    setTimeout(() => {
        updateChart();
    }, 10);
}

// Remove a series
function removeRiskEvolutionSeries(seriesId) {
    activeSeries = activeSeries.filter(s => s.id !== seriesId);
    updateSeriesList();
    
    // Use setTimeout to prevent blocking
    setTimeout(() => {
        updateChart();
    }, 10);
}

// Update series list display
function updateSeriesList() {
    const container = document.getElementById('riskEvolutionSeriesList');
    const itemsContainer = document.getElementById('riskEvolutionSeriesItems');

    if (!container || !itemsContainer) return;

    if (activeSeries.length === 0) {
        container.classList.add('hidden');
        return;
    }

    container.classList.remove('hidden');

    itemsContainer.innerHTML = activeSeries.map(series => {
        const companyLabel = series.company || 'All Companies';
        const riskLabel = series.risk || 'All Risk Factors';
        const windowLabel = series.window === 'daily' ? 'Daily' 
            : series.window === 'weekly' ? 'Weekly (7-day rolling)' 
            : 'Monthly (30-day rolling)';
        
        return `
            <div class="flex items-center justify-between bg-zinc-900/50 rounded-lg p-3 border border-zinc-700">
                <div class="flex items-center gap-3">
                    <div class="w-4 h-4 rounded" style="background-color: ${series.color}"></div>
                    <span class="text-zinc-200 text-sm font-medium">${escapeHtml(companyLabel)} - ${escapeHtml(riskLabel)}</span>
                    <span class="text-zinc-400 text-xs">(${windowLabel})</span>
                </div>
                <button onclick="removeRiskEvolutionSeries('${series.id}')" 
                    class="text-red-400 hover:text-red-300 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        `;
    }).join('');
}

// Process time series data for a given series
// Filter by risk_factor field (most granular level) matching the selected risk factor from themeScoring
function processTimeSeriesData(series) {
    console.log('Processing time series data:', {
        series: series,
        totalDataPoints: riskEvolutionData.length,
        sampleItems: riskEvolutionData.slice(0, 3).map(item => ({
            company: item.company,
            risk_factor: item.risk_factor,
            sub_scenario: item.sub_scenario
        }))
    });

    // First filter by date range if selected
    let dateFiltered = riskEvolutionData;
    if (selectedDateRange.start && selectedDateRange.end) {
        dateFiltered = riskEvolutionData.filter(item => {
            if (!item.date) return false;
            const itemDate = new Date(item.date);
            // Normalize to midnight local time for comparison
            const normalizedItemDate = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
            return normalizedItemDate >= selectedDateRange.start && normalizedItemDate <= selectedDateRange.end;
        });
    }
    
    // Filter content based on company and risk factor
    // The selected risk factor comes from themeScoring.themes keys (most granular level from taxonomy)
    // Try to match against risk_factor first (most granular), then fallback to sub_scenario if needed
    // This handles cases where the taxonomy leaf node might be stored in different fields
    let filtered = dateFiltered.filter(item => {
        const matchCompany = !series.company || item.company === series.company;
        
        if (!series.risk) {
            // No risk factor filter - include all
            return matchCompany;
        }
        
        // Match the selected risk factor - try risk_factor first (most granular), then sub_scenario
        // The risk factors from themeScoring.themes are leaf-level nodes that should match risk_factor
        // but we check sub_scenario as fallback in case of data structure variations
        const riskFactor = item.risk_factor;
        const subScenario = item.sub_scenario;
        const matchRisk = riskFactor === series.risk || subScenario === series.risk;
        
        return matchCompany && matchRisk;
    });

    console.log(`Filtered results: ${filtered.length} items`, {
        companyFilter: series.company || 'All',
        riskFilter: series.risk || 'All',
        sampleFiltered: filtered.slice(0, 3).map(item => ({
            company: item.company,
            risk_factor: item.risk_factor,
            date: item.date
        }))
    });

    // Group by date and count chunks (raw score)
    const dateCounts = {};
    filtered.forEach(item => {
        const date = item.date;
        if (!date) return;
        dateCounts[date] = (dateCounts[date] || 0) + 1;
    });

    // Convert to array of {date, value} objects
    // Normalize dates to midnight local time to ensure proper alignment with axis ticks
    let dataPoints = Object.entries(dateCounts)
        .map(([date, value]) => {
            const dateObj = new Date(date);
            if (isNaN(dateObj.getTime())) {
                return null;
            }
            // Normalize to midnight local time to avoid timezone issues
            const normalizedDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
            return {
                date: normalizedDate,
                value: value
            };
        })
        .filter(d => d !== null)
        .sort((a, b) => a.date - b.date);

    // Apply rolling window if needed
    if (series.window === 'weekly') {
        dataPoints = applyRollingWindow(dataPoints, 7);
    } else if (series.window === 'monthly') {
        dataPoints = applyRollingWindow(dataPoints, 30);
    }

    return dataPoints;
}

// Apply rolling window aggregation
function applyRollingWindow(dataPoints, windowDays) {
    if (dataPoints.length === 0) return [];

    // Calculate rolling sum on-the-fly: for each data point,
    // find all data points within the window period and sum them
    // This is O(n²) in worst case but much faster in practice since
    // we only process actual data points, not every calendar day
    const rollingData = [];
    const windowMs = windowDays * 24 * 60 * 60 * 1000; // Convert days to milliseconds
    
    for (let i = 0; i < dataPoints.length; i++) {
        const targetDate = dataPoints[i].date;
        const windowStart = new Date(targetDate.getTime() - windowMs + 24 * 60 * 60 * 1000); // Include current day
        
        let sum = 0;
        
        // Sum all data points within the window
        // Since dataPoints is sorted by date, we can optimize by checking from current index backwards
        for (let j = i; j >= 0; j--) {
            const checkDate = dataPoints[j].date;
            
            // If this point is outside the window, we can stop (since points are sorted)
            if (checkDate < windowStart) {
                break;
            }
            
            sum += dataPoints[j].value;
        }
        
        rollingData.push({
            date: targetDate,
            value: sum
        });
    }

    return rollingData;
}

// Update chart with all active series
function updateChart() {
    const container = document.getElementById('riskEvolutionChart');
    const svgElement = document.getElementById('riskEvolutionSvg');
    const emptyMessage = document.getElementById('riskEvolutionEmptyMessage');
    
    if (!container) {
        console.error('Risk Evolution: Chart container not found');
        return;
    }

    if (activeSeries.length === 0) {
        if (svgElement) svgElement.style.display = 'none';
        if (emptyMessage) emptyMessage.style.display = 'flex';
        return;
    }

    // Show chart, hide empty message
    if (svgElement) svgElement.style.display = 'block';
    if (emptyMessage) emptyMessage.style.display = 'none';

    // Process data for all series
    const allSeriesData = activeSeries.map(series => {
        const data = processTimeSeriesData(series);
        const companyLabel = series.company || 'All Companies';
        const riskLabel = series.risk || 'All Risk Factors';
        const windowLabel = series.window === 'daily' ? 'Daily' 
            : series.window === 'weekly' ? 'Weekly' 
            : 'Monthly';
        
        return {
            id: series.id,
            label: `${companyLabel} - ${riskLabel} (${windowLabel})`,
            data: data,
            color: series.color
        };
    });

    // Filter out series with no data
    const seriesWithData = allSeriesData.filter(s => s.data && s.data.length > 0);
    
    if (seriesWithData.length === 0) {
        if (svgElement) {
            const container = svgElement.parentElement;
            const width = container ? container.clientWidth || 800 : 800;
            const availableHeight = Math.min(window.innerHeight * 0.5, container?.clientHeight || 500);
            const height = Math.max(400, availableHeight);
            svgElement.setAttribute('width', width);
            svgElement.setAttribute('height', height);
            svgElement.innerHTML = `<text x="50%" y="50%" text-anchor="middle" fill="#71717a" font-size="16" dy=".3em">No data available for selected series</text>`;
        }
        return;
    }

    // Render chart with error handling
    try {
        renderTimeSeriesChart(seriesWithData, 'riskEvolutionSvg');
    } catch (error) {
        console.error('Risk Evolution: Error rendering chart', error);
        if (svgElement) {
            const container = svgElement.parentElement;
            const width = container ? container.clientWidth || 800 : 800;
            const availableHeight = Math.min(window.innerHeight * 0.5, container?.clientHeight || 500);
            const height = Math.max(400, availableHeight);
            svgElement.setAttribute('width', width);
            svgElement.setAttribute('height', height);
            svgElement.innerHTML = `<text x="50%" y="50%" text-anchor="middle" fill="#ef4444" font-size="16" dy=".3em">Error rendering chart: ${error.message}</text>`;
        }
    }
}

// Render D3.js time series chart
function renderTimeSeriesChart(seriesArray, containerId) {
    const svgElement = document.getElementById(containerId);
    if (!svgElement) return;

    // Check if D3 is available
    if (typeof d3 === 'undefined') {
        svgElement.innerHTML = '<text x="50%" y="50%" text-anchor="middle" fill="#ef4444" font-size="16" dy=".3em">D3.js library not loaded. Please check your connection.</text>';
        return;
    }

    // Clear previous chart and remove any existing tooltips
    d3.select(`#${containerId}`).selectAll("*").remove();
    d3.selectAll(".risk-evolution-tooltip").remove();

    if (seriesArray.length === 0 || seriesArray.every(s => s.data.length === 0)) {
        svgElement.innerHTML = '<text x="50%" y="50%" text-anchor="middle" fill="#71717a" font-size="16">No data available for selected series</text>';
        return;
    }

    // Set dimensions - responsive height based on viewport
    // Increased bottom margin to accommodate rotated date labels with larger font (16px)
    // Rotated -45deg text extends diagonally, needs significant vertical space
    const margin = { top: 20, right: 30, bottom: 120, left: 60 };
    const container = svgElement.parentElement;
    const width = container.clientWidth - margin.left - margin.right;
    // Responsive height: use viewport height or container, whichever is smaller, with a minimum of 400px
    const availableHeight = Math.min(window.innerHeight * 0.5, container.clientHeight || 500);
    const height = Math.max(400, availableHeight) - margin.top - margin.bottom;

    // Create SVG with overflow visible to prevent clipping of rotated labels
    const svg = d3.select(`#${containerId}`)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style("overflow", "visible");

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Get all dates and values for scaling
    const allDates = [];
    const allValues = [];
    seriesArray.forEach(series => {
        series.data.forEach(d => {
            allDates.push(d.date);
            allValues.push(d.value);
        });
    });

    // Scales
    const xScale = d3.scaleTime()
        .domain(d3.extent(allDates))
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(allValues) * 1.1 || 1])
        .nice()
        .range([height, 0]);

    // Line generator
    const line = d3.line()
        .x(d => xScale(d.date))
        .y(d => yScale(d.value))
        .curve(d3.curveMonotoneX);

    // Add grid lines
    g.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale)
            .tickSize(-height)
            .tickFormat(""))
        .selectAll("line")
        .attr("stroke", "#3f3f46")
        .attr("stroke-dasharray", "2,2");

    g.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(yScale)
            .tickSize(-width)
            .tickFormat(""))
        .selectAll("line")
        .attr("stroke", "#3f3f46")
        .attr("stroke-dasharray", "2,2");

    // Add axes with proper spacing for rotated date labels
    const xAxis = g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%Y-%m-%d")));
    
    // Adjust positioning of rotated date labels to prevent cropping
    // With -45deg rotation and 16px font, labels extend diagonally downward
    // Increased dy to push labels further down and prevent clipping
    xAxis.selectAll("text")
        .attr("fill", "#a1a1aa")
        .style("font-size", "16px")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", "2em")
        .attr("transform", "rotate(-45)");

    g.append("g")
        .call(d3.axisLeft(yScale))
        .selectAll("text")
        .attr("fill", "#a1a1aa")
        .style("font-size", "16px");

    // Style axes
    g.selectAll(".domain, .tick line")
        .attr("stroke", "#71717a");

    // Add axis labels
    g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .attr("fill", "#e4e4e7")
        .style("font-size", "18px")
        .text("Raw Score");

    g.append("text")
        .attr("transform", `translate(${width / 2}, ${height + margin.bottom - 15})`)
        .style("text-anchor", "middle")
        .attr("fill", "#e4e4e7")
        .style("font-size", "18px")
        .text("Date");

    // Add lines for each series
    seriesArray.forEach((series, index) => {
        if (series.data.length === 0) return;

        // Line path
        g.append("path")
            .datum(series.data)
            .attr("fill", "none")
            .attr("stroke", series.color)
            .attr("stroke-width", 2)
            .attr("d", line)
            .style("opacity", 0.8);

        // Data points - make clickable with visual feedback
        g.selectAll(`.dot-${index}`)
            .data(series.data)
            .enter().append("circle")
            .attr("class", `dot-${index}`)
            .attr("cx", d => xScale(d.date))
            .attr("cy", d => yScale(d.value))
            .attr("r", 3)
            .attr("fill", series.color)
            .style("cursor", "pointer")
            .style("transition", "r 0.2s")
            .on("mouseover", function(event, d) {
                d3.select(this).attr("r", 5); // Enlarge on hover
                showTooltip(event, d, series.label);
            })
            .on("mouseout", function() {
                d3.select(this).attr("r", 3); // Restore size
                hideTooltip();
            })
            .on("click", function(event, d) {
                // Stop event propagation to prevent tooltip issues
                event.stopPropagation();
                
                // Find the actual series object to get company and risk
                const actualSeries = activeSeries.find(s => {
                    const seriesId = `${s.company || 'All'}_${s.risk || 'All'}_${s.window}`;
                    return seriesId === seriesArray[index].id;
                });
                
                if (actualSeries) {
                    showEvidenceModal(
                        actualSeries.company || null,
                        actualSeries.risk || null,
                        d.date
                    );
                }
            });
    });

    // Tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "risk-evolution-tooltip")
        .style("position", "absolute")
        .style("background", "#1f2937")
        .style("border", "1px solid #374151")
        .style("border-radius", "4px")
        .style("padding", "8px 12px")
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("z-index", "1000")
        .style("color", "#f3f4f6")
        .style("font-size", "14px");

    function showTooltip(event, d, label) {
        const dateStr = d3.timeFormat("%Y-%m-%d")(d.date);
        tooltip.transition()
            .duration(200)
            .style("opacity", 1);
        tooltip.html(`
            <div><strong>${escapeHtml(label)}</strong></div>
            <div>Date: ${dateStr}</div>
            <div>Value: ${d.value}</div>
        `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px");
    }

    function hideTooltip() {
        tooltip.transition()
            .duration(200)
            .style("opacity", 0);
    }
}

// Apply date range preset
function applyDateRangePreset(preset) {
    if (!dateRange.min || !dateRange.max) return;
    
    const today = new Date();
    const endDate = new Date(dateRange.max);
    let startDate = null;
    
    switch(preset) {
        case 'last7':
            startDate = new Date(endDate);
            startDate.setDate(startDate.getDate() - 6); // Include end date
            break;
        case 'last30':
            startDate = new Date(endDate);
            startDate.setDate(startDate.getDate() - 29);
            break;
        case 'last90':
            startDate = new Date(endDate);
            startDate.setDate(startDate.getDate() - 89);
            break;
        case 'ytd':
            startDate = new Date(today.getFullYear(), 0, 1);
            // Ensure we don't go before data start
            if (startDate < dateRange.min) {
                startDate = new Date(dateRange.min);
            }
            break;
        case 'all':
            startDate = new Date(dateRange.min);
            endDate.setTime(dateRange.max.getTime());
            break;
        default:
            return;
    }
    
    selectedDateRange.start = startDate;
    selectedDateRange.end = new Date(endDate);
    
    // Update date inputs
    const startInput = document.getElementById('riskEvolutionStartDate');
    const endInput = document.getElementById('riskEvolutionEndDate');
    if (startInput) startInput.value = startDate.toISOString().split('T')[0];
    if (endInput) endInput.value = selectedDateRange.end.toISOString().split('T')[0];
    
    // Apply filter and update chart
    applyDateRangeFilter();
}

// Apply date range filter from manual inputs
function applyDateRangeFilter() {
    const startInput = document.getElementById('riskEvolutionStartDate');
    const endInput = document.getElementById('riskEvolutionEndDate');
    
    if (!startInput || !endInput) return;
    
    const startDateStr = startInput.value;
    const endDateStr = endInput.value;
    
    if (!startDateStr || !endDateStr) {
        alert('Please select both start and end dates');
        return;
    }
    
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    
    // Normalize to midnight local time
    selectedDateRange.start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    selectedDateRange.end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    
    // Validate range
    if (selectedDateRange.start > selectedDateRange.end) {
        alert('Start date must be before or equal to end date');
        return;
    }
    
    // Ensure within data range
    if (selectedDateRange.start < dateRange.min) {
        selectedDateRange.start = new Date(dateRange.min);
    }
    if (selectedDateRange.end > dateRange.max) {
        selectedDateRange.end = new Date(dateRange.max);
    }
    
    // Update active range display
    const activeRangeText = document.getElementById('activeDateRangeText');
    if (activeRangeText) {
        activeRangeText.textContent = `${selectedDateRange.start.toISOString().split('T')[0]} to ${selectedDateRange.end.toISOString().split('T')[0]}`;
    }
    
    // Update chart with filtered data
    updateChart();
}

// Export CSV functionality
function exportRiskEvolutionCSV() {
    if (activeSeries.length === 0) {
        alert('No series to export. Please add at least one time series first.');
        return;
    }
    
    // Collect all data points from all active series
    const allData = [];
    
    activeSeries.forEach(series => {
        const data = processTimeSeriesData(series);
        const companyLabel = series.company || 'All Companies';
        const riskLabel = series.risk || 'All Risk Factors';
        const windowLabel = series.window === 'daily' ? 'Daily' 
            : series.window === 'weekly' ? 'Weekly (7-day rolling)' 
            : 'Monthly (30-day rolling)';
        const seriesLabel = `${companyLabel} - ${riskLabel} (${windowLabel})`;
        
        data.forEach(point => {
            allData.push({
                date: point.date.toISOString().split('T')[0],
                series: seriesLabel,
                value: point.value
            });
        });
    });
    
    if (allData.length === 0) {
        alert('No data to export.');
        return;
    }
    
    // Create CSV content
    const headers = ['Date', 'Series', 'Value'];
    const csvRows = [headers.join(',')];
    
    allData.forEach(row => {
        const csvRow = [
            row.date,
            `"${row.series.replace(/"/g, '""')}"`, // Escape quotes in CSV
            row.value
        ];
        csvRows.push(csvRow.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `risk_evolution_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Export PNG functionality
function exportRiskEvolutionPNG() {
    const svgElement = document.getElementById('riskEvolutionSvg');
    if (!svgElement) {
        alert('No chart to export. Please add at least one time series first.');
        return;
    }
    
    if (activeSeries.length === 0) {
        alert('No series to export. Please add at least one time series first.');
        return;
    }
    
    try {
        // Get SVG content
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        // Create image from SVG
        const img = new Image();
        img.onload = function() {
            // Create canvas
            const canvas = document.createElement('canvas');
            canvas.width = svgElement.clientWidth || 800;
            canvas.height = svgElement.clientHeight || 500;
            const ctx = canvas.getContext('2d');
            
            // Fill white background (or transparent)
            ctx.fillStyle = '#18181b'; // zinc-900 background
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw image
            ctx.drawImage(img, 0, 0);
            
            // Convert to PNG and download
            canvas.toBlob(function(blob) {
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `risk_evolution_chart_${new Date().toISOString().split('T')[0]}.png`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 'image/png');
            
            URL.revokeObjectURL(url);
        };
        
        img.onerror = function() {
            alert('Error exporting chart. Please try again.');
        };
        
        img.src = url;
    } catch (error) {
        console.error('Error exporting PNG:', error);
        alert('Error exporting chart: ' + error.message);
    }
}

// Show evidence modal for clicked data point
function showEvidenceModal(company, riskFactor, date) {
    if (!riskEvolutionData || riskEvolutionData.length === 0) {
        alert('No evidence data available');
        return;
    }
    
    // Store the selected risk factor for display purposes
    const selectedRiskFactor = riskFactor;
    
    // Filter evidence by company, risk factor, and date
    const filteredEvidence = riskEvolutionData.filter(item => {
        // Date filter - normalize to midnight for comparison
        if (!item.date) return false;
        const itemDate = new Date(item.date);
        const normalizedItemDate = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
        const normalizedTargetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dateMatch = normalizedItemDate.getTime() === normalizedTargetDate.getTime();
        
        if (!dateMatch) return false;
        
        // Company filter
        const companyMatch = !company || item.company === company;
        
        // Risk factor filter - try risk_factor first, then sub_scenario
        // The selected riskFactor is the most granular level from themeScoring
        const riskMatch = !riskFactor || 
            item.risk_factor === riskFactor || 
            item.sub_scenario === riskFactor;
        
        return companyMatch && riskMatch;
    }).map(item => {
        // Enhance each item with the most granular risk factor for display
        // If we filtered by a specific granular risk, show that
        // Otherwise, prioritize sub_scenario (most granular) over risk_factor (parent)
        let displayRiskFactor = item.risk_factor;
        if (selectedRiskFactor) {
            // If sub_scenario matches the selected granular risk, use that
            if (item.sub_scenario === selectedRiskFactor) {
                displayRiskFactor = item.sub_scenario;
            } else if (item.risk_factor === selectedRiskFactor) {
                displayRiskFactor = item.risk_factor;
            } else {
                // Fallback: use sub_scenario if available (more granular than risk_factor)
                displayRiskFactor = item.sub_scenario || item.risk_factor;
            }
        } else {
            // No specific filter - use most granular available
            displayRiskFactor = item.sub_scenario || item.risk_factor || item.theme;
        }
        
        return {
            ...item,
            _displayRiskFactor: displayRiskFactor // Store for display
        };
    });
    
    // Update modal filters display
    const filtersElement = document.getElementById('evidenceModalFilters');
    if (filtersElement) {
        const dateStr = date.toISOString().split('T')[0];
        filtersElement.innerHTML = `
            <div class="flex flex-wrap gap-4">
                <span><strong>Date:</strong> ${dateStr}</span>
                ${company ? `<span><strong>Company:</strong> ${escapeHtml(company)}</span>` : '<span><strong>Company:</strong> All Companies</span>'}
                ${riskFactor ? `<span><strong>Risk Factor:</strong> ${escapeHtml(riskFactor)}</span>` : '<span><strong>Risk Factor:</strong> All Risk Factors</span>'}
                <span><strong>Evidence Count:</strong> ${filteredEvidence.length}</span>
            </div>
        `;
    }
    
    // Render evidence content
    renderEvidenceModalContent(filteredEvidence);
    
    // Show modal
    const modal = document.getElementById('riskEvolutionEvidenceModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

// Render evidence content in modal
function renderEvidenceModalContent(evidence) {
    const contentElement = document.getElementById('evidenceModalContent');
    if (!contentElement) return;
    
    if (evidence.length === 0) {
        contentElement.innerHTML = `
            <div class="text-center py-12">
                <p class="text-zinc-400 text-lg">No evidence found for the selected criteria</p>
            </div>
        `;
        return;
    }
    
    // Create evidence table
    let html = `
        <div class="overflow-x-auto">
            <table class="w-full border-collapse">
                <thead class="bg-gradient-to-r from-zinc-800 to-zinc-700 sticky top-0">
                    <tr>
                        <th class="px-4 py-3 text-left text-sm font-semibold text-white border-b border-zinc-600">Date</th>
                        <th class="px-4 py-3 text-left text-sm font-semibold text-white border-b border-zinc-600">Company</th>
                        <th class="px-4 py-3 text-left text-sm font-semibold text-white border-b border-zinc-600">Headline</th>
                        <th class="px-4 py-3 text-left text-sm font-semibold text-white border-b border-zinc-600">Quote</th>
                        <th class="px-4 py-3 text-left text-sm font-semibold text-white border-b border-zinc-600">Motivation</th>
                        <th class="px-4 py-3 text-left text-sm font-semibold text-white border-b border-zinc-600">Risk Factor</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-zinc-700 bg-zinc-900">
    `;
    
    evidence.forEach((item, index) => {
        const bgClass = index % 2 === 0 ? 'bg-zinc-900' : 'bg-zinc-800/50';
        html += `
            <tr class="${bgClass} hover:bg-zinc-700/50 transition-colors duration-150">
                <td class="px-4 py-3 text-sm text-zinc-300">${escapeHtml(item.date || 'N/A')}</td>
                <td class="px-4 py-3 text-sm font-medium text-zinc-200">${escapeHtml(item.company || 'N/A')}</td>
                <td class="px-4 py-3 text-sm text-blue-400 cursor-pointer hover:text-blue-300 hover:underline" 
                    ${item.document_id ? `onclick="showDocumentModal('${item.document_id}')"` : ''}>
                    ${escapeHtml(item.headline || 'N/A')}
                </td>
                <td class="px-4 py-3 text-sm text-zinc-300 italic max-w-md">${escapeHtml(item.quote || 'N/A')}</td>
                <td class="px-4 py-3 text-sm text-zinc-300 max-w-md">${escapeHtml(item.motivation || 'N/A')}</td>
                <td class="px-4 py-3 text-sm font-medium text-orange-400">${escapeHtml(item._displayRiskFactor || 'N/A')}</td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    contentElement.innerHTML = html;
}

// Close evidence modal
function closeEvidenceModal() {
    const modal = document.getElementById('riskEvolutionEvidenceModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Make functions globally available
window.renderRiskEvolution = renderRiskEvolution;
window.addRiskEvolutionSeries = addRiskEvolutionSeries;
window.removeRiskEvolutionSeries = removeRiskEvolutionSeries;
window.applyDateRangePreset = applyDateRangePreset;
window.applyDateRangeFilter = applyDateRangeFilter;
window.exportRiskEvolutionCSV = exportRiskEvolutionCSV;
window.exportRiskEvolutionPNG = exportRiskEvolutionPNG;
window.showEvidenceModal = showEvidenceModal;
window.closeEvidenceModal = closeEvidenceModal;

