namespace StudentWorkload.Domain.Entities;

public class WorkloadRecord
{
    public int Id { get; set; }
    public DateTime Date { get; set; } // Дата, за которую фиксируется нагрузка
    public double HoursSpent { get; set; } // Сколько фактически часов студент потратил на учебу
    public string Notes { get; set; } = string.Empty; // Комментарий или описание выполненной работы

    // Связь со студентом (обязательно)
    public int StudentId { get; set; }
    public Student Student { get; set; } = null!;

    // Опциональная связь с конкретным предметом (если нагрузка относилась к нему)
    public int? SubjectId { get; set; }
    public Subject? Subject { get; set; }
}