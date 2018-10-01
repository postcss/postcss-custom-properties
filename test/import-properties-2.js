module.exports = {
	customProperties: {
		'--color': 'rgb(255, 0, 0)',
		'--color-2': 'yellow'
	},
	mediaQueries: [
			{
				params: "(min-width: 961px)",
				rules:
				{
					'--color-2': 'rgb(0, 255, 255)',
				}
			}
	]
};
