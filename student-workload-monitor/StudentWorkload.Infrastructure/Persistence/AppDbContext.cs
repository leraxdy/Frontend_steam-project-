using Microsoft.EntityFrameworkCore;
using StudentWorkload.Domain.Entities;
using StudentWorkload.Application.Interfaces;

namespace StudentWorkload.Infrastructure.Persistence;

public class AppDbContext : DbContext, IApplicationDbContext
{
    public DbSet<Student> Students => Set<Student>();
    public DbSet<Subject> Subjects => Set<Subject>();
    public DbSet<Assignment> Assignments => Set<Assignment>();
    public DbSet<WorkloadRecord> WorkloadRecords => Set<WorkloadRecord>();

    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Индексы для быстрого поиска и JOIN (оптимизация под критерий C5)
        modelBuilder.Entity<Assignment>()
            .HasIndex(a => a.DueDate); // Важно для алгоритма прогнозирования дедлайнов

        modelBuilder.Entity<WorkloadRecord>()
            .HasIndex(w => w.Date);

        // Связь Student -> Subject (1 ко многим)
        modelBuilder.Entity<Subject>()
            .HasOne(s => s.Student)
            .WithMany(st => st.Subjects)
            .HasForeignKey(s => s.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        // Связь Subject -> Assignment (1 ко многим)
        modelBuilder.Entity<Assignment>()
            .HasOne(a => a.Subject)
            .WithMany(s => s.Assignments)
            .HasForeignKey(a => a.SubjectId)
            .OnDelete(DeleteBehavior.Cascade);

        // Связь Student -> WorkloadRecord (1 ко многим)
        modelBuilder.Entity<WorkloadRecord>()
            .HasOne(w => w.Student)
            .WithMany(s => s.WorkloadRecords)
            .HasForeignKey(w => w.StudentId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}