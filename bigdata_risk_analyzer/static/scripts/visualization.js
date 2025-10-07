// Info modal content for each label
const infoContents = {
    main_theme: `<b>Main Theme</b>:<br>The overarching risk scenario you want to analyze. It can be specified as a single word or as a short sentence. The risk analyzer will generate a list of sub-themes representing individual, self contained components of the main risk. It can contain multiple core concepts, but we recommend not adding too many core concepts in the same run.<br><i>Examples: "US Import Tariffs against China", "Energy Transition", "Regulatory Changes in AI"</i>`,
    focus: `<b>Focus</b>:<br>Use this parameter to pass additional, custom instructions to the LLM when breaking down the theme into sub-risks. Guide the mindmap creation and customize it to your needs, inject your domain knowledge, and ensure the mindmap covers all required risk dimensions.`,
    companies: `<b>Company Universe</b>:<br>The portfolio of companies you want to screen for exposure, you have several input options:<br><ul class="list-disc pl-6"><li>Select one of the public watchlists using the dropdown menu</li><li>Write list of RavenPack entity IDs (e.g., <code>4A6F00, D8442A</code>)</li><li>Input a watchlist ID (e.g., <code>44118802-9104-4265-b97a-2e6d88d74893</code> )</li></ul><br>Watchlists can be created programmatically using the <a href='https://docs.bigdata.com/getting-started/watchlist_management' target='_blank'>Bigdata.com SDK</a> or through the <a href='https://app.bigdata.com/watchlists' target='_blank'>Bigdata app</a>.`,
    control_entities: `<b>Control Entities</b>:<br>A dict of entities to be co-mentioned with the sentence, companies, and keywords (e.g. <code>{"place": ["China"]}</code>). Specify companies, places, people, concepts, etc. <a href='https://docs.bigdata.com/getting-started/knowledge_graph/find_companies#using-filters' target='_blank'>Learn more</a>.`,
    start_date: `<b>Start/End Date</b>:<br>The start and end of the time sample during which you want to screen your portfolio for thematic exposure. Format: <code>YYYY-MM-DD</code>.`,
    keywords: `<b>Keywords</b>:<br>A list of keywords defining core concepts of the theme (or sub-theme) to be included in the query. Combined with OR and added to Similarity and Entity filter with AND.`,
    document_type: `<b>Document Type</b>:<br>The type of documents to search over. Use this to analyze text data from news, corporate transcripts, or filings. Currently, only "TRANSCRIPTS" is supported.`,
    fiscal_year: `<b>Fiscal Year</b>:<br>For Transcripts and Filings, filter documents by their reporting details. <b>fiscal_year</b> represents the annual reporting period and can be combined with <b>start_date</b> and <b>end_date</b> for time-sensitive queries. Not applicable to News.`,
    rerank_threshold: `<b>Rerank Threshold</b>:<br>Optional, used with sentence search only. Ensures close cosine similarity between sentence embeddings and retrieved chunks. By default, not applied. For most use cases, one-step retrieval is sufficient. <a href='https://docs.bigdata.com/how-to-guides/rerank_search' target='_blank'>Learn more</a>.`,
    frequency: `<b>Frequency</b>:<br>Break down your sample range into higher frequency intervals (<code>D</code>, <code>Y</code>, <code>M</code>, <code>3M</code>, <code>Y</code>). Useful for large samples to control document retrieval over time.`,
    llm_model: `<b>LLM Model</b>:<br>The LLM model to be used for mindmap generation and text analysis. It has to be specified as a string containing both provider name and model name separated by two colons: <provider::model>.`,
    document_limit: `<b>Document Limit</b>:<br>The maximum number of documents to be retrieved by each query. This is a single value that applies to any combination of query statement & date range.`,
    batch_size: `<b>Batch Size</b>:<br>Set this parameter when screening a large portfolio of companies (i.e. 50 or more). It allows to break down the portfolio into smaller batches of fixed size, and instructs the search service to run parallel queries for each and every batch. This allows for improving the sampling across your portfolio, given the document limit constraint that has to be applied per query.`,
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

// Dragbar logic
document.addEventListener('DOMContentLoaded', function () {
    const dragbar = document.getElementById('dragbar');
    const sidebar = document.getElementById('sidebar');
    const outputarea = document.getElementById('outputarea');
    let dragging = false;
    dragbar.addEventListener('mousedown', function (e) {
        dragging = true;
        document.body.classList.add('cursor-ew-resize');
        document.body.style.userSelect = 'none';
    });
    document.addEventListener('mousemove', function (e) {
        if (!dragging) return;
        const minSidebar = 250;
        const maxSidebar = 600;
        let newWidth = Math.min(Math.max(e.clientX - sidebar.getBoundingClientRect().left, minSidebar), maxSidebar);
        sidebar.style.width = newWidth + 'px';
        // outputarea will flex to fill remaining space
    })
    document.addEventListener('mouseup', function (e) {
        if (dragging) {
            dragging = false;
            document.body.classList.remove('cursor-ew-resize');
            document.body.style.userSelect = '';
        }
    });
});

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
    if (text === null || text === undefined) return '';
    const str = String(text);
    return str.replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, '&quot;')
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