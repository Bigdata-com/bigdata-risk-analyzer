// Adapter function to convert risk data to theme format if needed
function adaptRiskDataToThemeFormat(riskData) {
    // If data is already in theme format, return as-is
    if (riskData.theme_scoring) {
        return riskData;
    }
    
    // Convert risk_scoring to theme_scoring
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

function renderScreenerReport(rawData) {
    if (!rawData || typeof rawData !== 'object') {
        // Show empty state in all tabs
        if (window.tabController) {
            window.tabController.showEmptyState('summary', 'No data to display');
            window.tabController.showEmptyState('companies', 'No data to display');
            window.tabController.showEmptyState('mindmap', 'No data to display');
            window.tabController.showEmptyState('evidence', 'No data to display');
        }
        return;
    }

    // Adapt data if it's in risk format
    const data = adaptRiskDataToThemeFormat(rawData);

    console.log('Rendering report with adapted data:', {
        hasThemeScoring: !!data.theme_scoring,
        hasThemeTaxonomy: !!data.theme_taxonomy,
        hasContent: !!data.content,
        companyCount: data.theme_scoring ? Object.keys(data.theme_scoring).length : 0
    });

    // Hide empty state, show dashboard
    const emptyState = document.getElementById('emptyState');
    const dashboardSection = document.getElementById('dashboardSection');
    
    if (emptyState) emptyState.classList.add('hidden');
    if (dashboardSection) dashboardSection.classList.remove('hidden');
    
    // Show new analysis button
    const newAnalysisBtn = document.getElementById('newAnalysisBtn');
    if (newAnalysisBtn) newAnalysisBtn.style.display = 'inline-flex';

    // Render dashboard cards first (main insights)
    if (window.renderDashboardCards) {
        renderDashboardCards(data);
    }

    // Note: Configuration badge is updated by the caller (form.js or config_panel.js)
    // Don't update it here to avoid overwriting demo configs

    // Render exploration tabs (detailed views)
    try {
        // Summary tab - Heatmap
        if (data.theme_scoring) {
            window.tabController.setLoadingState('summary', false);
            renderHeatmap(data.theme_scoring);
        }

        // Companies tab - Company cards
        if (data.theme_scoring) {
            window.tabController.setLoadingState('companies', false);
            renderCompanyCards(data.theme_scoring);
        }

        // Mindmap tab - Taxonomy visualization
        if (data.theme_taxonomy) {
            window.tabController.setLoadingState('mindmap', false);
            renderMindmap(data.theme_taxonomy);
        }

        // Evidence tab - Filterable table
        if (data.content) {
            window.tabController.setLoadingState('evidence', false);
            renderEvidenceTable(data.content);
        }
    } catch (error) {
        console.error('Error rendering report:', error);
    }
}

// Alias for Risk Analyzer - same functionality
const renderRiskReport = renderScreenerReport;

// Make both functions globally available
window.renderScreenerReport = renderScreenerReport;
window.renderRiskReport = renderRiskReport;
