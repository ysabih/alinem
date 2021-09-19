using Newtonsoft.Json;

namespace Alinem.Models
{
	public class InitGameRequest
	{
		public string UserName { get; set; }
		public PlayerTurn UserTurn { get; set; }
		public GameType GameType { get; set; }
		public GameDifficulty? Difficulty { get; set; }
	}

	public class JoinPrivateGameRequest
	{
		public string GameId { get; set; }
		public string UserName { get; set; }
	}

	public class QuitGameRequest
	{
		public string GameId { get; set; }
	}

	public class ResetGameRequest
	{
		public string GameId { get; set; }
		public PlayerTurn UserTurn { get; set; }
	}

	public class GameActionRequest
	{
		public string GameId { get; set; }
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

	public class GameNotification
	{
		public GameAction LastAction { get; set; }
		public GameState NewGameState { get; set; }
	}
}
