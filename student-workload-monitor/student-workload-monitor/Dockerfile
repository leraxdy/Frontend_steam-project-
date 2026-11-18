# Этап 1: Сборка решения
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Копируем файлы ВСЕХ 4 проектов для корректного восстановления зависимостей
COPY ["student-workload-monitor/student-workload-monitor.csproj", "student-workload-monitor/"]
COPY ["StudentWorkload.Application/StudentWorkload.Application.csproj", "StudentWorkload.Application/"]
COPY ["StudentWorkload.Domain/StudentWorkload.Domain.csproj", "StudentWorkload.Domain/"]
COPY ["StudentWorkload.Infrastructure/StudentWorkload.Infrastructure.csproj", "StudentWorkload.Infrastructure/"]

RUN dotnet restore "./student-workload-monitor/student-workload-monitor.csproj"

# Копируем весь остальной код и публикуем приложение
COPY . .
WORKDIR "/src/student-workload-monitor"
RUN dotnet publish "./student-workload-monitor.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# Этап 2: Финальный образ для запуска
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

# Создаём папку для базы данных и выдаём права пользователю контейнера на запись в неё
RUN mkdir -p /app/data && chown -R $APP_UID:$APP_UID /app/data
USER $APP_UID

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "student-workload-monitor.dll"]