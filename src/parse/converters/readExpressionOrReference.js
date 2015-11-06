import readExpression from './readExpression';
import readReference from './expressions/primary/readReference';

export default function readExpressionOrReference ( parser, expectedFollowers ) {
	var start, expression, i;

	start = parser.pos;
	expression = readExpression( parser );

	if ( !expression ) {
		return null;
	}

	for ( i = 0; i < expectedFollowers.length; i += 1 ) {
		if ( parser.matchString( expectedFollowers[i], false ) ) {
			return expression;
		}
	}

	parser.pos = start;
	return readReference( parser );
}
