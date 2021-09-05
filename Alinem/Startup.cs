using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Newtonsoft.Json.Converters;
using Alinem.Hubs;
using Alinem.Logic;

namespace Alinem
{
	public class Startup
	{
		public Startup(IConfiguration configuration)
		{
			Configuration = configuration;
		}

		public IConfiguration Configuration { get; }

		// This method gets called by the runtime. Use this method to add services to the container.
		public void ConfigureServices(IServiceCollection services)
		{
			AddGameHubDependencies(services);

			services.AddSignalR(options => {
				options.EnableDetailedErrors = true;
			})
			.AddNewtonsoftJsonProtocol(options => {
				options.PayloadSerializerSettings.Converters.Add(new StringEnumConverter());
			});

			services.AddCors(options =>
			{
				options.AddDefaultPolicy(builder =>
				{
					builder.WithOrigins("http://localhost:3000")
						.AllowCredentials()
						.AllowAnyHeader()
						.AllowAnyMethod();
				});
			});
		}

		// This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
		public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
		{
			app.UseRouting();
			app.UseCors();
			app.UseEndpoints(endpoints =>
			{
				endpoints.MapHub<GameHub>("/gamehub");
			});
		}

		internal static void AddGameHubDependencies(IServiceCollection services)
		{
			// Business services
			services.AddSingleton<IGameLogic>(new GameLogic());
			services.AddSingleton<IServerState>(new ServerState());
			services.AddSingleton<IGameAI, MinimaxGameAI>();
		}
	}
}
