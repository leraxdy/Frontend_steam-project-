using System.ComponentModel.DataAnnotations;

namespace student_workload_monitor.Contracts;

// --- 1. STUDENTS ---
public sealed record CreateStudentRequest(
    [Required(ErrorMessage = "FullName is required")]
    [StringLength(150, MinimumLength = 2)]
    string FullName,

    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    [StringLength(150)]
    string Email,

    [Required(ErrorMessage = "AcademicGroup is required")]
    [StringLength(30, MinimumLength = 2)]
    string AcademicGroup
);

public sealed record UpdateStudentRequest(
    [Required(ErrorMessage = "FullName is required")]
    [StringLength(150, MinimumLength = 2)]
    string FullName,

    [Required(ErrorMessage = "AcademicGroup is required")]
    [StringLength(30, MinimumLength = 2)]
    string AcademicGroup
);

public sealed record StudentResponse(
    int Id,
    string FullName,
    string Email,
    string AcademicGroup
);

// --- 2. SUBJECTS ---
public sealed record CreateSubjectRequest(
    [Range(1, int.MaxValue, ErrorMessage = "StudentId must be a positive integer")]
    int StudentId,

    [Required(ErrorMessage = "Subject name is required")]
    [StringLength(150, MinimumLength = 2)]
    string Name,

    [StringLength(150)]
    string TeacherName = "",

    [Range(1, 60, ErrorMessage = "TotalCredits must be between 1 and 60")]
    int TotalCredits = 3
);

public sealed record SubjectResponse(
    int Id,
    int StudentId,
    string Name,
    string TeacherName,
    int TotalCredits
);

// --- 3. ASSIGNMENTS ---
public sealed record CreateAssignmentRequest(
    [Range(1, int.MaxValue, ErrorMessage = "SubjectId must be a positive integer")]
    int SubjectId,

    [Required(ErrorMessage = "Title is required")]
    [StringLength(200, MinimumLength = 2)]
    string Title,

    [StringLength(1000)]
    string Description = "",

    [Required(ErrorMessage = "DueDate is required")]
    DateTime DueDate = default,

    [Range(0.1, 500, ErrorMessage = "EstimatedHours must be greater than 0 and up to 500")]
    double EstimatedHours = 1.0
);

public sealed record AssignmentResponse(
    int Id,
    int SubjectId,
    string Title,
    string Description,
    DateTime DueDate,
    double EstimatedHours,
    bool IsCompleted
);

// --- 4. WORKLOAD RECORDS ---
public sealed record CreateWorkloadRecordRequest(
    [Range(1, int.MaxValue, ErrorMessage = "StudentId must be a positive integer")]
    int StudentId,

    int? SubjectId,

    [Range(0.1, 24, ErrorMessage = "HoursSpent must be between 0.1 and 24")]
    double HoursSpent,

    DateTime? Date = null,

    [StringLength(500)]
    string Notes = ""
);

public sealed record WorkloadRecordResponse(
    int Id,
    int StudentId,
    int? SubjectId,
    DateTime Date,
    double HoursSpent,
    string Notes
);