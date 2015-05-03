import Context from './Context';
import ComputationStore from '../stores/ComputationStore';
import Computation from '../Computation/Computation';

class ComputationModel extends Context {

	constructor ( key, signature, owner, initialValue ) {

		// TODO: this should be easy(ier) to unwind now...
		var computation = new Computation( owner, signature, initialValue );
		var store = new ComputationStore( computation );
		store.computation.setModel( this );
		super ( key, store );
	}

	mark () {
		this.store.invalidate();
		super.mark();
	}
}

export default ComputationModel;