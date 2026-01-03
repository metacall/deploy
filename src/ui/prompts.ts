import * as p from '@clack/prompts';
import { LanguageId } from '@metacall/protocol/deployment';
import { Languages } from '@metacall/protocol/language';
import { Plans } from '@metacall/protocol/plan';

const isInteractive = (): boolean => {
	return process.stdout.isTTY && !process.env.CI;
};

export async function selectLanguage(
	languages: LanguageId[],
	message = 'Select languages to run on MetaCall'
): Promise<LanguageId[]> {
	if (!isInteractive()) {
		throw new Error('Language selection requires interactive mode');
	}

	const choices = languages.map(lang => ({
		value: lang,
		label: Languages[lang]?.displayName || lang
	}));

	const selected = await p.multiselect({
		message,
		options: choices
	});

	if (p.isCancel(selected)) {
		throw new Error('Language selection cancelled');
	}

	return selected;
}

export async function selectFile(files: string[], message: string): Promise<string[]> {
	if (!isInteractive()) {
		throw new Error('File selection requires interactive mode');
	}

	const choices = files.map(file => ({
		value: file,
		label: file
	}));

	const selected = await p.multiselect({
		message,
		options: choices
	});

	if (p.isCancel(selected)) {
		throw new Error('File selection cancelled');
	}

	return selected;
}

export async function selectPlan(
	availablePlans: string[],
	message = 'Please select plan from the list'
): Promise<Plans> {
	if (!isInteractive()) {
		if (availablePlans.length === 1) {
			return availablePlans[0] as Plans;
		}
		throw new Error('Plan selection requires interactive mode or single plan');
	}

	const choices = availablePlans.map(plan => ({
		value: plan,
		label: plan
	}));

	const selected = await p.select({
		message,
		options: choices
	});

	if (p.isCancel(selected)) {
		throw new Error('Plan selection cancelled');
	}

	return selected as Plans;
}

export async function selectDeployment(
	deployments: Array<{ suffix: string; version: string; prefix: string }>,
	message = 'Select the deployment to delete:'
): Promise<{ suffix: string; version: string; prefix: string }> {
	if (!isInteractive()) {
		throw new Error('Deployment selection requires interactive mode');
	}

	const choices = deployments.map(dep => ({
		value: dep,
		label: `${dep.suffix} ${dep.version}`
	}));

	const selected = await p.select({
		message,
		options: choices
	});

	if (p.isCancel(selected)) {
		throw new Error('Deployment selection cancelled');
	}

	return selected as { suffix: string; version: string; prefix: string };
}

export async function selectContainer(
	containers: Array<{ name: string; value: string }>,
	message = 'Select a container to get logs'
): Promise<string> {
	if (!isInteractive()) {
		throw new Error('Container selection requires interactive mode');
	}

	const choices = containers.map(container => ({
		value: container.value,
		label: container.name
	}));

	const selected = await p.select({
		message,
		options: choices
	});

	if (p.isCancel(selected)) {
		throw new Error('Container selection cancelled');
	}

	return selected;
}

export async function inputEmail(message = 'Please enter your email id:'): Promise<string> {
	if (!isInteractive()) {
		throw new Error('Email input requires interactive mode');
	}

	const email = await p.text({
		message,
		validate: value => {
			if (!value || value.trim().length === 0) {
				return 'Email is required';
			}
			if (!value.includes('@')) {
				return 'Please enter a valid email address';
			}
			return undefined;
		}
	});

	if (p.isCancel(email)) {
		throw new Error('Email input cancelled');
	}

	return email;
}

export async function inputPassword(message = 'Please enter your password:'): Promise<string> {
	if (!isInteractive()) {
		throw new Error('Password input requires interactive mode');
	}

	const password = await p.password({
		message,
		validate: value => {
			if (!value || value.trim().length === 0) {
				return 'Password is required';
			}
			return undefined;
		}
	});

	if (p.isCancel(password)) {
		throw new Error('Password input cancelled');
	}

	return password;
}

export async function inputText(message: string): Promise<string> {
	if (!isInteractive()) {
		throw new Error('Text input requires interactive mode');
	}

	const text = await p.text({
		message,
		validate: value => {
			if (!value || value.trim().length === 0) {
				return 'Input is required';
			}
			return undefined;
		}
	});

	if (p.isCancel(text)) {
		throw new Error('Text input cancelled');
	}

	return text;
}

export async function confirm(message: string, defaultValue = false): Promise<boolean> {
	if (!isInteractive()) {
		return defaultValue;
	}

	const result = await p.confirm({
		message,
		initialValue: defaultValue
	});

	if (p.isCancel(result)) {
		return defaultValue;
	}

	return result;
}

export async function selectFromList(
	list: string[] | Array<{ name: string; value: string }>,
	message: string
): Promise<string> {
	if (!isInteractive()) {
		if (Array.isArray(list) && list.length === 1) {
			return typeof list[0] === 'string' ? list[0] : list[0].value;
		}
		throw new Error('List selection requires interactive mode');
	}

	const choices = list.map(item => {
		if (typeof item === 'string') {
			return { value: item, label: item };
		}
		return { value: item.value, label: item.name };
	});

	const selected = await p.select({
		message,
		options: choices
	});

	if (p.isCancel(selected)) {
		throw new Error('Selection cancelled');
	}

	return selected;
}
