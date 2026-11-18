using Microsoft.AspNetCore.Mvc;
using StudentWorkload.Application.Interfaces;

namespace student_workload_monitor.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WorkloadController : ControllerBase
{
    private readonly IWorkloadForecastingService _forecastingService;

    public WorkloadController(IWorkloadForecastingService forecastingService)
    {
        _forecastingService = forecastingService;
    }

    /// <summary>
    /// Получить прогноз учебной нагрузки и оценку рисков для конкретного студента на ближайшие 7 дней
    /// </summary>
    /// <param name="studentId">Идентификатор студента</param>
    [HttpGet("forecast/{studentId:int}")]
    public async Task<IActionResult> GetWorkloadForecast(int studentId)
    {
        // Вызываем сервис прогнозирования, реализующий экспертную бизнес-логику (Критерий D1)
        var forecast = await _forecastingService.CalculateStudentWorkloadAsync(studentId);

        return Ok(forecast);
    }
}