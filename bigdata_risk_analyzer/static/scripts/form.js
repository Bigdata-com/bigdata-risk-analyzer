document.getElementById('riskForm').onsubmit = async function (e) {
    e.preventDefault();
    const spinner = document.getElementById('spinner');
    const showJsonBtn = document.getElementById('showJsonBtn');
    const submitBtn = document.querySelector('button[type="submit"]');
    
    // Close config panel
    if (window.closeConfigPanel) {
        closeConfigPanel();
    }
    
    showJsonBtn.style.display = 'none';
    lastReport = null;
    
    // Reset frontend: hide results, show empty state, clear dashboard
    const emptyState = document.getElementById('emptyState');
    const dashboardSection = document.getElementById('dashboardSection');
    const dashboardCards = document.getElementById('dashboardCards');
    
    if (emptyState) emptyState.style.display = 'none';
    if (dashboardSection) dashboardSection.classList.add('hidden');
    if (dashboardCards) dashboardCards.innerHTML = '';
    
    // Open process logs
    const logViewerContainer = document.getElementById('logViewerContainer');
    const logsIcon = document.getElementById('logsIcon');
    if (logViewerContainer && logViewerContainer.classList.contains('hidden')) {
        logViewerContainer.classList.remove('hidden');
        if (logsIcon) logsIcon.style.transform = 'rotate(180deg)';
    }
    
    // Clear logs
    const logViewer = document.getElementById('logViewer');
    if (logViewer) logViewer.innerHTML = '<div class="text-zinc-400">Starting analysis...</div>';
    
    // Reset all tabs
    if (window.tabController) {
        window.tabController.reset();
    }

    try {
        // Validate date range first
        const startDateInput = document.getElementById('start_date').value;
        const endDateInput = document.getElementById('end_date').value;
        const frequencyInput = document.getElementById('frequency').value;

        const dateValidation = validateDateRange(startDateInput, endDateInput, frequencyInput);
        if (!dateValidation.isValid) {
            alert(`❌ ${dateValidation.message}`);
            return;
        }

        // Disable the submit button
        submitBtn.disabled = true;
        submitBtn.textContent = 'Waiting for response...';

        // Gather form data
        const main_theme = document.getElementById('main_theme').value.trim();
        const focus = document.getElementById('focus').value.trim();
        const control_entities = document.getElementById('control_entities')?.value?.trim() || '';
        const keywords = document.getElementById('keywords')?.value?.trim() || '';
        // Get companies and check if its available in the watchlists
        let companies = document.getElementById('companies_text').value.trim();
        const foundWatchlist = watchlists.find(w => w.name === companies);
        if (foundWatchlist) {
            companies = foundWatchlist.id;
        }
        else if (!companies) {
            alert(`❌ Error: Company Universe is required.`);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Run Analysis';
            return;
        }
        const start_date = document.getElementById('start_date').value;
        const end_date = document.getElementById('end_date').value;

        let fiscal_year = document.getElementById('fiscal_year').value.trim();
        if (fiscal_year.includes(',')) {
            fiscal_year = fiscal_year.split(',').map(s => s.trim()).filter(Boolean);
            // Check if all entries are numbers
            if (!fiscal_year.every(yr => Number(yr))) {
                throw new Error('Fiscal Year must be a number or a comma-separated list of numbers.');
            }
        } else if (fiscal_year) {
            fiscal_year = fiscal_year;
        } else {
            fiscal_year = undefined;
        }

        const llm_model = document.getElementById('llm_model').value.trim();
        const document_type = document.getElementById('document_type').value;
        const rerank_threshold = document.getElementById('rerank_threshold').value;
        const frequency = document.getElementById('frequency').value;
        const document_limit = document.getElementById('document_limit').value;
        const batch_size = document.getElementById('batch_size').value;

        // Build request payload
        let payload = {
            main_theme,
            focus,
            llm_model,
            document_type,
            frequency,
            document_limit: document_limit ? parseInt(document_limit) : undefined,
            batch_size: batch_size ? parseInt(batch_size) : undefined,
            fiscal_year: fiscal_year ? fiscal_year : undefined
        };

        // A list of companies
        if (companies.includes(',')) {
            payload.companies = companies.split(',').map(s => s.trim()).filter(Boolean);
            // A single RP Entity ID
        } else if (companies.length === 6) {
            payload.companies = [companies];
            // A watchlist ID
        } else if (companies.length > 6) {
            payload.companies = companies;
        }
        if (control_entities) {
            var clean_control_entities = control_entities.replaceAll(`'`, `"`);
            try {
                payload.control_entities = JSON.parse(clean_control_entities);
            } catch (e) {
                alert('❌ Invalid JSON for control entities.');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Run Analysis';
                return;
            }
        }

        if (start_date) payload.start_date = start_date;
        if (end_date) payload.end_date = end_date;
        if (rerank_threshold) payload.rerank_threshold = parseFloat(rerank_threshold);

        // Add token from URL param if present
        const params = new URLSearchParams();
        const token = getUrlParam('token');
        if (token) {
            params.append("token", token);
        }

        const response = await fetch(`/risk-analysis?${params}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const errorData = await response.json();
            // Iterate over errorData.detail if it's an array show the loc and msg fields
            if (errorData.detail && Array.isArray(errorData.detail)) {
                const messages = errorData.detail.map(err => {
                    if (err.loc && err.loc.length > 1) {
                        return `${err.loc.join(', ')}: ${err.msg}`;
                    } else {
                        return err.msg;
                    }
                }).join('<br>');
                throw new Error('Form submission error:<br>' + messages);
            }
            throw new Error(`HTTP error ${response.status}`);
        }
        const data = await response.json();
        // Start polling status endpoint every 5 seconds using request_id
        if (data && data.request_id) {
            const requestId = data.request_id;
            let polling = true;
            const logViewer = document.getElementById('logViewer');
            async function pollStatus() {

                try {
                    const statusResp = await fetch(`/status/${requestId}?${params}`);
                    if (!statusResp.ok) {
                        throw new Error(`Status HTTP error ${statusResp.status}`);
                    }
                    const statusData = await statusResp.json();
                    spinner.style.display = 'block';
                    // Render logs if available
                    if (statusData.logs && Array.isArray(statusData.logs)) {
                        logViewer.innerHTML = statusData.logs.map(line => {
                            let base = 'mb-1';
                            let color = '';
                            if (line.toLowerCase().includes('error')) color = 'text-red-400';
                            else if (line.toLowerCase().includes('success')) color = 'text-green-400';
                            else if (line.toLowerCase().includes('info')) color = 'text-sky-400';
                            return `<div class='${base} ${color}'>${line}</div>`;
                        }).join('');
                        logViewer.scrollTop = logViewer.scrollHeight;
                    } else if (statusData.log) {
                        logViewer.textContent = statusData.log;
                    } else {
                        logViewer.textContent = 'No logs yet.';
                    }
                    // Stop polling if status is 'completed' or 'failed'
                    if (statusData.status === 'completed' || statusData.status === 'failed') {
                        polling = false;
                        if (statusData.status === 'completed') {
                            // Update config badge BEFORE rendering so dashboard has access to it
                            if (window.updateConfigBadge) {
                                // Use exactly what the user typed for display
                                const companiesText = document.getElementById('companies_text').value.trim();
                                updateConfigBadge({
                                    main_theme: main_theme,
                                    companies: companiesText || 'Custom Universe',
                                    isDemo: false
                                });
                            }
                            
                            // Render the report using the new interface
                            if (window.renderRiskReport) {
                                renderRiskReport(statusData.report);
                            }
                            showJsonBtn.style.display = 'inline-block';
                            
                            // Show new analysis button
                            const newAnalysisBtn = document.getElementById('newAnalysisBtn');
                            if (newAnalysisBtn) newAnalysisBtn.style.display = 'inline-flex';
                            
                            lastReport = statusData.report;
                        }
                        spinner.style.display = 'none';
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Run Analysis';
                        return;
                    }
                } catch (err) {
                    logViewer.innerHTML = `<div class=\"log-line log-error\">❌ Status Error: ${err.message}</div>`;
                }
                if (polling) {
                    setTimeout(pollStatus, 5000);
                }
            }
            pollStatus();
        }
    } catch (err) {
        alert(`❌ Error: ${err.message}`);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Run Analysis';
        spinner.style.display = 'none';
    }
};
