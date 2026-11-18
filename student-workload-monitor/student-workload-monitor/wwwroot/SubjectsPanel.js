function SubjectsPanel({
    subjects,
    selectedStudentId,
    isLoading,
    isSubmitting,
    newSubject,
    setNewSubject,
    onCreateSubject,
    onDeleteSubject
}) {
    return (
        <section className="card">
            <div className="card-header">
                <h2>Предмети</h2>
            </div>

            <form onSubmit={onCreateSubject} className="stacked-form">
                <div className="form-group">
                    <input
                        type="text"
                        placeholder="Назва предмета (напр. Інженерія ПЗ)"
                        maxLength={120}
                        value={newSubject.name}
                        onChange={e => setNewSubject({ ...newSubject, name: e.target.value })}
                        required
                    />
                </div>
                <div className="form-row-2">
                    <input
                        type="text"
                        placeholder="Викладач"
                        maxLength={100}
                        value={newSubject.teacherName}
                        onChange={e => setNewSubject({ ...newSubject, teacherName: e.target.value })}
                        required
                    />
                    <input
                        type="number"
                        placeholder="Кредити ECTS"
                        min="1"
                        max="30"
                        step="1"
                        value={newSubject.totalCredits}
                        onChange={e => setNewSubject({ ...newSubject, totalCredits: e.target.value })}
                        required
                    />
                </div>
                <button
                    type="submit"
                    className="btn btn-primary full-width"
                    disabled={!selectedStudentId || isSubmitting}
                >
                    {isSubmitting ? "Додавання..." : "Додати предмет"}
                </button>
            </form>

            {isLoading ? (
                <div className="empty-state">Завантаження предметів...</div>
            ) : (
                <ul className="item-list">
                    {subjects.length === 0 ? (
                        <li className="empty-state">У студента поки немає предметів</li>
                    ) : (
                        subjects.map(subj => (
                            <li key={subj.id} className="subject-item">
                                <div>
                                    <div className="subject-title">{subj.name}</div>
                                    <div className="subject-meta">
                                        Викладач: {subj.teacherName} • {subj.totalCredits} ECTS
                                    </div>
                                </div>
                                <button
                                    className="btn btn-danger-outline btn-sm"
                                    onClick={() => onDeleteSubject(subj.id)}
                                    disabled={isSubmitting}
                                >
                                    Видалити
                                </button>
                            </li>
                        ))
                    )}
                </ul>
            )}
        </section>
    );
}