import { Injectable, OnModuleInit } from '@nestjs/common';
import { TelegramService } from './telegram.service';

enum EMainMenu {
    STATUS = '📄 Статус',
    TASK = '➕ Задача',
}

enum EConfirm {
    OK = 'Да',
    CANCEL = 'Нет',
}

// TODO Move
enum EStock {
    BitMex = 'BitMex',
    ByBit = 'ByBit',
    Binance = 'Binance',
    Deribit = 'Deribit',
    Okex = 'Okex',
    Huobi = 'Huobi',
}

// TODO Move
enum TSide {
    LONG = 'LONG',
    SHORT = 'SHORT',
}

// TODO Move
class TaskConfig {
    stock?: EStock;
    marginAmount?: number;
    lineStart?: number;
    lineAfter10?: number;
    step?: number;
    lineAfter20?: number;
    side?: TSide;
    spike?: number;
    cancelAfter?: number;
}

@Injectable()
export class MenuService implements OnModuleInit {
    private taskConfig: TaskConfig = new TaskConfig();

    constructor(private tg: TelegramService) {}

    async onModuleInit(): Promise<void> {
        await this.tg.sendText('Система запущена', false);
        await this.mainMenu();
    }

    async mainMenu(): Promise<void> {
        await this.tg.sendText('Главное меню', Object.values(EMainMenu));
        this.setNext(this.mainMenuSelect);
    }

    async mainMenuSelect(selected: string): Promise<void> {
        switch (selected) {
            case EMainMenu.STATUS:
                await this.showStatus();
                break;

            case EMainMenu.TASK:
                await this.constructTask();
                break;

            default:
                await this.tg.sendText('Неизвестный пункт меню');
        }
    }

    async showStatus(): Promise<void> {
        // TODO -
    }

    async constructTask(): Promise<void> {
        this.taskConfig = new TaskConfig();

        await this.taskStockPrompt();
    }

    async taskStockPrompt(): Promise<void> {
        await this.tg.sendText('Выбери биржу', Object.values(EStock));
        this.setNext(this.taskStockSelect);
    }

    async taskStockSelect(selected: string): Promise<void> {
        if (!(selected in EStock)) {
            await this.tg.sendText('Неизвестная биржа');
            return;
        }

        this.taskConfig.stock = selected as EStock;

        await this.taskMarginPrompt();
    }

    async taskMarginPrompt(): Promise<void> {
        await this.tg.sendText('Введи общую маржу для трат', false);
        this.setNext(this.taskMarginSelect);
    }

    async taskMarginSelect(amountString: string): Promise<void> {
        const amount = parseInt(amountString);

        if (Number.isNaN(amount)) {
            await this.tg.sendText('Нужно ввести число');
            return;
        }

        this.taskConfig.marginAmount = amount;

        await this.taskStartPrompt();
    }

    async taskStartPrompt(): Promise<void> {
        await this.tg.sendText('Введи начало линии', false);
        this.setNext(this.taskStartSelect);
    }

    async taskStartSelect(startString: string): Promise<void> {
        const start = parseInt(startString);

        if (Number.isNaN(start)) {
            await this.tg.sendText('Нужно ввести число');
            return;
        }

        this.taskConfig.lineStart = start;

        await this.taskAfter10Prompt();
    }

    async taskAfter10Prompt(): Promise<void> {
        await this.tg.sendText('Введи линию через 10 свечей', false);
        this.setNext(this.taskAfter10Select);
    }

    async taskAfter10Select(after10String: string): Promise<void> {
        this.taskConfig.lineStart = this.taskConfig.lineStart || 0;

        const after10 = parseInt(after10String);

        if (Number.isNaN(after10)) {
            await this.tg.sendText('Нужно ввести число');
            return;
        }

        this.taskConfig.lineAfter10 = after10;

        if (this.taskConfig.lineStart > this.taskConfig.lineAfter10) {
            this.taskConfig.side = TSide.LONG;
        } else {
            this.taskConfig.side = TSide.SHORT;
        }

        this.taskConfig.step = (this.taskConfig.lineAfter10 - this.taskConfig.lineStart) / 10;
        this.taskConfig.lineAfter20 = this.taskConfig.lineStart + this.taskConfig.step * 20;

        await this.taskSpikePrompt();
    }

    async taskSpikePrompt(): Promise<void> {
        await this.tg.sendText('Введи спайк', false);
        this.setNext(this.taskSpikeSelect);
    }

    async taskSpikeSelect(spikeString: string): Promise<void> {
        const spike = parseInt(spikeString);

        if (Number.isNaN(spike)) {
            await this.tg.sendText('Нужно ввести число');
            return;
        }

        this.taskConfig.spike = spike;

        await this.taskCancelPrompt();
    }

    async taskCancelPrompt(): Promise<void> {
        await this.tg.sendText('Введи через сколько свечей отменить', false);
        this.setNext(this.taskCancelSelect);
    }

    async taskCancelSelect(cancelAfterString: string): Promise<void> {
        const cancelAfter = parseInt(cancelAfterString);

        if (Number.isNaN(cancelAfter)) {
            await this.tg.sendText('Нужно ввести число');
            return;
        }

        this.taskConfig.cancelAfter = cancelAfter;

        await this.taskConfirmPrompt();
    }

    async taskConfirmPrompt(): Promise<void> {
        await this.tg.sendText(
            `Всё верно?\n\n${JSON.stringify(this.taskConfig, null, 2)}`,
            Object.values(EConfirm),
        );
        this.setNext(this.taskConfirmSelect);
    }

    async taskConfirmSelect(choice: string): Promise<void> {
        if (choice === EConfirm.OK) {
            // TODO -
            await this.tg.sendText('Задача отправлена в работу');
        } else {
            await this.tg.sendText('Отменено');
        }

        await this.mainMenu();
    }

    async setNext(next: (text: string) => Promise<void>): Promise<void> {
        await this.tg.setNextStep(async (text) => {
            if (text === '/cancel') {
                await this.mainMenu();
            } else {
                await next.call(this, text);
            }
        });
    }
}
