// Info modal content for each label
const infoContents = {
    main_theme: `<b>Main Theme</b>:<br>The overarching risk scenario you want to analyze. It can be specified as a single word or as a short sentence. The risk analyzer will generate a list of sub-themes representing individual, self contained components of the main risk. It can contain multiple core concepts, but we recommend not adding too many core concepts in the same run.<br><i>Examples: "US Import Tariffs against China", "Energy Transition", "Regulatory Changes in AI"</i>`,
    focus: `<b>Focus</b>:<br>Use this parameter to pass additional, custom instructions to the LLM when breaking down the theme into sub-risks. Guide the mindmap creation and customize it to your needs, inject your domain knowledge, and ensure the mindmap covers all required risk dimensions.`,
    companies: `<b>Company Universe</b>:<br>The portfolio of companies you want to screen for exposure, you have two input options:<br><ul class="list-disc pl-6"><li>Write a comma-separated list of RavenPack entity IDs (e.g., <code>4A6F00, D8442A</code>)</li><li>Upload a CSV with <code>RP_ENTITY_ID</code> and <code>COMPANY_NAME</code> columns (optionally <code>TICKER</code>/<code>SECTOR</code>/<code>INDUSTRY</code>/<code>COUNTRY</code>)</li></ul><br>Watchlists are not supported at this time.`,
    start_date: `<b>Start/End Date</b>:<br>The start and end of the time sample during which you want to screen your portfolio for thematic exposure. Format: <code>YYYY-MM-DD</code>.`,
    keywords: `<b>Keywords</b>:<br>Optional key terms to emphasize when generating the risk taxonomy.`,
    rerank_threshold: `<b>Rerank Threshold</b>:<br>Optional relevance threshold (0-1); retrieved chunks scoring below it are discarded. By default, not applied.`,
    chunk_percentage: `<b>Retrieval %</b>:<br>Percentage (0-100) of the estimated available chunks to retrieve per risk factor, e.g. <code>5</code> means 5%. Higher values cost more and take longer, but surface more evidence.`,
    max_leaf_labels: `<b>Max Risk Factors</b>:<br>Maximum number of leaf sub-scenarios in the generated risk taxonomy. Leave empty for no cap.`,
    max_taxonomy_depth: `<b>Max Taxonomy Depth</b>:<br>Maximum number of levels in the generated risk taxonomy, counting the root risk node as level 1. By default the taxonomy has 4 levels (root, risk channel, risk factor, sub-scenario); set this to <code>3</code> to drop the separate risk-factor layer so sub-scenarios sit directly under each risk channel. Leave empty for the default depth.`,
    llm_model: `<b>LLM Model</b>:<br>The OpenAI model used for taxonomy generation, chunk labeling, and company summaries.`,
    headline_comment: `<b>Headline</b>:<br>Click on each headline to retrieve the DOCUMENT ID. The DOCUMENT ID identifies the document that contains that  headline.`,
};

// Toggle advanced options visibility
function toggleAdvancedOptions() {
    var adv = document.getElementById('advanced-options');
    var btnIcon = document.getElementById('advancedOptionsIcon');
    if (adv.style.display === 'none' || adv.classList.contains('hidden')) {
        adv.style.display = 'block';
        adv.classList.remove('hidden');
        btnIcon.textContent = '-';
    } else {
        adv.style.display = 'none';
        adv.classList.add('hidden');
        btnIcon.textContent = '+';
    }
}

// Toggle the "Process Logs" panel visibility
function toggleProcessLogs() {
    const container = document.getElementById('logViewerContainer');
    const icon = document.getElementById('logsIcon');
    if (!container) return;

    if (container.classList.contains('hidden')) {
        container.classList.remove('hidden');
        if (icon) icon.style.transform = 'rotate(180deg)';
    } else {
        container.classList.add('hidden');
        if (icon) icon.style.transform = 'rotate(0deg)';
    }
}


// Information modal for form fields
function showInfoModal(label) {
    let container = document.getElementById('infoModalsContainer');
    container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onclick="if(event.target==this)this.style.display='none'">
        <div class="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 relative">
          <button class="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl font-bold" onclick="this.closest('.fixed').style.display='none'">&times;</button>
          <div class="text-base text-black">${infoContents[label] || 'No info available.'}</div>
          <div class="mt-4 text-sm text-black">For a complete list of parameters and their descriptions, refer to the <a href='http://localhost:8000/docs' target='_blank' class='text-blue-600 underline'>API documentation</a>.</div>
        </div>
      </div>
    `;
}

// Information modal for document ID
function showDocumentModal(document_id) {
    let container = document.getElementById('infoModalsContainer');
    container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onclick="if(event.target==this)this.style.display='none'">
        <div class="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 relative">
          <button class="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl font-bold" onclick="this.closest('.fixed').style.display='none'">&times;</button>
          <div class="text-base font-bold text-black">DOCUMENT ID</div>
          <div class="text-base text-black">${document_id}</div>
        </div>
      </div>
    `;
}

// Escape HTML
function escapeHtml(text) {
  if (text == null) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}



// Helper to get URL param
function getUrlParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
}

// Expand and contract motivation text
function toggleMotivation(element) {
    const textDiv = element.querySelector('.motivation-text');
    const clickText = element.querySelector('.text-blue-600');

    if (textDiv.classList.contains('max-h-[2em]')) {
        textDiv.classList.remove('max-h-[2em]', 'overflow-hidden');
        textDiv.classList.add('max-h-full');
        clickText.textContent = 'Click to collapse';
    } else {
        textDiv.classList.remove('max-h-full');
        textDiv.classList.add('max-h-[2em]', 'overflow-hidden');
        clickText.textContent = 'Click to expand';
    }
}

// Copy JSON to clipboard with fallback in case navigator.clipboard is not available
function copyJson() {
    const jsonContent = document.getElementById('jsonContent');
    if (!jsonContent) return;
    const text = jsonContent.innerText || jsonContent.textContent;
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            const btn = document.getElementById('copyBtn');
            if (btn) {
                const orig = btn.textContent;
                btn.textContent = 'Copied!';
                setTimeout(() => { btn.textContent = orig; }, 1200);
            }
        });
    } else {
        // fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            const btn = document.getElementById('copyBtn');
            if (btn) {
                const orig = btn.textContent;
                btn.textContent = 'Copied!';
                setTimeout(() => { btn.textContent = orig; }, 1200);
            }
        } catch (err) { }
        document.body.removeChild(textarea);
    }
};

// Close modal
function closeModal() {
    document.getElementById('jsonModal').style.display = 'none';
}