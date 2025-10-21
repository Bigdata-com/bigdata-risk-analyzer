# Manual Testing Checklist for Layout Restructure

This document provides a comprehensive manual testing checklist to verify that the Risk Analyzer layout restructure has been implemented correctly.

## Pre-Testing Setup

1. **Start the Risk Analyzer application**
   ```bash
   cd bigdata-risk-analyzer
   python -m bigdata_risk_analyzer
   ```

2. **Open browser and navigate to the application**
   - URL: `http://localhost:8000` (or configured port)

## Test Scenarios

### 1. Initial Load Test

- [ ] **Load app in browser**
  - Application loads without errors
  - Empty state is displayed initially
  - No JavaScript console errors

- [ ] **Verify initial empty state**
  - "Ready to monitor risk exposure?" message is visible
  - Three quick start cards are displayed
  - Configuration button is available

### 2. Analysis Execution Test

- [ ] **Run analysis or load demo**
  - Click on one of the quick start templates (e.g., "Import Tariffs against China")
  - OR click "Configuration" and run a custom analysis
  - Analysis completes successfully

- [ ] **Verify Overview tab shows first by default**
  - After analysis completes, Overview tab should be active
  - Overview tab button should be highlighted (red border)
  - Other tabs should be in inactive state

### 3. Overview Tab Content Test

- [ ] **Verify 3 dashboard cards appear in Overview tab**
  - "At a Glance" card with summary statistics
  - "Top 10 Exposed Companies" card with company rankings
  - "Top 10 Risk Factors" card with theme rankings
  - All cards should be properly styled and functional

- [ ] **Test dashboard card interactions**
  - Click on company theme buttons to expand/collapse themes
  - Click on company insight buttons to expand/collapse insights
  - Click on theme items to filter evidence (should switch to Evidence tab)

### 4. Tab Navigation Test

- [ ] **Verify no collapsible "Explore Detailed Results" button exists**
  - No expandable section button should be visible
  - All tabs should be permanently visible at the top

- [ ] **Click each tab and verify functionality**
  - **Overview Tab**: Dashboard cards are displayed
  - **Risk Heatmap Tab**: Heatmap visualization is shown
  - **Companies Tab**: Company cards are displayed
  - **Taxonomy Tab**: Risk taxonomy mindmap is shown
  - **Evidence Tab**: Evidence table is displayed

- [ ] **Verify tab navigation stays visible at all times**
  - Tab navigation should remain sticky at the top
  - No scrolling should hide the tab navigation
  - Tab switching should be smooth and responsive

### 5. JavaScript Functionality Test

- [ ] **Verify no JavaScript console errors**
  - Open browser developer tools (F12)
  - Check Console tab for any errors
  - All JavaScript should execute without errors

- [ ] **Test tab switching functionality**
  - Click between tabs rapidly
  - Verify content loads correctly for each tab
  - Verify loading indicators work properly

### 6. Reset Functionality Test

- [ ] **Test "Start New Analysis" button resets properly**
  - Click the "Start New Analysis" button (refresh icon)
  - Application should return to empty state
  - All tabs should be reset
  - Overview tab should be ready for new analysis

- [ ] **Verify Overview tab resets when starting new analysis**
  - After reset, Overview tab should be empty
  - Dashboard cards should be cleared
  - Ready for new analysis data

### 7. Responsive Design Test

- [ ] **Test on different screen sizes**
  - Desktop (1920x1080)
  - Tablet (768x1024)
  - Mobile (375x667)
  - Verify tabs remain accessible and functional

### 8. Performance Test

- [ ] **Test with large datasets**
  - Run analysis with maximum companies
  - Verify all tabs load within reasonable time
  - Check for memory leaks or performance issues

## Expected Results

### ✅ Success Criteria

- Overview tab is the first tab and shows by default
- 3 dashboard cards are displayed in Overview tab
- All 5 tabs are permanently visible (Overview, Risk Heatmap, Companies, Taxonomy, Evidence)
- No collapsible sections exist
- Tab navigation is always visible
- All JavaScript functions work without errors
- Reset functionality works properly

### ❌ Failure Indicators

- Overview tab is not the default active tab
- Dashboard cards are not in Overview tab
- Collapsible "Explore Detailed Results" section still exists
- Tabs are hidden or not accessible
- JavaScript errors in console
- Reset functionality doesn't work

## Troubleshooting

### Common Issues

1. **Overview tab not showing by default**
   - Check that `tab_controller.js` has `activeTab = 'overview'`
   - Verify `report_renderer.js` calls `switchTab('overview')`

2. **Dashboard cards not in Overview tab**
   - Check that `dashboard_cards.js` returns HTML string
   - Verify `report_renderer.js` injects HTML into Overview tab content

3. **Collapsible section still exists**
   - Check that `toggleExploreSection` function is removed
   - Verify template doesn't contain "Explore Detailed Results" button

4. **JavaScript errors**
   - Check browser console for specific error messages
   - Verify all script files are loaded correctly
   - Check for missing function references

## Test Completion

- [ ] All test scenarios pass
- [ ] No JavaScript console errors
- [ ] All functionality works as expected
- [ ] Layout matches the new design requirements
- [ ] Performance is acceptable

**Test Date**: ___________  
**Tester**: ___________  
**Status**: Pass / Fail  
**Notes**: ___________
