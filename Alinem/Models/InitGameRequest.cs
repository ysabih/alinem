using Newtonsoft.Json;

namespace Alinem.Models
{
	public class InitGameRequest
	{
		public string RequesterPlayerName { get; set; }
		public PlayerTurn RequesterTurn { get; set; }
		public GameType GameType { get; set; }
	}

	public class GameActionRequest
	{
		public string GameId { get; set; }
		public string UserId { get; set; }
		public GameAction Action { get; set; }
	}

	[JsonConverter(typeof(GameActionJsonConverter))]
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
