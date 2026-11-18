namespace StudentWorkload.Domain.Entities;

public class Student
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string AcademicGroup { get; set; } = string.Empty; // Например, КН-31

    // Навигационные свойства для связи с другими таблицами
    public ICollection<Subject> Subjects { get; set; } = new List<Subject>();
    public ICollection<WorkloadRecord> WorkloadRecords { get; set; } = new List<WorkloadRecord>();
}