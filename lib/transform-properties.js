import valueParser from "postcss-values-parser";
import transformValueAST from "./transform-value-ast";

function getFirstParentMediaQuery(node) {
	if (!node.parent) {
		return undefined;
	}
	if (node.parent.type === "atrule" && node.parent.name === "media") {
		return node.parent.params;
	}
	return getFirstParentMediaQuery(node.parent);
}

// transform custom pseudo selectors with custom selectors
export default (root, customProperties, opts) => {
	// walk decls that can be transformed
	root.walkDecls(decl => {
		if (isTransformableDecl(decl)) {
			const mediaQuery = getFirstParentMediaQuery(decl);
			let customPropertiesClone = Object.assign({}, customProperties);
			if (mediaQuery) {
				// overwrites the values in custom properties with the one from the media query
				const mediaQueries = customProperties.mediaQueries;
				const correctMediaQuery = mediaQueries.find(
					mq => mq.params === mediaQuery
				);
				customPropertiesClone = Object.assign(
					customPropertiesClone,
					correctMediaQuery.rules
				);
			}

			const originalValue = decl.value;
			const valueAST = valueParser(originalValue).parse();

			const value = String(transformValueAST(valueAST, customPropertiesClone));

			// conditionally transform values that have changed
			if (value !== originalValue) {
				if (opts.preserve) {
					decl.cloneBefore({ value });
				} else {
					decl.value = value;
				}
			}
		}
	});
};

// match html and :root rules
const htmlOrRootSelectorRegExp = /^(html|:root)$/i;

// match custom property inclusions
const customPropertiesRegExp = /(^|[^\w-])var\([\W\w]+\)/;

// whether the declaration has a parent rule that is either html or :root
const isDeclChildOfHtmlOrRootRule = decl =>
	Object(decl.parent).type === "rule" &&
	htmlOrRootSelectorRegExp.test(decl.parent.selector);

// whether the declaration should be potentially transformed
const isTransformableDecl = decl =>
	customPropertiesRegExp.test(decl.value) && !isDeclChildOfHtmlOrRootRule(decl);
