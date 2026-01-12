using StackExchange.Redis;
using System.Text.Json;

namespace FirstKubernetes.Services;

public interface IRedisCacheService
{
    Task<T?> GetAsync<T>(string key);
    Task SetAsync<T>(string key, T value, TimeSpan? expiration = null);
    Task<bool> ExistsAsync(string key);
    Task DeleteAsync(string key);
}

public class RedisCacheService : IRedisCacheService
{
    private readonly IConnectionMultiplexer _redis;
    private readonly IDatabase _db;
    private readonly ILogger<RedisCacheService> _logger;

    public RedisCacheService(IConnectionMultiplexer redis, ILogger<RedisCacheService> logger)
    {
        _redis = redis;
        _db = redis.GetDatabase();
        _logger = logger;
    }

    public async Task<T?> GetAsync<T>(string key)
    {
        try
        {
            var value = await _db.StringGetAsync(key);
            if (value.IsNullOrEmpty)
            {
                _logger.LogInformation("Cache miss for key: {Key}", key);
                return default;
            }

            _logger.LogInformation("Cache hit for key: {Key}", key);
            return JsonSerializer.Deserialize<T>(value!.ToString());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting from cache: {Key}", key);
            return default;
        }
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiration = null)
    {
        try
        {
            var json = JsonSerializer.Serialize(value);
            if (expiration.HasValue)
            {
                await _db.StringSetAsync(key, json, new StackExchange.Redis.Expiration(expiration.Value));
            }
            else
            {
                await _db.StringSetAsync(key, json);
            }
            _logger.LogInformation("Cached key: {Key}", key);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting cache: {Key}", key);
        }
    }

    public async Task<bool> ExistsAsync(string key)
    {
        return await _db.KeyExistsAsync(key);
    }

    public async Task DeleteAsync(string key)
    {
        await _db.KeyDeleteAsync(key);
        _logger.LogInformation("Deleted key: {Key}", key);
    }
}