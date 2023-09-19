import {
    ConversationController,
    ConversationEntry,
    ConversationMessageType,
    getNormalizedMessageSettings,
} from './conversation-controller';
import { ConversationMessageSettings } from './types';

export class User {
    constructor(private controller: ConversationController) {}

    print = (
        settings: string | ConversationMessageSettings,
        options?: {
            key?: string;
        }
    ): ConversationEntry => {
        const normalized = getNormalizedMessageSettings(settings, options);
        return this.controller.createEntry(
            normalized.key,
            normalized.content,
            ConversationMessageType.User,
            undefined,
            normalized.timestamp
        );
    };
}
