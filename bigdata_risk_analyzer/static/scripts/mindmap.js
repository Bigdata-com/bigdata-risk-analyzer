// Mindmap Visualization - Tree View and Interactive Tree Graph
let currentMindmapView = 'tree'; // 'tree' or 'graph'
let mindmapData = null;

function renderMindmap(taxonomy) {
    const container = document.querySelector('[data-tab-content="mindmap"] .tab-actual-content');
    if (!container || !taxonomy) return;

    mindmapData = taxonomy;

    let html = `
        <div class="mb-6">
            <div class="flex justify-between items-center mb-4">
                <div>
                    <h3 class="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
                        </svg>
                        Theme Taxonomy
                    </h3>
                    <p class="text-zinc-400 text-sm">Hierarchical breakdown of the investment theme</p>
                </div>
                <div class="flex gap-2 bg-zinc-800 p-1 rounded-lg border border-zinc-700">
                    <button onclick="switchMindmapView('tree')" id="viewTree"
                        class="px-4 py-2 rounded text-sm font-medium transition-all duration-200 ${currentMindmapView === 'tree' ? 'bg-blue-500 text-white' : 'text-zinc-400 hover:text-zinc-200'}">
                        <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                        </svg>
                        Tree View
                    </button>
                    <button onclick="switchMindmapView('graph')" id="viewGraph"
                        class="px-4 py-2 rounded text-sm font-medium transition-all duration-200 ${currentMindmapView === 'graph' ? 'bg-blue-500 text-white' : 'text-zinc-400 hover:text-zinc-200'}">
                        <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
                        </svg>
                        Interactive Graph
                    </button>
                </div>
            </div>
        </div>
        <div id="mindmapTreeView" class="mindmap-view ${currentMindmapView === 'tree' ? '' : 'hidden'}"></div>
        <div id="mindmapGraphView" class="mindmap-view ${currentMindmapView === 'graph' ? '' : 'hidden'}"></div>
    `;

    container.innerHTML = html;

    // Render the initial view
    if (currentMindmapView === 'tree') {
        renderTreeView(taxonomy);
    } else {
        renderGraphView(taxonomy);
    }
}

function switchMindmapView(view) {
    currentMindmapView = view;
    
    // Update button styles
    const treeBtn = document.getElementById('viewTree');
    const graphBtn = document.getElementById('viewGraph');
    
    if (view === 'tree') {
        treeBtn.classList.add('bg-blue-500', 'text-white');
        treeBtn.classList.remove('text-zinc-400', 'hover:text-zinc-200');
        graphBtn.classList.remove('bg-blue-500', 'text-white');
        graphBtn.classList.add('text-zinc-400', 'hover:text-zinc-200');
    } else {
        graphBtn.classList.add('bg-blue-500', 'text-white');
        graphBtn.classList.remove('text-zinc-400', 'hover:text-zinc-200');
        treeBtn.classList.remove('bg-blue-500', 'text-white');
        treeBtn.classList.add('text-zinc-400', 'hover:text-zinc-200');
    }
    
    // Show/hide views
    const treeView = document.getElementById('mindmapTreeView');
    const graphView = document.getElementById('mindmapGraphView');
    
    if (view === 'tree') {
        treeView.classList.remove('hidden');
        graphView.classList.add('hidden');
        if (treeView.innerHTML === '') {
            renderTreeView(mindmapData);
        }
    } else {
        graphView.classList.remove('hidden');
        treeView.classList.add('hidden');
        if (graphView.innerHTML === '') {
            renderGraphView(mindmapData);
        }
    }
}

function renderTreeView(node, depth = 0) {
    const container = document.getElementById('mindmapTreeView');
    if (!container) return;

    function buildTreeHTML(node, depth = 0) {
        if (!node) return '';
        
        const hasChildren = node.children && node.children.length > 0;
        const indent = depth * 2;
        const depthColors = ['text-blue-400', 'text-emerald-400', 'text-purple-400', 'text-amber-400', 'text-pink-400'];
        const colorClass = depthColors[depth % depthColors.length];
        
        let html = `
            <div class="tree-node mb-2" style="margin-left: ${indent}rem">
                <div class="flex items-start gap-2 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700 hover:border-${colorClass.split('-')[1]}-500/50 transition-all group">
                    ${hasChildren ? `
                        <button onclick="toggleTreeNode(this)" class="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded bg-zinc-700 hover:bg-zinc-600 transition-colors">
                            <svg class="w-4 h-4 text-zinc-300 transform transition-transform expand-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </button>
                    ` : '<div class="w-6 h-6 flex-shrink-0"></div>'}
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="font-bold ${colorClass} text-lg">${escapeHtml(node.label)}</span>
                            <span class="text-xs text-zinc-500 font-mono">Node ${node.node}</span>
                        </div>
                        ${node.summary ? `<p class="text-zinc-300 text-sm mt-1">${escapeHtml(node.summary)}</p>` : ''}
                        ${node.keywords && node.keywords.length > 0 ? `
                            <div class="flex flex-wrap gap-1 mt-2">
                                ${node.keywords.map(kw => `<span class="text-xs bg-zinc-700 text-zinc-300 px-2 py-1 rounded">${escapeHtml(kw)}</span>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
                ${hasChildren ? `<div class="tree-children mt-2">${node.children.map(child => buildTreeHTML(child, depth + 1)).join('')}</div>` : ''}
            </div>
        `;
        
        return html;
    }

    container.innerHTML = `
        <div class="bg-zinc-800/30 rounded-lg border border-zinc-700 p-6 max-h-[600px] overflow-y-auto">
            ${buildTreeHTML(node)}
        </div>
    `;
}

function toggleTreeNode(button) {
    const childrenDiv = button.closest('.tree-node').querySelector('.tree-children');
    const icon = button.querySelector('.expand-icon');
    
    if (childrenDiv) {
        if (childrenDiv.classList.contains('hidden')) {
            childrenDiv.classList.remove('hidden');
            icon.style.transform = 'rotate(180deg)';
        } else {
            childrenDiv.classList.add('hidden');
            icon.style.transform = 'rotate(0deg)';
        }
    }
}

function renderGraphView(taxonomy) {
    const container = document.getElementById('mindmapGraphView');
    if (!container || !taxonomy) return;

    // Clear and set up SVG container
    container.innerHTML = `
        <div class="bg-zinc-800/30 rounded-lg border border-zinc-700 p-4">
            <div class="mb-3 text-sm text-zinc-400 flex items-center gap-4">
                <span>💡 Scroll to zoom • Hover for details • Tree grows left to right</span>
            </div>
            <div id="graphSvgContainer" class="bg-zinc-900 rounded overflow-hidden" style="height: 600px;"></div>
        </div>
    `;

    const width = container.offsetWidth - 40;
    const height = 600;

    // Convert taxonomy to D3 hierarchy
    function taxonomyToHierarchy(node) {
        return {
            name: node.label,
            node: node.node,
            summary: node.summary,
            keywords: node.keywords,
            children: node.children ? node.children.map(taxonomyToHierarchy) : []
        };
    }

    const hierarchyData = taxonomyToHierarchy(taxonomy);
    const root = d3.hierarchy(hierarchyData);

    // Create tree layout (left to right orientation) - compact with shorter branches
    const treeLayout = d3.tree()
        .size([height - 100, width - 400])
        .separation((a, b) => (a.parent === b.parent ? 0.8 : 1));

    // Calculate tree positions
    treeLayout(root);

    // Create SVG
    const svg = d3.select('#graphSvgContainer')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', [0, 0, width, height]);

    // Add zoom behavior
    const g = svg.append('g')
        .attr('transform', 'translate(50, 50)');
    
    svg.call(d3.zoom()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
        }));

    // Draw links (connections between nodes)
    const link = g.append('g')
        .attr('fill', 'none')
        .attr('stroke', '#4b5563')
        .attr('stroke-width', 2)
        .selectAll('path')
        .data(root.links())
        .join('path')
        .attr('d', d3.linkHorizontal()
            .x(d => d.y)
            .y(d => d.x));

    // Draw nodes
    const node = g.append('g')
        .selectAll('g')
        .data(root.descendants())
        .join('g')
        .attr('transform', d => `translate(${d.y},${d.x})`);

    // Node circles - bigger sizes
    const depthColors = ['#60a5fa', '#34d399', '#a78bfa', '#fbbf24', '#f472b6'];
    node.append('circle')
        .attr('r', d => d.depth === 0 ? 12 : 8)
        .attr('fill', d => depthColors[d.depth % depthColors.length])
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .style('cursor', 'pointer');

    // Node labels (to the right of circles) - bigger fonts
    node.append('text')
        .attr('x', d => d.depth === 0 ? 16 : 12)
        .attr('y', 0)
        .attr('dy', '0.32em')
        .text(d => d.data.name)
        .attr('font-size', d => d.depth === 0 ? '18px' : '15px')
        .attr('font-weight', d => d.depth === 0 ? 'bold' : 'normal')
        .attr('fill', '#fff')
        .style('pointer-events', 'none');

    // Tooltip
    const tooltip = d3.select('body').append('div')
        .attr('class', 'mindmap-tooltip')
        .style('position', 'absolute')
        .style('visibility', 'hidden')
        .style('background-color', 'rgba(0, 0, 0, 0.9)')
        .style('color', '#fff')
        .style('padding', '12px')
        .style('border-radius', '8px')
        .style('border', '1px solid #3b82f6')
        .style('font-size', '13px')
        .style('max-width', '300px')
        .style('z-index', '1000')
        .style('pointer-events', 'none');

    node.on('mouseover', function(event, d) {
        let content = `<strong>${d.data.name}</strong> (Node ${d.data.node})`;
        if (d.data.summary) content += `<br><br>${d.data.summary}`;
        if (d.data.keywords && d.data.keywords.length > 0) {
            content += `<br><br><em>Keywords:</em> ${d.data.keywords.join(', ')}`;
        }
        tooltip.html(content)
            .style('visibility', 'visible');
        
        d3.select(this).select('circle')
            .transition()
            .duration(200)
            .attr('r', d => d.depth === 0 ? 15 : 10);
    })
    .on('mousemove', function(event) {
        tooltip.style('top', (event.pageY + 10) + 'px')
            .style('left', (event.pageX + 10) + 'px');
    })
    .on('mouseout', function(event, d) {
        tooltip.style('visibility', 'hidden');
        d3.select(this).select('circle')
            .transition()
            .duration(200)
            .attr('r', d => d.depth === 0 ? 12 : 8);
    });
}

// Make functions globally accessible
window.switchMindmapView = switchMindmapView;
window.toggleTreeNode = toggleTreeNode;
