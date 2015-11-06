import { CLOSING } from '../../../../config/types';

export default function readClosing ( parser, tag ) {
	var start, index, closing;

	start = parser.pos;

	if ( !parser.matchString( tag.open ) ) {
		return null;
	}

	parser.allowWhitespace();

	if ( !parser.matchString( '/' ) ) {
		parser.pos = start;
		return null;
	}

	parser.allowWhitespace();

	index = parser.indexOf( tag.close );

	if ( index !== -1 ) {
		closing = {
			t: CLOSING,
			r: parser.substring( index ).split( ' ' )[0]
		};

		parser.pos = index;

		if ( !parser.matchString( tag.close ) ) {
			parser.error( `Expected closing delimiter '${tag.close}'` );
		}

		return closing;
	}

	parser.pos = start;
	return null;
}
