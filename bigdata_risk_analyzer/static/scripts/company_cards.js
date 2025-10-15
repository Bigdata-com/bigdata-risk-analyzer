// Company Cards - Compact Design with Inline Expandables
function renderCompanyCards(themeScoring) {
    const container = document.querySelector('[data-tab-content="companies"] .tab-actual-content');
    if (!container || !themeScoring) return;

    const companies = Object.entries(themeScoring);
    if (companies.length === 0) {
        container.innerHTML = '<p class="text-zinc-400">No company data available</p>';
        return;
    }

    // Sort companies by composite score (descending)
    companies.sort((a, b) => (b[1].composite_score || 0) - (a[1].composite_score || 0));

    let html = `
        <div class="mb-6">
            <div class="flex justify-between items-center mb-4">
                <div>
                    <h3 class="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                        </svg>
                        Company Scores
                    </h3>
                    <p class="text-zinc-400 text-sm">Detailed thematic scores for each company</p>
                </div>
                <div class="flex gap-2">
                    <input type="text" id="companySearch" placeholder="Search companies..." 
                        class="px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-zinc-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        onkeyup="filterCompanyCards()">
                    <select id="sortCompanies" onchange="sortCompanyCards()" 
                        class="px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-zinc-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer">
                        <option value="score_desc">Score (High to Low)</option>
                        <option value="score_asc">Score (Low to High)</option>
                        <option value="name_asc">Name (A to Z)</option>
                        <option value="name_desc">Name (Z to A)</option>
                    </select>
                </div>
            </div>
        </div>
        <div id="companyCardsContainer" class="space-y-2">
    `;

    // Render each company card (compact design)
    companies.forEach(([companyName, scoring]) => {
        const themes = scoring.themes || {};
        const themesArray = Object.entries(themes).filter(([_, score]) => score > 0);
        const themeCount = themesArray.length;
        
        // Truncate motivation for preview
        const motivationPreview = scoring.motivation ? 
            (scoring.motivation.length > 100 ? scoring.motivation.substring(0, 100) + '...' : scoring.motivation) : 
            'No insights available';
        
        html += `
            <div class="company-card bg-gradient-to-r from-zinc-800 to-zinc-800/50 rounded-lg border border-zinc-700 hover:border-blue-500/50 transition-all duration-200" 
                data-company-name="${escapeHtml(companyName).toLowerCase()}" 
                data-score="${scoring.composite_score}">
                
                <!-- Compact Header Bar -->
                <div class="px-4 py-2 flex items-center justify-between">
                    <!-- Left: Company Info -->
                    <div class="flex items-center gap-3 flex-1 min-w-0">
                        <span class="bg-blue-500 text-white px-2 py-1 rounded font-bold text-xs font-mono flex-shrink-0">${escapeHtml(scoring.ticker || 'N/A')}</span>
                        <div class="flex-1 min-w-0">
                            <h4 class="text-white font-bold truncate">${escapeHtml(companyName)}</h4>
                            <div class="text-zinc-400 text-xs">${escapeHtml(scoring.industry)}</div>
                        </div>
                    </div>
                    
                    <!-- Right: Score & Actions -->
                    <div class="flex items-center gap-3 flex-shrink-0">
                        <div class="flex flex-col items-center bg-blue-500/10 border border-blue-500/30 rounded px-3 py-1">
                            <div class="text-xl font-bold text-blue-400">${scoring.composite_score}</div>
                            <div class="text-[10px] text-zinc-400">Score</div>
                        </div>
                        
                        <!-- Theme Toggle Button -->
                        <button onclick="toggleCompanyThemes(this)" 
                            class="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded text-emerald-400 text-xs font-medium transition-colors flex items-center gap-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                            </svg>
                            ${themeCount} Themes
                        </button>
                        
                        <!-- Insights Toggle Button -->
                        <button onclick="toggleCompanyInsights(this)" 
                            class="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded text-amber-400 text-xs font-medium transition-colors flex items-center gap-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                            </svg>
                            Insights
                        </button>
                    </div>
                </div>
                
                <!-- Inline Expandable: Themes -->
                <div class="themes-section hidden border-t border-zinc-700 px-4 py-3 bg-zinc-900/30">
                    <div class="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        `;

        // Render theme chips (compact)
        themesArray.forEach(([theme, score]) => {
            const intensity = score > 5 ? 'high' : score > 2 ? 'medium' : 'low';
            const colorClasses = {
                high: 'bg-emerald-500 text-white border-emerald-400',
                medium: 'bg-emerald-700 text-emerald-100 border-emerald-600',
                low: 'bg-emerald-900 text-emerald-300 border-emerald-800'
            };
            
            html += `
                <div class="flex items-center justify-between ${colorClasses[intensity]} border rounded px-2 py-1">
                    <span class="text-xs font-medium truncate flex-1 mr-1" title="${escapeHtml(theme)}">${escapeHtml(theme)}</span>
                    <span class="font-bold text-xs flex-shrink-0">${score}</span>
                </div>
            `;
        });

        html += `
                    </div>
                </div>
                
                <!-- Inline Expandable: Insights -->
                <div class="insights-section hidden border-t border-zinc-700 px-4 py-3 bg-zinc-900/30">
                    <div class="text-zinc-300 text-sm leading-relaxed">
                        ${escapeHtml(scoring.motivation || 'No insights available')}
                    </div>
                </div>
            </div>
        `;
    });

    html += `</div>`;
    container.innerHTML = html;
}

// Toggle theme scores section inline
function toggleCompanyThemes(button) {
    const card = button.closest('.company-card');
    const themesSection = card.querySelector('.themes-section');
    const insightsSection = card.querySelector('.insights-section');
    
    if (themesSection.classList.contains('hidden')) {
        themesSection.classList.remove('hidden');
        button.classList.add('bg-emerald-500/30');
        // Close insights if open
        if (!insightsSection.classList.contains('hidden')) {
            insightsSection.classList.add('hidden');
            const insightsButton = card.querySelector('button[onclick*="toggleCompanyInsights"]');
            if (insightsButton) insightsButton.classList.remove('bg-amber-500/30');
        }
    } else {
        themesSection.classList.add('hidden');
        button.classList.remove('bg-emerald-500/30');
    }
}

// Toggle insights section inline
function toggleCompanyInsights(button) {
    const card = button.closest('.company-card');
    const insightsSection = card.querySelector('.insights-section');
    const themesSection = card.querySelector('.themes-section');
    
    if (insightsSection.classList.contains('hidden')) {
        insightsSection.classList.remove('hidden');
        button.classList.add('bg-amber-500/30');
        // Close themes if open
        if (!themesSection.classList.contains('hidden')) {
            themesSection.classList.add('hidden');
            const themesButton = card.querySelector('button[onclick*="toggleCompanyThemes"]');
            if (themesButton) themesButton.classList.remove('bg-emerald-500/30');
        }
    } else {
        insightsSection.classList.add('hidden');
        button.classList.remove('bg-amber-500/30');
    }
}

// Filter company cards based on search input
function filterCompanyCards() {
    const searchTerm = document.getElementById('companySearch').value.toLowerCase();
    const cards = document.querySelectorAll('.company-card');
    
    cards.forEach(card => {
        const companyName = card.getAttribute('data-company-name');
        if (companyName.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Sort company cards
function sortCompanyCards() {
    const sortValue = document.getElementById('sortCompanies').value;
    const container = document.getElementById('companyCardsContainer');
    const cards = Array.from(container.querySelectorAll('.company-card'));
    
    cards.sort((a, b) => {
        const scoreA = parseInt(a.getAttribute('data-score')) || 0;
        const scoreB = parseInt(b.getAttribute('data-score')) || 0;
        const nameA = a.getAttribute('data-company-name');
        const nameB = b.getAttribute('data-company-name');
        
        switch (sortValue) {
            case 'score_desc':
                return scoreB - scoreA;
            case 'score_asc':
                return scoreA - scoreB;
            case 'name_asc':
                return nameA.localeCompare(nameB);
            case 'name_desc':
                return nameB.localeCompare(nameA);
            default:
                return 0;
        }
    });
    
    // Re-append sorted cards
    cards.forEach(card => container.appendChild(card));
}

// Make functions globally accessible
window.toggleCompanyThemes = toggleCompanyThemes;
window.toggleCompanyInsights = toggleCompanyInsights;
window.filterCompanyCards = filterCompanyCards;
window.sortCompanyCards = sortCompanyCards;
