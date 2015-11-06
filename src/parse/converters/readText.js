import { getRegExp } from './utils/getLowestIndex';
import { decodeCharacterReferences } from '../../utils/html';

export default function readText ( parser ) {
	var index, disallowed, barrier, result;

	if ( parser.textOnlyMode ) {
		disallowed = parser.tags.map( t => t.open );
		disallowed = disallowed.concat( parser.tags.map( t => '\\' + t.open ) );

		index = parser.indexOf( getRegExp( disallowed ) );
	} else {
		barrier = parser.inside ? '</' + parser.inside : '<';

		if ( parser.inside && !parser.interpolate[ parser.inside ] ) {
			index = parser.indexOf( barrier );
		} else {
			disallowed = parser.tags.map( t => t.open );
			disallowed = disallowed.concat( parser.tags.map( t => '\\' + t.open ) );

			// http://developers.whatwg.org/syntax.html#syntax-attributes
			if ( parser.inAttribute === true ) {
				// we're inside an unquoted attribute value
				disallowed.push( `"`, `'`, `=`, `<`, `>`, '`' );
			} else if ( parser.inAttribute ) {
				// quoted attribute value
				disallowed.push( parser.inAttribute );
			} else {
				disallowed.push( barrier );
			}

			index = parser.indexOf( getRegExp( disallowed ) );
		}
	}

	if ( !index ) {
		return null;
	}

	if ( index === -1 ) {
		index = parser.str.length;
	}

	if ( ( parser.inside && parser.inside !== 'textarea' ) || parser.textOnlyMode ) {
		result = parser.substring( index );
	} else {
		result = decodeCharacterReferences( parser.substring( index ) );
	}

	parser.pos = index;

	return result;
}
