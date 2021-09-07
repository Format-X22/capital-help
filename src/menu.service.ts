import { Injectable, OnModuleInit } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { EStock, TaskService, ESide, Task } from './task.service';

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
        if (Number.isNaN(idString)) {
            await this.tg.sendText('Нужно ввести число');
            return;
        }

        await this.tg.sendText(await this.taskService.clear(Number(idString)));
        await this.mainMenu();
    }

    private async cancelTaskPrompt(): Promise<void> {
        await this.tg.sendText('Какую задачу нужно отменить?');
        this.setNext(this.cancelTaskDo);
    }

    private async cancelTaskDo(idString: string): Promise<void> {
        if (Number.isNaN(idString)) {
            await this.tg.sendText('Нужно ввести число');
            return;
        }

        await this.tg.sendText(await this.taskService.cancel(Number(idString)));
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
        const amount = parseInt(amountString);

        if (Number.isNaN(amount)) {
            await this.tg.sendText('Нужно ввести число');
            return;
        }

        this.taskConfig.marginAmount = amount;

        // TODO -
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
}
