import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { TelegramService } from './telegram.service';
import { MenuService } from './menu.service';

@Module({
    imports: [
        ScheduleModule.forRoot(),
        ConfigModule.forRoot({
            isGlobal: true,
            cache: true,
        }),
    ],
    controllers: [],
    providers: [TelegramService, MenuService],
})
export class AppModule {}
