import { Injectable, OnModuleInit } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { ECandleSize, ESide, EStock, Task } from './task.config';
import { TaskService } from './task.service';

enum EMainMenu {
    STATUS = '📄 Статус',
    ERRORS = '📕 Ошибки',
    TASK = '➕ Задача',
    CLEAR = '🧹 Очистить',
    CANCEL = '❌ Отменить',
}

enum EConfirm {
    OK = 'Да',
    CANCEL = 'Нет',
}

@Injectable()
export class MenuService implements OnModuleInit {
    private taskConfig: Task = new Task();

    constructor(private tg: TelegramService, private taskService: TaskService) {}

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

            case EMainMenu.ERRORS:
                await this.showErrors();
                break;

            case EMainMenu.TASK:
                await this.constructTask();
                break;

            case EMainMenu.CLEAR:
                await this.clearTaskPrompt();
                break;

            case EMainMenu.CANCEL:
                await this.cancelTaskPrompt();
                break;

            default:
                await this.tg.sendText('Неизвестный пункт меню');
        }
    }

    private async showStatus(): Promise<void> {
        await this.tg.sendText(this.toPrettyJson(this.taskService.getTasks()));
    }

    private async showErrors(): Promise<void> {
        await this.tg.sendText(this.toPrettyJson(this.taskService.getLast10Errors()));
    }

    private async clearTaskPrompt(): Promise<void> {
        await this.tg.sendText('Какую задачу нужно очистить?');
        this.setNext(this.clearTaskDo);
    }

    private async clearTaskDo(idString: string): Promise<void> {
        const id = Number(idString);

        if (!(await this.checkNumber(id))) {
            return;
        }

        await this.tg.sendText(await this.taskService.clear(id));
        await this.mainMenu();
    }

    private async cancelTaskPrompt(): Promise<void> {
        await this.tg.sendText('Какую задачу нужно отменить?');
        this.setNext(this.cancelTaskDo);
    }

    private async cancelTaskDo(idString: string): Promise<void> {
        const id = Number(idString);

        if (!(await this.checkNumber(id))) {
            return;
        }

        await this.tg.sendText(await this.taskService.cancel(id));
        await this.mainMenu();
    }

    private async constructTask(): Promise<void> {
        this.taskConfig = new Task();

        await this.taskStockPrompt();
    }

    private async taskStockPrompt(): Promise<void> {
        await this.tg.sendText('Выбери биржу', Object.values(EStock));
        this.setNext(this.taskStockSelect);
    }

    private async taskStockSelect(selected: string): Promise<void> {
        if (!(selected in EStock)) {
            await this.tg.sendText('Неизвестная биржа');
            return;
        }

        this.taskConfig.stock = selected as EStock;

        await this.taskMarginPrompt();
    }

    private async taskMarginPrompt(): Promise<void> {
        await this.tg.sendText('Введи общую маржу для трат', false);
        this.setNext(this.taskMarginSelect);
    }

    private async taskMarginSelect(amountString: string): Promise<void> {
        const amount = Number(amountString);

        if (!(await this.checkNumber(amount))) {
            return;
        }

        this.taskConfig.marginAmount = amount;

        await this.taskZeroLeverPrompt();
    }

    private async taskZeroLeverPrompt(): Promise<void> {
        await this.tg.sendText('Какая цена 0.00 уровня фибы?', false);
        this.setNext(this.taskZeroLeverSelect);
    }

    private async taskZeroLeverSelect(levelString: string): Promise<void> {
        const level = Number(levelString);

        if (!(await this.checkNumber(level))) {
            return;
        }

        this.taskConfig.zeroLevel = level;

        await this.taskOneLevelPrompt();
    }

    private async taskOneLevelPrompt(): Promise<void> {
        await this.tg.sendText('Какая цена 1.00 уровня фибы?', false);
        this.setNext(this.taskOneLevelSelect);
    }

    private async taskOneLevelSelect(levelString: string): Promise<void> {
        const config = this.taskConfig;
        const zero = config.zeroLevel as number;
        const level = Number(levelString);

        if (!(await this.checkNumber(level))) {
            return;
        }

        config.oneLevel = level;

        const diff = Math.abs(config.oneLevel - zero) * 0.62;

        if (config.oneLevel > zero) {
            config.side = ESide.LONG;
            config.sixLevel = zero + diff;
        } else {
            config.side = ESide.SHORT;
            config.sixLevel = zero - diff;
        }

        await this.taskCancelPricePrompt();
    }

    private async taskCancelPricePrompt(): Promise<void> {
        await this.tg.sendText('На какой цене отменить?', false);
        this.setNext(this.taskCancelPriceSelect);
    }

    private async taskCancelPriceSelect(priceString: string): Promise<void> {
        const price = Number(priceString);

        if (!(await this.checkNumber(price))) {
            return;
        }

        this.taskConfig.cancelPrice = price;

        await this.taskCancelAfterCandlesPrompt();
    }

    private async taskCancelAfterCandlesPrompt(): Promise<void> {
        await this.tg.sendText('Через сколько свечей отменить?', false);
        this.setNext(this.taskCancelAfterCandlesSelect);
    }

    private async taskCancelAfterCandlesSelect(cancelString: string): Promise<void> {
        const cancel = Number(cancelString);

        if (!(await this.checkNumber(cancel))) {
            return;
        }

        this.taskConfig.cancelAfterCandles = cancel;

        await this.taskCandleSizePrompt();
    }

    private async taskCandleSizePrompt(): Promise<void> {
        await this.tg.sendText('Какой размер свеч?', Object.values(ECandleSize));
        this.setNext(this.taskCandlesSizeSelect);
    }

    private async taskCandlesSizeSelect(candleSize: string): Promise<void> {
        if (!Object.values(ECandleSize).includes(candleSize as ECandleSize)) {
            await this.tg.sendText('Неизвестный таймфрейм');
            return;
        }

        this.taskConfig.candleSize = { ...ECandleSize }[candleSize];

        await this.taskConfirmPrompt();
    }

    private async taskConfirmPrompt(): Promise<void> {
        await this.tg.sendText(
            `Всё верно?\n\n${this.toPrettyJson(this.taskConfig)}`,
            Object.values(EConfirm),
        );
        this.setNext(this.taskConfirmSelect);
    }

    private async taskConfirmSelect(choice: string): Promise<void> {
        if (choice === EConfirm.OK) {
            this.taskService.add(this.taskConfig);
            await this.tg.sendText('Задача отправлена в работу');
        } else {
            await this.tg.sendText('Отменено');
        }

        await this.mainMenu();
    }

    private setNext(next: (text: string) => Promise<void>): void {
        this.tg.setNextStep(async (text) => {
            if (text === '/cancel') {
                await this.mainMenu();
            } else {
                await next.call(this, text);
            }
        });
    }

    private toPrettyJson(data: unknown) {
        return JSON.stringify(data, null, 2);
    }

    private async checkNumber(value: number): Promise<boolean> {
        if (Number.isNaN(value)) {
            await this.tg.sendText('Нужно ввести число');
            return false;
        }

        return true;
    }
}
