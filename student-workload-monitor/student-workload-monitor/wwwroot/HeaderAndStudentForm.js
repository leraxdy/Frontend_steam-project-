function HeaderAndStudentForm({
    students,
    selectedStudentId,
    isLoading,
    isSubmitting,
    showStudentPanel,
    setShowStudentPanel,
    newStudent,
    setNewStudent,
    onStudentChange,
    onCreateStudent,
    onDeleteStudent
}) {
    return (
        <>
            <header className="topbar">
                <div className="container topbar-inner">
                    <div>
                        <h1>Student Monitor</h1>
                        <p className="subtitle">Контроль навчального навантаження, дедлайнів та прогнозування ризиків</p>
                    </div>
                    <div className="student-selector">
                        <label htmlFor="studentSelect">Активний студент:</label>
                        <select
                            id="studentSelect"
                            value={selectedStudentId || ""}
                            onChange={onStudentChange}
                            disabled={isLoading}
                        >
                            {students.length === 0 ? (
                                <option value="">Немає студентів — створіть першого</option>
                            ) : (
                                students.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.fullName} ({s.academicGroup})
                                    </option>
                                ))
                            )}
                        </select>
                        <button
                            className="btn btn-secondary"
                            type="button"
                            onClick={() => setShowStudentPanel(prev => !prev)}
                        >
                            {showStudentPanel ? "Закрити" : "+ Студент"}
                        </button>
                        <button
                            className="btn btn-danger-outline"
                            type="button"
                            onClick={onDeleteStudent}
                            disabled={!selectedStudentId || isSubmitting}
                            title="Видалити студента"
                        >
                            Видалити
                        </button>
                    </div>
                </div>
            </header>

            {showStudentPanel && (
                <div className="container">
                    <section className="card">
                        <div className="card-header">
                            <h2>Новий студент</h2>
                            <button
                                className="btn-icon"
                                type="button"
                                onClick={() => setShowStudentPanel(false)}
                                aria-label="Закрити форму"
                            >
                                &times;
                            </button>
                        </div>
                        <form onSubmit={onCreateStudent} className="form-grid-3">
                            <div className="form-group">
                                <label htmlFor="studentFullName">ПІБ</label>
                                <input
                                    type="text"
                                    id="studentFullName"
                                    placeholder="Іваненко Іван Іванович"
                                    maxLength={100}
                                    value={newStudent.fullName}
                                    onChange={e => setNewStudent({ ...newStudent, fullName: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="studentEmail">Email</label>
                                <input
                                    type="email"
                                    id="studentEmail"
                                    placeholder="ivanenko@knu.ua"
                                    maxLength={100}
                                    value={newStudent.email}
                                    onChange={e => setNewStudent({ ...newStudent, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="studentGroup">Академічна група</label>
                                <input
                                    type="text"
                                    id="studentGroup"
                                    placeholder="ІПЗ-31"
                                    maxLength={20}
                                    value={newStudent.academicGroup}
                                    onChange={e => setNewStudent({ ...newStudent, academicGroup: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-actions full-width">
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? "Збереження..." : "Створити студента"}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}
        </>
    );
}