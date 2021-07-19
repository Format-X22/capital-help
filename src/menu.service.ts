import { Injectable, OnModuleInit } from '@nestjs/common';
import { TelegramService } from './telegram.service';

enum EMainMenu {
    STATUS = '📄 Статус',
    TASK = '➕ Задача',
}

enum EStock {
    BitMex = 'BitMex',
    ByBit = 'ByBit',
    Binance = 'Binance',
    Deribit = 'Deribit',
    Okex = 'Okex',
    Huobi = 'Huobi',
}

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
        await this.telegramService.sendText('Главное меню', Object.values(EMainMenu));
    }

    async mainMenuSelect(selected: string): Promise<void> {
        switch (selected) {
            case EMainMenu.STATUS:
                await this.showStatus();
                break;

            case EMainMenu.TASK:
                await this.startConstructTask();
                break;

            default:
                await this.telegramService.sendText('Неизвестный пункт меню');
        }
    }

    async showStatus(): Promise<void> {
        // TODO -
    }

    async startConstructTask(): Promise<void> {
        // TODO -
        await this.taskStock();
    }

    async taskStock(): Promise<void> {
        this.telegramService.setNextStep(this.taskStockInput);
        await this.telegramService.sendText('Выбери биржу', Object.values(EStock));
    }

    async taskStockInput(): Promise<void> {
        // TODO -
    }
}
