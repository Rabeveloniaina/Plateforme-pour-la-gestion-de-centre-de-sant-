const { validationResult } = require('express-validator');

const runValidations = (validations) => {
	return async (req, res, next) => {
		for (const validation of validations) {
			const result = await validation.run(req);
			if (result.errors.length) break;
		}
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({
				success: false,
				message: 'Données invalides',
				errors: errors.array().map(e => ({ field: e.param, message: e.msg }))
			});
		}
		return next();
	};
};

module.exports = { runValidations };
