function getDefaultDueDate() {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    tomorrow.setMinutes(tomorrow.getMinutes() - tomorrow.getTimezoneOffset());
    return tomorrow.toISOString().slice(0, 16);
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleString("uk-UA", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        headers: { "Content-Type": "application/json", ...(options.headers || {}) },
        ...options
    });

    if (response.status === 204) return null;

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;

    if (!response.ok) {
        let message = data?.detail || data?.title || data?.message || `Помилка HTTP ${response.status}`;
        if (data?.errors) {
            const validationErrors = Object.values(data.errors).flat().join(" ");
            if (validationErrors) message = validationErrors;
        }
        throw new Error(message);
    }

    return data;
}