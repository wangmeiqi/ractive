import { BOOLEAN_LITERAL } from '../../../../../config/types';

export default function readBooleanLiteral ( parser ) {
	if ( parser.matchString( 'true' ) ) {
		return {
			t: BOOLEAN_LITERAL,
			v: 'true'
		};
	}

	if ( parser.matchString( 'false' ) ) {
		return {
			t: BOOLEAN_LITERAL,
			v: 'false'
		};
	}

	return null;
}
