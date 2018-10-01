import fs from 'fs';
import path from 'path';
import postcss from 'postcss';
import valueParser from 'postcss-values-parser';
import getCustomPropertiesFromRoot from './get-custom-properties-from-root';

/* Get Custom Properties from CSS File
/* ========================================================================== */

async function getCustomPropertiesFromCSSFile(from) {
	const css = await readFile(from);
	const root = postcss.parse(css, { from });

	return getCustomPropertiesFromRoot(root, { preserve: true });
}

/* Get Custom Properties from Object
/* ========================================================================== */

function getCustomPropertiesFromObject(object) {
	const customProperties = Object.assign(
		{},
		Object(object).customProperties,
		Object(object)['custom-properties']
	);
	const mediaQueryKeyMapper = (query) => {
		return {
				params: query.params,
				rules: getCustomPropertiesFromObject({ customProperties: query.rules })
		}
	}


	for (const key in customProperties) {
		if (key === "mediaQueries") {
			customProperties[key] = customProperties[key].map(mediaQueryKeyMapper)
		}
		else {
			customProperties[key] = valueParser(customProperties[key]).parse().nodes;
		}
	}
	return customProperties;
}

/* Get Custom Properties from JSON file
/* ========================================================================== */

async function getCustomPropertiesFromJSONFile(from) {
	const object = await readJSON(from);

	return getCustomPropertiesFromObject(object);
}

/* Get Custom Properties from JS file
/* ========================================================================== */

async function getCustomPropertiesFromJSFile(from) {
	const object = await import(from);

	return getCustomPropertiesFromObject(object);
}

/* Get Custom Properties from Imports
/* ========================================================================== */

export default function getCustomPropertiesFromImports(sources) {
	return sources.map(source => {
		if (source instanceof Promise) {
			return source;
		} else if (source instanceof Function) {
			return source();
		}

		// read the source as an object
		const opts = source === Object(source) ? source : { from: String(source) };

		// skip objects with Custom Properties
		if (opts.customProperties || opts['custom-properties']) {
			return opts
		}

		// source pathname
		const from = path.resolve(String(opts.from || ''));

		// type of file being read from
		const type = (opts.type || path.extname(from).slice(1)).toLowerCase();

		return { type, from };
	}).reduce(async (customProperties, source) => {
		const { type, from } = await source;

		if (type === 'css') {
				return combineCustomProperties(await customProperties, await getCustomPropertiesFromCSSFile(from));
		}

		if (type === 'js') {
			return combineCustomProperties(await customProperties, await getCustomPropertiesFromJSFile(from));
		}

		if (type === 'json') {
			return combineCustomProperties(await customProperties, await getCustomPropertiesFromJSONFile(from));
		}

		return combineCustomProperties(await customProperties, await getCustomPropertiesFromObject(await source));
	}, {});
}

/* Helper utilities
/* ========================================================================== */

const readFile = from =>
	new Promise((resolve, reject) => {
		fs.readFile(from, 'utf8', (error, result) => {
			if (error) {
				reject(error);
			} else {
				resolve(result);
			}
		});
	});

const readJSON = async from => JSON.parse(await readFile(from));

export function combineCustomProperties(...sources) {
	let mediaQueries = [];
	sources.forEach(src => {
		// consolidate same MQ rules
		if (src.mediaQueries) {
			mediaQueries = src.mediaQueries.map(mq => {
				const mqWithSameParam = mediaQueries.find(origMQ => origMQ.params === mq.params);
				if (mqWithSameParam) {
					return { params: mq.params, rules: Object.assign(mqWithSameParam.rules, mq.rules) };
				}
				return mq;
			})
		}
	});

	return Object.assign(...sources, { mediaQueries });
}
