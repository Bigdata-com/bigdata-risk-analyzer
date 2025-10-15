// Dashboard Cards - Quick Insights
function renderDashboardCards(data) {
    const container = document.getElementById('dashboardCards');
    if (!container || !data) return;

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
    
    // Render the 3 cards in a single row
    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            ${renderAtAGlanceCard(totalCompanies, totalThemes, maxScore, totalEvidences, runDate, config)}
            ${renderTopCompaniesCard(sortedCompanies.slice(0, 10))}
            ${renderTopThemesCard(sortedThemes.slice(0, 10), totalCompanies)}
        </div>
    `;
}

function renderAtAGlanceCard(totalCompanies, totalThemes, maxScore, totalEvidences, runDate, config) {
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
                    <span class="text-zinc-300">Companies Analyzed</span>
                    <span class="text-2xl font-bold text-zinc-200">${totalCompanies}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-zinc-300">Risk Factors Identified</span>
                    <span class="text-2xl font-bold text-orange-400">${totalThemes}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-zinc-300">Highest Score</span>
                    <span class="text-2xl font-bold text-red-400">${maxScore}</span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-zinc-300">Supporting Evidences</span>
                    <span class="text-2xl font-bold text-amber-400">${totalEvidences}</span>
                </div>
                <div class="pt-4 mt-4 border-t-2 border-orange-600/50">
                    <h4 class="text-sm font-bold text-orange-300 mb-2 uppercase tracking-wide">Current Configuration</h4>
                    <div class="space-y-1.5">
                        ${config.isDemo ? `
                            <div class="text-base text-amber-400 font-semibold">Demo Mode</div>
                        ` : ''}
                        <div class="text-base text-white font-semibold">
                            Risk Scenario: ${escapeHtml(config.theme)}
                        </div>
                        <div class="text-base text-white font-semibold">
                            Universe: ${escapeHtml(config.universe)}
                        </div>
                        ${config.isDemo ? `
                            <div class="text-base text-white font-semibold">
                                Source: Earnings Transcripts
                            </div>
                            <div class="text-base text-white font-semibold">
                                Period: Last 4 quarters
                            </div>
                        ` : ''}
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
                <div class="flex items-center gap-2 p-2 hover:bg-zinc-700/30 transition-colors">
                    <div class="flex items-center justify-center w-6 h-6 ${medalColor} font-bold text-sm flex-shrink-0">
                        ${idx + 1}
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                            <span class="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-mono">${escapeHtml(scoring.ticker || 'N/A')}</span>
                            <span class="text-white text-sm truncate">${escapeHtml(companyName)}</span>
                        </div>
                    </div>
                    <div class="text-lg font-bold text-red-400 flex-shrink-0">${scoring.composite_score}</div>
                    <button onclick="toggleDashboardCompanyThemes(this, event)" 
                        class="px-2 py-1 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded text-orange-400 text-xs font-medium transition-colors flex items-center gap-1 flex-shrink-0">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                        </svg>
                        ${themeCount}
                    </button>
                    <button onclick="toggleDashboardCompanyInsights(this, event)" 
                        class="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded text-amber-400 text-xs font-medium transition-colors flex items-center gap-1 flex-shrink-0">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                        </svg>
                        Insights
                    </button>
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
                                <div class="flex items-center justify-between ${colorClasses[intensity]} border rounded px-2 py-1">
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
                <h3 class="text-xl font-bold text-white">Top 10 Exposed Companies</h3>
            </div>
            <div class="space-y-0 max-h-[400px] overflow-y-auto">
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
            <div class="border-b border-zinc-700 last:border-b-0 p-2 hover:bg-zinc-700/30 transition-colors cursor-pointer"
                 onclick="filterByTheme('${escapeHtml(theme)}')">
                <div class="flex items-center gap-2">
                    <div class="flex items-center justify-center w-6 h-6 ${medalColor} font-bold text-sm flex-shrink-0">
                        ${idx + 1}
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="text-white text-sm truncate" title="${escapeHtml(theme)}">${escapeHtml(theme)}</div>
                        <div class="mt-1">
                            <div class="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                                <div class="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full transition-all duration-500"
                                     style="width: ${barWidth}%"></div>
                            </div>
                        </div>
                    </div>
                    <span class="text-lg font-bold text-orange-400 flex-shrink-0">${totalScore}</span>
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
                <h3 class="text-xl font-bold text-white">Top 10 Risk Factors</h3>
            </div>
            <div class="space-y-0 max-h-[400px] overflow-y-auto">
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
function scrollToCompany(companyName) {
    // Switch to companies tab and scroll to company
    if (window.tabController) {
        window.tabController.switchTab('companies');
    }
    // Wait for tab to render, then scroll
    setTimeout(() => {
        const cards = document.querySelectorAll('.company-card');
        cards.forEach(card => {
            if (card.getAttribute('data-company-name') === companyName.toLowerCase()) {
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                card.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                setTimeout(() => {
                    card.style.backgroundColor = '';
                }, 2000);
            }
        });
    }, 300);
}

function filterByTheme(theme) {
    // Switch to evidence tab and apply theme filter
    if (window.tabController) {
        window.tabController.switchTab('evidence');
    }
    // Wait for tab to render, then apply filter
    setTimeout(() => {
        const themeFilter = document.getElementById('filterTheme');
        if (themeFilter) {
            themeFilter.value = theme;
            if (window.applyEvidenceFilters) {
                window.applyEvidenceFilters();
            }
        }
    }, 300);
}

function exportDashboard() {
    // For now, trigger the JSON modal
    document.getElementById('showJsonBtn')?.click();
}

// Make functions globally accessible
window.renderDashboardCards = renderDashboardCards;
window.scrollToCompany = scrollToCompany;
window.filterByTheme = filterByTheme;
window.exportDashboard = exportDashboard;
window.toggleDashboardCompanyThemes = toggleDashboardCompanyThemes;
window.toggleDashboardCompanyInsights = toggleDashboardCompanyInsights;

