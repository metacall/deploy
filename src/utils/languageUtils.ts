import { LanguageId } from '@metacall/protocol/deployment';
import { Languages, RunnerToDisplayName as ProtocolRunnerToDisplayName } from '@metacall/protocol/language';

export function printLanguage(languageId: LanguageId): string {
	return Languages[languageId]?.displayName || languageId;
}

export function RunnerToDisplayName(runner: string): string {
	return ProtocolRunnerToDisplayName(runner);
}
