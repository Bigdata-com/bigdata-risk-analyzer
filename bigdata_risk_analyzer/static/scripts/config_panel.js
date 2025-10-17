// Configuration Panel - Sliding Side Panel
window.currentConfig = {
    theme: '',
    focus: '',
    companies: '',
    start_date: '',
    end_date: ''
};
let currentConfig = window.currentConfig;

function toggleConfigPanel() {
    const panel = document.getElementById('configPanel');
    const backdrop = document.getElementById('configBackdrop');
    
    if (panel && backdrop) {
        const isOpen = !panel.classList.contains('translate-x-full');
        
        if (isOpen) {
            // Close
            panel.classList.add('translate-x-full');
            backdrop.classList.add('hidden');
            backdrop.classList.remove('opacity-100');
        } else {
            // Open
            panel.classList.remove('translate-x-full');
            backdrop.classList.remove('hidden');
            setTimeout(() => backdrop.classList.add('opacity-100'), 10);
        }
    }
}

function closeConfigPanel() {
    const panel = document.getElementById('configPanel');
    const backdrop = document.getElementById('configBackdrop');
    
    if (panel && backdrop) {
        panel.classList.add('translate-x-full');
        backdrop.classList.add('hidden');
        backdrop.classList.remove('opacity-100');
    }
}

// Adapter function to convert risk data to theme format
function adaptRiskDataToThemeFormat(riskData) {
    // If data is already in theme format, return as-is
    if (riskData.theme_scoring) {
        return riskData;
    }
    
    // Convert risk_scoring to theme_scoring
    // Note: We keep risk_taxonomy as-is (hierarchical) for mindmap compatibility
    const adapted = {
        theme_scoring: {},
        theme_taxonomy: riskData.risk_taxonomy || {},
        content: riskData.content || []
    };
    
    // Transform each company's risk data to theme format
    if (riskData.risk_scoring) {
        for (const [companyName, companyData] of Object.entries(riskData.risk_scoring)) {
            adapted.theme_scoring[companyName] = {
                ...companyData,
                themes: companyData.risks || companyData.themes || {}
            };
        }
    }
    
    return adapted;
}

function loadQuickStartTemplate(type) {
    const jsonFiles = {
        'import-tariffs': {
            file: '/static/data/import_tariffs.json', 
            theme: 'US Import Tariffs Against China',
            universe: 'Top 100 US'
        },
        'energy-cost': {
            file: '/static/data/energy-cost.json',
            theme: 'Energy Cost Increase Risk',
            universe: 'Top 100 US'
        },
        'operational-technology': {
            file: '/static/data/operational_technology.json',
            theme: 'Operational & Technology Risk',
            universe: 'Top 100 US'
        }
    };
    
    const template = jsonFiles[type];
    if (template) {
        closeConfigPanel();
        
        // Reset frontend: hide empty state, clear dashboard
        const emptyState = document.getElementById('emptyState');
        const dashboardSection = document.getElementById('dashboardSection');
        const dashboardCards = document.getElementById('dashboardCards');
        
        if (emptyState) emptyState.style.display = 'none';
        if (dashboardSection) dashboardSection.classList.add('hidden');
        if (dashboardCards) dashboardCards.innerHTML = '';
        
        // Reset tabs
        if (window.tabController) {
            window.tabController.reset();
        }
        
        // Show spinner
        const spinner = document.getElementById('spinner');
        if (spinner) spinner.classList.remove('hidden');
        
        fetch(template.file)
            .then(res => res.json())
            .then(riskData => {
                if (spinner) spinner.classList.add('hidden');
                
                // Adapt risk data to theme format
                const data = adaptRiskDataToThemeFormat(riskData);
                
                // Store the report globally
                window.lastReport = data;
                
                // Update config badge with demo info
                if (window.updateConfigBadge) {
                    updateConfigBadge({
                        theme: template.theme,
                        companies: template.universe,
                        isDemo: true
                    });
                }
                
                // Show JSON button
                const showJsonBtn = document.getElementById('showJsonBtn');
                if (showJsonBtn) showJsonBtn.style.display = 'inline-block';
                
                // Show new analysis button
                const newAnalysisBtn = document.getElementById('newAnalysisBtn');
                if (newAnalysisBtn) newAnalysisBtn.style.display = 'inline-flex';
                
                // Render the report
                if (window.renderScreenerReport) {
                    renderScreenerReport(data);
                }
            })
            .catch(err => {
                if (spinner) spinner.classList.add('hidden');
                console.error('Error loading demo:', err);
                alert('Failed to load demo data: ' + err.message);
            });
    }
}

function updateConfigBadge(config) {
    // Update both local and global references
    currentConfig = { ...currentConfig, ...config };
    window.currentConfig = currentConfig;
    
    const badge = document.getElementById('currentConfigBadge');
    if (badge && currentConfig.theme) {
        const universe = currentConfig.companies || 'Unknown';
        const runTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        badge.innerHTML = `
            <div class="flex items-center gap-2 justify-between">
                <div class="truncate flex-1">
                    <span class="font-semibold text-blue-400">${escapeHtml(currentConfig.theme)}</span>
                    <span class="text-zinc-500 mx-1">|</span>
                    <span class="text-zinc-400">${escapeHtml(universe)}</span>
                </div>
                <span class="text-xs text-zinc-500 flex-shrink-0">${runTime}</span>
            </div>
        `;
        badge.title = `Theme: ${currentConfig.theme}\nUniverse: ${universe}\nLast run: ${runTime}`;
    }
}

// Initialize config panel on DOM ready
document.addEventListener('DOMContentLoaded', function() {
    // Close panel when clicking backdrop
    const backdrop = document.getElementById('configBackdrop');
    if (backdrop) {
        backdrop.addEventListener('click', closeConfigPanel);
    }
    
    // Close panel on ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeConfigPanel();
        }
    });
});

// Make functions globally accessible
window.toggleConfigPanel = toggleConfigPanel;
window.closeConfigPanel = closeConfigPanel;
window.loadQuickStartTemplate = loadQuickStartTemplate;
window.updateConfigBadge = updateConfigBadge;
