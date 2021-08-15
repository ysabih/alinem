using Alinem.Models;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;

namespace Alinem.Logic
{
	public class ServerState : IServerState
	{
		private static readonly Player ComputerPlayer;
		private static readonly ConcurrentDictionary<string, Player> Players;
		private static readonly ConcurrentDictionary<string, GameState> Games;

		static ServerState()
		{
			ComputerPlayer = new Player
			{
				Id = "5c28d7b43e6140c894d26d5ec409ed8ebf9de1dc4f61",
				Name = "BOT",
				Type = PlayerType.COMPUTER
			};
			Players = new ConcurrentDictionary<string, Player>(new Dictionary<string, Player>() { { ComputerPlayer.Id, ComputerPlayer } });
			Games = new ConcurrentDictionary<string, GameState>();
		}

		// Not thread safe, use lock when to add/remove elements
		private static HashSet<string> OpenGames = new HashSet<string>();
		private static object OpenGamesLock = new object();

		private static readonly int DefaultGameDifficulty = 3;
		int IServerState.DefaultGameDifficulty => DefaultGameDifficulty;

		Player IServerState.ComputerPlayer => ComputerPlayer;

		public void AddNewGame(GameState gameState)
		{
			if (!Games.TryAdd(gameState.Id, gameState))
			{
				throw new ArgumentException($"Game with Id {gameState.Id} already exists");
			}
			if(gameState.Type == GameType.VS_RANDOM_PLAYER)
			{
				AddOpenGameId(gameState.Id);
			}
		}

		public bool Exists(string gameId)
		{
			return Games.ContainsKey(gameId);
		}

		public GameState GetGameState(string gameId)
		{
			GameState gameState;
			if (!Games.TryGetValue(gameId, out gameState))
			{
				throw new ArgumentException($"There is no current game with id {gameId}");
			}
			return gameState;
		}

		public void UpdateGameState(GameState newState)
		{
			Games.AddOrUpdate(newState.Id,
				// If client code tries to udpate a game that doesn't exist, something is wrong
				(id) => { throw new ArgumentException($"Game with id \'{newState.Id}\' does not exists"); },
				(id, oldState) => newState);
		}

		public bool RemoveGameIfExists(string gameId)
		{
			GameState gameState = null;
			bool removed = Games.TryRemove(gameId, out gameState);
			if(gameState.Type == GameType.VS_RANDOM_PLAYER && gameState.Stage == GameStage.WAITING_FOR_OPPONENT)
			{
				lock(OpenGamesLock)
				{
					OpenGames.Remove(gameId);
				}
			}
			else if (gameState.Type == GameType.VS_FRIEND && gameState.Stage == GameStage.WAITING_FOR_OPPONENT)
			{
				lock (OpenGamesLock)
				{
					OpenGames.Remove(gameId);
				}
			}
			return removed;
		}

		public string PopRandomOpenGameId()
		{
			lock(OpenGamesLock)
			{
				string first = OpenGames.FirstOrDefault();
				if(first != null)
				{
					OpenGames.Remove(first);
				}
				return first;
			}
		}

		public void AddOrUpdatePlayer(Player player)
		{
			Players.AddOrUpdate(player.Id, player, (id, oldValue) => { return player; });
		}

		private static void AddOpenGameId(string gameId)
		{
			lock (OpenGamesLock)
			{
				if (!OpenGames.Add(gameId))
				{
					throw new ArgumentException($"Open game with id \'{gameId}\' already added");
				}
			}
		}
	}
}
