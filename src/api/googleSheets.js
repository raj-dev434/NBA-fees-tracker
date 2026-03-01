// src/api/googleSheets.js
// Helper functions to interact with Google Sheets via a Google Apps Script Web App endpoint.

const SHEET_ENDPOINT = import.meta.env.VITE_GOOGLE_SHEET_URL;

/**
 * Append a fee entry to the Google Sheet.
 * @param {Object} entry - The fee entry data.
 * @returns {Promise<Object>} Result of the request.
 */
export async function appendFeeEntry(entry) {
    try {
        const response = await fetch(SHEET_ENDPOINT, {
            method: "POST",
            mode: "no-cors", // By-pass CORS preflight constraints
            headers: {
                "Content-Type": "text/plain;charset=utf-8",
            },
            body: JSON.stringify({ action: "append", data: entry }),
        });

        // When mode is "no-cors", the response is "opaque" meaning we can't read its JSON body.
        // We just assume the request was successfully sent.
        return { success: true };
    } catch (error) {
        console.error("Error appending fee entry:", error);
        throw error;
    }
}

/**
 * Fetch all fee entries from the Google Sheet.
 * @returns {Promise<Array<Object>>} Array of fee entry objects.
 */
export async function fetchFeeData() {
    try {
        const url = `${SHEET_ENDPOINT}?action=fetch`;
        const response = await fetch(url);

        if (!response.ok) {
            // Check if we hit a redirect/login page which indicates a permissions issue
            throw new Error(`Network response was not ok: ${response.status}`);
        }

        const data = await response.json();

        // Normalize the keys (trim whitespace and lowercase) 
        // to handle typos in Google Sheet column headers (e.g. "court " instead of "court")
        const normalizedData = data.map(item => {
            const cleanItem = {};
            for (let key in item) {
                if (item.hasOwnProperty(key)) {
                    cleanItem[key.trim().toLowerCase()] = item[key];
                }
            }
            return cleanItem;
        });

        return normalizedData;
    } catch (error) {
        console.error("Error fetching fee data:", error);
        throw error;
    }
}
