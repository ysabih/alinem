using System;

namespace Alinem.Models
{
	public class GameState
	{
		public string Id { get; set; }
		public GameType Type { get; set; }
		public DateTime StartTimeUtc { get; set; }
		public GameStage Stage { get; set; }
		public Player Player1 { get; set; }
		public Player Player2 { get; set; }
		public GameBoardState BoardState { get; set; }
		public GameDifficulty Difficulty { get; set; }
	}

	public class GameBoardState
	{
		public PlayerTurn?[,] Board { get; set; }
		public PlayerTurn CurrentTurn { get; set; }
		public int TurnNumber { get; set; }
		public PlayerTurn? Winner { get; set; }
		public GameMode GameMode { get; set; }
	}

	public enum UserConnectionState
	{
		CONNECTED,
		NOT_CONNECTED,
		ABORTED
	}

	public enum GameStage
	{
		WAITING_FOR_OPPONENT,
		PLAYING,
		GAME_OVER
	}

	public enum PlayerTurn
	{
		ONE,
		TWO
	}

	public enum PlayerType
	{
		HUMAN,
		COMPUTER
	}

	public enum GameMode
	{
		PUT,
		MOVE
	}

	public struct Point
	{
		public byte X { get; set; }
		public byte Y { get; set; }

		public Point(byte x, byte y)
		{
			X = x;
			Y = y;
		}
	}

	public enum GameType
	{
		VS_COMPUTER,
		VS_RANDOM_PLAYER,
		VS_FRIEND
	}

	public enum GameDifficulty
	{
		EASY,
		MEDIUM,
		HARD
	}
}
