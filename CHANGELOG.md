# Changelog

## [v2.3.2] - 2025-01-22

### 🎯 Major Features Added

#### **Report Generator Tab**
- Added new "Report Generator" tab with "Coming soon..." placeholder
- Positioned between Evidence and How it Works tabs
- Features chart/analytics icon to differentiate from Evidence tab
- Includes professional placeholder content with document icon and description

#### **Company Screener Enhancements**
- **Renamed**: "Companies" tab → "Company Screener"
- **Enhanced Filter System**: 
  - Multi-select dropdowns for Sector, Industry, and Risk filters
  - Color-coded filter chips with count badges
  - Search functionality for company names
  - "Show Results" limit (Top N companies)
- **Improved Table Structure**:
  - Split Risk Count into 3 columns: Risk Count, Risk Breakdown, Insights
  - Added expandable sections for detailed risk and insights information
  - Sortable by Composite, Coverage, and Intensity scores
- **Export Functionality**: CSV/JSON download for portfolio construction
- **Updated Guide**: "How to Use" → "How to Screen" with current functionality

### 🔧 UI/UX Improvements

#### **Layout Restructuring**
- **Overview Tab**: Moved 3 dashboard cards into dedicated Overview tab
- **Tab Navigation**: Made all tabs permanent at the top (removed collapsible sections)
- **Tab Order**: Overview → Risk Heatmap → Company Screener → Taxonomy → Evidence → Report Generator → How it Works

#### **Dashboard Enhancements**
- **"At a Glance" Card**:
  - Changed "Companies Analyzed" → "Companies Exposed"
  - Added "Highest Company Score" metric
  - Added "Report Information" section (Source, Period, Generated date)
  - Replaced 3-level risk classification with PDF area chart of composite scores
  - Added median statistics to score distribution
- **Card Headers**: Added column headers to "Top 10 Exposed Companies" and "Top 10 Risk Factors"
- **Interactive Elements**: Clickable companies/risks redirect to Evidence tab with filters

#### **Heatmap Improvements**
- **New Score Metrics**: Added Coverage Score and Intensity Score columns
- **Interactive Features**: Clickable cells redirect to Evidence tab with company+risk filters
- **Sortable Table**: Sort by Coverage, Intensity, or Raw Score
- **Flip View**: Toggle between Company view and Risk view
- **Guide Modal**: "How to Read This Heatmap" with score explanations
- **Scrollbar**: Synchronized top scrollbar for better navigation

### 🎨 Visual & Styling Updates

#### **Header & Navigation**
- **Deploy Button**: Added orange "Deploy" button (demo mode only) in main header
- **Tab Colors**: Changed active tab selection to blue
- **Configuration Header**: Made more neutral (grey) with consistent styling
- **Spacing**: Eliminated persistent black space between headers

#### **Company Screener UX**
- **Filter UI**: Redesigned with sidebar layout and chip-based filter system
- **Button Text**: "Filter Companies" → "Screen Companies"
- **Section Reordering**: Moved "Show Results" to top of sidebar
- **Typography**: Increased font sizes for better readability
- **Button Optimization**: Removed "View" from expandable section buttons

### 📚 Documentation & Guides

#### **"How it Works" Tab**
- **New Tab**: Added comprehensive methodology explanation
- **Content Sections**:
  - Methodology Overview
  - Analysis Process (4-step workflow)
  - Key Features
  - Score Explanations (Composite, Coverage, Intensity)
  - Real-World Applications
  - Technical Implementation
- **External Links**: Added links to Bigdata documentation
- **Regulatory Focus**: Emphasized regulatory compliance and evidence-based analysis

#### **Updated Guides**
- **Dashboard Guide**: "How to Read This Dashboard" with auto-trigger for first-time users
- **Screener Guide**: Updated "How to Screen" with current functionality
- **Heatmap Guide**: "How to Read This Heatmap" with score explanations

### 🔧 Technical Improvements

#### **JavaScript Enhancements**
- **Global Function Exports**: Added proper exports for all render functions
- **Tab Controller**: Updated to support new tabs and loading states
- **Filter System**: Implemented robust chip-based filtering with deselection
- **Cache Busting**: Added version parameters to prevent stale script loading

#### **Demo Mode Features**
- **Deploy Button**: Redirects to `https://deploy.labs.bigdata.com`
- **Updated Message**: Enhanced demo mode message with GitHub and deployment links
- **Version Display**: Moved version number to bottom-right corner (discreet)

### 🐛 Bug Fixes

#### **Filter System**
- Fixed filter deselection issues with proper string escaping
- Resolved checkbox selection problems for multi-select filters
- Added robust error handling for undefined filter states

#### **Tab Rendering**
- Fixed empty tab issues by ensuring proper script inclusions
- Resolved JavaScript syntax errors and duplicate declarations
- Added proper function availability checks

#### **Heatmap Functionality**
- Fixed tooltip positioning and event propagation
- Resolved sorting issues in Risk view
- Fixed scrollbar synchronization between top and bottom

### 📊 Data & Analytics

#### **Score Metrics**
- **Composite Score**: Overall risk exposure based on all risk factors
- **Coverage Score**: Percentage of risk types the company is exposed to
- **Intensity Score**: Average evidence strength across all risk factors
- **Median Statistics**: Added median to score distribution displays

#### **Export Capabilities**
- **Company Screener**: CSV/JSON export with filtered results
- **Portfolio Construction**: Export functionality for investment workflows

### 🎯 User Experience

#### **Workflow Improvements**
- **Sector Risk Analysis**: Technology sector → AI Risk filter → Coverage Score sorting
- **Portfolio Construction**: Top N limit → sector/industry filters → Composite Score sorting
- **Risk Factor Deep Dive**: Specific risk factors → Intensity Score sorting → detailed analysis

#### **Accessibility**
- **Tooltips**: Added comprehensive tooltips for all score metrics
- **Guides**: Auto-triggering help modals for first-time users
- **Clear Messaging**: Updated descriptions and terminology throughout

---

## Previous Versions

### [v2.3.1] - Previous Release
- Initial Risk Analyzer implementation
- Basic dashboard functionality
- Core risk analysis features

---

**Total Changes**: 15+ major features, 25+ UI/UX improvements, 10+ bug fixes
**Files Modified**: 8+ template files, 6+ JavaScript files, 15+ test files
**New Functionality**: Report Generator placeholder, enhanced Company Screener, improved Heatmap