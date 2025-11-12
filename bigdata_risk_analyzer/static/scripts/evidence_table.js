// Evidence Table with Filters
let allEvidenceData = [];
let filteredEvidenceData = [];
// Evidence audit status: { [index]: boolean } where true = accepted, false = discarded
let evidenceAuditStatus = {};

function renderEvidenceTable(content) {
    const container = document.querySelector('[data-tab-content="evidence"] .tab-actual-content');
    if (!container) return;

    if (!content || !Array.isArray(content) || content.length === 0) {
        container.innerHTML = '<p class="text-zinc-400">No evidence data available</p>';
        return;
    }

    allEvidenceData = content;
    filteredEvidenceData = allEvidenceData.map((item, index) => ({
        ...item,
        _originalIndex: index
    }));
    
    // Initialize evidenceAuditStatus for all items if not already set
    // Default to true (accepted) for all items
    const previousLength = Object.keys(evidenceAuditStatus).length;
    if (previousLength === 0 || allEvidenceData.length !== previousLength) {
        // Initialize all items to accepted (true)
        evidenceAuditStatus = {};
        allEvidenceData.forEach((_, index) => {
            evidenceAuditStatus[index] = true;
        });
    } else {
        // Preserve existing status, but ensure all indices are present
        allEvidenceData.forEach((_, index) => {
            if (evidenceAuditStatus[index] === undefined) {
                evidenceAuditStatus[index] = true;
            }
        });
    }
    
    // Make globally accessible
    window.allEvidenceData = allEvidenceData;
    window.evidenceAuditStatus = evidenceAuditStatus;

    // Extract unique companies and risk factors for filters
    const companies = [...new Set(content.map(item => item.company))].sort();
    const themes = [...new Set(content.map(item => item.sub_scenario || item.risk_factor || item.theme))].filter(Boolean).sort();

    let html = `
        <div class="mb-6">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        Evidence & Supporting Quotes
                    </h3>
                    <p class="text-zinc-400 text-sm">Source documents and quotes backing thematic assessments</p>
                </div>
                <div class="flex gap-2">
                    <button onclick="exportEvidence('csv')" 
                        class="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        Export CSV
                    </button>
                    <button onclick="exportEvidence('json')" 
                        class="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        Export JSON
                    </button>
                </div>
            </div>
            
            <!-- Filters -->
            <div class="bg-zinc-800/50 rounded-lg border border-zinc-700 p-4 mb-4">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-zinc-300 mb-2">Filter by Company</label>
                        <select id="filterCompany" onchange="applyEvidenceFilters()" 
                            class="w-full px-3 py-2 bg-zinc-900 border border-zinc-600 rounded-lg text-zinc-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer">
                            <option value="">All Companies (${companies.length})</option>
                            ${companies.map(company => `<option value="${escapeHtml(company)}">${escapeHtml(company)}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-zinc-300 mb-2">Filter by Risk Factor</label>
                        <select id="filterTheme" onchange="applyEvidenceFilters()" 
                            class="w-full px-3 py-2 bg-zinc-900 border border-zinc-600 rounded-lg text-zinc-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer">
                            <option value="">All Risk Factors (${themes.length})</option>
                            ${themes.map(theme => `<option value="${escapeHtml(theme)}">${escapeHtml(theme)}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-zinc-300 mb-2">Search</label>
                        <input type="text" id="searchEvidence" placeholder="Search quotes, headlines..." 
                            onkeyup="applyEvidenceFilters()"
                            class="w-full px-3 py-2 bg-zinc-900 border border-zinc-600 rounded-lg text-zinc-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                    </div>
                </div>
                <div class="mt-3 flex justify-between items-center">
                    <div class="text-sm text-zinc-400">
                        Showing <span id="evidenceCount" class="font-bold text-blue-400">${content.length}</span> of ${content.length} items
                    </div>
                    <button onclick="clearEvidenceFilters()" 
                        class="text-sm text-blue-400 hover:text-blue-300 font-medium">
                        Clear Filters
                    </button>
                </div>
            </div>
        </div>

        <!-- Evidence Table -->
        <div class="overflow-x-auto bg-zinc-800/50 rounded-lg border border-zinc-700">
            <table class="w-full border-collapse">
                <thead class="bg-gradient-to-r from-zinc-800 to-zinc-700">
                    <tr>
                        <th class="sticky top-0 z-10 bg-gradient-to-r from-zinc-800 to-zinc-700 px-4 py-3 text-left text-sm font-semibold text-white border-b border-zinc-600">Time Period</th>
                        <th class="sticky top-0 z-10 bg-gradient-to-r from-zinc-800 to-zinc-700 px-4 py-3 text-left text-sm font-semibold text-white border-b border-zinc-600">Date</th>
                        <th class="sticky top-0 z-10 bg-gradient-to-r from-zinc-800 to-zinc-700 px-4 py-3 text-left text-sm font-semibold text-white border-b border-zinc-600">Company</th>
                        <th class="sticky top-0 z-10 bg-gradient-to-r from-zinc-800 to-zinc-700 px-4 py-3 text-left text-sm font-semibold text-white border-b border-zinc-600">Headline</th>
                        <th class="sticky top-0 z-10 bg-gradient-to-r from-zinc-800 to-zinc-700 px-4 py-3 text-left text-sm font-semibold text-white border-b border-zinc-600">Quote</th>
                        <th class="sticky top-0 z-10 bg-gradient-to-r from-zinc-800 to-zinc-700 px-4 py-3 text-left text-sm font-semibold text-white border-b border-zinc-600">Motivation</th>
                        <th class="sticky top-0 z-10 bg-gradient-to-r from-zinc-800 to-zinc-700 px-4 py-3 text-left text-sm font-semibold text-white border-b border-zinc-600">Risk Factor</th>
                        <th class="sticky top-0 z-10 bg-gradient-to-r from-zinc-800 to-zinc-700 px-4 py-3 text-center text-sm font-semibold text-white border-b border-zinc-600 cursor-pointer hover:bg-zinc-700/50" onclick="toggleAllFilteredEvidence(event)" title="Click to toggle all filtered evidence">
                            Audit (accept/reject)
                        </th>
                    </tr>
                </thead>
                <tbody id="evidenceTableBody" class="divide-y divide-zinc-700 bg-zinc-900">
                </tbody>
            </table>
        </div>
        
        <!-- Pagination -->
        <div id="evidencePagination" class="mt-4 flex justify-between items-center">
            <div class="text-sm text-zinc-400">
                Page <span id="currentPage" class="font-bold text-white">1</span> of <span id="totalPages" class="font-bold text-white">1</span>
            </div>
            <div class="flex gap-2">
                <button onclick="changeEvidencePage(-1)" id="prevPageBtn"
                    class="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    Previous
                </button>
                <button onclick="changeEvidencePage(1)" id="nextPageBtn"
                    class="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    Next
                </button>
            </div>
        </div>
    `;

    container.innerHTML = html;
    renderEvidenceTableRows(1);
}

const ITEMS_PER_PAGE = 50;
let currentPage = 1;

function renderEvidenceTableRows(page = 1) {
    const tbody = document.getElementById('evidenceTableBody');
    if (!tbody) return;

    currentPage = page;
    const startIdx = (page - 1) * ITEMS_PER_PAGE;
    const endIdx = startIdx + ITEMS_PER_PAGE;
    const pageData = filteredEvidenceData.slice(startIdx, endIdx);

    let html = '';
    pageData.forEach((chunk, idx) => {
        // Get original index from stored property
        const originalIndex = chunk._originalIndex !== undefined ? chunk._originalIndex : allEvidenceData.findIndex(item => 
            item.company === chunk.company &&
            item.date === chunk.date &&
            item.quote === chunk.quote &&
            (item.sub_scenario || item.risk_factor || item.theme) === (chunk.sub_scenario || chunk.risk_factor || chunk.theme)
        );
        
        const isAccepted = originalIndex >= 0 ? (evidenceAuditStatus[originalIndex] !== false) : true;
        const bgClass = idx % 2 === 0 ? 'bg-zinc-900' : 'bg-zinc-800/50';
        const rowClass = isAccepted ? '' : 'opacity-50';
        
        html += `
            <tr class="${bgClass} ${rowClass} hover:bg-zinc-700/50 transition-colors duration-150">
                <td class="px-4 py-3 text-sm text-zinc-300">${escapeHtml(chunk.time_period)}</td>
                <td class="px-4 py-3 text-sm text-zinc-300">${escapeHtml(chunk.date)}</td>
                <td class="px-4 py-3 text-sm font-medium text-zinc-200">${escapeHtml(chunk.company)}</td>
                <td class="px-4 py-3 text-sm text-blue-400 cursor-pointer hover:text-blue-300 hover:underline" onclick="showDocumentModal('${chunk.document_id}')">${escapeHtml(chunk.headline)}</td>
                <td class="px-4 py-3 text-sm text-zinc-300 italic max-w-md">${escapeHtml(chunk.quote)}</td>
                <td class="px-4 py-3 text-sm text-zinc-300 max-w-md">${escapeHtml(chunk.motivation)}</td>
                <td class="px-4 py-3 text-sm font-medium text-orange-400">${escapeHtml(chunk.sub_scenario || chunk.risk_factor || chunk.theme || 'N/A')}</td>
                <td class="px-4 py-3 text-center">
                    <button onclick="toggleEvidenceStatus(${originalIndex}, event)" 
                            class="p-2 rounded-lg transition-colors ${isAccepted ? 'text-green-400 hover:bg-green-500/20' : 'text-red-400 hover:bg-red-500/20'}"
                            title="${isAccepted ? 'Accepted - Click to discard' : 'Discarded - Click to accept'}">
                        ${isAccepted ? `
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                        ` : `
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        `}
                    </button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
    updatePaginationControls();
}

function updatePaginationControls() {
    const totalPages = Math.ceil(filteredEvidenceData.length / ITEMS_PER_PAGE);
    document.getElementById('currentPage').textContent = currentPage;
    document.getElementById('totalPages').textContent = totalPages;
    
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages || totalPages === 0;
}

function changeEvidencePage(delta) {
    const totalPages = Math.ceil(filteredEvidenceData.length / ITEMS_PER_PAGE);
    const newPage = currentPage + delta;
    
    if (newPage >= 1 && newPage <= totalPages) {
        renderEvidenceTableRows(newPage);
    }
}

function applyEvidenceFilters() {
    const companyFilter = document.getElementById('filterCompany').value.toLowerCase();
    const themeFilter = document.getElementById('filterTheme').value.toLowerCase();
    const searchTerm = document.getElementById('searchEvidence').value.toLowerCase();

    filteredEvidenceData = allEvidenceData.map((item, index) => ({
        ...item,
        _originalIndex: index  // Store original index for audit status lookup
    })).filter(item => {
        const matchesCompany = !companyFilter || item.company.toLowerCase() === companyFilter;
        const riskFactor = (item.sub_scenario || item.risk_factor || item.theme || '').toLowerCase();
        const matchesTheme = !themeFilter || riskFactor === themeFilter;
        const matchesSearch = !searchTerm || 
            item.quote.toLowerCase().includes(searchTerm) ||
            item.headline.toLowerCase().includes(searchTerm) ||
            item.motivation.toLowerCase().includes(searchTerm);
        
        return matchesCompany && matchesTheme && matchesSearch;
    });

    document.getElementById('evidenceCount').textContent = filteredEvidenceData.length;
    renderEvidenceTableRows(1);
}

function clearEvidenceFilters() {
    document.getElementById('filterCompany').value = '';
    document.getElementById('filterTheme').value = '';
    document.getElementById('searchEvidence').value = '';
    filteredEvidenceData = allEvidenceData.map((item, index) => ({
        ...item,
        _originalIndex: index
    }));
    document.getElementById('evidenceCount').textContent = filteredEvidenceData.length;
    renderEvidenceTableRows(1);
}

function exportEvidence(format) {
    if (filteredEvidenceData.length === 0) {
        alert('No data to export');
        return;
    }

    if (format === 'json') {
        // Remove _originalIndex before exporting
        const exportData = filteredEvidenceData.map(({ _originalIndex, ...item }) => item);
        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        downloadFile(blob, 'evidence_export.json');
    } else if (format === 'csv') {
        const headers = ['Time Period', 'Date', 'Company', 'Ticker', 'Sector', 'Industry', 'Country', 'Document ID', 'Headline', 'Quote', 'Motivation', 'Theme'];
        const rows = filteredEvidenceData.map(item => {
            // Remove _originalIndex
            const { _originalIndex, ...cleanItem } = item;
            return [
                cleanItem.time_period,
                cleanItem.date,
                cleanItem.company,
                cleanItem.ticker || '',
                cleanItem.sector,
                cleanItem.industry,
                cleanItem.country,
                cleanItem.document_id,
                cleanItem.headline,
                cleanItem.quote,
                cleanItem.motivation,
                cleanItem.theme
            ];
        });
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        downloadFile(blob, 'evidence_export.csv');
    }
}

function downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Toggle individual evidence status
function toggleEvidenceStatus(index, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    if (index < 0 || index >= allEvidenceData.length) return;
    
    // Ensure status is initialized (default to true if undefined)
    if (evidenceAuditStatus[index] === undefined) {
        evidenceAuditStatus[index] = true;
    }
    
    // Toggle status immediately
    evidenceAuditStatus[index] = !evidenceAuditStatus[index];
    
    // Update global reference
    window.evidenceAuditStatus = evidenceAuditStatus;
    
    // Update UI immediately - re-render current page to show updated status
    renderEvidenceTableRows(currentPage);
    
    // Then recalculate scores and update all visualizations
    recalculateAndUpdateVisualizations();
}

// Toggle all filtered evidence
function toggleAllFilteredEvidence(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    if (filteredEvidenceData.length === 0) return;
    
    // Get indices from filtered evidence
    const filteredIndices = filteredEvidenceData
        .map(chunk => chunk._originalIndex)
        .filter(idx => idx !== undefined && idx >= 0);
    
    // Check if any filtered evidence is discarded
    const hasDiscarded = filteredIndices.some(idx => evidenceAuditStatus[idx] === false);
    
    // Set all filtered evidence to the same state immediately
    const targetState = hasDiscarded ? true : false;
    filteredIndices.forEach(idx => {
        evidenceAuditStatus[idx] = targetState;
    });
    
    // Update global reference
    window.evidenceAuditStatus = evidenceAuditStatus;
    
    // Update UI immediately - re-render current page to show updated status
    renderEvidenceTableRows(currentPage);
    
    // Then recalculate scores and update all visualizations
    recalculateAndUpdateVisualizations();
}

// Recalculate scores from accepted evidence only
function recalculateScoresFromAcceptedEvidence() {
    // Get accepted evidence only
    const acceptedEvidence = allEvidenceData.filter((_, index) => evidenceAuditStatus[index] !== false);
    
    if (acceptedEvidence.length === 0) {
        return {};
    }
    
    // Group evidence by company and theme
    const companyThemeCounts = {};
    
    acceptedEvidence.forEach(item => {
        const company = item.company;
        const theme = item.sub_scenario || item.risk_factor || item.theme || 'Unknown';
        
        if (!companyThemeCounts[company]) {
            // Initialize company data from first accepted evidence item
            companyThemeCounts[company] = {
                themes: {},
                composite_score: 0,
                ticker: item.ticker,
                sector: item.sector,
                industry: item.industry,
                country: item.country,
                motivation: item.motivation || ''
            };
        }
        
        // Count evidence per theme
        if (!companyThemeCounts[company].themes[theme]) {
            companyThemeCounts[company].themes[theme] = 0;
        }
        companyThemeCounts[company].themes[theme]++;
        companyThemeCounts[company].composite_score++;
    });
    
    return companyThemeCounts;
}

// Recalculate and update all visualizations
function recalculateAndUpdateVisualizations() {
    // Update UI immediately - no debounce for better UX
    // Recalculate theme_scoring from accepted evidence
    const recalculatedScoring = recalculateScoresFromAcceptedEvidence();
    
    // Update window.lastReport with recalculated data
    if (window.lastReport) {
        // Preserve current active tab and filter states
        const currentTab = window.tabController ? window.tabController.activeTab : 'overview';
        
        // Preserve filter states from company screener
        const preservedFilterState = window.filterState ? {...window.filterState} : null;
        const preservedScreenerSort = {
            field: window.currentScreenerSortField,
            direction: window.currentScreenerSortDirection
        };
        
        // Preserve evidence table filters
        const preservedCompanyFilter = document.getElementById('filterCompany')?.value || '';
        const preservedThemeFilter = document.getElementById('filterTheme')?.value || '';
        const preservedDateFilter = document.getElementById('filterDate')?.value || '';
        
        // Create a copy to avoid mutating the original
        const updatedReport = {
            ...window.lastReport,
            theme_scoring: recalculatedScoring
        };
        
        // Re-render all tabs with updated scores
        // Note: content still contains all evidence, but scores are recalculated from accepted only
        if (window.renderScreenerReport) {
            window.renderScreenerReport(updatedReport);
            // Update window.lastReport to reflect the new scores
            window.lastReport.theme_scoring = recalculatedScoring;
            
            // Restore filter states after a brief delay to ensure DOM is ready
            setTimeout(() => {
                // Restore company screener filters
                if (preservedFilterState) {
                    // Update both filterState and window.filterState
                    if (window.filterState) {
                        Object.assign(window.filterState, preservedFilterState);
                    }
                    // Also update the local filterState if it exists
                    const filterStateVar = window.filterState || {};
                    Object.assign(filterStateVar, preservedFilterState);
                    window.filterState = filterStateVar;
                    
                    if (window.updateFilterChips) {
                        window.updateFilterChips();
                    }
                    if (window.filterScreener) {
                        window.filterScreener();
                    }
                }
                
                // Restore screener sort
                if (preservedScreenerSort.field) {
                    if (typeof window.currentScreenerSortField !== 'undefined') {
                        window.currentScreenerSortField = preservedScreenerSort.field;
                    }
                    if (typeof window.currentScreenerSortDirection !== 'undefined') {
                        window.currentScreenerSortDirection = preservedScreenerSort.direction;
                    }
                }
                
                // Restore evidence table filters
                const companyFilterEl = document.getElementById('filterCompany');
                const themeFilterEl = document.getElementById('filterTheme');
                const dateFilterEl = document.getElementById('filterDate');
                if (companyFilterEl && preservedCompanyFilter) {
                    companyFilterEl.value = preservedCompanyFilter;
                }
                if (themeFilterEl && preservedThemeFilter) {
                    themeFilterEl.value = preservedThemeFilter;
                }
                if (dateFilterEl && preservedDateFilter) {
                    dateFilterEl.value = preservedDateFilter;
                }
                if ((preservedCompanyFilter || preservedThemeFilter || preservedDateFilter) && window.applyEvidenceFilters) {
                    window.applyEvidenceFilters();
                }
                
                // Restore the active tab
                if (window.tabController && currentTab) {
                    window.tabController.switchTab(currentTab);
                }
            }, 100);
        }
    }
}

// Get accepted evidence count
function getAcceptedEvidenceCount() {
    return allEvidenceData.filter((_, index) => evidenceAuditStatus[index] !== false).length;
}

// Make functions globally accessible
window.renderEvidenceTable = renderEvidenceTable;
window.applyEvidenceFilters = applyEvidenceFilters;
window.clearEvidenceFilters = clearEvidenceFilters;
window.changeEvidencePage = changeEvidencePage;
window.exportEvidence = exportEvidence;
window.toggleEvidenceStatus = toggleEvidenceStatus;
window.toggleAllFilteredEvidence = toggleAllFilteredEvidence;
window.recalculateScoresFromAcceptedEvidence = recalculateScoresFromAcceptedEvidence;
window.recalculateAndUpdateVisualizations = recalculateAndUpdateVisualizations;
window.getAcceptedEvidenceCount = getAcceptedEvidenceCount;

