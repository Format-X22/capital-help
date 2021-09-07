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

export enum ECandleSize {
    H1 = '1 час',
    H4 = '4 часа',
    D1 = 'День',
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

export enum ETaskState {
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

export const canClearStates = [
    ETaskState.TIMEOUT,
    ETaskState.VOLATILITY_EXIT,
    ETaskState.LOSS,
    ETaskState.SAFE_LOSS,
    ETaskState.SMALL_SAFE_LOSS,
    ETaskState.TAKE,
    ETaskState.MANUAL_CANCEL,
    ETaskState.KILLED,
];

export type TErrors = Array<{ time: Date; error: string }>;

export class Task {
    private static lastId = 0;

    id: number;
    state: ETaskState = ETaskState.INITIAL;
    stock?: EStock;
    marginAmount?: number;
    side?: ESide;
    zeroLevel?: number;
    oneLevel?: number;
    sixLevel?: number;
    cancelPrice?: number;
    cancelAfterCandles?: number;
    candleSize?: ECandleSize;

    constructor() {
        this.id = Task.lastId++;
    }
}