namespace StudentWorkload.Application.Interfaces;

public interface IWorkloadForecastingService
{
    Task<WorkloadForecastResultDto> CalculateStudentWorkloadAsync(int studentId);
}

public class WorkloadForecastResultDto
{
    public int StudentId { get; set; }
    public double TotalPendingHours { get; set; }
    public int ActiveAssignmentsCount { get; set; }
    public string RiskLevel { get; set; } = string.Empty; // "Low", "Medium", "High", "Critical"
    public string Recommendation { get; set; } = string.Empty;
}