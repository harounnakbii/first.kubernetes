using FirstKubernetes.Services;
using Microsoft.AspNetCore.Http.HttpResults;
using StackExchange.Redis;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateSlimBuilder(args);

// Configuration Redis
var redisConnection = builder.Configuration.GetValue<string>("Redis:ConnectionString")
                      ?? "redis-service:6379,password=myredispassword";

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.TypeInfoResolverChain.Insert(0, AppJsonSerializerContext.Default);
});

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
{
    var logger = sp.GetRequiredService<ILogger<Program>>();
    try
    {
        logger.LogInformation("Connecting to Redis: {Connection}", redisConnection);
        return ConnectionMultiplexer.Connect(redisConnection);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to connect to Redis");
        throw;
    }
});

builder.Services.AddSingleton<IRedisCacheService, RedisCacheService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

Todo[] sampleTodos =
[
    new(1, "Walk the dog"),
    new(2, "Do the dishes", DateOnly.FromDateTime(DateTime.Now)),
    new(3, "Do the laundry", DateOnly.FromDateTime(DateTime.Now.AddDays(1))),
    new(4, "Clean the bathroom"),
    new(5, "Clean the car", DateOnly.FromDateTime(DateTime.Now.AddDays(2)))
];


// GET /todos - Avec cache Redis
app.MapGet("/todos", async (IRedisCacheService cache, ILogger<Program> logger) =>
{
    const string cacheKey = "todos:all";

    // Essayer de récupérer depuis le cache
    var cachedTodos = await cache.GetAsync<List<Todo>>(cacheKey);

    if (cachedTodos != null)
    {
        logger.LogInformation("Returning {Count} todos from cache", cachedTodos.Count);
        return Results.Ok(cachedTodos);
    }

    // Si pas en cache, utiliser les données en mémoire
    logger.LogInformation("Cache miss, returning {Count} todos from memory", sampleTodos.Length);

    // Mettre en cache pour 5 minutes
    await cache.SetAsync(cacheKey, sampleTodos, TimeSpan.FromMinutes(5));

    return Results.Ok(sampleTodos);
})
.WithName("GetTodos");

// GET /todos/{id} - Avec cache
app.MapGet("/todos/{id}", async (int id, IRedisCacheService cache) =>
{
    var cacheKey = $"todo:{id}";

    var cachedTodo = await cache.GetAsync<Todo>(cacheKey);
    if (cachedTodo != null)
    {
        return Results.Ok(cachedTodo);
    }

    var todo = sampleTodos.FirstOrDefault(t => t.Id == id);
    if (todo == null)
    {
        return Results.NotFound();
    }

    await cache.SetAsync(cacheKey, todo, TimeSpan.FromMinutes(5));
    return Results.Ok(todo);
})
.WithName("GetTodo");

// POST /todos - Invalide le cache
app.MapPost("/todos", async (Todo todo, IRedisCacheService cache) =>
{
    // sampleTodos est un tableau, donc on ne peut pas ajouter directement.
    // Pour la démo, on ne modifie pas sampleTodos.
    // En production, utiliser une liste ou une base de données.

    // Invalider le cache
    await cache.DeleteAsync("todos:all");

    return Results.Created($"/todos/{todo.Id}", todo);
})
.WithName("CreateTodo");

// GET /cache/stats - Voir les stats Redis
app.MapGet("/cache/stats", (IConnectionMultiplexer redis) =>
{
    var server = redis.GetServer(redis.GetEndPoints().First());
    var info = server.Info("stats");

    return Results.Ok(new
    {
        connected = redis.IsConnected,
        endpoints = redis.GetEndPoints().Select(e => e.ToString()),
        stats = info
    });
})
.WithName("CacheStats");

// GET /cache/clear - Vider le cache
app.MapDelete("/cache/clear", async (IRedisCacheService cache) =>
{
    await cache.DeleteAsync("todos:all");
    return Results.Ok("Cache cleared");
})
.WithName("ClearCache");

app.MapGet("/health", () => Results.Ok("Healthy"));

app.Run();

public record Todo(int Id, string? Title, DateOnly? DueBy = null, bool IsComplete = false);
[JsonSerializable(typeof(Todo))]
[JsonSerializable(typeof(Todo[]))]
internal partial class AppJsonSerializerContext : JsonSerializerContext
{

}
