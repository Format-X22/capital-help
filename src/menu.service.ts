import { Injectable, OnModuleInit } from '@nestjs/common';
import { TelegramService } from './telegram.service';

@Injectable()
export class MenuService implements OnModuleInit {
    constructor(private telegramService: TelegramService) {}

    async onModuleInit(): Promise<void> {
        this.telegramService.setNextStepContext(this);
        await this.telegramService.sendText('Система запущена', false);
        await this.mainMenu();
    }

    async mainMenu(): Promise<void> {
        this.telegramService.setNextStep(this.mainMenuSelect);
        await this.telegramService.sendText('Главное меню', ['📄 Статус', '➕ Задача']);
    }

    async mainMenuSelect(): Promise<void> {
        // TODO -
    }
}
