using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateSlimBuilder(args);

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.TypeInfoResolverChain.Insert(0, AppJsonSerializerContext.Default);
});

// Ajouter HttpClient
builder.Services.AddHttpClient("FirstApi", client =>
{
    // DNS interne Kubernetes : nom-du-service.namespace.svc.cluster.local
    // Si même namespace : juste nom-du-service
    var firstApiUrl = Environment.GetEnvironmentVariable("FIRST_API_URL")
                     ?? "http://first-kubernetes-service:8080";  // ← Nom exact
    client.BaseAddress = new Uri(firstApiUrl);
    client.DefaultRequestHeaders.Add("Accept", "application/json");
});

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Endpoint qui appelle la première API
app.MapGet("/call-first-api", async Task<Results<IResult, NotFound>> (IHttpClientFactory httpClientFactory) =>
{
    var client = httpClientFactory.CreateClient("FirstApi");

    try
    {
        var response = await client.GetAsync("/todos");

        if (!response.IsSuccessStatusCode)
        {
            return TypedResults.NotFound();
        }

        var content = await response.Content.ReadAsStringAsync();
        //var data = JsonSerializer.Deserialize<Todo[]>(content,
        //    AppJsonSerializerContext.Default.TodoArray);
        // Retourner directement le JSON (pas de sérialisation)
        return TypedResults.Content(content, "application/json");
    }
    catch (Exception ex)
    {
        return TypedResults.NotFound();
    }
});

app.MapGet("/health", () => TypedResults.Ok("Healthy"));

app.Run();
public record Todo(int Id, string? Title, DateOnly? DueBy = null, bool IsComplete = false);

[JsonSerializable(typeof(string[]))]
[JsonSerializable(typeof(string))]
[JsonSerializable(typeof(ProblemDetails))]
[JsonSerializable(typeof(Todo[]))]
internal partial class AppJsonSerializerContext : JsonSerializerContext
{
}
