using Newtonsoft.Json;

namespace Alinem.Models
{
	public class InitGameRequest
	{
		public User User { get; set; }
		public PlayerTurn UserTurn { get; set; }
		public GameType GameType { get; set; }
	}

	public class User
	{
		public string Id { get; set; }
		public string Name { get; set; }
	}

	//public class QuitGameRequest
	//{
	//	public string GameId { get; set; }
	//	public string UserId { get; set; }
	//}

	public class ResetGameRequest
	{
		public string GameId { get; set; }
		public string UserId { get; set; }
		public PlayerTurn UserTurn { get; set; }
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
