using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using student_workload_monitor.Contracts;
using StudentWorkload.Application.Interfaces;
using StudentWorkload.Domain.Entities;

namespace student_workload_monitor.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class StudentsController(IApplicationDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<StudentResponse>>> GetAll(CancellationToken ct)
    {
        var students = await db.Students
            .AsNoTracking()
            .Select(s => new StudentResponse(s.Id, s.FullName, s.Email, s.AcademicGroup))
            .ToListAsync(ct);

        return Ok(students);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<StudentResponse>> GetById(int id, CancellationToken ct)
    {
        var student = await db.Students
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == id, ct);

        if (student is null)
            return NotFound(new { message = $"Student with id {id} was not found." });

        return Ok(new StudentResponse(student.Id, student.FullName, student.Email, student.AcademicGroup));
    }

    [HttpPost]
    public async Task<ActionResult<StudentResponse>> Create([FromBody] CreateStudentRequest request, CancellationToken ct)
    {
        var emailExists = await db.Students.AnyAsync(s => s.Email == request.Email, ct);
        if (emailExists)
            return Conflict(new { message = $"Student with email '{request.Email}' already exists." });

        var student = new Student
        {
            FullName = request.FullName,
            Email = request.Email,
            AcademicGroup = request.AcademicGroup
        };

        db.Students.Add(student);
        await db.SaveChangesAsync(ct);

        var response = new StudentResponse(student.Id, student.FullName, student.Email, student.AcademicGroup);
        return CreatedAtAction(nameof(GetById), new { id = student.Id }, response);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<StudentResponse>> Update(int id, [FromBody] UpdateStudentRequest request, CancellationToken ct)
    {
        var student = await db.Students.FirstOrDefaultAsync(s => s.Id == id, ct);
        if (student is null)
            return NotFound(new { message = $"Student with id {id} was not found." });

        student.FullName = request.FullName;
        student.AcademicGroup = request.AcademicGroup;

        await db.SaveChangesAsync(ct);

        return Ok(new StudentResponse(student.Id, student.FullName, student.Email, student.AcademicGroup));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var student = await db.Students.FirstOrDefaultAsync(s => s.Id == id, ct);
        if (student is null)
            return NotFound(new { message = $"Student with id {id} was not found." });

        db.Students.Remove(student);
        await db.SaveChangesAsync(ct);

        return NoContent();
    }
}