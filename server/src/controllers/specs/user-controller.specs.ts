const CredentialsSchema = {
	type: 'object',
	required: ['email', 'password'],
	properties: {
		email: {
			type: 'string',
			format: 'email',
		},
		password: {
			type: 'string',
		},
	},
};

export const CredentialsRequestBody = {
	description: 'The input of login function',
	required: true,
	content: {
		'application/json': {schema: CredentialsSchema},
	},
};

export const RegisterRequestBody = {
	description: 'The input of register function',
	required: true,
	content: {
		'application/json': {schema: CredentialsSchema},
	},
};
