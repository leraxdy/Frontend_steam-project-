using System.Text.Json.Serialization;

namespace StudentWorkload.Domain.Entities;

public class Assignment
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime DueDate { get; set; }
    public double EstimatedHours { get; set; }
    public bool IsCompleted { get; set; }

    public int SubjectId { get; set; }

    [JsonIgnore]
    public Subject? Subject { get; set; } // Сделали nullable и добавили JsonIgnore
}