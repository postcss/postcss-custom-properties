import fs from 'fs';
import path from 'path';

/* Write Custom Properties to CSS File
/* ========================================================================== */

function customPropertiesToCSS(customProperties){
	const cssContent = Object.keys(customProperties).reduce((cssLines, name) => {
		if (name === 'mediaQueries') {
			return cssLines;
		}
		cssLines.push(`\t${name}: ${customProperties[name]};`);

		return cssLines;
	}, []).join('\n');

	if (!customProperties.mediaQueries) {
		return `:root {\n${cssContent}\n}\n`;
	}

	else {
		const mediaQueryCss = customProperties.mediaQueries.reduce((css, query) => {
			const mediaQuery = `@media${query.params} {\n`
			const mediaQueryRules = customPropertiesToCSS(query.rules)
			return `${css}${mediaQuery}${mediaQueryRules}}\n`
		},'')
		return  `:root {\n${cssContent}\n}\n${mediaQueryCss}`
	}
}

async function writeCustomPropertiesToCssFile(to, customProperties) {
	const css= customPropertiesToCSS(customProperties);

	await writeFile(to, css);
}

/* Write Custom Properties to JSON file
/* ========================================================================== */

async function writeCustomPropertiesToJsonFile(to, customProperties) {
	const jsonContent = JSON.stringify({
		'custom-properties': customProperties
	}, null, '  ');

	const json = `${jsonContent}\n`;

	await writeFile(to, json);
}

/* Write Custom Properties to Common JS file
/* ========================================================================== */

async function writeCustomPropertiesToCjsFile(to, customProperties) {
	const jsContents = getCustomPropertiesAsJSString(customProperties);
	const js = `module.exports = {\n\tcustomProperties: {\n${jsContents}\n\t}\n};\n`;

	await writeFile(to, js);
}

/* Write Custom Properties to Module JS file
/* ========================================================================== */

async function writeCustomPropertiesToMjsFile(to, customProperties) {
	const mjsContents = getCustomPropertiesAsJSString(customProperties);
	const mjs = `export const customProperties = {\n${mjsContents}\n};\n`;

	await writeFile(to, mjs);
}

/* Write Custom Properties to Exports
/* ========================================================================== */

export default function writeCustomPropertiesToExports(customProperties, destinations) {
	return Promise.all(destinations.map(async destination => {
		if (destination instanceof Function) {
			await destination(defaultCustomPropertiesToJSON(customProperties));
		} else {
			// read the destination as an object
			const opts = destination === Object(destination) ? destination : { to: String(destination) };

			// transformer for Custom Properties into a JSON-compatible object
			const toJSON = opts.toJSON || defaultCustomPropertiesToJSON;

			if ('customProperties' in opts) {
				// write directly to an object as customProperties
				opts.customProperties = toJSON(customProperties);
			} else if ('custom-properties' in opts) {
				// write directly to an object as custom-properties
				opts['custom-properties'] = toJSON(customProperties);
			} else {
				// destination pathname
				const to = String(opts.to || '');

				// type of file being written to
				const type = (opts.type || path.extname(opts.to).slice(1)).toLowerCase();

				// transformed Custom Properties
				const customPropertiesJSON = toJSON(customProperties);

				if (type === 'css') {
					await writeCustomPropertiesToCssFile(to, customPropertiesJSON);
				}

				if (type === 'js') {
					await writeCustomPropertiesToCjsFile(to, customPropertiesJSON);
				}

				if (type === 'json') {
					await writeCustomPropertiesToJsonFile(to, customPropertiesJSON);
				}

				if (type === 'mjs') {
					await writeCustomPropertiesToMjsFile(to, customPropertiesJSON);
				}
			}
		}
	}));
}

/* Helper utilities
/* ========================================================================== */

const defaultCustomPropertiesToJSON = customProperties => {
	return Object.keys(customProperties).reduce((customPropertiesJSON, key) => {
		if (key === "mediaQueries") {
			if(customProperties[key] === []){
				return customPropertiesJSON;
			}
			customPropertiesJSON[key] = customProperties[key].map(mq => {
				return { params: mq.params, rules: defaultCustomPropertiesToJSON(mq.rules) }
			})
		} else {
			customPropertiesJSON[key] = String(customProperties[key]);
		}
		return customPropertiesJSON;
	}, {});
};

const writeFile = (to, text) => new Promise((resolve, reject) => {
	fs.writeFile(to, text, error => {
		if (error) {
			reject(error);
		} else {
			resolve();
		}
	});
});

const escapeForJS = string => string === typeof String ? string.replace(/\\([\s\S])|(')/g, '\\$1$2').replace(/\n/g, '\\n').replace(/\r/g, '\\r') : string;

function getCustomPropertiesAsJSString(obj) {
	return Object.keys(obj).reduce((jsLines, name) => {
		if (name === 'mediaQueries' && obj[name].length > 0) {
			jsLines.push(`\t\t'${escapeForJS(name)}': ${convertMediaQueriesToJs(obj[name])}`);

		} else {
			jsLines.push(`\t\t'${escapeForJS(name)}': '${escapeForJS(obj[name])}'`);
		}

		return jsLines;
	}, []).join(',\n');
}

function convertMediaQueriesToJs(mQ) {
	const mediaQueries = mQ.reduce((mediaQueriesString, mediaQuery) => {
		return `${mediaQueriesString}
				{
					params: '${mediaQuery.params}',
					rules: {
						${getCustomPropertiesAsJSString(mediaQuery.rules)}
					}
				},
		`
	}, '')
	return escapeForJS(`[
		${mediaQueries}
		]
	`)
}
