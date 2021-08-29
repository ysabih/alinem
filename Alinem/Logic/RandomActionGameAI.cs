using Alinem.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Alinem.Logic
{
	// Temp game AI implementation for test purposes
	public class RandomActionGameAI : IGameAI
	{
		private readonly Random rand;

		public RandomActionGameAI()
		{
			rand = new Random();
		}

		public GameAction CalculateComputerMove(GameBoardState gameState, int difficulty)
		{
			List<GameAction> actions = GameLogicUtils.GetAllAvailableActions(gameState);
			return actions[rand.Next(0, actions.Count)];
		}
	}
}