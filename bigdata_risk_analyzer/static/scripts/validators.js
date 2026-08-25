// Maximum date-range span accepted by the demo form (retrieval cost/time scales with it).
const MAX_DATE_RANGE_DAYS = 730; // 2 years

// Validate date range against a flat maximum span
function validateDateRange(startDate, endDate) {
    if (!startDate || !endDate) {
        return { isValid: true, message: '' }; // Skip validation if any value is missing
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > MAX_DATE_RANGE_DAYS) {
        return {
            isValid: false,
            message: `Date range exceeds the maximum allowed span. <br>Maximum: ${MAX_DATE_RANGE_DAYS} days.<br>Current range: ${diffDays} days.<br>Use the endpoint directly for full control`
        };
    }

    return { isValid: true, message: '' };
}


// Add event listeners for date range validation
function validateAndShowError() {
    const startDateValue = document.getElementById('start_date').value;
    const endDateValue = document.getElementById('end_date').value;

    const validation = validateDateRange(startDateValue, endDateValue);

    // Remove any existing error message
    const existingError = document.getElementById('dateRangeError');
    if (existingError) {
        existingError.remove();
    }

    if (!validation.isValid) {
        // Create and show error message
        const errorDiv = document.createElement('div');
        errorDiv.id = 'dateRangeError';
        errorDiv.className = 'mb-5 p-3 bg-red-800 text-white rounded-lg border border-red-600';
        errorDiv.innerHTML = `<strong>⚠️ Date Range Error:</strong> <br> ${validation.message}`;

        // Insert after the end_date field
        const endDateField = document.getElementById('end_date').closest('.mb-5') || document.getElementById('end_date').parentElement;
        endDateField.parentNode.insertBefore(errorDiv, endDateField.nextSibling);
    }
}

// Add event listeners after the DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('start_date').addEventListener('change', validateAndShowError);
    document.getElementById('end_date').addEventListener('change', validateAndShowError);
});
