import { COMMENT } from '../../config/types';

var OPEN_COMMENT = '<!--',
	CLOSE_COMMENT = '-->';

export default function readHtmlComment ( parser ) {
	var start, content, endIndex, comment;

	start = parser.pos;

	if ( !parser.matchString( OPEN_COMMENT ) ) {
		return null;
	}

	endIndex = parser.indexOf( CLOSE_COMMENT );

	if ( endIndex === -1 ) {
		parser.error( 'Illegal HTML - expected closing comment sequence (\'-->\')' );
	}

	content = parser.substring( endIndex );
	parser.pos = endIndex + 3;

	comment = {
		t: COMMENT,
		c: content
	};

	if ( parser.includeLinePositions ) {
		comment.p = parser.getLinePos( start );
	}

	return comment;
}
