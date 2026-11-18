using Microsoft.EntityFrameworkCore;
using StudentWorkload.Domain.Entities;
using System.Collections.Generic;

namespace StudentWorkload.Application.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Student> Students { get; }
    DbSet<Subject> Subjects { get; }
    DbSet<Assignment> Assignments { get; }
    DbSet<WorkloadRecord> WorkloadRecords { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}