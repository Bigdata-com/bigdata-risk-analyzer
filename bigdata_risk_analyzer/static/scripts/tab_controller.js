// Tab Controller - Manages tab navigation and content display
class TabController {
    constructor() {
        this.activeTab = 'summary';
        this.tabsInitialized = false;
        this.loadingStates = {
            summary: false,
            companies: false,
            mindmap: false,
            evidence: false
        };
    }

    init() {
        this.setupTabListeners();
        this.tabsInitialized = true;
    }

    setupTabListeners() {
        const tabButtons = document.querySelectorAll('[data-tab]');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = button.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });
    }

    switchTab(tabName) {
        if (!tabName) return;

        // Update active tab
        this.activeTab = tabName;

        // Update tab buttons - using red theme for risk analyzer
        const tabButtons = document.querySelectorAll('[data-tab]');
        tabButtons.forEach(button => {
            const btnTabName = button.getAttribute('data-tab');
            if (btnTabName === tabName) {
                button.classList.add('border-red-500', 'text-red-400', 'bg-red-500/10');
                button.classList.remove('border-transparent', 'text-zinc-400', 'hover:text-zinc-200');
            } else {
                button.classList.remove('border-red-500', 'text-red-400', 'bg-red-500/10');
                button.classList.add('border-transparent', 'text-zinc-400', 'hover:text-zinc-200');
            }
        });

        // Update tab content visibility
        const tabContents = document.querySelectorAll('[data-tab-content]');
        tabContents.forEach(content => {
            const contentTabName = content.getAttribute('data-tab-content');
            if (contentTabName === tabName) {
                content.classList.remove('hidden');
                // Add fade-in animation
                content.style.opacity = '0';
                setTimeout(() => {
                    content.style.transition = 'opacity 0.3s ease-in';
                    content.style.opacity = '1';
                }, 10);
            } else {
                content.classList.add('hidden');
            }
        });
    }

    setLoadingState(tabName, isLoading) {
        this.loadingStates[tabName] = isLoading;
        const tabContent = document.querySelector(`[data-tab-content="${tabName}"]`);
        if (!tabContent) return;

        const loadingIndicator = tabContent.querySelector('.loading-indicator');
        const actualContent = tabContent.querySelector('.tab-actual-content');

        if (isLoading) {
            if (loadingIndicator) loadingIndicator.classList.remove('hidden');
            if (actualContent) actualContent.classList.add('hidden');
        } else {
            if (loadingIndicator) loadingIndicator.classList.add('hidden');
            if (actualContent) actualContent.classList.remove('hidden');
        }
    }

    showEmptyState(tabName, message = 'No data available') {
        const tabContent = document.querySelector(`[data-tab-content="${tabName}"]`);
        if (!tabContent) return;

        const actualContent = tabContent.querySelector('.tab-actual-content');
        if (actualContent) {
            actualContent.innerHTML = `
                <div class="flex flex-col items-center justify-center py-20 text-zinc-400">
                    <svg class="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
                    </svg>
                    <p class="text-lg">${message}</p>
                </div>
            `;
        }
    }

    reset() {
        // Reset all tabs to initial state
        Object.keys(this.loadingStates).forEach(tab => {
            this.setLoadingState(tab, false);
            const tabContent = document.querySelector(`[data-tab-content="${tab}"]`);
            if (tabContent) {
                const actualContent = tabContent.querySelector('.tab-actual-content');
                if (actualContent) actualContent.innerHTML = '';
            }
        });
    }
}

// Global instance
window.tabController = new TabController();
