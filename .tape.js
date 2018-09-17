module.exports = {
	'postcss-custom-properties': {
		'basic': {
			message: 'supports basic usage'
		},
		'basic:preserve': {
			message: 'supports { preserve: false } usage',
			options: {
				preserve: false
			}
		},
		'basic:import': {
			message: 'supports { importFrom: { customProperties: { ... } } } usage',
			options: {
				importFrom: {
					customProperties: {
						'--color': 'rgb(255, 0, 0)',
						'--color-2': 'yellow',
						'--ref-color': 'var(--color)'
					}
				}
			}
		},
		'basic:import-fn': {
			message: 'supports { importFrom() } usage',
			options: {
				importFrom() {
					return {
						customProperties: {
							'--color': 'rgb(255, 0, 0)',
							'--color-2': 'yellow',
							'--ref-color': 'var(--color)'
						}
					};
				}
			},
			expect: 'basic.import.expect.css',
			result: 'basic.import.result.css'
		},
		'basic:import-fn-promise': {
			message: 'supports { async importFrom() } usage',
			options: {
				importFrom() {
					return new Promise(resolve => {
						resolve({
							customProperties: {
								'--color': 'rgb(255, 0, 0)',
								'--color-2': 'yellow',
								'--ref-color': 'var(--color)'
							}
						})
					});
				}
			},
			expect: 'basic.import.expect.css',
			result: 'basic.import.result.css'
		},
		'basic:import-json': {
			message: 'supports { importFrom: "test/import-properties.json" } usage',
			options: {
				importFrom: 'test/import-properties.json'
			},
			expect: 'basic.import.expect.css',
			result: 'basic.import.result.css'
		},
		'basic:import-js': {
			message: 'supports { importFrom: "test/import-properties.js" } usage',
			options: {
				importFrom: 'test/import-properties.js'
			},
			expect: 'basic.import.expect.css',
			result: 'basic.import.result.css'
		},
		'basic:import-css': {
			message: 'supports { importFrom: "test/import-properties.css" } usage',
			options: {
				importFrom: 'test/import-properties.css'
			},
			expect: 'basic.import.expect.css',
			result: 'basic.import.result.css'
		},
		'basic:import-css-from': {
			message: 'supports { importFrom: { from: "test/import-properties.css" } } usage',
			options: {
				importFrom: { from: 'test/import-properties.css' }
			},
			expect: 'basic.import.expect.css',
			result: 'basic.import.result.css'
		},
		'basic:import-css-from-type': {
			message: 'supports { importFrom: [ { from: "test/import-properties.css", type: "css" } ] } usage',
			options: {
				importFrom: [ { from: 'test/import-properties.css', type: 'css' } ]
			},
			expect: 'basic.import.expect.css',
			result: 'basic.import.result.css'
		},
		'basic:export': {
			message: 'supports { exportTo: { customProperties: { ... } } } usage',
			options: {
				exportTo: (global.__exportPropertiesObject = global.__exportPropertiesObject || {
					customProperties: null
				})
			},
			expect: 'basic.expect.css',
			result: 'basic.result.css',
			after() {
				if (__exportPropertiesObject.customProperties['--color'] !== 'rgb(255, 0, 0)') {
					throw new Error('The exportTo function failed');
				}
			}
		},
		'basic:export-fn': {
			message: 'supports { exportTo() } usage',
			options: {
				exportTo(customProperties) {
					if (customProperties['--color'] !== 'rgb(255, 0, 0)') {
						throw new Error('The exportTo function failed');
					}
				}
			},
			expect: 'basic.expect.css',
			result: 'basic.result.css'
		},
		'basic:export-fn-promise': {
			message: 'supports { async exportTo() } usage',
			options: {
				exportTo(customProperties) {
					return new Promise((resolve, reject) => {
						if (customProperties['--color'] !== 'rgb(255, 0, 0)') {
							reject('The exportTo function failed');
						} else {
							resolve();
						}
					});
				}
			},
			expect: 'basic.expect.css',
			result: 'basic.result.css'
		},
		'basic:export-json': {
			message: 'supports { exportTo: "test/export-properties.json" } usage',
			options: {
				exportTo: 'test/export-properties.json'
			},
			expect: 'basic.expect.css',
			result: 'basic.result.css',
			before() {
				global.__exportPropertiesString = require('fs').readFileSync('test/export-properties.json', 'utf8');
			},
			after() {
				if (global.__exportPropertiesString !== require('fs').readFileSync('test/export-properties.json', 'utf8')) {
					throw new Error('The original file did not match the freshly exported copy');
				}
			}
		},
		'basic:export-js': {
			message: 'supports { exportTo: "test/export-properties.js" } usage',
			options: {
				exportTo: 'test/export-properties.js'
			},
			expect: 'basic.expect.css',
			result: 'basic.result.css',
			before() {
				global.__exportPropertiesString = require('fs').readFileSync('test/export-properties.js', 'utf8');
			},
			after() {
				if (global.__exportPropertiesString !== require('fs').readFileSync('test/export-properties.js', 'utf8')) {
					throw new Error('The original file did not match the freshly exported copy');
				}
			}
		},
		'basic:export-mjs': {
			message: 'supports { exportTo: "test/export-properties.mjs" } usage',
			options: {
				exportTo: 'test/export-properties.mjs'
			},
			expect: 'basic.expect.css',
			result: 'basic.result.css',
			before() {
				global.__exportPropertiesString = require('fs').readFileSync('test/export-properties.mjs', 'utf8');
			},
			after() {
				if (global.__exportPropertiesString !== require('fs').readFileSync('test/export-properties.mjs', 'utf8')) {
					throw new Error('The original file did not match the freshly exported copy');
				}
			}
		},
		'basic:export-css': {
			message: 'supports { exportTo: "test/export-properties.css" } usage',
			options: {
				exportTo: 'test/export-properties.css'
			},
			expect: 'basic.expect.css',
			result: 'basic.result.css',
			before() {
				global.__exportPropertiesString = require('fs').readFileSync('test/export-properties.css', 'utf8');
			},
			after() {
				if (global.__exportPropertiesString !== require('fs').readFileSync('test/export-properties.css', 'utf8')) {
					throw new Error('The original file did not match the freshly exported copy');
				}
			}
		},
		'basic:export-css-to': {
			message: 'supports { exportTo: { to: "test/export-properties.css" } } usage',
			options: {
				exportTo: { to: 'test/export-properties.css' }
			},
			expect: 'basic.expect.css',
			result: 'basic.result.css',
			before() {
				global.__exportPropertiesString = require('fs').readFileSync('test/export-properties.css', 'utf8');
			},
			after() {
				if (global.__exportPropertiesString !== require('fs').readFileSync('test/export-properties.css', 'utf8')) {
					throw new Error('The original file did not match the freshly exported copy');
				}
			}
		},
		'basic:export-css-to-type': {
			message: 'supports { exportTo: { to: "test/export-properties.css", type: "css" } } usage',
			options: {
				exportTo: { to: 'test/export-properties.css', type: 'css' }
			},
			expect: 'basic.expect.css',
			result: 'basic.result.css',
			before() {
				global.__exportPropertiesString = require('fs').readFileSync('test/export-properties.css', 'utf8');
			},
			after() {
				if (global.__exportPropertiesString !== require('fs').readFileSync('test/export-properties.css', 'utf8')) {
					throw new Error('The original file did not match the freshly exported copy');
				}
			}
		}
	}
};
