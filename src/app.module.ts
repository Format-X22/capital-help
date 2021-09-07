import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { TelegramService } from './telegram.service';
import { MenuService } from './menu.service';
import { TaskService } from './task.service';
import { PhoneService } from './phone.service';

@Module({
    imports: [
        ScheduleModule.forRoot(),
        ConfigModule.forRoot({
            isGlobal: true,
            cache: true,
        }),
    ],
    controllers: [],
    providers: [TelegramService, MenuService, TaskService, PhoneService],
})
export class AppModule {}
