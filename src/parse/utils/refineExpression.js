import { REFERENCE, BRACKETED, NUMBER_LITERAL, MEMBER, REFINEMENT } from 'config/types';
import flattenExpression from './flattenExpression';

var arrayMemberPattern = /^[0-9][1-9]*$/;

export default function refineExpression ( expression, mustache ) {
	var referenceExpression;

	if ( expression ) {
		// While the expression is bracketed and a child expression exists
		while ( expression.t === BRACKETED && expression.x ) {
			// Set the expression to its child expression
			expression = expression.x;
		}

		// special case - integers should be treated as array members references,
		// rather than as expressions in their own right

		// The expression is a reference
		if ( expression.t === REFERENCE ) {
			// Set the mustache reference to the expression name.
			mustache.r = expression.n;
		} else {
			// The expression is a number and looks like an array member
			if ( expression.t === NUMBER_LITERAL && arrayMemberPattern.test( expression.v ) ) {
				// Set the mustache reference to the expression's event directives
				mustache.r = expression.v;
			}

			// The expression is a reference expression
			else if ( referenceExpression = getReferenceExpression( expression ) ) {
				// Set the mustache's reference expression to the expression's reference expression
				mustache.rx = referenceExpression;
			} else {
				// Set the mustache's expression to the flattened expression
				mustache.x = flattenExpression( expression );
			}
		}

		return mustache;
	}
}

// TODO refactor this! it's bewildering
function getReferenceExpression ( expression ) {
	var members = [], refinement;

	// While the expression is a 'member' and the expression's reference is a 'refinement'
	while ( expression.t === MEMBER && expression.r.t === REFINEMENT ) {
		// Set refinement to the expression's reference
		refinement = expression.r;

		// If the reference has an expression
		if ( refinement.x ) {
			// If the reference's expression is a reference
			if ( refinement.x.t === REFERENCE ) {
				// Add the reference to members
				members.unshift( refinement.x );
			} else {
				// Add the flattened expression to members
				members.unshift( flattenExpression( refinement.x ) );
			}
		} else {
			// Add the reference name to members
			members.unshift( refinement.n );
		}

		// Set the expression to its child expression
		expression = expression.x;
	}

	// If the deepest child expression is not a reference
	if ( expression.t !== REFERENCE ) {
		return null;
	}

	return {
		r: expression.n,
		m: members
	};
}