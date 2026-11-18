using System.Net;
using System.Net.Http.Json;
using student_workload_monitor.Contracts;
using StudentWorkload.Application.Interfaces;

namespace StudentWorkload.IntegrationTests;

public class ApiIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public ApiIntegrationTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task CreateStudent_WithInvalidData_Returns400BadRequest()
    {
        var invalidRequest = new CreateStudentRequest("", "not-an-email", "IPZ-31");

        var response = await _client.PostAsJsonAsync("/api/students", invalidRequest);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetStudentById_WhenDoesNotExist_Returns404NotFound()
    {
        var response = await _client.GetAsync("/api/students/99999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task EndToEndWorkflow_CreateStudentSubjectAssignment_CalculatesForecast()
    {
        // 1. Создаём студента -> 201 Created
        var studentReq = new CreateStudentRequest("Тестовий Студент", $"student_{Guid.NewGuid():N}@edu.ua", "ІПЗ-31");
        var studentRes = await _client.PostAsJsonAsync("/api/students", studentReq);
        Assert.Equal(HttpStatusCode.Created, studentRes.StatusCode);
        var student = await studentRes.Content.ReadFromJsonAsync<StudentResponse>();
        Assert.NotNull(student);

        // 2. Создаём предмет -> 201 Created
        var subjectReq = new CreateSubjectRequest(student.Id, "Інженерія ПЗ", "Коваленко О.П.", 5);
        var subjectRes = await _client.PostAsJsonAsync("/api/subjects", subjectReq);
        Assert.Equal(HttpStatusCode.Created, subjectRes.StatusCode);
        var subject = await subjectRes.Content.ReadFromJsonAsync<SubjectResponse>();
        Assert.NotNull(subject);

        // 3. Создаём задание -> 201 Created
        var assignmentReq = new CreateAssignmentRequest(
            subject.Id,
            "Лабораторна робота №1",
            "Реалізація REST API",
            DateTime.UtcNow.AddDays(3),
            6.0);
        var assignmentRes = await _client.PostAsJsonAsync("/api/assignments", assignmentReq);
        Assert.Equal(HttpStatusCode.Created, assignmentRes.StatusCode);

        // 4. Запрашиваем прогноз нагрузки -> 200 OK
        var forecastRes = await _client.GetAsync($"/api/workload/forecast/{student.Id}");
        Assert.Equal(HttpStatusCode.OK, forecastRes.StatusCode);
        var forecast = await forecastRes.Content.ReadFromJsonAsync<WorkloadForecastResultDto>();
        Assert.NotNull(forecast);
        Assert.Equal(student.Id, forecast.StudentId);
        Assert.Equal(1, forecast.ActiveAssignmentsCount);
        Assert.True(forecast.TotalPendingHours >= 6.0);
    }
}
