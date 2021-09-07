import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as sleep from 'sleep-promise';

export enum EStock {
    BitMex = 'BitMex',
    ByBit = 'ByBit',
    Binance = 'Binance',
    Deribit = 'Deribit',
    Okex = 'Okex',
    Huobi = 'Huobi',
}

export enum ESide {
    LONG = 'LONG',
    SHORT = 'SHORT',
}

export enum ECancelResult {
    NOT_FOUND = 'Не найдено',
    ALREADY = 'Уже отменено',
    SUCCESS = 'Успешно',
    KILLED = 'Задача была убита',
}

export enum EClearResult {
    NOT_FOUND = 'Не найдено',
    DENIED = 'Невозможно',
    SUCCESS = 'Успешно',
}

enum ETaskState {
    INITIAL = 'Свежая',
    WAIT = 'В ожидании',
    TIMEOUT = 'Время ожидания истекло',
    VOLATILITY_EXIT = 'Отмена из-за волатильности',
    TRY_ENTER = 'Попытка входа',
    IN_PARTIAL_POSITION = 'Частично в позиции',
    IN_FULL_POSITION = 'Полностью в позиции',
    LOSS = 'Потеря',
    SAFE_LOSS = 'Выход в ноль',
    SMALL_SAFE_LOSS = 'Выход в малую прибыль',
    TAKE = 'Успешно',
    MANUAL_CANCEL = 'Отменена в ручную',
    KILLED = 'Задача была убита',
}

const canClearStates = [
    ETaskState.TIMEOUT,
    ETaskState.VOLATILITY_EXIT,
    ETaskState.LOSS,
    ETaskState.SAFE_LOSS,
    ETaskState.SMALL_SAFE_LOSS,
    ETaskState.TAKE,
    ETaskState.MANUAL_CANCEL,
    ETaskState.KILLED,
];

export class Task {
    private static lastId = 0;

    id: number;
    state: ETaskState = ETaskState.INITIAL;
    stock?: EStock;
    marginAmount?: number;
    side?: ESide;

    constructor() {
        this.id = Task.lastId++;
    }
}

type TErrors = Array<{ time: Date; error: string }>;

@Injectable()
export class TaskService {
    protected readonly logger: Logger = new Logger(TaskService.name);
    private tasks = new Map<Task['id'], Task>();
    private errors: TErrors = [];
    private userLock: Promise<ECancelResult> | null = null;
    private iterationLock: Promise<void> | null = null;

    add(task: Task): void {
        this.tasks.set(task.id, task);
    }

    async cancel(id: Task['id']): Promise<ECancelResult> {
        if (this.iterationLock) {
            await this.iterationLock;
        }

        this.userLock = new Promise(async (resolve) => {
            const task = this.tasks.get(id);

            if (!task) {
                resolve(ECancelResult.NOT_FOUND);
                return;
            }

            if (canClearStates.includes(task.state)) {
                resolve(ECancelResult.ALREADY);
                return;
            }

            if (task.state === ETaskState.INITIAL) {
                task.state = ETaskState.MANUAL_CANCEL;

                resolve(ECancelResult.SUCCESS);
                return;
            }

            if (task.state === ETaskState.WAIT) {
                await this.cancelWaitingTask(task);

                task.state = ETaskState.MANUAL_CANCEL;

                resolve(ECancelResult.SUCCESS);
                return;
            }

            task.state = ETaskState.KILLED;

            resolve(ECancelResult.KILLED);
        });

        const result = await this.userLock;

        this.userLock = null;

        return result;
    }

    async clear(id: Task['id']): Promise<EClearResult> {
        const task = this.tasks.get(id);

        if (!task) {
            return EClearResult.NOT_FOUND;
        }

        if (!canClearStates.includes(task.state)) {
            return EClearResult.DENIED;
        }

        this.tasks.delete(id);

        return EClearResult.SUCCESS;
    }

    getTasks(): Array<Task> {
        return Array.from(this.tasks.values());
    }

    getLast10Errors(): TErrors {
        return this.errors.slice(-10);
    }

    private async cancelWaitingTask(task: Task): Promise<void> {
        // TODO -

        task.state = ETaskState.MANUAL_CANCEL;
    }

    @Cron(CronExpression.EVERY_5_SECONDS)
    private async iteration(): Promise<void> {
        if (this.userLock) {
            await this.userLock;
        }

        this.iterationLock = new Promise(async (resolve) => {
            const handlers: Array<Promise<void>> = [];

            for (const task of this.tasks.values()) {
                handlers.push(this.tryHandleTask(task));
            }

            await Promise.allSettled(handlers);

            resolve();
        });

        await this.iterationLock;

        this.iterationLock = null;
    }

    private async tryHandleTask(task: Task): Promise<void> {
        try {
            await this.handleTask(task);
        } catch (error) {
            this.errors.push({ time: new Date(), error });
            this.logger.error(error, error?.trace?.());
        }
    }

    private async handleTask(task: Task): Promise<void> {
        switch (task.state) {
            case ETaskState.INITIAL:
                await this.placeInitialOrders(task);
                break;

            case ETaskState.WAIT:
                await this.checkEnter(task);
                break;

            case ETaskState.TRY_ENTER:
            case ETaskState.IN_PARTIAL_POSITION:
            case ETaskState.IN_FULL_POSITION:
                await this.handlePosition(task);
                break;

            case ETaskState.LOSS:
            case ETaskState.SAFE_LOSS:
            case ETaskState.TAKE:
            case ETaskState.MANUAL_CANCEL:
            case ETaskState.KILLED:
            case ETaskState.TIMEOUT:
                // Do nothing, task done
                break;

            default:
                throw new Error(`Unknown state for task ${task.id} - ${task.state}`);
        }
    }

    private async placeInitialOrders(task: Task): Promise<void> {
        // TODO -

        task.state = ETaskState.WAIT;
    }

    private async checkEnter(task: Task): Promise<void> {
        // TODO -
    }

    private async handlePosition(task: Task): Promise<void> {
        // TODO -
    }
}
