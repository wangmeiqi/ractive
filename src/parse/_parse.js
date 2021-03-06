import { TEMPLATE_VERSION } from '../config/template';
import Parser from './Parser';
import readMustache from './converters/readMustache';
import readTriple from './converters/mustache/readTriple';
import readUnescaped from './converters/mustache/readUnescaped';
import readPartial from './converters/mustache/readPartial';
import readMustacheComment from './converters/mustache/readMustacheComment';
import readInterpolator from './converters/mustache/readInterpolator';
import readSection from './converters/mustache/readSection';
import readHtmlComment from './converters/readHtmlComment';
import readElement from './converters/readElement';
import readText from './converters/readText';
import readPartialDefinitionSection from './converters/readPartialDefinitionSection';
import readTemplate from './converters/readTemplate';
import cleanup from './utils/cleanup';
import insertExpressions from './utils/insertExpressions';
import { fromComputationString } from './utils/createFunction';

// See https://github.com/ractivejs/template-spec for information
// about the Ractive template specification

const STANDARD_READERS = [ readPartial, readUnescaped, readSection, readInterpolator, readMustacheComment ];
const TRIPLE_READERS = [ readTriple ];
const STATIC_READERS = [ readUnescaped, readSection, readInterpolator ]; // TODO does it make sense to have a static section?

export const READERS = [ readMustache, readHtmlComment, readElement, readText ];
export const PARTIAL_READERS = [ readPartialDefinitionSection ];

const StandardParser = Parser.extend({
	init ( str, options ) {
		const tripleDelimiters = options.tripleDelimiters || [ '{{{', '}}}' ];
		const staticDelimiters = options.staticDelimiters || [ '[[', ']]' ];
		const staticTripleDelimiters = options.staticTripleDelimiters || [ '[[[', ']]]' ];

		this.standardDelimiters = options.delimiters || [ '{{', '}}' ];

		this.tags = [
			{ isStatic: false, isTriple: false, open: this.standardDelimiters[0], close: this.standardDelimiters[1], readers: STANDARD_READERS },
			{ isStatic: false, isTriple: true,  open: tripleDelimiters[0],        close: tripleDelimiters[1],        readers: TRIPLE_READERS },
			{ isStatic: true,  isTriple: false, open: staticDelimiters[0],        close: staticDelimiters[1],        readers: STATIC_READERS },
			{ isStatic: true,  isTriple: true,  open: staticTripleDelimiters[0],  close: staticTripleDelimiters[1],  readers: TRIPLE_READERS }
		];

		this.contextLines = options.contextLines || 0;

		this.sortMustacheTags();

		this.sectionDepth = 0;
		this.elementStack = [];

		this.interpolate = {
			script: !options.interpolate || options.interpolate.script !== false,
			style: !options.interpolate || options.interpolate.style !== false,
			textarea: true
		};

		if ( options.sanitize === true ) {
			options.sanitize = {
				// blacklist from https://code.google.com/p/google-caja/source/browse/trunk/src/com/google/caja/lang/html/html4-elements-whitelist.json
				elements: 'applet base basefont body frame frameset head html isindex link meta noframes noscript object param script style title'.split( ' ' ),
				eventAttributes: true
			};
		}

		this.stripComments = options.stripComments !== false;
		this.preserveWhitespace = options.preserveWhitespace;
		this.sanitizeElements = options.sanitize && options.sanitize.elements;
		this.sanitizeEventAttributes = options.sanitize && options.sanitize.eventAttributes;
		this.includeLinePositions = options.includeLinePositions;
		this.textOnlyMode = options.textOnlyMode;
		this.csp = options.csp;
	},

	postProcess ( result ) {
		// special case - empty string
		if ( !result.length ) {
			return { t: [], v: TEMPLATE_VERSION };
		}

		if ( this.sectionDepth > 0 ) {
			this.error( 'A section was left open' );
		}

		cleanup( result[0].t, this.stripComments, this.preserveWhitespace, !this.preserveWhitespace, !this.preserveWhitespace );

		if ( this.csp !== false ) {
			const expr = {};
			insertExpressions( result[0].t, expr );
			if ( Object.keys( expr ).length ) result[0].e = expr;
		}

		return result[0];
	},

	converters: [
		readTemplate
	],

	sortMustacheTags () {
		// Sort in order of descending opening delimiter length (longer first),
		// to protect against opening delimiters being substrings of each other
		this.tags.sort( ( a, b ) => {
			return b.open.length - a.open.length;
		});
	}
});

export default function parse ( template, options ) {
	return new StandardParser( template, options || {} ).result;
}

parse.computedStrings = function( computed ) {
	if ( !computed ) return [];

	Object.keys( computed ).forEach( key => {
		const value = computed[ key ];
		if ( typeof value === 'string' ) {
			computed[ key ] = fromComputationString( value );
		}
	});
};
