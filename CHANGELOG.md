# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.3.10] - 19-12-2025

### Fixed
- Companies with content chunks but missing from `risk_scoring` are now included in rankings, heatmap, and company screener
- Companies with null tickers are now properly included in `df_company` during JSON generation
- Fixed issue where companies in watchlist with evidence chunks were excluded from visualizations when they had null tickers or weren't aggregated in the initial scoring

## [2.3.9] - 12-11-2025

### Added
- Audit column in Evidence table to accept/reject individual evidence items
- Bulk toggle functionality for filtered evidence via column header click
- Evidence status affects all visualizations: Overview, Risk Heatmap, Risk Evolution, and Company Screener tabs
- Real-time score recalculation based on accepted evidence only
- Sector aggregation in heatmao

## [2.3.8] - 4-11-2025

### Added
- Risk Evolution tab with time series visualization of raw scores over time
- Date range filtering with presets (Last 7/30/90 days, YTD, All Time) and manual date pickers
- Export functionality: CSV export for time series data and PNG export for charts
- Clickable data points on time series charts to view filtered evidence in a modal
- Evidence modal showing evidence filtered by company, risk factor, and date
- Responsive chart that adapts to screen size with window resize handler

## [2.3.7] - 31-10-2025

## Added
- Better explanation for scores
- Logo change to Powered by Bigdata.com 

## [2.3.6] - 30-10-2025

## Added
- New use-case for govt shutdown
- Minor naming changes

## [2.3.5] - 27-10-2025

## Added
- Added version query parameter to static scripts to invalidate browser cache when a new version is released.
- Fix long OpenAI responses causing slow workflows via bumping Bigdata Research Tools.

## [2.3.4] - 24-10-2025

### Fix
- Ticker was expected, but not always received. Now it is optional.
- Bigdata research tools was stuck on an old commit, it now points to the latest v1 beta commit.

## [2.3.3] - 24-10-2025

### Added
- Enhanced frontend with interactive components, how to guides and improved usability.

## [2.3.2] - 21-10-2025

### Fixed
- Fixed issue where the logo link in the navbar did not preserve the access token in the URL.

## [2.3.1] - 20-10-2025

### Added
- Display version number in the frontend.

### Fixed
- Bigdata and OpenAI API keys are no longer required to start the service when DEMO_MODE is enabled.
- CI pipeline was not detecting formatting issues.

## [2.3.0] - 17-10-2025

### Changed
- Re-designed the frontend layout and styling for better user experience.
- Changed example results, removed them from the DB and added a new DEMO_MODE feature that blocks running new analyses when enabled.

## [2.2.1] - 10-10-2025

### Fixed
- Renamed wrong names for watchlist list.

## [2.2.0] - 07-10-2025

### Added
- Fiscal year now accepts list of years as input (e.g. 2024,2025,2026)
- Example result initialized on db creation. This example can be directly retrieved from the FE.

### Changed
- Default time window changed to [today-1 month, today]
- Bigdata Research Tools updated to v1.0.0 beta
- JS scripts moved to static/scripts folder to clean the jinja template
- Model validator now uses custom ValidationError to properly expose validation errors in the frontend

## [2.1.0] - 01-10-2025

### Added
- Add links to API docs in the nav bar

### Changed
- Make the sidebar and output area resizable by dragging a divider between them
- Moved all logic for default values into the backend, so it is consistent between the API and the front end.
- Now Risk Analyzer uses NEWS instead of transcripts (Fiscal Year not available as an input parameter).

### Fixed
- Fix nav bar overlapping with content

## [2.0.0] - 26-09-2025

### Changed
- Changed endpoints to be asynchronous. `/risk-analyzer` will now return a `request_id` immediately, and progress updated and the result can be fetched later using `/status/{request_id}`.
- Updated document type enum to be consistent with the Bigdata.com SDK
- Updated front end to deal with the async endpoint.
- Improved UX of the front end

## [1.1.0] - 11-09-2025

### Added
- Added optional access token protection for the API endpoints. If the `ACCESS_TOKEN` environment variable is set, all API requests must include a `token` query parameter with the correct value to be authorized.


## [1.0.0] - 29-08-2025

### Added
- Initial release of the Risk Analyzer service by bigdata.com as a Python package and Docker image.