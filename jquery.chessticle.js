(function(window, document, $) {

	function Chessticle($element, options) {
		this.$element = $element;
		this.type = 'fen' in options ? 'fen' : 'pgn';
		this.input = options[this.type];

		if (!this.input) {
			throw new Error('"fen" or "pgn" input is required');
		}
	}

	Chessticle.prototype = {
		render: function() {
			
		}
	};

	$.fn.chessticle = function(options) {
		return this.each(function() {
			var $this = $(this),
				chessticle = $this.data('chessticle'),
				method = typeof(options) === 'string' ? options : null;

			if (!chessticle) {
				$this.data('chessticle', chessticle = new Chessticle($this, options));
				method = 'render';
			}

			method && chessticle[method] && chessticle[method]();
		});
	};

}(window, document, jQuery));
