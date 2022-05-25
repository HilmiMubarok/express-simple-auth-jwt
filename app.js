require('dotenv').config();
require('./config/database').connect();

const express = require('express');
const cors = require('cors');

const app = express();

const User = require('./model/user');
const auth = require('./middleware/auth');

app.use(cors());

app.use(express.json());

app.post('/register', async (req, res) => {
	try {
		const { first_name, last_name, email, password } = req.body;

		// Validate user input
		if (!(email && password && first_name && last_name)) {
			res.status(400).send('All inputs is required');
		}

		const oldUser = await User.findOne({ email });

		if (oldUser) {
			return res.status(409).send('Email already exists');
		}

		encryptedPassword = await bcrypt.hash(password, 10);

		const user = await User.create({
			first_name,
			last_name,
			email: email.toLowerCase(),
			password: encryptedPassword
		});

		// create token
		const token = jwt.sign({ user_id: user._id, email }, process.env.TOKEN_KEY, {
			expiresIn: '2h'
		});
		user.token = token;
		res.status(201).json(user);
	} catch (error) {
		console.log(error);
	}
});

app.post('/login', async (req, res) => {
	try {
		// Get user input
		const { email, password } = req.body;

		// Validate user input
		if (!(email && password)) {
			res.status(400).send('All input is required');
		}
		// Validate if user exist in our database
		const user = await User.findOne({ email });

		if (user && (await bcrypt.compare(password, user.password))) {
			// Create token
			const token = jwt.sign({ user_id: user._id, email }, process.env.TOKEN_KEY, {
				expiresIn: '2h'
			});
			user.token = token;
			res.status(200).json(user);
		}
		res.status(400).send('Invalid Credentials');
	} catch (err) {
		console.log(err);
	}
});

app.get('/welcome', auth, (req, res) => {
	res.status(200).send('Welcome 🙌 ');
});

app.use('*', (req, res) => {
	res.status(404).json({
		success: 'false',
		message: 'Page not found',
		error: {
			statusCode: 404,
			message: 'You reached a route that is not defined on this server'
		}
	});
});

module.exports = app;
