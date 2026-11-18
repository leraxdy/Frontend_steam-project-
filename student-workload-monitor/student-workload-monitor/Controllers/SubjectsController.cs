using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StudentWorkload.Application.Interfaces;
using StudentWorkload.Domain.Entities;

namespace student_workload_monitor.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SubjectsController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public SubjectsController(IApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Создать новый учебный предмет
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateSubject([FromBody] Subject subject)
    {
        _context.Subjects.Add(subject);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(CreateSubject), new { id = subject.Id }, subject);
    }

    [HttpGet]
    public async Task<IActionResult> GetSubjects([FromQuery] int? studentId)
    {
        var query = _context.Subjects.AsQueryable();

        // Если в модели Subject есть привязка к студенту (например, StudentId), можно добавить фильтрацию:
        // if (studentId.HasValue)
        // {
        //     query = query.Where(s => s.StudentId == studentId.Value);
        // }

        var subjects = await query.ToListAsync();
        return Ok(subjects);
    }
}