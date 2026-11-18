function ForecastSection({ forecast, isLoading }) {
    const riskLevelClass = `risk-badge risk-${(forecast.riskLevel || "none").toLowerCase()}`;

    return (
        <section className="forecast-section">
            <div className="forecast-grid">
                <div className="stat-card">
                    <span className="stat-label">Рівень ризику (7 днів)</span>
                    <div className={riskLevelClass}>
                        {isLoading ? "..." : (forecast.riskLevel || "—")}
                    </div>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Очікувані трудовитрати</span>
                    <div className="stat-value">
                        <span>{Number(forecast.totalPendingHours || 0).toFixed(1)}</span> год.
                    </div>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Активних завдань</span>
                    <div className="stat-value">{forecast.activeAssignmentsCount ?? 0}</div>
                </div>
                <div className="stat-card recommendation-card">
                    <span className="stat-label">Рекомендація системи</span>
                    <p className="recommendation-text">
                        {forecast.recommendation || "Оберіть або створіть студента для розрахунку прогнозу."}
                    </p>
                </div>
            </div>
        </section>
    );
}