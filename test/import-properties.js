module.exports = {
	customProperties: {
		'--ref-color': 'var(--color)',
		'--z-index': 10,
		mediaQueries: [
			{
				params: "(min-width: 961px)",
				rules:
				{
					'--color-2': 'rgb(0, 255, 255)',
				}
			}
		]
	}
};
