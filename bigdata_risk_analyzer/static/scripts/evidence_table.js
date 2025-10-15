// Evidence Table with Filters
let allEvidenceData = [];
let filteredEvidenceData = [];

function renderEvidenceTable(content) {
    const container = document.querySelector('[data-tab-content="evidence"] .tab-actual-content');
    if (!container) return;

    if (!content || !Array.isArray(content) || content.length === 0) {
        container.innerHTML = '<p class="text-zinc-400">No evidence data available</p>';
        return;
    }

    allEvidenceData = content;
    filteredEvidenceData = [...content];

    // Extract unique companies and themes for filters
    const companies = [...new Set(content.map(item => item.company))].sort();
    const themes = [...new Set(content.map(item => item.theme))].sort();

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
                        <label class="block text-sm font-medium text-zinc-300 mb-2">Filter by Theme</label>
                        <select id="filterTheme" onchange="applyEvidenceFilters()" 
                            class="w-full px-3 py-2 bg-zinc-900 border border-zinc-600 rounded-lg text-zinc-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer">
                            <option value="">All Themes (${themes.length})</option>
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
                        <th class="sticky top-0 z-10 bg-gradient-to-r from-zinc-800 to-zinc-700 px-4 py-3 text-left text-sm font-semibold text-white border-b border-zinc-600">Theme</th>
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
        const bgClass = idx % 2 === 0 ? 'bg-zinc-900' : 'bg-zinc-800/50';
        html += `
            <tr class="${bgClass} hover:bg-zinc-700/50 transition-colors duration-150">
                <td class="px-4 py-3 text-sm text-zinc-300">${escapeHtml(chunk.time_period)}</td>
                <td class="px-4 py-3 text-sm text-zinc-300">${escapeHtml(chunk.date)}</td>
                <td class="px-4 py-3 text-sm font-medium text-zinc-200">${escapeHtml(chunk.company)}</td>
                <td class="px-4 py-3 text-sm text-blue-400 cursor-pointer hover:text-blue-300 hover:underline" onclick="showDocumentModal('${chunk.document_id}')">${escapeHtml(chunk.headline)}</td>
                <td class="px-4 py-3 text-sm text-zinc-300 italic max-w-md">${escapeHtml(chunk.quote)}</td>
                <td class="px-4 py-3 text-sm text-zinc-300 max-w-md">${escapeHtml(chunk.motivation)}</td>
                <td class="px-4 py-3 text-sm font-medium text-emerald-400">${escapeHtml(chunk.theme)}</td>
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

    filteredEvidenceData = allEvidenceData.filter(item => {
        const matchesCompany = !companyFilter || item.company.toLowerCase() === companyFilter;
        const matchesTheme = !themeFilter || item.theme.toLowerCase() === themeFilter;
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
    filteredEvidenceData = [...allEvidenceData];
    document.getElementById('evidenceCount').textContent = filteredEvidenceData.length;
    renderEvidenceTableRows(1);
}

function exportEvidence(format) {
    if (filteredEvidenceData.length === 0) {
        alert('No data to export');
        return;
    }

    if (format === 'json') {
        const dataStr = JSON.stringify(filteredEvidenceData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        downloadFile(blob, 'evidence_export.json');
    } else if (format === 'csv') {
        const headers = ['Time Period', 'Date', 'Company', 'Ticker', 'Sector', 'Industry', 'Country', 'Document ID', 'Headline', 'Quote', 'Motivation', 'Theme'];
        const rows = filteredEvidenceData.map(item => [
            item.time_period,
            item.date,
            item.company,
            item.ticker || '',
            item.sector,
            item.industry,
            item.country,
            item.document_id,
            item.headline,
            item.quote,
            item.motivation,
            item.theme
        ]);
        
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

// Make functions globally accessible
window.applyEvidenceFilters = applyEvidenceFilters;
window.clearEvidenceFilters = clearEvidenceFilters;
window.changeEvidencePage = changeEvidencePage;
window.exportEvidence = exportEvidence;

