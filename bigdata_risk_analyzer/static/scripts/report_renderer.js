// Adapter function to convert risk data to theme format if needed
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

function renderScreenerReport(rawData) {
    if (!rawData || typeof rawData !== 'object') {
        // Show empty state in all tabs
        if (window.tabController) {
            window.tabController.showEmptyState('summary', 'No data to display');
            window.tabController.showEmptyState('screener', 'No data to display');
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
    
    console.log('Available functions:', {
        renderDashboardCards: typeof window.renderDashboardCards,
        renderHeatmap: typeof window.renderHeatmap,
        renderCompanyScreener: typeof window.renderCompanyScreener,
        renderMindmap: typeof window.renderMindmap,
        renderEvidenceTable: typeof window.renderEvidenceTable
    });

    // Hide empty state, show dashboard
    const emptyState = document.getElementById('emptyState');
    const dashboardSection = document.getElementById('dashboardSection');
    
    if (emptyState) emptyState.classList.add('hidden');
    if (dashboardSection) dashboardSection.classList.remove('hidden');
    
    // Re-initialize tab controller now that dashboard is visible
    if (window.tabController) {
        window.tabController.reinit();
    }
    
    // Show new analysis button (if it exists)
    const newAnalysisBtn = document.getElementById('newAnalysisBtn');
    if (newAnalysisBtn) newAnalysisBtn.style.display = 'inline-flex';

    // Render dashboard cards into Overview tab
    if (window.renderDashboardCards) {
        const overviewContent = document.querySelector('[data-tab-content="overview"] .tab-actual-content');
        if (overviewContent) {
            overviewContent.innerHTML = renderDashboardCards(data);
        }
    }

    // Note: Configuration badge is updated by the caller (form.js or config_panel.js)
    // Don't update it here to avoid overwriting demo configs

    // Set Overview tab as active by default
    if (window.tabController) {
        window.tabController.switchTab('overview');
    }

    // Render exploration tabs (detailed views)
    try {
        // Overview tab - Dashboard cards (already rendered above)
        if (data.theme_scoring) {
            window.tabController.setLoadingState('overview', false);
        }

        // Summary tab - Heatmap
        if (data.theme_scoring) {
            console.log('Rendering heatmap...');
            window.tabController.setLoadingState('summary', false);
            if (window.renderHeatmap) {
                renderHeatmap(data.theme_scoring);
            } else {
                console.error('renderHeatmap function not available');
            }
        } else {
            console.log('No theme_scoring data for heatmap');
        }

        // Companies tab - Company cards
        if (data.theme_scoring) {
            console.log('Rendering company screener...');
            window.tabController.setLoadingState('screener', false);
            if (window.renderCompanyScreener) {
                renderCompanyScreener(data.theme_scoring);
            } else {
                console.error('renderCompanyScreener function not available');
            }
        } else {
            console.log('No theme_scoring data for company screener');
        }

        // Mindmap tab - Taxonomy visualization
        if (data.theme_taxonomy) {
            console.log('Rendering mindmap...');
            window.tabController.setLoadingState('mindmap', false);
            if (window.renderMindmap) {
                renderMindmap(data.theme_taxonomy);
            } else {
                console.error('renderMindmap function not available');
            }
        } else {
            console.log('No theme_taxonomy data for mindmap');
        }

        // Evidence tab - Filterable table
        if (data.content) {
            console.log('Rendering evidence table...');
            window.tabController.setLoadingState('evidence', false);
            if (window.renderEvidenceTable) {
                renderEvidenceTable(data.content);
            } else {
                console.error('renderEvidenceTable function not available');
            }
        } else {
            console.log('No content data for evidence table');
        }
    } catch (error) {
        console.error('Error rendering report:', error);
    }
}

// Make both functions globally available
window.renderScreenerReport = renderScreenerReport;
window.renderRiskReport = renderScreenerReport; // Alias for Risk Analyzer
