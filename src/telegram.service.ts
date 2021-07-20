import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import { ConfigService } from '@nestjs/config';
import { KeyboardButton } from 'node-telegram-bot-api';

@Injectable()
export class TelegramService implements OnModuleInit {
    private readonly logger = new Logger(TelegramService.name);
    private bot?: TelegramBot;
    private admin?: string;
    private adminChat?: number;
    private next?: (text: string) => Promise<void>;

    constructor(private configService: ConfigService) {}

    onModuleInit(): void {
        const tgKey: string | undefined = this.configService.get('CH_TG_KEY');
        const tgAdmin: string | undefined = this.configService.get('CH_ADMIN');
        const tgAdminChat: number | undefined = this.configService.get('CH_ADMIN_CHAT');

        if (!tgKey || !tgAdmin || !tgAdminChat) {
            throw new Error('Empty envs');
        }

        this.admin = tgAdmin;
        this.adminChat = tgAdminChat;
        this.bot = new TelegramBot(tgKey, { polling: true });

        this.bot.on('message', this.tryHandle.bind(this));
    }

    async sendText(message: string, buttons?: Array<string> | false): Promise<void> {
        if (!this.bot || !this.adminChat) {
            this.logger.error('Try send before init');
            return;
        }

        const options: TelegramBot.SendMessageOptions = {};

        if (buttons) {
            const keyboard: Array<Array<KeyboardButton>> = buttons.map((text) => [{ text }]);

            options.reply_markup = { keyboard, resize_keyboard: true };
        } else if (buttons === false) {
            options.reply_markup = { remove_keyboard: true };
        }

        await this.bot.sendMessage(this.adminChat, message, options);
    }

    setNextStep(next: (text: string) => Promise<void>): void {
        this.next = next;
    }

    private async handleText(message: TelegramBot.Message): Promise<void> {
        if (message.chat.username !== this.admin) {
            await this.send403Message(message);
            return;
        }

        if (this.next) {
            await this.next(message.text || '');
        }
    }

    private async send403Message(message: Pick<TelegramBot.Message, 'chat'>): Promise<void> {
        await this.justSend(message, 'Access denied');
    }

    private async justSend(
        message: Pick<TelegramBot.Message, 'chat'>,
        text: string,
    ): Promise<void> {
        await this.bot?.sendMessage(message.chat.id, text);
    }

    private async tryHandle(
        message: TelegramBot.Message,
        metadata: TelegramBot.Metadata,
    ): Promise<void> {
        try {
            if (metadata.type !== 'text') {
                await this.justSend(message, 'Этот тип сообщений не поддерживается');
                return;
            }

            await this.handleText(message);
        } catch (error) {
            this.logger.error(error);

            try {
                await this.justSend(message, 'Что-то пошло не так');
            } catch (error) {
                this.logger.error(error);
            }
        }
    }
}
