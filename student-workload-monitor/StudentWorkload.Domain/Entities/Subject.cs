using System.Text.Json.Serialization;

namespace StudentWorkload.Domain.Entities;

public class Subject
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? TeacherName { get; set; }
    public int TotalCredits { get; set; }

    public int StudentId { get; set; }

    [JsonIgnore]
    public Student? Student { get; set; } // Сделали nullable, чтобы валидатор не требовал весь объект

    public ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
}