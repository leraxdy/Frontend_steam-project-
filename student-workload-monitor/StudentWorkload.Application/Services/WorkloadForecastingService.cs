using Microsoft.EntityFrameworkCore;
using StudentWorkload.Application.Interfaces;

namespace StudentWorkload.Application.Services;

public class WorkloadForecastingService : IWorkloadForecastingService
{
    private readonly IApplicationDbContext _context; // Используем интерфейс вместо AppDbContext

    public WorkloadForecastingService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<WorkloadForecastResultDto> CalculateStudentWorkloadAsync(int studentId)
    {
        var now = DateTime.UtcNow;
        var nextWeek = now.AddDays(7);

        var upcomingAssignments = await _context.Assignments
            .Include(a => a.Subject)
            .Where(a => a.Subject.StudentId == studentId && !a.IsCompleted && a.DueDate <= nextWeek)
            .ToListAsync();

        double totalHours = upcomingAssignments.Sum(a => a.EstimatedHours);
        int count = upcomingAssignments.Count;

        string riskLevel;
        string recommendation;

        if (totalHours <= 15)
        {
            riskLevel = "Low";
            recommendation = "Навантаження оптимальне. Час є для планового навчання.";
        }
        else if (totalHours <= 30)
        {
            riskLevel = "Medium";
            recommendation = "Середнє навантаження. Розподіліть завдання рівномірно по днях.";
        }
        else if (totalHours <= 45)
        {
            riskLevel = "High";
            recommendation = "Високе навантаження! Рекомендується приділити пріоритет дедлайнам, що горять.";
        }
        else
        {
            riskLevel = "Critical";
            recommendation = "КРИТИЧНА ПЕРЕГРУЗКА! Ризик вигорання. Зверніться до викладачів щодо дедлайнів.";
        }

        return new WorkloadForecastResultDto
        {
            StudentId = studentId,
            TotalPendingHours = totalHours,
            ActiveAssignmentsCount = count,
            RiskLevel = riskLevel,
            Recommendation = recommendation
        };
    }
}