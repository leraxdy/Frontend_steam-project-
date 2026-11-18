using Microsoft.EntityFrameworkCore;
using StudentWorkload.Application.Services;
using StudentWorkload.Domain.Entities;
using StudentWorkload.Infrastructure.Persistence;
using Xunit;

public class WorkloadForecastingServiceTests
{
    private AppDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString()) // Уникальная БД для каждого теста
            .Options;

        return new AppDbContext(options);
    }

    [Fact]
    public async Task CalculateStudentWorkloadAsync_ShouldReturnLowRisk_WhenTotalHoursAreLow()
    {
        // Arrange
        using var context = GetInMemoryDbContext();

        var student = new Student { Id = 1, FullName = "Іван", Email = "ivan@test.com" };
        var subject = new Subject { Id = 1, Name = "Математика", StudentId = 1 };

        // Задание на ближайшие 2 дня с небольшими часами
        var assignment = new Assignment
        {
            Id = 1,
            Title = "Домашня 1",
            EstimatedHours = 5,
            DueDate = DateTime.UtcNow.AddDays(2),
            IsCompleted = false,
            SubjectId = 1
        };

        context.Students.Add(student);
        context.Subjects.Add(subject);
        context.Assignments.Add(assignment);
        await context.SaveChangesAsync();

        var service = new WorkloadForecastingService(context);

        // Act
        var result = await service.CalculateStudentWorkloadAsync(1);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.StudentId);
        Assert.Equal(5, result.TotalPendingHours);
        Assert.Equal(1, result.ActiveAssignmentsCount);
        Assert.Equal("Low", result.RiskLevel);
    }

    [Fact]
    public async Task CalculateStudentWorkloadAsync_ShouldReturnCriticalRisk_WhenTotalHoursExceedLimit()
    {
        // Arrange
        using var context = GetInMemoryDbContext();

        var student = new Student { Id = 2, FullName = "Марія", Email = "maria@test.com" };
        var subject = new Subject { Id = 2, Name = "Програмування", StudentId = 2 };

        // Много тяжелых заданий на ближайшую неделю (в сумме > 45 часов)
        var assignment = new Assignment
        {
            Id = 1,
            Title = "Курсова робота",
            EstimatedHours = 50,
            DueDate = DateTime.UtcNow.AddDays(3),
            IsCompleted = false,
            SubjectId = 2
        };

        context.Students.Add(student);
        context.Subjects.Add(subject);
        context.Assignments.Add(assignment);
        await context.SaveChangesAsync();

        var service = new WorkloadForecastingService(context);

        // Act
        var result = await service.CalculateStudentWorkloadAsync(2);

        // Assert
        Assert.Equal("Critical", result.RiskLevel);
        Assert.Equal(50, result.TotalPendingHours);
    }
}