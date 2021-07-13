using Alinem.Logic;
using Alinem.Models;
using FluentAssertions;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Text;

namespace Alinem.UnitTests
{
	[TestFixture]
	public class GameLogicTests
	{
		private static object[] ActionApplicationTestCases =
		{
			// Move piece
			new object[]
			{
				new GameBoardState
				{
					CurrentTurn = PlayerTurn.ONE,
					TurnNumber = 7,
					Winner = null,
					GameMode = GameMode.MOVE,
					Board = new PlayerTurn?[3, 3]
					{
						{PlayerTurn.ONE, PlayerTurn.ONE, null, },
						{PlayerTurn.TWO, PlayerTurn.ONE, null, },
						{PlayerTurn.TWO, null, PlayerTurn.TWO, }
					}
				},
				new MovePieceAction
				{
					From = new Point(1, 1),
					To = new Point(2, 0)
				},
				new GameBoardState
				{
					CurrentTurn = PlayerTurn.TWO,
					TurnNumber = 8,
					Winner = PlayerTurn.ONE,
					GameMode = GameMode.MOVE,
					Board = new PlayerTurn?[3, 3]
					{
						{PlayerTurn.ONE, PlayerTurn.ONE, PlayerTurn.ONE, },
						{PlayerTurn.TWO, null, null, },
						{PlayerTurn.TWO, null, PlayerTurn.TWO, }
					}
				}
			},
			// Put piece
			new object[]
			{
				new GameBoardState
				{
					CurrentTurn = PlayerTurn.ONE,
					TurnNumber = 3,
					Winner = null,
					GameMode = GameMode.MOVE,
					Board = new PlayerTurn?[3, 3]
					{
						{PlayerTurn.ONE, PlayerTurn.TWO, null, },
						{null, null, null, },
						{null, null, null, }
					}
				},
				new PutPieceAction
				{
					Position = new Point(1, 1)
				},
				new GameBoardState
				{
					CurrentTurn = PlayerTurn.TWO,
					TurnNumber = 4,
					Winner = null,
					GameMode = GameMode.PUT,
					Board = new PlayerTurn?[3, 3]
					{
						{PlayerTurn.ONE, PlayerTurn.TWO, null, },
						{null, PlayerTurn.ONE, null, },
						{null, null, null, }
					}
				}
			}
		};

		[TestCaseSource(nameof(ActionApplicationTestCases))]
		public void TestGameActionisAppliedCorrectly(GameBoardState beforeState, GameAction action, GameBoardState expectedStateAfter)
		{
			var actualStateAfter = new GameLogic().ApplyAction(beforeState, action);
			actualStateAfter.Should().BeEquivalentTo(expectedStateAfter);
		}
	}
}
