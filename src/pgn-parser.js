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

function PgnToken(type, value) {
	this.type = type;
	this.value = value;
}

function PgnLexer() {
	this.index = -1;
	this.input = '';
	this.tokens = [];
}

PgnLexer.prototype = {
	reset: function() {

	},

	lex: function(input) {
		this.reset();
		this.input = input || '';
		var current;
		while (current = this.input.charAt(++this.index)) {

		}

		return this.tokens;
	}
};

function PgnParser(lexer) {
	this.lexer = lexer || new PgnLexer();
}

PgnParser.prototype = {
	parse: function(input) {
		var tokens = this.lexer.lex(input);
		var result = {
			tags: {},
			moves: {
				white: [],
				black: []
			}
		};

		for (var i = 0; i < tokens.length; i++) {
			//do stuff
		}

		return result;
	}
};

exports.parse = function() {

};