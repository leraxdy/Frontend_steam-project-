## ***Kurta Artem Khudoba Valeria IPZ-33 PG-7***

# Student Workload Monitoring & Forecasting System

Кросплатформна .NET-система призначена для моніторингу, обліку та прогнозування навчального навантаження студента (розподіл завдань, дедлайнів та аналітика витраченого часу).

## 🚀 Технологічний стек
* **Backend:** C#, .NET 9.0, ASP.NET Core Web API
* **База даних:** Entity Framework Core (SQLite з автоматичним застосуванням міграцій)
* **Контейнеризація:** Docker, Docker Compose (кросплатформний запуск на Windows, Linux, macOS)
* **Архітектура:** Clean Architecture (Domain, Application, Infrastructure, Presentation)
* **Тестування:** xUnit, Moq (модульні та інтеграційні тести)

---

## 🛠️ Інструкція з запуску проекту (Getting Started)

Проєкт повністю кросплатформний і може бути запущений двома основними способами: через Docker (найшвидший варіант для перевірки у будь-якому середовищі) або локально через .NET CLI.

### Спосіб 1: Запуск через Docker (Рекомендовано)

1. Переконайтеся, що **Docker Desktop** встановлено та запуск активний.
2. У кореневій папці проєкту виконайте команду для збірки та фонового запуску контейнера:
   ```bash
   docker compose up --build -d
   ```
3. Після старту та застосування міграцій бази даних інтерфейс документації та API будуть доступні за адресами:
   * **Swagger UI:** `http://localhost:8080/swagger`
   * **HTTPS Endpoint:** `https://localhost:8081`

### Спосіб 2: Локальний запуск через .NET CLI

1. Переконайтеся, що на вашому комп'ютері встановлено **.NET 9.0 SDK**.
2. Перейдіть до папки з рішенням та виконайте збірку:
   ```bash
   dotnet build
   ```
3. Запустіть веб-апі додаток:
   ```bash
   dotnet run --project student-workload-monitor/student-workload-monitor.csproj
   ```

---

## 🧪 Запуск тестів

Для перевірки коректності бізнес-логіки та алгоритмів прогнозування навантаження використовуються модульні тести на базі xUnit:
```bash
dotnet test
```
Також ви можете запустити тести через **Test Explorer** у середовищі Visual Studio / VS Code.

## 🔗 Основні API Ендпоинти
* **Students:** `GET /api/Students`, `POST /api/Students`, `GET /api/Students/{id}`
* **Subjects:** `GET /api/Subjects`, `POST /api/Subjects`
* **Assignments:** `GET /api/Assignments`, `POST /api/Assignments`, `GET /api/Assignments/{id}`