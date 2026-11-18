function AssignmentsPanel({
    subjects,
    filteredAssignments,
    filters,
    setFilters,
    newAssignment,
    setNewAssignment,
    isLoading,
    isSubmitting,
    getSubjectName,
    onCreateAssignment,
    onCompleteAssignment,
    onDeleteAssignment
}) {
    return (
        <section className="card">
            <div className="card-header">
                <h2>Завдання та дедлайни</h2>
                <div className="filter-group">
                    <select
                        aria-label="Фільтр за предметом"
                        value={filters.subjectId}
                        onChange={e => setFilters({ ...filters, subjectId: e.target.value })}
                    >
                        <option value="all">Усі предмети</option>
                        {subjects.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                    <select
                        aria-label="Фільтр за статусом"
                        value={filters.status}
                        onChange={e => setFilters({ ...filters, status: e.target.value })}
                    >
                        <option value="all">Усі статуси</option>
                        <option value="false">Активні</option>
                        <option value="true">Виконані</option>
                    </select>
                </div>
            </div>

            <form onSubmit={onCreateAssignment} className="assignment-form">
                <div className="form-row-2">
                    <div className="form-group">
                        <label htmlFor="assignmentSubject">Предмет</label>
                        <select
                            id="assignmentSubject"
                            value={newAssignment.subjectId}
                            onChange={e => setNewAssignment({ ...newAssignment, subjectId: e.target.value })}
                            required
                        >
                            <option value="" disabled>
                                {subjects.length ? "Оберіть предмет" : "Спочатку додайте предмет"}
                            </option>
                            {subjects.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="assignmentTitle">Назва завдання</label>
                        <input
                            type="text"
                            id="assignmentTitle"
                            placeholder="Лабораторна робота №3"
                            maxLength={150}
                            value={newAssignment.title}
                            onChange={e => setNewAssignment({ ...newAssignment, title: e.target.value })}
                            required
                        />
                    </div>
                </div>
                <div className="form-row-3">
                    <div className="form-group">
                        <label htmlFor="assignmentDueDate">Дедлайн</label>
                        <input
                            type="datetime-local"
                            id="assignmentDueDate"
                            value={newAssignment.dueDate}
                            onChange={e => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="assignmentHours">Оцінка (годин)</label>
                        <input
                            type="number"
                            id="assignmentHours"
                            min="0.5"
                            max="200"
                            step="0.5"
                            value={newAssignment.estimatedHours}
                            onChange={e => setNewAssignment({ ...newAssignment, estimatedHours: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="assignmentDescription">Опис</label>
                        <input
                            type="text"
                            id="assignmentDescription"
                            placeholder="Короткі вимоги"
                            maxLength={300}
                            value={newAssignment.description}
                            onChange={e => setNewAssignment({ ...newAssignment, description: e.target.value })}
                            required
                        />
                    </div>
                </div>
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={!subjects.length || isSubmitting}
                >
                    {isSubmitting ? "Збереження..." : "Додати завдання"}
                </button>
            </form>

            {isLoading ? (
                <div className="empty-state">Завантаження завдань...</div>
            ) : (
                <div className="assignments-list">
                    {filteredAssignments.length === 0 ? (
                        <div className="empty-state">Завдань за обраними фільтрами не знайдено</div>
                    ) : (
                        filteredAssignments.map(a => (
                            <div key={a.id} className={`assignment-card ${a.isCompleted ? "completed" : ""}`}>
                                <div>
                                    <div className="assignment-title">{a.title}</div>
                                    <div className="assignment-desc">{a.description}</div>
                                    <div className="assignment-badges">
                                        <span className="badge">{getSubjectName(a.subjectId)}</span>
                                        <span className="badge badge-hours">{a.estimatedHours} год.</span>
                                        <span className="badge">Дедлайн: {formatDate(a.dueDate)}</span>
                                    </div>
                                </div>
                                <div className="assignment-actions">
                                    {!a.isCompleted && (
                                        <button
                                            className="btn btn-success btn-sm"
                                            onClick={() => onCompleteAssignment(a.id)}
                                            disabled={isSubmitting}
                                        >
                                            Виконано
                                        </button>
                                    )}
                                    <button
                                        className="btn btn-danger-outline btn-sm"
                                        onClick={() => onDeleteAssignment(a.id)}
                                        disabled={isSubmitting}
                                    >
                                        Видалити
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </section>
    );
}