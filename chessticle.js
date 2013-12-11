!function(e){"object"==typeof exports?module.exports=e():"function"==typeof define&&define.amd?define(e):"undefined"!=typeof window?window.chessticle=e():"undefined"!=typeof global?global.chessticle=e():"undefined"!=typeof self&&(self.chessticle=e())}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Lexer = require('./src/lexer'),
	Parser = require('./src/parser');

module.exports = {
	Lexer: Lexer,
	Parser: Parser,
	parse: function(input) {
		return new Parser().parse(new Lexer().lex(input));
	}
};
},{"./src/lexer":2,"./src/parser":3}],2:[function(require,module,exports){
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

		return nag.substring(1);
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
						var symbol = this.readRegex(/[a-zA-Z0-9][-\w+#=:\/!?]*/, true);
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
},{}],3:[function(require,module,exports){
// spec details: http://www6.chessclub.com/help/PGN-spec

/**
 *   WhiteTitle, BlackTitle: "FM, "GM", "IM", "-", etc.
 *   WhiteElo, BlackElo: integer or "-"
 *   WhiteUSCF, BlackUSCF: integer or "-"
 *   WhiteNA, BlackNA: string (email or network address)
 *   WhiteType, BlackType: "human" or "program"
 *   EventDate: date (similar to Date tag)
 *   EventSponsor: string
 *   Section: string ("Open", "Reserve", etc.)
 *   Stage: string ("Preliminary", "Semifinal", etc.)
 *   Board: integer (board number in tournament event)
 *   Opening: string ("v0" opcode)
 *   Variation: string ("v1" opcode)
 *   SubVariation: string ("v2" opcode)
 *   ECO: string ([A-E]\d\d)(/[A-E]\d\d)?
 *   NIC: string
 *   Time: string in HH:MM:SS
 *   UTCTime: string in HH:MM:SS
 *   UTCDate: value of Date tag in UTC
 *   TimeControl: (\?|-|\d+/\d+|\d+|\d+\+\d+|\*\d+)
 *   SetUp: (0|1) (0: normal starting position; 1: starts from position given in FEN tag)
 *   FEN: string
 *   Termination: "abandoned", "adjudication", "death", "emergency", "normal",
 *                "rules infraction", "time forfeit", "unterminated"
 *   Annotator: string
 *   Mode: string (e.g. "OTB", "PM", "EM", "UCS", "TC")
 *   PlyCount: integer
 */

function merge(obj1, obj2) {
	for (var key in obj2) {
		obj1[key] = obj2[key];
	}

	return obj1;
}

function Parser() {}

Parser.prototype = {
	ensureToken: function(token, name, validator) {
		if (!token) {
			throw new Error('Unexpected input termination: expected ' + name);
		}
		if (token.name !== name) {
			throw new Error('Unexpected token: ' + token.name + ' (expected ' + name + ')');
		}
		if (validator && !validator(token.value)) {
			throw new Error('Token value not valid');
		}
	},

	ensureTokens: function(tokens, i, expected) {
		for (var j = 0, data; j < expected.length; j++) {
			data = expected[j];
			this.ensureToken(
				tokens[i + j + 1],
				typeof(data) === 'string' ? data : data.type,
				data.validator
			);
		}
	},

	parse: function(tokens) {
		var data = {
			metadata: {},
			commentary: '',
			result: '*',
			moves: []
		};

		var token, i = -1, result, noMoreTags = false;
		while (token = tokens[++i]) {
			switch (token.name) {
				case 'open-bracket':
					if (noMoreTags) {
						throw new Error('Unexpected token: ' + token.name);
					}

					result = this.parseTagPair(tokens, i);
					data.metadata[result.name] = result.value;
					i = result.index;
					break;
				case 'close-bracket':
				case 'close-paren':
				case 'open-paren':
					//shouldn't ever encounter one of these that wasn't
					//handled by the open-bracket/open-paren case
					throw new Error('Unexpected token: ' + token.name);
				case 'commentary':
					//this will only occur if there is commentary before white's first move
					if (noMoreTags) {
						throw new Error('Unexpected token: ' + token.name);
					}

					data.commentary += token.value;
					break;
				case 'integer':
					//movetext begins
					noMoreTags = true;
					break;
				case 'periods':
				case 'escape':
					break;
				case 'symbol':
				case 'asterisk':
					if (!noMoreTags) {
						throw new Error('Unexpected token: ' + token.name);
					}

					result = this.parseHalfMove(tokens, i);
					i = result.index;
					if (result.result) {
						data.result = result.result;
					} else {
						data.moves.push(result.move);
					}
					break;
				default:
					throw new Error('Unrecognized token: ' + token.name);
			}
		}

		return data;
	},

	parseHalfMove: function(tokens, i) {
		//expect integer + periods + symbol OR integer + symbol
		var result = {
			index: i,
			move: {
				san: null,
				commentary: '',
				variations: []
			}
		};

		var token = tokens[i];
		if (!token || (token.name !== 'symbol' && token.name !== 'asterisk')) {
			throw new Error('Expected token "symbol" or "asterisk"');
		}

		//is it a game termination marker?
		var gtm = [ '1-0', '0-1', '1/2-1/2' ];
		if (gtm.indexOf(token.value) !== -1 || token.name === 'asterisk') {
			//game termination marker
			return {
				index: i,
				result: token.value
			};
		}

		result.move.san = token.value;

		//this probably totally works and is totally maintainable forever
		var sanRegex = /^(?:([PNBRQK])?([a-h]|[1-8]|[a-h][1-8])?(x)?([a-h][1-8])(?:=([A-Z]))?|(^O-O(?:-O)?))(\+\+?|#)?([!?]{1,2})?$/,
			match = sanRegex.exec(result.move.san);

		if (!match) {
			throw new Error('Half-move is not in standard algebraic notation: ' + result.move.san);
		}

		var moveData = {
			piece: match[1] || null,
			origin: match[2] || null,
			capturing: !!match[3],
			target: match[4] || null,
			promotion: match[5] || null,
			kingSideCastle: match[6] === 'O-O',
			queenSideCastle: match[6] === 'O-O-O',
			check: !!match[7] && match[7] === '+',
			checkmate: !!match[7] && (match[7] === '++' || match[7] === '#')
		};

		if (!moveData.piece &&
			!moveData.origin &&
			!moveData.target &&
			!moveData.kingSideCastle &&
			!moveData.queenSideCastle) {
			throw new Error('Half-move is not in standard algebraic notation: ' + result.move.san);
		}

		if (moveData.promotion) {
			if (moveData.piece && moveData.piece !== 'P') {
				throw new Error('Only pawns can promote');
			}
			if (!/[NBRQ]/.test(moveData.promotion)) {
				throw new Error('Invalid promotion, must be one of N, B, R or Q');
			}
		}

		if (moveData.piece === 'K' && (moveData.check || moveData.checkmate)) {
			throw new Error('Kings cannot give check' + (moveData.checkmate ? 'mate' : ''));
		}

		//TODO make sure it's not an illegal move
		// - validate king doesn't move into check(mate)
		// - validate absolute pins
		// - validate move trajectory
		// - validate move doesn't go to an occupied square without a capture
		// - etc.

		merge(result.move, moveData);

		//is there a NAG?
		var next = tokens[i + 1];
		if (match[8]) {
			switch (match[8]) {
				case '!':  result.move.nag = 1; break;
				case '?':  result.move.nag = 2; break;
				case '!!': result.move.nag = 3; break;
				case '??': result.move.nag = 4; break;
				case '!?': result.move.nag = 5; break;
				case '?!': result.move.nag = 6; break;
			}
		} else if (next && next.name === 'nag') {
			result.move.nag = Number(next.value);
			if (isNaN(result.move.nag) || result.move.nag > 255) {
				throw new Error('Invalid NAG value: ' + result.move.nag);
			}
			i++;
		}

		next = tokens[i + 1];

		if (next && next.name === 'commentary') {
			result.move.commentary = next.value;
			i++;
			next = tokens[i + 1];
		}

		while (next && next.name === 'open-paren') {
			var data = this.parseVariation(tokens, i + 1);
			result.move.variations.push(data.variation);
			i = data.index;
			next = tokens[i + 1];
		}

		result.index = i;
		return result;
	},

	parseVariation: function(tokens, i) {
		var variation = {
			commentary: '',
			moves: []
		};
		var next = tokens[i + 1];
		if (!next || (next.name !== 'integer' && next.name !== 'commentary')) {
			throw new Error('Expected token "integer" or "commentary"');
		}

		if (next.name === 'commentary') {
			variation.commentary = next.value;
			i++;
			next = tokens[i + 1];
			if (!next || next.name !== 'integer') {
				throw new Error('Expected token "integer"');
			}
		}

		var closeParenFound = false;
		while (next = tokens[++i]) {
			if (next.name === 'close-paren') {
				//variation is complete
				closeParenFound = true;
				break;
			}

			if (next.name === 'integer' || next.name === 'periods') {
				//TODO this allows bogus things like "1. 2. 3. 4. d4"
				continue;
			}

			var halfMove = this.parseHalfMove(tokens, i);
			i = halfMove.index;
			variation.moves.push(halfMove.move);
		}

		if (!closeParenFound) {
			throw new Error('Expected token "close-paren"');
		}

		return {
			index: i,
			variation: variation
		};
	},

	parseTagPair: function(tokens, i) {
		//expect open-bracket + symbol + string + close-bracket
		this.ensureTokens(tokens, i, [ 'symbol', 'string', 'close-bracket' ]);

		return {
			index: i + 3,
			name: tokens[i + 1].value,
			value: tokens[i + 2].value
		};
	}
};

module.exports = Parser;

},{}]},{},[1])
(1)
});
;