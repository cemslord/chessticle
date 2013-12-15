(function(window, document, $) {

	function Chessticle($element, options) {
		this.$element = $element;
		this.input = options.input;
		this.imageSet = options.imageSet || 'alpha.ead-01';
		this.imageSize = options.imageSize || 40;
		this.imageCss = this.imageSet.replace(/\./g, '-') + '_' + this.imageSize;
		this.data = null;
		this.startingPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
		this.currentPly = -1;
	}

	Chessticle.prototype = {
		parseFen: function(fen) {
			var fenParts = fen.split(' ');
			var board = fenParts[0].split('/').map(function(rank) {
				var chars = rank.split(''),
					files = [];
				for (var i = 0; i < chars.length; i++) {
					if (/\d/.test(chars[i])) {
						var spaces = Number(chars[i]);
						for (var j = 0; j < spaces.length; j++) {
							files.push('');
						}
					} else if (/[A-Z]/.test(chars[i])) {
						//white piece
						files.push('w' + chars[i].toLowerCase());
					} else {
						//black piece
						files.push('b' + chars[i]);
					}
				}

				return files;
			});

			return {
				fen: fen,
				board: board,
				toMove: fenParts[1],
				wKingSideCastle: fenParts[2].indexOf('K') !== -1,
				wQueenSideCastle: fenParts[2].indexOf('Q') !== -1,
				bKingSideCastle: fenParts[2].indexOf('k') !== -1,
				bQueenSideCastle: fenParts[2].indexOf('q') !== -1,
				enPassantTarget: fenParts[3] !== '-' ? fenParts[3] : null,
				halfmoveClock: Number(fenParts[4]),
				moveNumber: Number(fenParts[5])
			};
		},

		render: function() {
			if (this.$element.find('.chessticle-container').length) {
				return;
			}

			this.data = window.chessticle.parse(this.input);

			if (this.data.metadata.fen) {
				this.startingPosition = this.data.metadata.Fen;
			}

			var position = this.parseFen(this.startingPosition);
			var $container = $('<div/>').addClass('chessticle-container');
			var $title = $('<div/>').addClass('chessticle-title');
			var $boardContainer = $('<div/>').addClass('chessticle-board-container');
			var $board = $('<table/>').addClass('chessticle-board').addClass('chessticle-board-' + this.imageCss);
			var $moveControls = $('<ul/>').addClass('chessticle-move-controls');

			var ranks = [ 1, 2, 3, 4, 5, 6, 7, 8 ],
				files = [ 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h' ];

			for (var i = ranks.length - 1; i >= 0; i--) {
				var rank = ranks[i],
					$tr = $('<tr/>');
				for (var j = 0; j < files.length; j++) {
					var file = files[j];
					var $td = $('<td/>').attr('data-square', file + rank);
					if ((i % 2 === 0 && j % 2 === 1) || (i % 2 === 1 && j % 2 === 0)) {
						$td.addClass('chessticle-light-square');
					} else {
						$td.addClass('chessticle-dark-square');
					}
					if (position[ranks.length - i - 1][j]) {
						var cls = 'chessticle-piece-' + this.imageCss + '-' + position[ranks.length - i - 1][j];
						$('<div/>')
							.addClass(cls)
							.appendTo($td);
					}
					$tr.append($td);
				}
				$board.append($tr);
			}

			$('<li/>').addClass('chessticle-prev').click($.proxy(this.previousMove, this)).appendTo($moveControls);
			$('<li/>').addClass('chessticle-next').click($.proxy(this.nextMove, this)).appendTo($moveControls);

			$boardContainer.append($board, $moveControls);
			$container.append($title, $boardContainer);

			this.$element.append($container);
		},

		validateMove: function(origin, piece, target) {
			switch (piece) {
				case 'p':
					break;
				case 'n':
					break;
				case 'b':
					break;
				case 'r':
					break;
				case 'q':
					break;
				case 'k':
					break;
			}
		},

		findOriginForMove: function(move) {
			//TODO account for FEN starting positions
			var color = !!(this.currentPly % 2) ? 'b' : 'w',
				self = this,
				piece = color + (move.piece || 'p').toLowerCase(),
				rank = null,
				file = null,
				$board = this.$element.find('.chessticle-board'),
				$target = $board.find('td[data-square="' + move.target + '"]'),
				$squares = $();

			if (!$target.length) {
				//wat?
				throw new Error('Invalid target');
			}

			if (move.origin) {
				rank = (/\d/.exec(move.origin) || [])[0];
				file = (/[a-h]/.exec(move.origin) || [])[0];
			}

			if (rank && file) {
				$squares = $board.find('td[data-square="' + file + rank + '"]');
			} else if (rank) {
				$squares = $board.find('td[data-square*="' + rank + '"]');
			} else if (file) {
				$squares = $board.find('td[data-square*="' + file + '"]');
			} else {
				//search the entire board
				$squares = $board.find('td[data-square]');
			}

			$squares = $squares
				.filter(function() {
					//make sure the piece that's trying to move actually exists on the square
					return $(this).find('[class$="' + piece + '"]').length;
				});

			switch ($squares.length) {
				case 1: return $squares;
				case 0: return $();
				default:
					//more than one possible piece, so see which one can actually move
					//to the target
					return $squares.filter(function() {
						return self.validateMove($(this).data('square'), piece, move.target);
					});
					break;
			}
		},

		nextMove: function() {
			if (this.currentPly === this.data.moves.length) {
				return;
			}

			var move = this.data.moves[++this.currentPly];
			if (move.result) {
				return;
			}

			if (move.kingSideCastle) {

			} else if (move.queenSideCastle) {

			} else {
				var $origin = this.findOriginForMove(move);
				if (!$origin.length) {
					throw new Error('Invalid move');
				}
			}
		},

		previousMove: function() {
			if (this.currentPly <= 0) {
				return;
			}

			var move = this.data.moves[--this.currentPly];
			console.log(move);
		},

		destroy: function() {
			this.$element.find('.chessticle-container').remove();
		}
	};

	$.fn.chessticle = function(options) {
		return this.each(function() {
			var $this = $(this),
				chessticle = $this.data('chessticle'),
				method = typeof(options) === 'string' ? options : null;

			if (!chessticle) {
				$this.data('chessticle', chessticle = new Chessticle($this, options || {}));
				method = 'render';
			}

			method && chessticle[method] && chessticle[method]();
		});
	};

}(window, document, jQuery));
