using Alinem.Models;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.DependencyInjection;
using Newtonsoft.Json;
using NUnit.Framework;
using System.Threading.Tasks;

namespace Alinem.IntegrationTests
{
	[TestFixture]
	public class GameHubTests
	{
		[Test]
		public async Task TestInitGame()
		{
//			string textPayload = @"{
//		""requesterPlayerName"": ""IntegrationTests"",
//        ""gameType"": ""VS_COMPUTER"",
//        ""requesterTurn"": ""TWO""
//}";

			var payload = new InitGameRequest
			{
				GameType = GameType.VS_COMPUTER,
				RequesterPlayerName = "IwillGrillYourMother",
				RequesterTurn = PlayerTurn.ONE
			};

			var connection = new HubConnectionBuilder()
			.WithUrl("http://localhost:5000/gamehub")
			.AddNewtonsoftJsonProtocol()
			.Build();
			await connection.StartAsync().ConfigureAwait(false);

			var response = await connection.InvokeAsync<GameBoardState>("InitGame", payload).ConfigureAwait(false);

		}
	}
}
