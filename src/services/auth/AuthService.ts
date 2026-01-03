import login from '@metacall/protocol/login';
import signup from '@metacall/protocol/signup';
import { AuthenticationError } from '../../errors/CLIError';
import { IProtocolService } from '../../types/service.types';

export class AuthService {
	constructor(private readonly protocolService: IProtocolService, private readonly baseURL: string) {}

	async validateToken(): Promise<boolean> {
		try {
			return await this.protocolService.validateToken();
		} catch (error) {
			if (error instanceof Error) {
				throw new AuthenticationError(`Token validation failed: ${error.message}`, error);
			}
			throw error;
		}
	}

	async refreshToken(): Promise<string> {
		try {
			return await this.protocolService.refreshToken();
		} catch (error) {
			if (error instanceof Error) {
				throw new AuthenticationError(`Token refresh failed: ${error.message}`, error);
			}
			throw error;
		}
	}

	async login(email: string, password: string): Promise<string> {
		try {
			return await login(email, password, this.baseURL);
		} catch (error) {
			if (error instanceof Error) {
				throw new AuthenticationError(`Login failed: ${error.message}`, error);
			}
			throw error;
		}
	}

	async signup(email: string, password: string, alias: string): Promise<string> {
		try {
			return await signup(email, password, alias, this.baseURL);
		} catch (error) {
			if (error instanceof Error) {
				throw new AuthenticationError(`Signup failed: ${error.message}`, error);
			}
			throw error;
		}
	}

	async authenticateWithToken(token: string): Promise<string> {
		const isValid = await this.validateToken();
		if (!isValid) {
			throw new AuthenticationError('Token is invalid');
		}

		return token;
	}

	async isDeploymentEnabled(): Promise<boolean> {
		try {
			return await this.protocolService.deployEnabled();
		} catch (error) {
			if (error instanceof Error) {
				throw new AuthenticationError(`Deploy enabled check failed: ${error.message}`, error);
			}
			throw error;
		}
	}
}
