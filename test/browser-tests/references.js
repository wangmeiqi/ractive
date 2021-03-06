import { test } from 'qunit';
import { initModule, onWarn } from './test-config';
import { fire } from 'simulant';

export default function() {
	initModule( 'references.js' );

	test( '@index special ref finds the nearest index', t => {
		new Ractive({
			el: fixture,
			template: '{{#each outer}}{{#each .list}}{{@index}}{{/each}}{{/each}}',
			data: {
				outer: [ {}, {}, { list: [ 0, 0, 0 ] }, {} ]
			}
		});

		t.htmlEqual( fixture.innerHTML, '012' );
	});

	test( '@key special ref finds the nearest key', t => {
		new Ractive({
			el: fixture,
			template: '{{#each outer}}{{#each .list}}{{@key}}{{/each}}{{/each}}',
			data: {
				outer: { one: {}, two: {}, three: { list: { a: 1, b: 1, c: 1 } }, four: {} }
			}
		});

		t.htmlEqual( fixture.innerHTML, 'abc' );
	});

	test( 'component @keypath references should be relative to the component', t => {
		const cmp = Ractive.extend({
			template: '{{#with foo.bar}}{{@keypath}}{{/with}}'
		});

		new Ractive({
			el: fixture,
			template: '<cmp foo="{{baz.bat}}" />',
			data: {
				baz: { bat: { bar: 'yep' } }
			},
			components: { cmp }
		});

		t.htmlEqual( fixture.innerHTML, 'foo.bar' );
	});

	test( 'nested component @keypath references should be relative to the nested component', t => {
		const cmp1 = Ractive.extend({
			template: '{{#with foo.bar}}{{@keypath}}{{/with}}'
		});
		const cmp2 = Ractive.extend({
			template: '{{#with baz.bat}}<cmp1 foo="{{.}}" />{{/with}}',
			components: { cmp1 }
		});

		new Ractive({
			el: fixture,
			template: '<cmp2 baz="{{~/bop}}" />',
			data: {
				bop: { bat: { bar: 'yep' } }
			},
			components: { cmp2 }
		});

		t.htmlEqual( fixture.innerHTML, 'foo.bar' );
	});

	test( 'component @rootpath references should be relative to the root', t => {
		const cmp = Ractive.extend({
			template: '{{#with foo.bar}}{{@rootpath}}{{/with}}'
		});

		new Ractive({
			el: fixture,
			template: '<cmp foo="{{baz.bat}}" />',
			data: {
				baz: { bat: { bar: 'yep' } }
			},
			components: { cmp }
		});

		t.htmlEqual( fixture.innerHTML, 'baz.bat.bar' );
	});

	test( 'instance property shortcut @.foo === @this.foo', t => {
		new Ractive({
			el: fixture,
			template: '{{@.foo}} {{@.bar.baz}}',
			foo: 'foo',
			bar: { baz: 'baz' }
		});

		t.htmlEqual( fixture.innerHTML, 'foo baz' );
	});

	test( 'instance shortcut in event handlers', t => {
		const r = new Ractive({
			target: fixture,
			template: `<button on-click="@.set('foo', 'yep')">click me</button>`
		});

		fire( r.find( 'button' ), 'click' );

		t.equal( r.get( 'foo' ), 'yep' );
	});

	test( 'calling set with an instance property shortcut', t => {
		const r = new Ractive({
			el: fixture,
			template: '{{@.foo}} {{@.bar.baz}}',
		});

		// just checking
		r.set( '@.nope.not', '???' );

		r.set( '@.foo', 'foo' );
		r.set( '@.bar.baz', 'baz' );

		t.htmlEqual( fixture.innerHTML, 'foo baz' );
	});

	test( `can't set with one of the reserved read-only special refs`, t => {
		const r = new Ractive({});
		t.throws( () => r.set( '@index', true ), /invalid keypath/ );
		t.throws( () => r.set( '@key', true ), /invalid keypath/ );
		t.throws( () => r.set( '@keypath', true ), /invalid keypath/ );
		t.throws( () => r.set( '@rootpath', true ), /invalid keypath/ );
	});

	test( 'context popping with ^^/', t => {
		new Ractive({
			el: fixture,
			template: '{{#with some.path}}{{#with ~/other}}{{^^/foo}}{{#with .foo}}{{" " + ^^/^^/foo}}{{/with}}{{/with}}{{/with}}',
			data: {
				some: {
					path: { foo: 'yep' }
				},
				other: {
					foo: 'nope'
				}
			}
		});

		t.htmlEqual( fixture.innerHTML, 'yep yep' );
	});

	test( 'context popping with path popping ^^/../', t => {
		new Ractive({
			el: fixture,
			template: '{{#with some.path}}{{#with ~/other}}{{^^/../up.foo}}{{#with .foo}}{{" " + ^^/^^/../up.foo}}{{/with}}{{/with}}{{/with}}',
			data: {
				some: {
					path: { foo: 'no' },
					up: { foo: 'yep' }
				},
				other: {
					foo: 'nope'
				}
			}
		});

		t.htmlEqual( fixture.innerHTML, 'yep yep' );
	});

	test( 'direct ancestor reference to a context', t => {
		const bar = { baz: 'yep' };
		new Ractive({
			el: fixture,
			template: '{{#with foo.bar.baz}}{{JSON.stringify(../)}}{{/with}}',
			data: { foo: { bar } }
		});

		t.htmlEqual( fixture.innerHTML, JSON.stringify( bar ) );
	});

	test( 'direct context pop reference to a context', t => {
		const bar = { baz: 'yep' };
		new Ractive({
			el: fixture,
			template: '{{#with foo.bar}}{{#with ~/other}}{{JSON.stringify(^^/)}}{{/with}}{{/with}}',
			data: { foo: { bar }, other: { foo: 'nope' } }
		});

		t.htmlEqual( fixture.innerHTML, JSON.stringify( bar ) );
	});

	test( 'direct context pop and ancestor reference to a context', t => {
		const bar = { baz: 'yep' };
		new Ractive({
			el: fixture,
			template: '{{#with foo.bar.baz}}{{#with ~/other}}{{JSON.stringify(^^/../)}}{{/with}}{{/with}}',
			data: { foo: { bar }, other: { foo: 'nope' } }
		});

		t.htmlEqual( fixture.innerHTML, JSON.stringify( bar ) );
	});

	test( '@shared special refers to ractive-only global state', t => {
		const r1 = new Ractive();
		const r2 = new Ractive();

		r1.set( '@shared.foo', 'bar' );
		t.equal( r2.get( '@shared.foo' ), 'bar' );
	});

	test( 'by default instance members resolve after ambiguous context', t => {
		new Ractive({
			target: fixture,
			template: '{{foo}} {{#with 1 as foo}}{{foo}}{{/with}} {{#with bar}}{{#with ~/other}}{{foo}}{{/with}}{{/with}}',
			data: {
				bar: { foo: 'yep' },
				other: {}
			},
			foo: 'hey'
		});

		t.htmlEqual( fixture.innerHTML, 'hey 1 yep' );
	});

	test( 'instance members are not resolved if resolveInstanceMembers is false', t => {
		new Ractive({
			target: fixture,
			template: '{{foo}}?',
			foo: 'hey',
			resolveInstanceMembers: false
		});

		t.htmlEqual( fixture.innerHTML, '?' );
	});

	test( 'if asked, ractive will issue warnings about ambiguous references', t => {
		t.expect( 4 );

		onWarn( w => {
			t.ok( /resolved.*is ambiguous/.test( w ) );
			onWarn( w => {
				t.ok( /resolved.*is ambiguous and will create a mapping/.test( w ) );
				onWarn( w => {
					t.ok( /is ambiguous and did not resolve/.test( w ) );
				});
			});
		});

		const cmp = Ractive.extend({
			template: '{{foo}}',
			warnAboutAmbiguity: true
		});
		new Ractive({
			target: fixture,
			template: '{{#with some}}{{#with ~/other}}{{foo}}{{/with}}{{/with}}<cmp />{{nope}}',
			data: {
				some: {},
				other: {},
				foo: 'yep'
			},
			components: { cmp },
			warnAboutAmbiguity: true
		});

		t.htmlEqual( fixture.innerHTML, 'yepyep' );
	});

	test( 'component tree root data can be accessed with @.root.data (#2432)', t => {
		const cmp = Ractive.extend({
			template: '{{#with some.path}}{{~/foo}} {{@.root.data.foo}}{{/with}}',
			data: {
				foo: 'cmp',
				some: { path: {} }
			}
		});
		new Ractive({
			target: fixture,
			template: '{{#with other.path}}<cmp />{{/with}}',
			data: {
				foo: 'root',
				other: { path: {} }
			},
			components: { cmp }
		});

		t.htmlEqual( fixture.innerHTML, 'cmp root' );
	});

	test( 'root model will deal with ~/ references (#2432)', t => {
		const cmp = Ractive.extend({
			data: { foo: { bar: 'cmp' } }
		});
		const r = new Ractive({
			target: fixture,
			data: { foo: { bar: 'root' } },
			template: '<cmp />',
			components: { cmp }
		});

		const c = r.findComponent( 'cmp' );

		t.equal( c.get( '~/foo.bar' ), 'cmp' );
		t.equal( c.get( '@.root.data.foo.bar' ), 'root' );
	});

	test( `trying to set a relative keypath from instance set warns and doesn't do unexpected things`, t => {
		onWarn( w => {
			t.ok( /relative keypath.*non-relative.*getNodeInfo.*event object/.test( w ) );
		});

		const r = new Ractive();

		r.set( '.foo.bar', 'nope' );
		t.ok( !r.get( 'foo.bar' ) );
		t.ok( !( '' in r.get() ) );
	});

	test( `instance methods are bound properly when used with resolveInstanceMembers (#2757)`, t => {
		const r = new Ractive({
			target: fixture,
			template: `<button on-click="set('foo', 'bar')">click me</button>`
		});

		fire( r.find( 'button' ), 'click' );

		t.equal( r.get( 'foo' ), 'bar' );
	});

	test( `context takes precedent over instance methods`, t => {
		new Ractive({
			target: fixture,
			template: '{{foo()}}',
			data: {
				foo () { return 'foo'; }
			},
			foo () { return 'nope'; }
		});

		t.htmlEqual( fixture.innerHTML, 'foo' );
	});

	test( `instance methods aren't resolved if resolveInstanceMembers is false`, t => {
		new Ractive({
			target: fixture,
			template: '{{foo()}}',
			foo () { return 'nope'; },
			resolveInstanceMembers: false
		});

		t.htmlEqual( fixture.innerHTML, '' );
	});
}
