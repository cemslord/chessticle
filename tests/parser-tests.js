var should = require('should'),
	Parser = require('../').Parser,
	parser = new Parser();

describe('Parser', function() {
	it('should handle tag pair', function() {
		var tokens = [
			{ name: 'open-bracket' },
			{ name: 'symbol', value: 'Foo' },
			{ name: 'string', value: 'bar' },
			{ name: 'close-bracket' }
		];
		var result = parser.parse(tokens);
		result.metadata.should.have.property('Foo', 'bar');
	});

	it('should ignore escaped text', function() {
		var tokens = [
			{ name: 'escape', value: 'asdf' }
		];
		var result = parser.parse(tokens);
		result.metadata.should.be.empty;
		result.moves.should.be.empty;
	});

	it('should ignore periods', function() {
		var tokens = [
			{ name: 'periods', value: '......' }
		];
		var result = parser.parse(tokens);
		result.metadata.should.be.empty;
		result.moves.should.be.empty;
	});

	describe('movetext', function() {
		describe('nags', function() {
			it('should handle nag after move', function() {
				var tokens = [
					{ name: 'integer', value: '1' },
					{ name: 'symbol', value: 'd4' },
					{ name: 'nag', value: '1' }
				];
				var result = parser.parse(tokens);
				result.moves.should.have.length(1);
				result.moves[0].should.have.property('piece', null);
				result.moves[0].should.have.property('origin', null);
				result.moves[0].should.have.property('capturing', false);
				result.moves[0].should.have.property('target', 'd4');
				result.moves[0].should.have.property('promotion', null);
				result.moves[0].should.have.property('kingSideCastle', false);
				result.moves[0].should.have.property('queenSideCastle', false);
				result.moves[0].should.have.property('check', false);
				result.moves[0].should.have.property('checkmate', false);
				result.moves[0].should.have.property('nag', 1);
			});

			[ '!', '?', '!!', '??', '!?', '?!' ].forEach(function(nag, i) {
				it('should handle ' + nag + ' nag', function() {
					var tokens = [
						{ name: 'integer', value: '1' },
						{ name: 'symbol', value: 'd4' + nag }
					];
					var result = parser.parse(tokens);
					result.moves.should.have.length(1);
					result.moves[0].should.have.property('piece', null);
					result.moves[0].should.have.property('origin', null);
					result.moves[0].should.have.property('capturing', false);
					result.moves[0].should.have.property('target', 'd4');
					result.moves[0].should.have.property('promotion', null);
					result.moves[0].should.have.property('kingSideCastle', false);
					result.moves[0].should.have.property('queenSideCastle', false);
					result.moves[0].should.have.property('check', false);
					result.moves[0].should.have.property('checkmate', false);
					result.moves[0].should.have.property('nag', i + 1);
				});
			});
		});

		it('should handle consecutive moves', function() {
			var tokens = [
				{ name: 'integer', value: '1' },
				{ name: 'symbol', value: 'd4' },
				{ name: 'symbol', value: 'd5' },
				{ name: 'integer', value: '2' },
				{ name: 'symbol', value: 'd3' },
				{ name: 'symbol', value: 'c6' }
			];
			var result = parser.parse(tokens);
			result.moves.should.have.length(4);
			result.moves[0].should.have.property('target', 'd4');
			result.moves[1].should.have.property('target', 'd5');
			result.moves[2].should.have.property('target', 'd3');
			result.moves[3].should.have.property('target', 'c6');
		});

		it('should handle consecutive moves with numbers', function() {
			var tokens = [
				{ name: 'integer', value: '1' },
				{ name: 'periods', value: '.' },
				{ name: 'symbol', value: 'd4' },
				{ name: 'integer', value: '1' },
				{ name: 'periods', value: '...' },
				{ name: 'symbol', value: 'd5' },
				{ name: 'integer', value: '2' },
				{ name: 'periods', value: '.' },
				{ name: 'symbol', value: 'd3' },
				{ name: 'integer', value: '2' },
				{ name: 'periods', value: '...' },
				{ name: 'symbol', value: 'c6' }
			];
			var result = parser.parse(tokens);
			result.moves.should.have.length(4);
			result.moves[0].should.have.property('target', 'd4');
			result.moves[1].should.have.property('target', 'd5');
			result.moves[2].should.have.property('target', 'd3');
			result.moves[3].should.have.property('target', 'c6');
		});

		describe('game termination markers', function() {
			[ '1-0', '0-1', '1/2-1/2' ].forEach(function(gtm) {
				it(gtm, function() {
					var tokens = [
						{ name: 'integer', value: '1' },
						{ name: 'periods', value: '.' },
						{ name: 'symbol', value: 'd4' },
						{ name: 'symbol', value: gtm }
					];
					var result = parser.parse(tokens);
					result.moves.should.have.length(1);
					result.moves[0].should.have.property('target', 'd4');
					result.should.have.property('result', gtm);
				});
			});

			it('*', function() {
				var tokens = [
					{ name: 'integer', value: '1' },
					{ name: 'periods', value: '.' },
					{ name: 'symbol', value: 'd4' },
					{ name: 'asterisk', value: '*' }
				];
				var result = parser.parse(tokens);
				result.moves.should.have.length(1);
				result.moves[0].should.have.property('target', 'd4');
				result.should.have.property('result', '*');
			});
		});

		describe('commentary', function() {
			it('should handle commentary before 1st move', function() {
				var tokens = [
					{ name: 'commentary', value: 'foo' },
					{ name: 'integer', value: '1' },
					{ name: 'periods', value: '.' },
					{ name: 'symbol', value: 'd4' }
				];
				var result = parser.parse(tokens);
				result.moves.should.have.length(1);
				result.should.have.property('commentary', 'foo');
				result.moves[0].should.have.property('target', 'd4');
			});

			it('should assign commentary after a move to previous move', function() {
				var tokens = [
					{ name: 'integer', value: '1' },
					{ name: 'periods', value: '.' },
					{ name: 'symbol', value: 'd4' },
					{ name: 'commentary', value: 'foo' }
				];
				var result = parser.parse(tokens);
				result.moves.should.have.length(1);
				result.moves[0].should.have.property('target', 'd4');
				result.moves[0].should.have.property('commentary', 'foo');
			});
		});

		describe('pawn moves', function() {
			it('should handle move', function() {
				var tokens = [
					{ name: 'integer', value: '1' },
					{ name: 'symbol', value: 'd4' }
				];
				var result = parser.parse(tokens);
				result.moves.should.have.length(1);
				result.moves[0].should.have.property('piece', null);
				result.moves[0].should.have.property('origin', null);
				result.moves[0].should.have.property('capturing', false);
				result.moves[0].should.have.property('target', 'd4');
				result.moves[0].should.have.property('promotion', null);
				result.moves[0].should.have.property('kingSideCastle', false);
				result.moves[0].should.have.property('queenSideCastle', false);
				result.moves[0].should.have.property('check', false);
				result.moves[0].should.have.property('checkmate', false);
			});

			it('should handle move with explicit pawn', function() {
				var tokens = [
					{ name: 'integer', value: '1' },
					{ name: 'symbol', value: 'Pd4' }
				];
				var result = parser.parse(tokens);
				result.moves.should.have.length(1);
				result.moves[0].should.have.property('piece', 'P');
				result.moves[0].should.have.property('origin', null);
				result.moves[0].should.have.property('capturing', false);
				result.moves[0].should.have.property('target', 'd4');
				result.moves[0].should.have.property('promotion', null);
				result.moves[0].should.have.property('kingSideCastle', false);
				result.moves[0].should.have.property('queenSideCastle', false);
				result.moves[0].should.have.property('check', false);
				result.moves[0].should.have.property('checkmate', false);
			});

			it('should handle capture', function() {
				var tokens = [
					{ name: 'integer', value: '1' },
					{ name: 'symbol', value: 'exd4' }
				];
				var result = parser.parse(tokens);
				result.moves.should.have.length(1);
				result.moves[0].should.have.property('piece', null);
				result.moves[0].should.have.property('origin', 'e');
				result.moves[0].should.have.property('capturing', true);
				result.moves[0].should.have.property('target', 'd4');
				result.moves[0].should.have.property('promotion', null);
				result.moves[0].should.have.property('kingSideCastle', false);
				result.moves[0].should.have.property('queenSideCastle', false);
				result.moves[0].should.have.property('check', false);
				result.moves[0].should.have.property('checkmate', false);
			});

			it('should handle capture with explicit pawn', function() {
				var tokens = [
					{ name: 'integer', value: '1' },
					{ name: 'symbol', value: 'Pexd4' }
				];
				var result = parser.parse(tokens);
				result.moves.should.have.length(1);
				result.moves[0].should.have.property('piece', 'P');
				result.moves[0].should.have.property('origin', 'e');
				result.moves[0].should.have.property('capturing', true);
				result.moves[0].should.have.property('target', 'd4');
				result.moves[0].should.have.property('promotion', null);
				result.moves[0].should.have.property('kingSideCastle', false);
				result.moves[0].should.have.property('queenSideCastle', false);
				result.moves[0].should.have.property('check', false);
				result.moves[0].should.have.property('checkmate', false);
			});

			it('should handle capture with explicit pawn on rank and file', function() {
				var tokens = [
					{ name: 'integer', value: '1' },
					{ name: 'symbol', value: 'Pe5xd4' }
				];
				var result = parser.parse(tokens);
				result.moves.should.have.length(1);
				result.moves[0].should.have.property('piece', 'P');
				result.moves[0].should.have.property('origin', 'e5');
				result.moves[0].should.have.property('capturing', true);
				result.moves[0].should.have.property('target', 'd4');
				result.moves[0].should.have.property('promotion', null);
				result.moves[0].should.have.property('kingSideCastle', false);
				result.moves[0].should.have.property('queenSideCastle', false);
				result.moves[0].should.have.property('check', false);
				result.moves[0].should.have.property('checkmate', false);
			});

			it('should handle pawn capture and promotion with check', function() {
				var tokens = [
					{ name: 'integer', value: '1' },
					{ name: 'symbol', value: 'exd4=Q+' }
				];
				var result = parser.parse(tokens);
				result.moves.should.have.length(1);
				result.moves[0].should.have.property('piece', null);
				result.moves[0].should.have.property('origin', 'e');
				result.moves[0].should.have.property('capturing', true);
				result.moves[0].should.have.property('target', 'd4');
				result.moves[0].should.have.property('promotion', 'Q');
				result.moves[0].should.have.property('kingSideCastle', false);
				result.moves[0].should.have.property('queenSideCastle', false);
				result.moves[0].should.have.property('check', true);
				result.moves[0].should.have.property('checkmate', false);
			});

			it('should handle pawn capture and promotion with checkmate (#)', function() {
				var tokens = [
					{ name: 'integer', value: '1' },
					{ name: 'symbol', value: 'exd4=Q#' }
				];
				var result = parser.parse(tokens);
				result.moves.should.have.length(1);
				result.moves[0].should.have.property('piece', null);
				result.moves[0].should.have.property('origin', 'e');
				result.moves[0].should.have.property('capturing', true);
				result.moves[0].should.have.property('target', 'd4');
				result.moves[0].should.have.property('promotion', 'Q');
				result.moves[0].should.have.property('kingSideCastle', false);
				result.moves[0].should.have.property('queenSideCastle', false);
				result.moves[0].should.have.property('check', false);
				result.moves[0].should.have.property('checkmate', true);
			});

			it('should handle pawn capture and promotion with checkmate (++)', function() {
				var tokens = [
					{ name: 'integer', value: '1' },
					{ name: 'symbol', value: 'exd4=Q++' }
				];
				var result = parser.parse(tokens);
				result.moves.should.have.length(1);
				result.moves[0].should.have.property('piece', null);
				result.moves[0].should.have.property('origin', 'e');
				result.moves[0].should.have.property('capturing', true);
				result.moves[0].should.have.property('target', 'd4');
				result.moves[0].should.have.property('promotion', 'Q');
				result.moves[0].should.have.property('kingSideCastle', false);
				result.moves[0].should.have.property('queenSideCastle', false);
				result.moves[0].should.have.property('check', false);
				result.moves[0].should.have.property('checkmate', true);
			});

			describe('promotions', function() {
				[ 'N', 'B', 'R', 'Q' ].forEach(function(piece) {
					it('should handle promotion to ' + piece, function() {
						var tokens = [
							{ name: 'integer', value: '1' },
							{ name: 'symbol', value: 'd8=' + piece }
						];
						var result = parser.parse(tokens);
						result.moves.should.have.length(1);
						result.moves[0].should.have.property('piece', null);
						result.moves[0].should.have.property('origin', null);
						result.moves[0].should.have.property('capturing', false);
						result.moves[0].should.have.property('target', 'd8');
						result.moves[0].should.have.property('promotion', piece);
						result.moves[0].should.have.property('kingSideCastle', false);
						result.moves[0].should.have.property('queenSideCastle', false);
						result.moves[0].should.have.property('check', false);
						result.moves[0].should.have.property('checkmate', false);
					});

					it('should handle promotion to ' + piece + ' with explicit pawn', function() {
						var tokens = [
							{ name: 'integer', value: '1' },
							{ name: 'symbol', value: 'Pd8=' + piece }
						];
						var result = parser.parse(tokens);
						result.moves.should.have.length(1);
						result.moves[0].should.have.property('piece', 'P');
						result.moves[0].should.have.property('origin', null);
						result.moves[0].should.have.property('capturing', false);
						result.moves[0].should.have.property('target', 'd8');
						result.moves[0].should.have.property('promotion', piece);
						result.moves[0].should.have.property('kingSideCastle', false);
						result.moves[0].should.have.property('queenSideCastle', false);
						result.moves[0].should.have.property('check', false);
						result.moves[0].should.have.property('checkmate', false);
					});
				});

				it('should not allow promotion to king', function() {
					var tokens = [
						{ name: 'integer', value: '1' },
						{ name: 'symbol', value: 'd8=K' }
					];

					(function() { parser.parse(tokens); })
						.should
						.throwError('Invalid promotion, must be one of N, B, R or Q');
				});

				it('should not allow promotion to pawn', function() {
					var tokens = [
						{ name: 'integer', value: '1' },
						{ name: 'symbol', value: 'd8=P' }
					];

					(function() { parser.parse(tokens); })
						.should
						.throwError('Invalid promotion, must be one of N, B, R or Q');
				});
			});
		});

		describe('castling', function() {
			it('should handle king side castle', function() {
				var tokens = [
					{ name: 'integer', value: '1' },
					{ name: 'symbol', value: 'O-O' }
				];
				var result = parser.parse(tokens);
				result.moves.should.have.length(1);
				result.moves[0].should.have.property('piece', null);
				result.moves[0].should.have.property('origin', null);
				result.moves[0].should.have.property('capturing', false);
				result.moves[0].should.have.property('target', null);
				result.moves[0].should.have.property('promotion', null);
				result.moves[0].should.have.property('kingSideCastle', true);
				result.moves[0].should.have.property('queenSideCastle', false);
				result.moves[0].should.have.property('check', false);
				result.moves[0].should.have.property('checkmate', false);
			});

			it('should handle king side castle with check', function() {
				var tokens = [
					{ name: 'integer', value: '1' },
					{ name: 'symbol', value: 'O-O+' }
				];
				var result = parser.parse(tokens);
				result.moves.should.have.length(1);
				result.moves[0].should.have.property('piece', null);
				result.moves[0].should.have.property('origin', null);
				result.moves[0].should.have.property('capturing', false);
				result.moves[0].should.have.property('target', null);
				result.moves[0].should.have.property('promotion', null);
				result.moves[0].should.have.property('kingSideCastle', true);
				result.moves[0].should.have.property('queenSideCastle', false);
				result.moves[0].should.have.property('check', true);
				result.moves[0].should.have.property('checkmate', false);
			});

			it('should handle queen side castle with checkmate', function() {
				var tokens = [
					{ name: 'integer', value: '1' },
					{ name: 'symbol', value: 'O-O#' }
				];
				var result = parser.parse(tokens);
				result.moves.should.have.length(1);
				result.moves[0].should.have.property('piece', null);
				result.moves[0].should.have.property('origin', null);
				result.moves[0].should.have.property('capturing', false);
				result.moves[0].should.have.property('target', null);
				result.moves[0].should.have.property('promotion', null);
				result.moves[0].should.have.property('kingSideCastle', true);
				result.moves[0].should.have.property('queenSideCastle', false);
				result.moves[0].should.have.property('check', false);
				result.moves[0].should.have.property('checkmate', true);
			});

			it('should handle queen side castle', function() {
				var tokens = [
					{ name: 'integer', value: '1' },
					{ name: 'symbol', value: 'O-O-O' }
				];
				var result = parser.parse(tokens);
				result.moves.should.have.length(1);
				result.moves[0].should.have.property('piece', null);
				result.moves[0].should.have.property('origin', null);
				result.moves[0].should.have.property('capturing', false);
				result.moves[0].should.have.property('target', null);
				result.moves[0].should.have.property('promotion', null);
				result.moves[0].should.have.property('kingSideCastle', false);
				result.moves[0].should.have.property('queenSideCastle', true);
				result.moves[0].should.have.property('check', false);
				result.moves[0].should.have.property('checkmate', false);
			});

			it('should handle queen side castle with check', function() {
				var tokens = [
					{ name: 'integer', value: '1' },
					{ name: 'symbol', value: 'O-O-O+' }
				];
				var result = parser.parse(tokens);
				result.moves.should.have.length(1);
				result.moves[0].should.have.property('piece', null);
				result.moves[0].should.have.property('origin', null);
				result.moves[0].should.have.property('capturing', false);
				result.moves[0].should.have.property('target', null);
				result.moves[0].should.have.property('promotion', null);
				result.moves[0].should.have.property('kingSideCastle', false);
				result.moves[0].should.have.property('queenSideCastle', true);
				result.moves[0].should.have.property('check', true);
				result.moves[0].should.have.property('checkmate', false);
			});

			it('should handle queen side castle with checkmate', function() {
				var tokens = [
					{ name: 'integer', value: '1' },
					{ name: 'symbol', value: 'O-O-O#' }
				];
				var result = parser.parse(tokens);
				result.moves.should.have.length(1);
				result.moves[0].should.have.property('piece', null);
				result.moves[0].should.have.property('origin', null);
				result.moves[0].should.have.property('capturing', false);
				result.moves[0].should.have.property('target', null);
				result.moves[0].should.have.property('promotion', null);
				result.moves[0].should.have.property('kingSideCastle', false);
				result.moves[0].should.have.property('queenSideCastle', true);
				result.moves[0].should.have.property('check', false);
				result.moves[0].should.have.property('checkmate', true);
			});
		});

		describe('piece moves', function() {
			[ 'N', 'B', 'R', 'Q' ].forEach(function(piece) {
				it('should handle ' + piece  + ' move', function() {
					var tokens = [
						{ name: 'integer', value: '1' },
						{ name: 'symbol', value: piece + 'c6' }
					];
					var result = parser.parse(tokens);
					result.moves.should.have.length(1);
					result.moves[0].should.have.property('piece', piece);
					result.moves[0].should.have.property('origin', null);
					result.moves[0].should.have.property('capturing', false);
					result.moves[0].should.have.property('target', 'c6');
					result.moves[0].should.have.property('promotion', null);
					result.moves[0].should.have.property('kingSideCastle', false);
					result.moves[0].should.have.property('queenSideCastle', false);
					result.moves[0].should.have.property('check', false);
					result.moves[0].should.have.property('checkmate', false);
				});

				it('should handle ' + piece + 'move with check', function() {
					var tokens = [
						{ name: 'integer', value: '1' },
						{ name: 'symbol', value: piece + 'c6+' }
					];
					var result = parser.parse(tokens);
					result.moves.should.have.length(1);
					result.moves[0].should.have.property('piece', piece);
					result.moves[0].should.have.property('origin', null);
					result.moves[0].should.have.property('capturing', false);
					result.moves[0].should.have.property('target', 'c6');
					result.moves[0].should.have.property('promotion', null);
					result.moves[0].should.have.property('kingSideCastle', false);
					result.moves[0].should.have.property('queenSideCastle', false);
					result.moves[0].should.have.property('check', true);
					result.moves[0].should.have.property('checkmate', false);
				});

				it('should handle ' + piece + 'move with checkmate', function() {
					var tokens = [
						{ name: 'integer', value: '1' },
						{ name: 'symbol', value: piece + 'c6#' }
					];
					var result = parser.parse(tokens);
					result.moves.should.have.length(1);
					result.moves[0].should.have.property('piece', piece);
					result.moves[0].should.have.property('origin', null);
					result.moves[0].should.have.property('capturing', false);
					result.moves[0].should.have.property('target', 'c6');
					result.moves[0].should.have.property('promotion', null);
					result.moves[0].should.have.property('kingSideCastle', false);
					result.moves[0].should.have.property('queenSideCastle', false);
					result.moves[0].should.have.property('check', false);
					result.moves[0].should.have.property('checkmate', true);
				});

				it('should handle ' + piece + ' capture', function() {
					var tokens = [
						{ name: 'integer', value: '1' },
						{ name: 'symbol', value: piece + 'xc6' }
					];
					var result = parser.parse(tokens);
					result.moves.should.have.length(1);
					result.moves[0].should.have.property('piece', piece);
					result.moves[0].should.have.property('origin', null);
					result.moves[0].should.have.property('capturing', true);
					result.moves[0].should.have.property('target', 'c6');
					result.moves[0].should.have.property('promotion', null);
					result.moves[0].should.have.property('kingSideCastle', false);
					result.moves[0].should.have.property('queenSideCastle', false);
					result.moves[0].should.have.property('check', false);
					result.moves[0].should.have.property('checkmate', false);
				});

				it('should handle ' + piece + ' capture with check', function() {
					var tokens = [
						{ name: 'integer', value: '1' },
						{ name: 'symbol', value: piece + 'xc6+' }
					];
					var result = parser.parse(tokens);
					result.moves.should.have.length(1);
					result.moves[0].should.have.property('piece', piece);
					result.moves[0].should.have.property('origin', null);
					result.moves[0].should.have.property('capturing', true);
					result.moves[0].should.have.property('target', 'c6');
					result.moves[0].should.have.property('promotion', null);
					result.moves[0].should.have.property('kingSideCastle', false);
					result.moves[0].should.have.property('queenSideCastle', false);
					result.moves[0].should.have.property('check', true);
					result.moves[0].should.have.property('checkmate', false);
				});

				it('should handle ' + piece + ' capture with checkmate', function() {
					var tokens = [
						{ name: 'integer', value: '1' },
						{ name: 'symbol', value: piece + 'xc6#' }
					];
					var result = parser.parse(tokens);
					result.moves.should.have.length(1);
					result.moves[0].should.have.property('piece', piece);
					result.moves[0].should.have.property('origin', null);
					result.moves[0].should.have.property('capturing', true);
					result.moves[0].should.have.property('target', 'c6');
					result.moves[0].should.have.property('promotion', null);
					result.moves[0].should.have.property('kingSideCastle', false);
					result.moves[0].should.have.property('queenSideCastle', false);
					result.moves[0].should.have.property('check', false);
					result.moves[0].should.have.property('checkmate', true);
				});

				it('should handle ' + piece + ' capture with explicit rank', function() {
					var tokens = [
						{ name: 'integer', value: '1' },
						{ name: 'symbol', value: piece + '4xc6' }
					];
					var result = parser.parse(tokens);
					result.moves.should.have.length(1);
					result.moves[0].should.have.property('piece', piece);
					result.moves[0].should.have.property('origin', '4');
					result.moves[0].should.have.property('capturing', true);
					result.moves[0].should.have.property('target', 'c6');
					result.moves[0].should.have.property('promotion', null);
					result.moves[0].should.have.property('kingSideCastle', false);
					result.moves[0].should.have.property('queenSideCastle', false);
					result.moves[0].should.have.property('check', false);
					result.moves[0].should.have.property('checkmate', false);
				});

				it('should handle ' + piece + ' capture with explicit file with checkmate', function() {
					var tokens = [
						{ name: 'integer', value: '1' },
						{ name: 'symbol', value: piece + '4xc6#' }
					];
					var result = parser.parse(tokens);
					result.moves.should.have.length(1);
					result.moves[0].should.have.property('piece', piece);
					result.moves[0].should.have.property('origin', '4');
					result.moves[0].should.have.property('capturing', true);
					result.moves[0].should.have.property('target', 'c6');
					result.moves[0].should.have.property('promotion', null);
					result.moves[0].should.have.property('kingSideCastle', false);
					result.moves[0].should.have.property('queenSideCastle', false);
					result.moves[0].should.have.property('check', false);
					result.moves[0].should.have.property('checkmate', true);
				});

				it('should handle ' + piece + ' capture with explicit file', function() {
					var tokens = [
						{ name: 'integer', value: '1' },
						{ name: 'symbol', value: piece + 'exc6' }
					];
					var result = parser.parse(tokens);
					result.moves.should.have.length(1);
					result.moves[0].should.have.property('piece', piece);
					result.moves[0].should.have.property('origin', 'e');
					result.moves[0].should.have.property('capturing', true);
					result.moves[0].should.have.property('target', 'c6');
					result.moves[0].should.have.property('promotion', null);
					result.moves[0].should.have.property('kingSideCastle', false);
					result.moves[0].should.have.property('queenSideCastle', false);
					result.moves[0].should.have.property('check', false);
					result.moves[0].should.have.property('checkmate', false);
				});

				it('should handle ' + piece + ' capture with explicit file with checkmate', function() {
					var tokens = [
						{ name: 'integer', value: '1' },
						{ name: 'symbol', value: piece + 'exc6#' }
					];
					var result = parser.parse(tokens);
					result.moves.should.have.length(1);
					result.moves[0].should.have.property('piece', piece);
					result.moves[0].should.have.property('origin', 'e');
					result.moves[0].should.have.property('capturing', true);
					result.moves[0].should.have.property('target', 'c6');
					result.moves[0].should.have.property('promotion', null);
					result.moves[0].should.have.property('kingSideCastle', false);
					result.moves[0].should.have.property('queenSideCastle', false);
					result.moves[0].should.have.property('check', false);
					result.moves[0].should.have.property('checkmate', true);
				});

				it('should handle ' + piece + ' capture with explicit rank and file', function() {
					var tokens = [
						{ name: 'integer', value: '1' },
						{ name: 'symbol', value: piece + 'e8xc6' }
					];
					var result = parser.parse(tokens);
					result.moves.should.have.length(1);
					result.moves[0].should.have.property('piece', piece);
					result.moves[0].should.have.property('origin', 'e8');
					result.moves[0].should.have.property('capturing', true);
					result.moves[0].should.have.property('target', 'c6');
					result.moves[0].should.have.property('promotion', null);
					result.moves[0].should.have.property('kingSideCastle', false);
					result.moves[0].should.have.property('queenSideCastle', false);
					result.moves[0].should.have.property('check', false);
					result.moves[0].should.have.property('checkmate', false);
				});

				it('should handle ' + piece + ' capture with explicit rank and file with check', function() {
					var tokens = [
						{ name: 'integer', value: '1' },
						{ name: 'symbol', value: piece + 'e8xc6+' }
					];
					var result = parser.parse(tokens);
					result.moves.should.have.length(1);
					result.moves[0].should.have.property('piece', piece);
					result.moves[0].should.have.property('origin', 'e8');
					result.moves[0].should.have.property('capturing', true);
					result.moves[0].should.have.property('target', 'c6');
					result.moves[0].should.have.property('promotion', null);
					result.moves[0].should.have.property('kingSideCastle', false);
					result.moves[0].should.have.property('queenSideCastle', false);
					result.moves[0].should.have.property('check', true);
					result.moves[0].should.have.property('checkmate', false);
				});

				it('should handle ' + piece + ' capture with explicit rank and file with checkmate', function() {
					var tokens = [
						{ name: 'integer', value: '1' },
						{ name: 'symbol', value: piece + 'e8xc6#' }
					];
					var result = parser.parse(tokens);
					result.moves.should.have.length(1);
					result.moves[0].should.have.property('piece', piece);
					result.moves[0].should.have.property('origin', 'e8');
					result.moves[0].should.have.property('capturing', true);
					result.moves[0].should.have.property('target', 'c6');
					result.moves[0].should.have.property('promotion', null);
					result.moves[0].should.have.property('kingSideCastle', false);
					result.moves[0].should.have.property('queenSideCastle', false);
					result.moves[0].should.have.property('check', false);
					result.moves[0].should.have.property('checkmate', true);
				});

				it('should not allow promotion', function() {
					var tokens = [
						{ name: 'integer', value: '1' },
						{ name: 'symbol', value: piece + 'c8=Q' }
					];
					(function() { parser.parse(tokens); }).should.throwError('Only pawns can promote');
				});
			});
		});

		describe('king moves', function() {
			it('should handle move', function() {
				var tokens = [
					{ name: 'integer', value: '1' },
					{ name: 'symbol', value: 'Kc6' }
				];
				var result = parser.parse(tokens);
				result.moves.should.have.length(1);
				result.moves[0].should.have.property('piece', 'K');
				result.moves[0].should.have.property('origin', null);
				result.moves[0].should.have.property('capturing', false);
				result.moves[0].should.have.property('target', 'c6');
				result.moves[0].should.have.property('promotion', null);
				result.moves[0].should.have.property('kingSideCastle', false);
				result.moves[0].should.have.property('queenSideCastle', false);
				result.moves[0].should.have.property('check', false);
				result.moves[0].should.have.property('checkmate', false);
			});

			it('should handle capture', function() {
				var tokens = [
					{ name: 'integer', value: '1' },
					{ name: 'symbol', value: 'Kxc6' }
				];
				var result = parser.parse(tokens);
				result.moves.should.have.length(1);
				result.moves[0].should.have.property('piece', 'K');
				result.moves[0].should.have.property('origin', null);
				result.moves[0].should.have.property('capturing', true);
				result.moves[0].should.have.property('target', 'c6');
				result.moves[0].should.have.property('promotion', null);
				result.moves[0].should.have.property('kingSideCastle', false);
				result.moves[0].should.have.property('queenSideCastle', false);
				result.moves[0].should.have.property('check', false);
				result.moves[0].should.have.property('checkmate', false);
			});

			it('should not allow check', function() {
				var tokens = [
					{ name: 'integer', value: '1' },
					{ name: 'symbol', value: 'Kc6+' }
				];
				(function() { parser.parse(tokens); }).should.throwError('Kings cannot give check');
			});

			it('should not allow checkmate', function() {
				var tokens = [
					{ name: 'integer', value: '1' },
					{ name: 'symbol', value: 'Kc6#' }
				];
				(function() { parser.parse(tokens); }).should.throwError('Kings cannot give checkmate');
			});
		});
	});

	describe('variations', function() {
		it('should handle single variation', function() {
			var tokens = [
				{ name: 'integer', value: '1' },
				{ name: 'symbol', value: 'd4' },
				{ name: 'open-paren' },
				{ name: 'integer', value: '1' },
				{ name: 'symbol', value: 'd3' },
				{ name: 'close-paren' }
			];
			var result = parser.parse(tokens);
			result.moves.should.have.length(1);
			result.moves[0].should.have.property('target', 'd4');
			result.moves[0].variations.should.have.length(1);
			result.moves[0].variations[0].moves.should.have.length(1);
			result.moves[0].variations[0].moves[0].should.have.property('target', 'd3');
		});

		it('should handle variation with commentary before 1st move', function() {
			var tokens = [
				{ name: 'integer', value: '1' },
				{ name: 'symbol', value: 'd4' },
				{ name: 'open-paren' },
				{ name: 'commentary', value: 'foo bar' },
				{ name: 'integer', value: '1' },
				{ name: 'symbol', value: 'd3' },
				{ name: 'close-paren' }
			];
			var result = parser.parse(tokens);
			result.moves.should.have.length(1);
			result.moves[0].should.have.property('target', 'd4');
			result.moves[0].variations.should.have.length(1);
			result.moves[0].variations[0].commentary.should.equal('foo bar');
			result.moves[0].variations[0].moves.should.have.length(1);
			result.moves[0].variations[0].moves[0].should.have.property('target', 'd3');
		});

		it('should handle variation with commentary', function() {
			var tokens = [
				{ name: 'integer', value: '1' },
				{ name: 'symbol', value: 'd4' },
				{ name: 'open-paren' },
				{ name: 'integer', value: '1' },
				{ name: 'symbol', value: 'd3' },
				{ name: 'commentary', value: 'foo bar' },
				{ name: 'close-paren' }
			];
			var result = parser.parse(tokens);
			result.moves.should.have.length(1);
			result.moves[0].should.have.property('target', 'd4');
			result.moves[0].variations.should.have.length(1);
			result.moves[0].variations[0].commentary.should.equal('');
			result.moves[0].variations[0].moves.should.have.length(1);
			result.moves[0].variations[0].moves[0].should.have.property('target', 'd3');
			result.moves[0].variations[0].moves[0].should.have.property('commentary', 'foo bar');
		});

		it('should handle variation with multiple moves', function() {
			var tokens = [
				{ name: 'integer', value: '1' },
				{ name: 'symbol', value: 'd4' },
				{ name: 'open-paren' },
				{ name: 'integer', value: '1' },
				{ name: 'symbol', value: 'd3' },
				{ name: 'symbol', value: 'd6' },
				{ name: 'integer', value: '2' },
				{ name: 'symbol', value: 'd4' },
				{ name: 'close-paren' }
			];
			var result = parser.parse(tokens);
			result.moves.should.have.length(1);
			result.moves[0].should.have.property('target', 'd4');
			result.moves[0].variations.should.have.length(1);
			result.moves[0].variations[0].moves.should.have.length(3);
			result.moves[0].variations[0].moves[0].should.have.property('target', 'd3');
			result.moves[0].variations[0].moves[1].should.have.property('target', 'd6');
			result.moves[0].variations[0].moves[2].should.have.property('target', 'd4');
		});

		it('should handle multiple variations', function() {
			var tokens = [
				{ name: 'integer', value: '1' },
				{ name: 'symbol', value: 'd4' },
				{ name: 'open-paren' },
				{ name: 'integer', value: '1' },
				{ name: 'symbol', value: 'd3' },
				{ name: 'close-paren' },
				{ name: 'open-paren' },
				{ name: 'integer', value: '1' },
				{ name: 'symbol', value: 'Nf3' },
				{ name: 'close-paren' }
			];
			var result = parser.parse(tokens);
			result.moves.should.have.length(1);
			result.moves[0].should.have.property('target', 'd4');
			result.moves[0].variations.should.have.length(2);
			result.moves[0].variations[0].moves.should.have.length(1);
			result.moves[0].variations[0].moves[0].should.have.property('target', 'd3');
			result.moves[0].variations[1].moves.should.have.length(1);
			result.moves[0].variations[1].moves[0].should.have.property('target', 'f3');
		});

		it('should handle nested variations', function() {
			var tokens = [
				{ name: 'integer', value: '1' },
				{ name: 'symbol', value: 'd4' },
				{ name: 'open-paren' },
				{ name: 'integer', value: '1' },
				{ name: 'symbol', value: 'd3' },
				{ name: 'symbol', value: 'd5' },
				{ name: 'open-paren' },
				{ name: 'integer', value: '1' },
				{ name: 'periods', value: '...' },
				{ name: 'symbol', value: 'd6' },
				{ name: 'close-paren' },
				{ name: 'close-paren' },
				{ name: 'symbol', value: 'Nf6' }
			];
			var result = parser.parse(tokens);
			result.moves.should.have.length(2);
			result.moves[0].should.have.property('target', 'd4');
			result.moves[1].should.have.property('target', 'f6');
			result.moves[0].variations.should.have.length(1);
			result.moves[0].variations[0].moves.should.have.length(2);
			result.moves[0].variations[0].moves[0].should.have.property('target', 'd3');
			result.moves[0].variations[0].moves[1].should.have.property('target', 'd5');
			result.moves[0].variations[0].moves[1].variations.should.have.length(1);
			result.moves[0].variations[0].moves[1].variations[0].moves.should.have.length(1);
			result.moves[0].variations[0].moves[1].variations[0].moves[0].should.have.property('target', 'd6');
		});
	});

	it('should blow up for unaccounted for close-bracket', function() {
		var tokens = [
			{ name: 'close-bracket' }
		];
		(function() { parser.parse(tokens); }).should.throwError('Unexpected token: close-bracket');
	});

	it('should blow up for invalid token', function() {
		var tokens = [
			{ name: 'asdf' }
		];
		(function() { parser.parse(tokens); }).should.throwError('Unrecognized token: asdf');
	});
});