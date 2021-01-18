using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Alinem.Models
{
	public class Game
	{
		public string Id { get; set; }
		public User Player1 { get; set; }
		public User Player2 { get; set; }
		public Player CurrentTurn { get; set; }
		public int TurnNumber { get; set; }
	}
}
