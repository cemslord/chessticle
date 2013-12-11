var Lexer = require('./src/lexer'),
	Parser = require('./src/parser');

module.exports = {
	Lexer: Lexer,
	Parser: Parser,
	parse: function(input) {
		return new Parser().parse(new Lexer().lex(input));
	}
};