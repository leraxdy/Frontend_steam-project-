using System.Text.Json;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace student_workload_monitor.Infrastructure;

public sealed class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var (statusCode, title, detail) = exception switch
        {
            KeyNotFoundException notFound => (
                StatusCodes.Status404NotFound,
                "Resource Not Found",
                notFound.Message),

            ArgumentException or InvalidOperationException or JsonException or BadHttpRequestException => (
                StatusCodes.Status400BadRequest,
                "Invalid Request Data",
                exception.Message),

            DbUpdateException => (
                StatusCodes.Status409Conflict,
                "Database Conflict",
                "Operation violates database constraints or references a non-existent record."),

            _ => (
                StatusCodes.Status500InternalServerError,
                "Internal Server Error",
                "An unexpected error occurred while processing the request.")
        };

        if (statusCode >= 500)
        {
            logger.LogError(
                "Unhandled server error [{TraceId}]: {ExceptionType} - {Message}",
                httpContext.TraceIdentifier,
                exception.GetType().Name,
                exception.Message);
        }
        else
        {
            logger.LogWarning(
                "Handled client error {StatusCode} [{TraceId}]: {Message}",
                statusCode,
                httpContext.TraceIdentifier,
                exception.Message);
        }

        var problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = detail,
            Instance = httpContext.Request.Path
        };
        problemDetails.Extensions["traceId"] = httpContext.TraceIdentifier;

        httpContext.Response.StatusCode = statusCode;
        await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);

        return true;
    }
}
