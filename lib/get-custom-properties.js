import valueParser from 'postcss-values-parser';

export function getMediaQueryCustomProperties(root, opts) {
	const mediaQueryRules = [];
	root.nodes.slice().forEach(rule => {
		if (isMediaQuery(rule)) {
			rule.nodes.forEach(node => {
				if (rootSelectorRegExp.test(node.selector)) {
					const customPropertiesObject = {};
					// TODO => extract this functionality that is used twice
					node.nodes.slice().forEach(decl => {
						if (isCustomDecl(decl)) {
							const { prop } = decl;

							// write the parsed value to the custom property
							customPropertiesObject[prop] = valueParser(
								decl.value
							).parse().nodes;

							// conditionally remove the custom property declaration
							if (!opts.preserve) {
								decl.remove();
							}
						}
					});

					mediaQueryRules.push({
						params: rule.params,
						rules: customPropertiesObject
					});
				}
			});
		}
		// conditionally remove the empty html or :root rule
		if (!opts.preserve) {
			rule.remove();
		}
	});
	return mediaQueryRules;
}

// return custom selectors from the css root, conditionally removing them
export default function getCustomProperties(root, opts) {
	// initialize custom selectors
	const customPropertiesFromHtmlElement = {};
	const customPropertiesFromRootPsuedo = {};

	// for each html or :root rule
	root.nodes.slice().forEach(rule => {
		const customPropertiesObject = isHtmlRule(rule)
			? customPropertiesFromHtmlElement
		: isRootRule(rule)
			? customPropertiesFromRootPsuedo
		: null;

		// for each custom property
		if (customPropertiesObject) {
			rule.nodes.slice().forEach(decl => {
				if (isCustomDecl(decl)) {
					const { prop } = decl;

					// write the parsed value to the custom property
					customPropertiesObject[prop] = valueParser(decl.value).parse().nodes;

					// conditionally remove the custom property declaration
					if (!opts.preserve) {
						decl.remove();
					}
				}
			});

			// conditionally remove the empty html or :root rule
			if (!opts.preserve && isEmptyParent(rule)) {
				rule.remove();
			}
		}
	});

	// return all custom properties, preferring :root properties over html properties
	return { ...customPropertiesFromHtmlElement, ...customPropertiesFromRootPsuedo };
}

// match html and :root rules
const htmlSelectorRegExp = /^html$/i;
const rootSelectorRegExp = /^:root$/i;
const customPropertyRegExp = /^--[A-z][\w-]*$/;

// whether the node is an html or :root rule
const isHtmlRule = node => node.type === 'rule' && htmlSelectorRegExp.test(node.selector) && Object(node.nodes).length;
const isRootRule = node => node.type === 'rule' && rootSelectorRegExp.test(node.selector) && Object(node.nodes).length;

const isMediaQuery = node => {
	const isAtRule = node.type === "atrule";
	const isMedia = node.name === "media";
	const hasNodes = Object(node.nodes).length;

	return isAtRule && isMedia && hasNodes;
};

// whether the node is an custom property
const isCustomDecl = node => node.type === 'decl' && customPropertyRegExp.test(node.prop);

// whether the node is a parent without children
const isEmptyParent = node => Object(node.nodes).length === 0;
