// Adapter function to convert risk data to theme format if needed
function adaptRiskDataToThemeFormat(riskData) {
    // If data is already in theme format, return as-is
    if (riskData.theme_scoring) {
        return riskData;
    }
    
    // Convert risk_scoring to theme_scoring
    // Note: We keep risk_taxonomy as-is (hierarchical) for mindmap compatibility
    // Handle RootModel structure for content (content.root) or direct array
    let contentArray = riskData.content;
    if (contentArray && typeof contentArray === 'object' && contentArray.root && Array.isArray(contentArray.root)) {
        contentArray = contentArray.root;
    } else if (!Array.isArray(contentArray)) {
        contentArray = [];
    }
    
    const adapted = {
        theme_scoring: {},
        theme_taxonomy: riskData.risk_taxonomy || {},
        content: contentArray
    };
    
    // Transform each company's risk data to theme format from risk_scoring
    if (riskData.risk_scoring) {
        for (const [companyName, companyData] of Object.entries(riskData.risk_scoring)) {
            adapted.theme_scoring[companyName] = {
                ...companyData,
                themes: companyData.risks || companyData.themes || {}
            };
        }
    }
    
    // Derive companies from content that are missing from risk_scoring
    // This ensures all companies with content chunks appear in rankings/heatmap
    if (contentArray && contentArray.length > 0) {
        const companyDataMap = {};
        
        // Aggregate content by company
        contentArray.forEach(chunk => {
            if (!chunk || !chunk.company) return;
            
            const companyName = chunk.company;
            
            // Skip if already in theme_scoring (from risk_scoring)
            if (adapted.theme_scoring[companyName]) return;
            
            // Initialize company data if not exists
            if (!companyDataMap[companyName]) {
                companyDataMap[companyName] = {
                    ticker: chunk.ticker || null,
                    sector: chunk.sector || 'Unknown',
                    industry: chunk.industry || 'Unknown',
                    themes: {},
                    composite_score: 0,
                    motivation: null
                };
            }
            
            // Aggregate themes/risks from content chunks
            // Use sub_scenario as the theme/risk identifier (fallback to risk_factor if not available)
            const theme = chunk.sub_scenario || chunk.risk_factor || 'Unknown Risk';
            if (!companyDataMap[companyName].themes[theme]) {
                companyDataMap[companyName].themes[theme] = 0;
            }
            companyDataMap[companyName].themes[theme] += 1;
            companyDataMap[companyName].composite_score += 1;
            
            // Collect motivation from chunks (use first non-empty one)
            if (!companyDataMap[companyName].motivation && chunk.motivation) {
                companyDataMap[companyName].motivation = chunk.motivation;
            }
        });
        
        // Add derived companies to theme_scoring
        for (const [companyName, companyData] of Object.entries(companyDataMap)) {
            adapted.theme_scoring[companyName] = companyData;
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
    if (window.tabController && typeof window.tabController.reinit === 'function') {
        window.tabController.reinit();
    } else {
        console.warn('TabController not available, retrying...');
        // Retry after a short delay
        setTimeout(() => {
            if (window.tabController && typeof window.tabController.reinit === 'function') {
                window.tabController.reinit();
            } else {
                console.error('TabController still not available after retry');
            }
        }, 100);
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

    // Set Overview tab as active by default (only on initial load)
    // Don't switch tabs if we're already on a different tab (e.g., during evidence recalculation)
    if (window.tabController) {
        const currentTab = window.tabController.activeTab;
        // Only switch to overview if no tab is set or if we're explicitly on overview
        // This prevents switching away from evidence/risk-evolution tabs during re-renders
        if (!currentTab || currentTab === 'overview') {
            window.tabController.switchTab('overview');
        }
        // Otherwise, preserve the current tab - it will be restored by the caller if needed
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

        // Risk Evolution tab - Time series visualization
        if (data.content) {
            console.log('Rendering risk evolution...', {
                hasContent: !!data.content,
                isArray: Array.isArray(data.content),
                hasRoot: !!(data.content && typeof data.content === 'object' && data.content.root),
                contentType: typeof data.content
            });
            window.tabController.setLoadingState('risk-evolution', false);
            if (window.renderRiskEvolution) {
                // Handle RootModel structure
                const contentData = Array.isArray(data.content) ? data.content : (data.content.root || data.content);
                renderRiskEvolution(contentData, data.theme_scoring);
            } else {
                console.error('renderRiskEvolution function not available');
            }
        } else {
            console.log('No content data for risk evolution');
        }
    } catch (error) {
        console.error('Error rendering report:', error);
    }
}

// Make both functions globally available
window.renderScreenerReport = renderScreenerReport;
window.renderRiskReport = renderScreenerReport; // Alias for Risk Analyzer
