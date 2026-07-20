var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "LocalDevelopment",
        policy =>
        {
            policy
                .WithOrigins("http://localhost:3000")
                .AllowAnyHeader()
                .AllowAnyMethod();
        });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseCors("LocalDevelopment");
}

app.MapControllers();

app.MapGet(
        "/api/health",
        () => Results.Ok(
            new
            {
                status = "Healthy",
                version = "0.0.1",
                service = "Azure Watchtower API"
            }))
    .WithName("GetHealth");

app.Run();