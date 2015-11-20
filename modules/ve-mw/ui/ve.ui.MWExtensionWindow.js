/*!
 * VisualEditor UserInterface MWExtensionWindow class.
 *
 * @copyright 2011-2015 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * Mixin for windows for editing generic MediaWiki extensions.
 *
 * @class
 * @abstract
 *
 * @constructor
 * @param {Object} [config] Configuration options
 */
ve.ui.MWExtensionWindow = function VeUiMWExtensionWindow() {
	this.whitespace = null;
	this.input = null;
};

/* Inheritance */

OO.initClass( ve.ui.MWExtensionWindow );

/* Static properties */

/**
 * Extension is allowed to have empty contents
 *
 * @static
 * @property {boolean}
 * @inheritable
 */
ve.ui.MWExtensionWindow.static.allowedEmpty = false;

/**
 * Inspector's directionality, 'ltr' or 'rtl'
 *
 * Leave as null to use the directionality of the current fragment.
 *
 * @static
 * @property {string|null}
 * @inheritable
 */
ve.ui.MWExtensionWindow.static.dir = null;

/* Methods */

/**
 * @inheritdoc OO.ui.Window
 */
ve.ui.MWExtensionWindow.prototype.initialize = function () {
	this.input = new ve.ui.WhitespacePreservingTextInputWidget( {
		limit: 1,
		multiline: true,
		classes: [ 've-ui-mwExtensionWindow-input' ]
	} );
};

/**
 * Get the placeholder text for the content input area.
 *
 * @return {string} Placeholder text
 */
ve.ui.MWExtensionWindow.prototype.getInputPlaceholder = function () {
	return '';
};

/**
 * @inheritdoc OO.ui.Window
 */
ve.ui.MWExtensionWindow.prototype.getSetupProcess = function ( data, process ) {
	data = data || {};
	return process.next( function () {
		var dir;

		// Initialization
		this.whitespace = [ '', '' ];

		if ( this.selectedNode ) {
			this.input.setValueAndWhitespace( this.selectedNode.getAttribute( 'mw' ).body.extsrc );
		} else {
			if ( !this.constructor.static.modelClasses[ 0 ].static.isContent ) {
				// New nodes should use linebreaks for blocks
				this.input.setWhitespace( [ '\n', '\n' ] );
			}
			this.input.setValue( '' );
		}

		this.input.$input.attr( 'placeholder', this.getInputPlaceholder() );

		dir = this.constructor.static.dir || data.dir;
		this.input.setRTL( dir === 'rtl' );
	}, this );
};

/**
 * @inheritdoc OO.ui.Window
 */
ve.ui.MWExtensionWindow.prototype.getReadyProcess = function ( data, process ) {
	return process;
};

/**
 * @inheritdoc OO.ui.Window
 */
ve.ui.MWExtensionWindow.prototype.getTeardownProcess = function ( data, process ) {
	return process;
};

/**
 * @inheritdoc OO.ui.Dialog
 */
ve.ui.MWExtensionWindow.prototype.getActionProcess = function ( action, process ) {
	return process.first( function () {
		if ( action === 'done' ) {
			if ( this.constructor.static.allowedEmpty || this.input.getValue() !== '' ) {
				this.insertOrUpdateNode();
			} else if ( this.selectedNode && !this.constructor.static.allowedEmpty ) {
				// Content has been emptied on a node which isn't allowed to
				// be empty, so delete it.
				this.removeNode();
			}
		}
	}, this );
};

/**
 * Create an new data element for the model class associated with this inspector
 *
 * @return {Object} Element data
 */
ve.ui.MWExtensionWindow.prototype.getNewElement = function () {
	// Extension inspectors which create elements should either match
	// a single modelClass or override this method.
	var modelClass = this.constructor.static.modelClasses[ 0 ];
	return {
		type: modelClass.static.name,
		attributes: {
			mw: {
				name: modelClass.static.extensionName,
				attrs: {},
				body: {
					extsrc: ''
				}
			}
		}
	};
};

/**
 * Insert or update the node in the document model from the new values
 */
ve.ui.MWExtensionWindow.prototype.insertOrUpdateNode = function () {
	var mwData, element,
		surfaceModel = this.getFragment().getSurface();
	if ( this.selectedNode ) {
		mwData = ve.copy( this.selectedNode.getAttribute( 'mw' ) );
		this.updateMwData( mwData );
		surfaceModel.change(
			ve.dm.Transaction.newFromAttributeChanges(
				surfaceModel.getDocument(),
				this.selectedNode.getOuterRange().start,
				{ mw: mwData }
			)
		);
	} else {
		element = this.getNewElement();
		this.updateMwData( element.attributes.mw );
		// Collapse returns a new fragment, so update this.fragment
		this.fragment = this.getFragment().collapseToEnd();
		this.getFragment().insertContent( [
			element,
			{ type: '/' + element.type }
		] );
	}
};

/**
 * Remove the node form the document model
 */
ve.ui.MWExtensionWindow.prototype.removeNode = function () {
	this.getFragment().removeContent();
};

/**
 * Update mwData object with the new values from the inspector
 *
 * @param {Object} mwData MediaWiki data object
 */
ve.ui.MWExtensionWindow.prototype.updateMwData = function ( mwData ) {
	var tagName = mwData.name,
		value = this.input.getValueAndWhitespace();

	// XML-like tags in wikitext are not actually XML and don't expect their contents to be escaped.
	// This means that it is not possible for a tag '<foo>…</foo>' to contain the string '</foo>'.
	// Prevent that by escaping the first angle bracket '<' to '&lt;'. (bug 57429)
	value = value.replace( new RegExp( '<(/' + tagName + '\\s*>)', 'gi' ), '&lt;$1' );

	mwData.body.extsrc = value;
};
