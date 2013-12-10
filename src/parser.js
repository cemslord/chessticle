// spec details: http://www6.chessclub.com/help/PGN-spec

/**
 * commentary: ";" to end of line, or between "{" and "}"
 * escape: "%" on first column of line to the end of the line
 * tokens:
 *  string: delimited by double quotes (max length = 255), no newlines or TABs
 *  integer: \d+
 *  period: "." (move number indications)
 *  asterisk: "*" (game termination marker)
 *  bracket: "[" or "]" (tag pair delimiter)
 *  paren: "(" or ")" (delimiters for recursive annotation variations)
 *  reserved: "<" or ">"
 *  numeric annotation glyph: $ + integer, where integer is 0-255
 *  symbol: [a-zA-Z0-9][-\w+#=:]*
 *
 *  tag pairs: "[" + (ws) + tag_name + (ws) + string + (ws) + "]"
 *    tag_name: \w+
 *    string: ":" as a delimiter for multiple strings in one string value
 *  seven tag roster: Event, Site, Date, Round, White, Black, Result
 *    Date: [\d?]{4}\.[\d?]{2}\.[\d?]{2}
 *    Result: "0-1", "1-0", "1/2-1/2", "*"
 *  movetext: integer + "."*
 *  standard algebraic notation: ([PNBRQK]([a-h]|[1-8]|[a-h][1-8])?x?[a-h][1-8](=[NBRQ])?|O-O|O-O-O)(+|#)?
 *    shortest: two characters, e.g. "d4"
 *    longest: seven characters, e.g. Qa6xb7# or fxg1=Q+
 *  move suffix annotations: [!?]{,2}
 *  game termination marker: "1-0", "0-1", "1/2-1/2", "*"
 *
 * other tags:
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

function Parser(lexer) {
}

Parser.prototype = {
	ensureToken: function(token, name, validator) {
		if (!token) {
			throw new Error('Unexpected input termination: expected ' + name);
		}
		if (token.name !== name) {
			throw new Error('Unexpected token: ' + token.type + ' (expected ' + name + ')');
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
					i += result.unrolled;
					break;
				case 'escape':
					//meh, don't care about escaped stuff
					break;
				case 'close-bracket':
				case 'close-paren':
					//shouldn't ever encounter one of these that wasn't
					//handled by the open-bracket/open-paren case
					throw new Error('Unexpected token: ' + token.name);
				case 'commentary':
					break;
				case 'integer':
					if (!noMoreTags) {
						//movetext begins
						noMoreTags = true;
					}

					result = this.parseHalfMove(tokens, i);
					i += result.unrolled;
					data.moves.push(result.moveData);
					break;
				case 'open-paren':
					//variation...
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
			unrolled: 2,
			san: null
		};
		try {
			this.ensureTokens(tokens, i, [ 'periods', 'symbol' ]);
			result.san = tokens[i + 2].value;
		} catch (e) {
			this.ensureTokens(tokens, i, [ 'symbol' ]);
			result.unrolled = 1;
			result.san = tokens[i + 1].value;
		}

		//validate move
		//this probably totally works and is totally maintainable forever
		var sanRegex = /(?:([PNBRQK])?([a-h]|[1-8]|[a-h][1-8])?(x)?([a-h][1-8])(?:=([A-Z]))?|(^O-O(?:-O)?))(\+\+?|#)?/,
			match = sanRegex.exec(result.san);

		if (!match) {
			throw new Error('Half-move is not in standard algebraic notation: ' + result.san);
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
			throw new Error('Half-move is not in standard algebraic notation: ' + result.move);
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

		result.moveData = moveData;
		return result;
	},

	parseTagPair: function(tokens, i) {
		//expect open-bracket + symbol + string + close-bracket
		this.ensureTokens(tokens, i, [ 'symbol', 'string', 'close-bracket' ]);

		return {
			unrolled: 3,
			name: tokens[i + 1].value,
			value: tokens[i + 2].value
		};
	}
};

Parser.parse = function(input) {
	return new Parser().parse(input);
};

module.exports = Parser;
