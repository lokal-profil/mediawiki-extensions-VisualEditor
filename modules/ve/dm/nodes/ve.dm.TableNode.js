/*!
 * VisualEditor data model TableNode class.
 *
 * @copyright 2011-2012 VisualEditor Team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * DataModel node for a table.
 *
 * @class
 * @extends ve.dm.BranchNode
 * @constructor
 * @param {ve.dm.BranchNode[]} [children] Child nodes to attach
 * @param {Object} [element] Reference to element in linear model
 */
ve.dm.TableNode = function VeDmTableNode( children, element ) {
	// Parent constructor
	ve.dm.BranchNode.call( this, 'table', children, element );
};

/* Inheritance */

ve.inheritClass( ve.dm.TableNode, ve.dm.BranchNode );

/* Static Members */

/**
 * Node rules.
 *
 * @see ve.dm.NodeFactory
 * @static
 * @property
 */
ve.dm.TableNode.rules = {
	'isWrapped': true,
	'isContent': false,
	'canContainContent': false,
	'hasSignificantWhitespace': false,
	'childNodeTypes': ['tableSection'],
	'parentNodeTypes': null
};

/**
 * Node converters.
 *
 * @see ve.dm.Converter
 * @static
 * @property
 */
ve.dm.TableNode.converters = {
	'domElementTypes': ['table'],
	'toDomElement': function () {
		return document.createElement( 'table' );
	},
	'toDataElement': function () {
		return {
			'type': 'table'
		};
	}
};

/* Registration */

ve.dm.nodeFactory.register( 'table', ve.dm.TableNode );
