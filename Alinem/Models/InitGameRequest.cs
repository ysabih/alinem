using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using System;

namespace Alinem.Models
{
	public class InitGameRequest
	{
		[JsonProperty("requesterPlayerName")]
		public string RequesterPlayerName { get; set; }

		[JsonProperty("requesterTurn")]
		[JsonConverter(typeof(StringEnumConverter))]
		public PlayerTurn RequesterTurn { get; set; }

		[JsonProperty("gameType")]
		[JsonConverter(typeof(StringEnumConverter))]
		public GameType GameType { get; set; }
	}

	public abstract class GameActionRequest
	{
		public Guid GameId { get; set; }
		public string UserId { get; set; }
		public GameAction Action { get; set; }
	}

	public abstract class GameAction { }

	public class MovePieceAction : GameAction
	{
		public Point From { get; set; }
		public Point To { get; set; }
	}

	public class PutPieceAction : GameAction
	{
		public Point Position { get; set; }
	}
}
