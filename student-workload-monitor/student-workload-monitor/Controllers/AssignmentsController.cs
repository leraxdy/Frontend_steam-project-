using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StudentWorkload.Application.Interfaces;
using StudentWorkload.Domain.Entities;

namespace student_workload_monitor.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AssignmentsController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public AssignmentsController(IApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Создать новое учебное задание / дедлайн
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateAssignment([FromBody] Assignment assignment)
    {
        // Проверяем, существует ли указанный предмет
        var subject = await _context.Subjects.FindAsync(assignment.SubjectId);
        if (subject == null)
        {
            return NotFound(new { message = $"Предмет с ID {assignment.SubjectId} не найден." });
        }

        _context.Assignments.Add(assignment);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAssignmentById), new { id = assignment.Id }, assignment);
    }

    /// <summary>
    /// Получить задание по ID
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetAssignmentById(int id)
    {
        var assignment = await _context.Assignments
            .Include(a => a.Subject)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (assignment == null)
        {
            return NotFound(new { message = $"Задание с ID {id} не найдено." });
        }

        return Ok(assignment);
    }

    [HttpGet]
    public async Task<IActionResult> GetAllAssignments()
    {
        var assignments = await _context.Assignments
            .Include(a => a.Subject)
            .ToListAsync();

        return Ok(assignments);
    }
}