const { useState, useEffect, useMemo, useRef } = React;

function App() {
    const [students, setStudents] = useState([]);
    const [selectedStudentId, setSelectedStudentId] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [forecast, setForecast] = useState({});

    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showStudentPanel, setShowStudentPanel] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
    const toastTimerRef = useRef(null);

    const [newStudent, setNewStudent] = useState({ fullName: "", email: "", academicGroup: "" });
    const [newSubject, setNewSubject] = useState({ name: "", teacherName: "", totalCredits: 4 });
    const [newAssignment, setNewAssignment] = useState({
        subjectId: "",
        title: "",
        description: "",
        dueDate: getDefaultDueDate(),
        estimatedHours: 4
    });

    const [filters, setFilters] = useState({ subjectId: "all", status: "all" });

    const showToast = (message, type = "success") => {
        setToast({ visible: true, message, type });
        clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => {
            setToast(prev => ({ ...prev, visible: false }));
        }, 4500);
    };

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

            const targetId = preferId && list.some(s => s.id === preferId) ? preferId : list[0].id;
            setSelectedStudentId(targetId);
            await refreshStudentWorkspace(targetId);
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setIsLoading(false);
        }
    };

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
                if (subjData.length === 0) return { ...prev, subjectId: "" };
                return prev;
            });
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { loadStudents(); }, []);

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
        if (!newAssignment.subjectId) return showToast("Оберіть предмет для завдання", "error");
        if (newAssignment.estimatedHours <= 0 || newAssignment.estimatedHours > 200) {
            return showToast("Оцінка годин має бути від 1 до 200", "error");
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

    return (
        <>
            <HeaderAndStudentForm
                students={students}
                selectedStudentId={selectedStudentId}
                isLoading={isLoading}
                isSubmitting={isSubmitting}
                showStudentPanel={showStudentPanel}
                setShowStudentPanel={setShowStudentPanel}
                newStudent={newStudent}
                setNewStudent={setNewStudent}
                onStudentChange={handleStudentChange}
                onCreateStudent={handleCreateStudent}
                onDeleteStudent={handleDeleteStudent}
            />

            <main className="container">
                {toast.visible && (
                    <div className={`toast ${toast.type}`} role="alert" aria-live="polite">
                        {toast.message}
                    </div>
                )}

                <ForecastSection forecast={forecast} isLoading={isLoading} />

                <div className="workspace-grid">
                    <SubjectsPanel
                        subjects={subjects}
                        selectedStudentId={selectedStudentId}
                        isLoading={isLoading}
                        isSubmitting={isSubmitting}
                        newSubject={newSubject}
                        setNewSubject={setNewSubject}
                        onCreateSubject={handleCreateSubject}
                        onDeleteSubject={handleDeleteSubject}
                    />

                    <AssignmentsPanel
                        subjects={subjects}
                        filteredAssignments={filteredAssignments}
                        filters={filters}
                        setFilters={setFilters}
                        newAssignment={newAssignment}
                        setNewAssignment={setNewAssignment}
                        isLoading={isLoading}
                        isSubmitting={isSubmitting}
                        getSubjectName={getSubjectName}
                        onCreateAssignment={handleCreateAssignment}
                        onCompleteAssignment={handleCompleteAssignment}
                        onDeleteAssignment={handleDeleteAssignment}
                    />
                </div>
            </main>
        </>
    );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);