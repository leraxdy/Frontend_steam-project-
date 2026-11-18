const { useState, useEffect, useMemo, useRef } = React;

function getDefaultDueDate() {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    tomorrow.setMinutes(tomorrow.getMinutes() - tomorrow.getTimezoneOffset());
    return tomorrow.toISOString().slice(0, 16);
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

function App() {
    // Стани даних
    const [students, setStudents] = useState([]);
    const [selectedStudentId, setSelectedStudentId] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [forecast, setForecast] = useState({});

    // Стани інтерфейсу (UX)
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showStudentPanel, setShowStudentPanel] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
    const toastTimerRef = useRef(null);

    // Стани форм
    const [newStudent, setNewStudent] = useState({ fullName: "", email: "", academicGroup: "" });
    const [newSubject, setNewSubject] = useState({ name: "", teacherName: "", totalCredits: 4 });
    const [newAssignment, setNewAssignment] = useState({
        subjectId: "",
        title: "",
        description: "",
        dueDate: getDefaultDueDate(),
        estimatedHours: 4
    });

    // Стани фільтрів
    const [filters, setFilters] = useState({ subjectId: "all", status: "all" });

    const showToast = (message, type = "success") => {
        setToast({ visible: true, message, type });
        clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => {
            setToast(prev => ({ ...prev, visible: false }));
        }, 4500);
    };

    // Завантаження списку студентів
    const loadStudents = async (preferId = null) => {
        setIsLoading(true);
        try {
            const list = await apiRequest("/api/students");
            setStudents(list);

            if (list.length === 0) {
                setSelectedStudentId(null);
                setShowStudentPanel(true);
                setSubjects([]);
                setAssignments([]);
                setForecast({});
                return;
            }

            const targetId = preferId && list.some(s => s.id === preferId)
                ? preferId
                : list[0].id;

            setSelectedStudentId(targetId);
            await refreshStudentWorkspace(targetId);
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setIsLoading(false);
        }
    };

    // Оновлення даних обраного студента
    const refreshStudentWorkspace = async (studentId = selectedStudentId) => {
        if (!studentId) return;
        setIsLoading(true);
        try {
            const [subjData, forecastData, allAssignments] = await Promise.all([
                apiRequest(`/api/subjects?studentId=${studentId}`),
                apiRequest(`/api/workload/forecast/${studentId}`),
                apiRequest("/api/assignments")
            ]);

            setSubjects(subjData);
            setForecast(forecastData);

            const subjectIds = new Set(subjData.map(s => s.id));
            setAssignments(allAssignments.filter(a => subjectIds.has(a.subjectId)));

            setNewAssignment(prev => {
                if (subjData.length > 0 && !subjData.some(s => s.id === Number(prev.subjectId))) {
                    return { ...prev, subjectId: subjData[0].id };
                }
                if (subjData.length === 0) {
                    return { ...prev, subjectId: "" };
                }
                return prev;
            });
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadStudents();
    }, []);

    // Фільтрація завдань
    const filteredAssignments = useMemo(() => {
        return assignments.filter(a => {
            const matchSubject = filters.subjectId === "all" || a.subjectId === Number(filters.subjectId);
            const matchStatus = filters.status === "all" || a.isCompleted === (filters.status === "true");
            return matchSubject && matchStatus;
        });
    }, [assignments, filters]);

    const getSubjectName = (subjectId) => {
        const found = subjects.find(s => s.id === subjectId);
        return found ? found.name : `Предмет #${subjectId}`;
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleString("uk-UA", {
            day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
        });
    };

    // --- ОБРОБНИКИ ПОДІЙ ---

    const handleStudentChange = async (e) => {
        const id = e.target.value ? Number(e.target.value) : null;
        setSelectedStudentId(id);
        await refreshStudentWorkspace(id);
    };

    const handleCreateStudent = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const created = await apiRequest("/api/students", {
                method: "POST",
                body: JSON.stringify({
                    fullName: newStudent.fullName.trim(),
                    email: newStudent.email.trim(),
                    academicGroup: newStudent.academicGroup.trim()
                })
            });
            setNewStudent({ fullName: "", email: "", academicGroup: "" });
            setShowStudentPanel(false);
            showToast(`Студента ${created.fullName} додано`);
            await loadStudents(created.id);
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteStudent = async () => {
        if (!selectedStudentId || !confirm("Видалити обраного студента разом з усіма його предметами та завданнями?")) return;
        setIsSubmitting(true);
        try {
            await apiRequest(`/api/students/${selectedStudentId}`, { method: "DELETE" });
            showToast("Студента видалено");
            await loadStudents();
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateSubject = async (e) => {
        e.preventDefault();
        if (!selectedStudentId) return;
        setIsSubmitting(true);
        try {
            await apiRequest("/api/subjects", {
                method: "POST",
                body: JSON.stringify({
                    studentId: selectedStudentId,
                    name: newSubject.name.trim(),
                    teacherName: newSubject.teacherName.trim(),
                    totalCredits: Number(newSubject.totalCredits)
                })
            });
            setNewSubject({ name: "", teacherName: "", totalCredits: 4 });
            showToast("Предмет додано");
            await refreshStudentWorkspace();
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteSubject = async (subjectId) => {
        if (!confirm("Видалити предмет та пов'язані з ним завдання?")) return;
        setIsSubmitting(true);
        try {
            await apiRequest(`/api/subjects/${subjectId}`, { method: "DELETE" });
            showToast("Предмет видалено");
            await refreshStudentWorkspace();
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateAssignment = async (e) => {
        e.preventDefault();
        if (!newAssignment.subjectId) {
            showToast("Оберіть предмет для завдання", "error");
            return;
        }
        if (newAssignment.estimatedHours <= 0 || newAssignment.estimatedHours > 200) {
            showToast("Оцінка годин має бути від 0.5 до 200", "error");
            return;
        }
        setIsSubmitting(true);
        try {
            await apiRequest("/api/assignments", {
                method: "POST",
                body: JSON.stringify({
                    subjectId: Number(newAssignment.subjectId),
                    title: newAssignment.title.trim(),
                    description: newAssignment.description.trim(),
                    dueDate: new Date(newAssignment.dueDate).toISOString(),
                    estimatedHours: Number(newAssignment.estimatedHours)
                })
            });
            setNewAssignment(prev => ({ ...prev, title: "", description: "" }));
            showToast("Завдання додано, прогноз перераховано");
            await refreshStudentWorkspace();
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCompleteAssignment = async (id) => {
        setIsSubmitting(true);
        try {
            await apiRequest(`/api/assignments/${id}/complete`, { method: "PATCH" });
            showToast("Завдання позначено виконаним");
            await refreshStudentWorkspace();
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteAssignment = async (id) => {
        if (!confirm("Видалити це завдання?")) return;
        setIsSubmitting(true);
        try {
            await apiRequest(`/api/assignments/${id}`, { method: "DELETE" });
            showToast("Завдання видалено");
            await refreshStudentWorkspace();
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const riskLevelClass = `risk-badge risk-${(forecast.riskLevel || "none").toLowerCase()}`;

    return (
        <>
            <header className="topbar">
                <div className="container topbar-inner">
                    <div>
                        <h1>Student Workload Monitor</h1>
                        <p className="subtitle">Контроль навчального навантаження, дедлайнів та прогнозування ризиків</p>
                    </div>
                    <div className="student-selector">
                        <label htmlFor="studentSelect">Активний студент:</label>
                        <select
                            id="studentSelect"
                            value={selectedStudentId || ""}
                            onChange={handleStudentChange}
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
                            onClick={handleDeleteStudent}
                            disabled={!selectedStudentId || isSubmitting}
                            title="Видалити студента"
                        >
                            Видалити
                        </button>
                    </div>
                </div>
            </header>

            <main className="container">
                {/* Сповіщення про помилки / успіх */}
                {toast.visible && (
                    <div className={`toast ${toast.type}`} role="alert" aria-live="polite">
                        {toast.message}
                    </div>
                )}

                {/* Форма додавання студента */}
                {showStudentPanel && (
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
                        <form onSubmit={handleCreateStudent} className="form-grid-3">
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
                )}

                {/* Блок прогнозу навантаження */}
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

                {/* Основна робоча область */}
                <div className="workspace-grid">
                    {/* Ліва колонка: Предмети */}
                    <section className="card">
                        <div className="card-header">
                            <h2>Предмети</h2>
                        </div>

                        <form onSubmit={handleCreateSubject} className="stacked-form">
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
                                                onClick={() => handleDeleteSubject(subj.id)}
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

                    {/* Права колонка: Завдання */}
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

                        <form onSubmit={handleCreateAssignment} className="assignment-form">
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
                                                        onClick={() => handleCompleteAssignment(a.id)}
                                                        disabled={isSubmitting}
                                                    >
                                                        Виконано
                                                    </button>
                                                )}
                                                <button
                                                    className="btn btn-danger-outline btn-sm"
                                                    onClick={() => handleDeleteAssignment(a.id)}
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
                </div>
            </main>
        </>
    );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);