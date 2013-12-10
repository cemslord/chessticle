function createToken(name, value) {
	return {
		name: name,
		value: value
	};
}

function Lexer() {
	this.reset();
}

Lexer.prototype = {
	reset: function() {
		this.index = -1;
		this.input = '';
		this.tokens = [];
	},

	readTo: function(char, throwOnNotFound) {
		var originalIndex = this.index;
		this.index = this.input.indexOf(char, originalIndex);
		if (this.index === -1) {
			if (throwOnNotFound) {
				throw new Error('Expected to find "' + char + '" after ' + originalIndex);
			}

			this.index = this.input.length;
		}

		return this.input.substring(originalIndex, this.index);
	},

	readRegex: function(regex, throwOnError) {
		var match = regex.exec(this.input.substring(this.index));
		if (!match) {
			if (throwOnError) {
				throw new Error('Error in lexer, please report this to https://github.com/tmont/chessticle/issues');
			}

			return null;
		}

		this.index += match[0].length - 1;
		return match && match[0];
	},

	readString: function() {
		var current, value = '', terminated = false, start = this.index;
		whileLoop: while (current = this.input.charAt(++this.index)) {
			switch (current) {
				case '\\':
					var next = this.input.charAt(this.index + 1);
					if (next === '\\' || next === '"') {
						//escaped backslash or double-quote
						value += next;
						this.index++;
					} else {
						value += current;
					}
					break;
				case '"':
					terminated = true;
					break whileLoop;
				default:
					value += current;
					break;
			}
		}

		if (!terminated) {
			throw new Error('Unterminated string at ' + start);
		}

		return value;
	},

	readNag: function() {
		var nag = this.readRegex(/\$\d+/, false);
		if (!nag) {
			throw new Error('Expected numeric annotation glyph at ' + this.index);
		}

		return nag;
	},

	sanitizeInput: function(input) {
		if (!input) {
			return '';
		}

		return input.replace(/(\r\n|\r)/g, '\n');
	},

	lex: function(input) {
		this.reset();
		this.input = this.sanitizeInput(input);
		var current;
		while (current = this.input.charAt(++this.index)) {
			switch (current) {
				case ';':
					this.tokens.push(createToken('commentary', this.readTo('\n', false).substring(1)));
					break;
				case '.':
					this.tokens.push(createToken('periods', this.readRegex(/\.+/, true)));
					break;
				case '<':
				case '>':
					this.tokens.push(createToken('reserved', current));
					break;
				case '(':
					this.tokens.push(createToken('open-paren', current));
					break;
				case ')':
					this.tokens.push(createToken('close-paren', current));
					break;
				case '{':
					this.tokens.push(createToken('commentary', this.readTo('}', true).substring(1)));
					break;
				case '[':
					this.tokens.push(createToken('open-bracket', current));
					break;
				case ']':
					this.tokens.push(createToken('close-bracket', current));
					break;
				case '$':
					this.tokens.push(createToken('nag', this.readNag()));
					break;
				case '*':
					this.tokens.push(createToken('asterisk', current));
					break;
				case '"':
					this.tokens.push(createToken('string', this.readString()));
					break;
				default:
					if (/[a-zA-Z0-9]/.test(current)) {
						var symbol = this.readRegex(/[a-zA-Z0-9][-\w+#=:]*/, true);
						this.tokens.push(createToken(/^\d+$/.test(symbol) ? 'integer' : 'symbol', symbol));
					} else if (current === '%') {
						if (this.index === 0 || this.input.charAt(this.index - 1) === '\n') {
							this.tokens.push(createToken('escape', this.readTo('\n', false).substring(1)));
						}
					} else if (!/\s/.test(current)) {
						throw new Error(
							'Invalid input character "' + current +
							'" (code point: ' + current.charCodeAt(0) + ') at ' + this.index
						);
					}
					break;
			}
		}

		return this.tokens;
	}
};

module.exports = Lexer;