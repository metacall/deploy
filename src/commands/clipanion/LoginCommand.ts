import { Command, Option } from 'clipanion';
import { BaseClipanionCommand } from './BaseClipanionCommand';
import { AuthService } from '../../services/auth/AuthService';
import { ConfigManager } from '../../config/ConfigManager';
import { CommandContext } from '../../types/CommandContext';
import { inputEmail, inputPassword, inputText, selectFromList } from '../../ui/prompts';
import login from '@metacall/protocol/login';
import signup from '@metacall/protocol/signup';
import { expiresIn } from '@metacall/protocol/token';
import { AuthenticationError } from '../../errors/CLIError';

export class LoginCommand extends BaseClipanionCommand {
	static paths = [['login']];

	static usage = Command.Usage({
		category: 'Authentication',
		description: 'Authenticate with MetaCall',
		details: `
			Authenticate with MetaCall using email/password or token.
			In interactive mode, you can choose between different authentication methods.
			You can also sign up for a new account.
		`,
		examples: [
			['Login interactively (recommended)', 'metacall-deploy login'],
			['Login with email and password', 'metacall-deploy login --email user@example.com --password your-password'],
			['Login with API token', 'metacall-deploy login --token your-api-token-here'],
			['Sign up for new account', 'metacall-deploy login']
		]
	});

	email = Option.String('--email', {
		description: 'Email for login'
	});

	password = Option.String('--password', {
		description: 'Password for login'
	});

	token = Option.String('--token', {
		description: 'Token for authentication'
	});

	async execute(): Promise<number> {
		const context = await this.buildContext();
		const configManager = new ConfigManager();

		try {
			let token: string;

			if (this.email || this.password) {
				token = await this.loginWithEmailPassword(context);
			} else if (this.token) {
				token = await this.authenticateWithToken(this.token, context);
			} else {
				token = await this.interactiveAuth(context);
			}

			await configManager.save({ token });

			this.getLogger().info('Login successful!');

			return 0;
		} catch (error: unknown) {
			if (error instanceof Error) {
				this.getLogger().error(`Login failed: ${error.message}`);
			} else {
				this.getLogger().error('Login failed');
			}
			return 1;
		}
	}

	private async loginWithEmailPassword(context: CommandContext): Promise<string> {
		const interactive = this.isInteractive();
		const shouldKeepAsking = !this.email || !this.password;

		let email = this.email || '';
		let password = this.password || '';

		const askCredentials = async (): Promise<void> => {
			if (!email && interactive) {
				email = await inputEmail();
			}
			if (!password && interactive) {
				password = await inputPassword();
			}
		};

		if (interactive && shouldKeepAsking) {
			await askCredentials();
		}

		if (!email || !password) {
			throw new AuthenticationError('Email and password are required');
		}

		if (interactive && shouldKeepAsking) {
			// eslint-disable-next-line no-constant-condition
			while (true) {
				try {
					const token = await login(email, password, context.config.baseURL);
					return await this.validateAndRefreshToken(token, context);
				} catch (error) {
					const errorMessage =
						error instanceof Error && 'response' in error
							? String((error as { response?: { data?: unknown } }).response?.data || error.message)
							: String(error);

					this.getLogger().warn(`Login failed: ${errorMessage}`);
					email = '';
					password = '';
					await askCredentials();
				}
			}
		} else {
			try {
				const token = await login(email, password, context.config.baseURL);
				return await this.validateAndRefreshToken(token, context);
			} catch (error) {
				const errorMessage =
					error instanceof Error && 'response' in error
						? String((error as { response?: { data?: unknown } }).response?.data || error.message)
						: String(error);
				throw new AuthenticationError(`Login failed: ${errorMessage}`, error as Error);
			}
		}
	}

	private async authenticateWithToken(token: string, context: CommandContext): Promise<string> {
		const interactive = this.isInteractive();
		const shouldKeepAsking = !this.token;

		let currentToken = token;

		const askToken = async (): Promise<string> => {
			if (interactive) {
				return await inputPassword('Please enter your MetaCall token');
			}
			throw new AuthenticationError('Token is required in non-interactive mode');
		};

		if (interactive && shouldKeepAsking) {
			currentToken = await askToken();
		}

		const protocolService = this.createProtocolService(context);
		const authService = new AuthService(protocolService, context.config.baseURL);

		if (interactive && shouldKeepAsking) {
			// eslint-disable-next-line no-constant-condition
			while (true) {
				try {
					const isValid = await authService.validateToken();
					if (isValid) {
						return await this.validateAndRefreshToken(currentToken, context);
					}
				} catch (error) {
					const errorMessage =
						error instanceof Error && 'response' in error
							? String((error as { response?: { data?: unknown } }).response?.data || error.message)
							: String(error);

					this.getLogger().warn(`Token invalid: ${errorMessage}`);
					currentToken = await askToken();
				}
			}
		} else {
			try {
				const isValid = await authService.validateToken();
				if (!isValid) {
					throw new AuthenticationError('Token is invalid');
				}
				return await this.validateAndRefreshToken(currentToken, context);
			} catch (error) {
				const errorMessage =
					error instanceof Error && 'response' in error
						? String((error as { response?: { data?: unknown } }).response?.data || error.message)
						: String(error);
				throw new AuthenticationError(`Token validation failed: ${errorMessage}`, error as Error);
			}
		}
	}

	private async interactiveAuth(context: CommandContext): Promise<string> {
		const methods = ['Login by token', 'Login by email and password', 'New user, sign up'];

		const selectedMethod = await selectFromList(methods, 'Select the login method');

		switch (selectedMethod) {
			case 'Login by token':
				return await this.authenticateWithToken('', context);
			case 'Login by email and password':
				return await this.loginWithEmailPassword(context);
			case 'New user, sign up':
				return await this.signupFlow(context);
			default:
				throw new AuthenticationError('Invalid authentication method selected');
		}
	}

	private async signupFlow(context: CommandContext): Promise<string> {
		let email = '';
		let password = '';
		let passwordConfirmation = '';
		let userAlias = '';

		const askCredentials = async (): Promise<void> => {
			email = email || (await inputEmail());
			password = password || (await inputPassword());
			passwordConfirmation = passwordConfirmation || (await inputPassword('Confirm password:'));
			userAlias = userAlias || (await inputText('Please enter your Alias:'));
		};

		const askData = async (): Promise<void> => {
			// eslint-disable-next-line no-constant-condition
			while (true) {
				await askCredentials();

				if (password !== passwordConfirmation) {
					this.getLogger().warn('Passwords did not match.');
					password = '';
					passwordConfirmation = '';
					continue;
				}
				break;
			}
		};

		await askData();

		// eslint-disable-next-line no-constant-condition
		while (true) {
			try {
				const result = await signup(email, password, userAlias, context.config.baseURL);
				this.getLogger().info(result);
				this.getLogger().info(
					'Visit MetaCall Hub directly to learn more about deployments and to purchase plans: https://metacall.io/pricing/'
				);
				process.exit(0);
			} catch (error) {
				const errorMessage =
					error instanceof Error && 'response' in error
						? String((error as { response?: { data?: unknown } }).response?.data || error.message)
						: String(error);

				this.getLogger().warn(errorMessage);

				email = '';
				password = '';
				passwordConfirmation = '';
				userAlias = '';

				await askData();
			}
		}
	}

	private async validateAndRefreshToken(token: string, context: CommandContext): Promise<string> {
		if (expiresIn(token) < context.config.renewTime) {
			const protocolService = this.createProtocolService(context);
			const authService = new AuthService(protocolService, context.config.baseURL);
			return await authService.refreshToken();
		}

		return token;
	}
}
