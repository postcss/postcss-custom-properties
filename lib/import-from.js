import fs from 'fs';
import path from 'path';
import postcss from 'postcss';
import valueParser from 'postcss-values-parser';
import getCustomProperties from './get-custom-properties';

/* Import Custom Properties from CSS AST
/* ========================================================================== */

function importCustomPropertiesFromCSSAST(root) {
	return getCustomProperties(root, { preserve: true });
}

/* Import Custom Properties from CSS File
/* ========================================================================== */

async function importCustomPropertiesFromCSSFile(from) {
	const css = await readFile(path.resolve(from));
	const root = postcss.parse(css, { from: path.resolve(from) });

	return importCustomPropertiesFromCSSAST(root);
}

/* Import Custom Properties from Object
/* ========================================================================== */

function importCustomPropertiesFromObject(object) {
	const customProperties = Object.assign(
		{},
		Object(object).customProperties || Object(object)['custom-properties']
	);

	for (const key in customProperties) {
		customProperties[key] = valueParser(customProperties[key]).parse().nodes;
	}

	return customProperties;
}

/* Import Custom Properties from JSON file
/* ========================================================================== */

async function importCustomPropertiesFromJSONFile(from) {
	const object = await readJSON(path.resolve(from));

	return importCustomPropertiesFromObject(object);
}

/* Import Custom Properties from JS file
/* ========================================================================== */

async function importCustomPropertiesFromJSFile(from) {
	const object = await import(path.resolve(from));

	return importCustomPropertiesFromObject(object);
}

/* Import Custom Properties from Sources
/* ========================================================================== */

export default function importCustomPropertiesFromSources(sources) {
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
		const from = String(opts.from || '');

		// type of file being read from
		const type = (opts.type || path.extname(opts.from).slice(1)).toLowerCase();

		return { type, from };
	}).reduce(async (customProperties, source) => {
		const { type, from } = await source;

		if (type === 'ast') {
			return Object.assign(customProperties, importCustomPropertiesFromCSSAST(from));
		}

		if (type === 'css') {
			return Object.assign(customProperties, await importCustomPropertiesFromCSSFile(from));
		}

		if (type === 'js') {
			return Object.assign(customProperties, await importCustomPropertiesFromJSFile(from));
		}

		if (type === 'json') {
			return Object.assign(customProperties, await importCustomPropertiesFromJSONFile(from));
		}

		return Object.assign(customProperties, importCustomPropertiesFromObject(await source));
	}, {});
}

/* Helper utilities
/* ========================================================================== */

const readFile = from => new Promise((resolve, reject) => {
	fs.readFile(from, 'utf8', (error, result) => {
		if (error) {
			reject(error);
		} else {
			resolve(result);
		}
	});
});

const readJSON = async from => JSON.parse(await readFile(from));
