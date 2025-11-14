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
        'us-gov-shutdown': {
            file: '/static/data/risk_analyzer_gov_shutdown_nasdaq100.json', 
            theme: 'US Government Shutdown',
            universe: 'Nasdaq 100',
            runDate: '23/10/2025'
        },
        'energy-cost': {
            file: '/static/data/china_tariffs.json',
            theme: 'US Import Tariffs against China',
            universe: 'Nasdaq 100',
            runDate: '11/11/2025'
        },
        'operational-technology': {
            file: '/static/data/europe_regulation.json',
            theme: 'Geopolitical Tensions and Energy Transition',
            universe: 'Europe Top 50',
            runDate: '11/11/2025'
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
                
                // Add runDate to the data
                data.runDate = template.runDate;
                
                // Store the report globally
                window.lastReport = data;
                
                // Update download button state
                updateDownloadButtonState();
                
                // Show pre-computed demo indicator
                const precomputedDemo = document.getElementById('precomputedDemo');
                if (precomputedDemo) {
                    precomputedDemo.classList.remove('hidden');
                }
                
                // Update config badge with demo info
                if (window.updateConfigBadge) {
                    updateConfigBadge({
                        theme: template.theme,
                        companies: template.universe,
                        isDemo: true
                    });
                }
                
                // Show JSON button (if it exists)
                const showJsonBtn = document.getElementById('showJsonBtn');
                if (showJsonBtn) showJsonBtn.style.display = 'inline-block';
                
                // Show new analysis button (if it exists)
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

// Trigger file input click
function triggerFileUpload() {
    const fileInput = document.getElementById('jsonFileInput');
    if (fileInput) {
        fileInput.click();
    }
}

// Handle JSON file upload
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }
    
    // Validate file type
    if (!file.name.endsWith('.json')) {
        showUploadMessage('Please select a JSON file.', 'error');
        return;
    }
    
    // Show loading spinner
    const spinner = document.getElementById('spinner');
    if (spinner) spinner.classList.remove('hidden');
    
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
    
    // Read file
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            // Parse JSON
            const riskData = JSON.parse(e.target.result);
            
            // Validate JSON structure (should have risk_scoring or theme_scoring)
            if (!riskData.risk_scoring && !riskData.theme_scoring) {
                throw new Error('Invalid JSON format: missing risk_scoring or theme_scoring');
            }
            
            // Adapt risk data to theme format
            const data = adaptRiskDataToThemeFormat(riskData);
            
            // Add runDate from current date
            const now = new Date();
            data.runDate = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
            
            // Store the report globally
            window.lastReport = data;
            
            // Update download button state
            updateDownloadButtonState();
            
            // Hide spinner
            if (spinner) spinner.classList.add('hidden');
            
            // Close config panel
            closeConfigPanel();
            
            // Hide pre-computed demo indicator (since this is an uploaded file)
            const precomputedDemo = document.getElementById('precomputedDemo');
            if (precomputedDemo) {
                precomputedDemo.classList.add('hidden');
            }
            
            // Update config badge with file info
            if (window.updateConfigBadge) {
                updateConfigBadge({
                    theme: 'Uploaded Report',
                    companies: file.name.replace('.json', ''),
                    isDemo: false
                });
            }
            
            // Show JSON button (if it exists)
            const showJsonBtn = document.getElementById('showJsonBtn');
            if (showJsonBtn) showJsonBtn.style.display = 'inline-block';
            
            // Show new analysis button (if it exists)
            const newAnalysisBtn = document.getElementById('newAnalysisBtn');
            if (newAnalysisBtn) newAnalysisBtn.style.display = 'inline-flex';
            
            // Render the report
            if (window.renderScreenerReport) {
                renderScreenerReport(data);
            }
            
            // Show success message
            showUploadMessage(`Successfully loaded ${file.name}`, 'success');
            
            // Reset file input
            event.target.value = '';
            
        } catch (error) {
            if (spinner) spinner.classList.add('hidden');
            console.error('Error processing JSON file:', error);
            showUploadMessage(`Error: ${error.message}`, 'error');
            event.target.value = '';
        }
    };
    
    reader.onerror = function() {
        if (spinner) spinner.classList.add('hidden');
        showUploadMessage('Error reading file. Please try again.', 'error');
        event.target.value = '';
    };
    
    reader.readAsText(file);
}

// Show upload message
function showUploadMessage(message, type) {
    const messageEl = document.getElementById('uploadMessage');
    if (messageEl) {
        messageEl.textContent = message;
        messageEl.classList.remove('hidden');
        messageEl.classList.remove('text-green-400', 'text-red-400');
        
        if (type === 'success') {
            messageEl.classList.add('text-green-400');
        } else if (type === 'error') {
            messageEl.classList.add('text-red-400');
        } else {
            messageEl.classList.add('text-zinc-400');
        }
        
        // Hide message after 5 seconds
        setTimeout(() => {
            messageEl.classList.add('hidden');
        }, 5000);
    }
}

// New Analysis function - opens the configuration panel
function startNewAnalysis() {
    toggleConfigPanel();
}

// Restart Analysis function - resets to initial landing page
function restartAnalysis() {
    // Hide dashboard section
    const dashboardSection = document.getElementById('dashboardSection');
    if (dashboardSection) {
        dashboardSection.classList.add('hidden');
    }
    
    // Show empty state
    const emptyState = document.getElementById('emptyState');
    if (emptyState) {
        emptyState.style.display = 'block';
    }
    
    // Clear dashboard content
    const dashboardCards = document.getElementById('dashboardCards');
    if (dashboardCards) {
        dashboardCards.innerHTML = '';
    }
    
    // Reset tabs
    if (window.tabController) {
        window.tabController.reset();
    }
    
    // Hide JSON button and new analysis button (if they exist)
    const showJsonBtn = document.getElementById('showJsonBtn');
    const newAnalysisBtn = document.getElementById('newAnalysisBtn');
    if (showJsonBtn) showJsonBtn.style.display = 'none';
    if (newAnalysisBtn) newAnalysisBtn.style.display = 'none';
    
    // Hide pre-computed demo indicator
    const precomputedDemo = document.getElementById('precomputedDemo');
    if (precomputedDemo) {
        precomputedDemo.classList.add('hidden');
    }
    
    // Clear any stored report data
    if (window.lastReport) {
        window.lastReport = null;
    }
    
    // Update download button state
    updateDownloadButtonState();
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
    
    // Initialize download button state
    updateDownloadButtonState();
    
    // Wire up file upload event handler
    const fileInput = document.getElementById('jsonFileInput');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
    }
});

// Convert adapted format back to original JSON format
function convertToOriginalFormat(adaptedData) {
    // If data is already in original format, return as-is
    if (adaptedData.risk_scoring) {
        return adaptedData;
    }
    
    // Convert theme_scoring back to risk_scoring
    const original = {
        risk_scoring: {},
        risk_taxonomy: adaptedData.theme_taxonomy || adaptedData.risk_taxonomy || {},
        content: adaptedData.content || []
    };
    
    // Transform each company's theme data back to risk format
    if (adaptedData.theme_scoring) {
        for (const [companyName, companyData] of Object.entries(adaptedData.theme_scoring)) {
            // Create a copy without themes property
            const { themes, ...rest } = companyData;
            original.risk_scoring[companyName] = {
                ...rest,
                risks: themes || companyData.risks || {}
            };
        }
    }
    
    return original;
}

// Download report as JSON
function downloadReportJSON() {
    if (!window.lastReport) {
        const messageEl = document.getElementById('downloadReportMessage');
        if (messageEl) {
            messageEl.textContent = 'No report data available. Please load or generate a report first.';
            messageEl.classList.remove('hidden');
            messageEl.classList.add('text-red-400');
            setTimeout(() => {
                messageEl.classList.add('hidden');
                messageEl.classList.remove('text-red-400');
            }, 3000);
        }
        return;
    }
    
    try {
        // Convert adapted format back to original format
        const originalData = convertToOriginalFormat(window.lastReport);
        
        // Create JSON string with pretty formatting
        const jsonString = JSON.stringify(originalData, null, 2);
        
        // Create blob and download
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const theme = window.currentConfig?.theme || 'risk_analysis';
        const filename = `${theme.toLowerCase().replace(/\s+/g, '_')}_${timestamp}.json`;
        link.download = filename;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        // Show success message
        const messageEl = document.getElementById('downloadReportMessage');
        if (messageEl) {
            messageEl.textContent = `Report downloaded as ${filename}`;
            messageEl.classList.remove('hidden');
            messageEl.classList.remove('text-red-400');
            messageEl.classList.add('text-green-400');
            setTimeout(() => {
                messageEl.classList.add('hidden');
            }, 3000);
        }
    } catch (error) {
        console.error('Error downloading report:', error);
        const messageEl = document.getElementById('downloadReportMessage');
        if (messageEl) {
            messageEl.textContent = 'Error downloading report. Please try again.';
            messageEl.classList.remove('hidden');
            messageEl.classList.add('text-red-400');
            setTimeout(() => {
                messageEl.classList.add('hidden');
                messageEl.classList.remove('text-red-400');
            }, 3000);
        }
    }
}

// Update download button state based on report availability
function updateDownloadButtonState() {
    const downloadBtn = document.getElementById('downloadReportBtn');
    if (downloadBtn) {
        if (window.lastReport) {
            downloadBtn.disabled = false;
        } else {
            downloadBtn.disabled = true;
        }
    }
}

// Make functions globally accessible
window.toggleConfigPanel = toggleConfigPanel;
window.closeConfigPanel = closeConfigPanel;
window.loadQuickStartTemplate = loadQuickStartTemplate;
window.updateConfigBadge = updateConfigBadge;
window.startNewAnalysis = startNewAnalysis;
window.restartAnalysis = restartAnalysis;
window.downloadReportJSON = downloadReportJSON;
window.updateDownloadButtonState = updateDownloadButtonState;
window.triggerFileUpload = triggerFileUpload;
window.handleFileUpload = handleFileUpload;
