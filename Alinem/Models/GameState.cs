using System;

namespace Alinem.Models
{
	public class GameState
	{
		public Guid Id { get; set; }
		public DateTime StartTimeUtc { get; set; }
		public Player Player1 { get; set; }
		public Player Player2 { get; set; }
		public GameBoardState BoardState { get; set; }
		public UserConnectionState[] UserConnectionsState { get; set; }
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
		public byte X { get; }
		public byte Y { get; }

		public Point(byte x, byte y)
		{
			X = x;
			Y = y;
		}
	}

	public enum GameType
	{
		VS_COMPUTER,
		VS_REMOTE_PLAYER,
		VS_LOCAL_PLAYER
	}
}
