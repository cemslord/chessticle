(function(window, document, $) {

	function Chessticle($element, options) {
		this.$element = $element;
		this.input = options.input;
		this.imageSet = options.imageSet || 'alpha.ead-01';
		this.imageSize = options.imageSize || 40;
		this.imageCss = this.imageSet.replace(/\./g, '-') + '_' + this.imageSize;
		this.data = null;
		this.startingPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

		if (!this.input) {
			throw new Error('"fen" or "pgn" input is required');
		}
	}

	Chessticle.prototype = {
		parseFen: function(fen) {
			return fen.split(' ')[0].split('/').map(function(rank) {
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
			var $moveControls = $('<div/>').addClass('chessticle-move-controls');

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

			$boardContainer.append($board, $moveControls);

			$container
				.append($title, $boardContainer);

			this.$element.append($container);
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
