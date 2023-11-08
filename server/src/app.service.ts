import { Injectable } from '@nestjs/common';
import * as Pusher from 'pusher';
// var Pusher = require('pusher');
import 'dotenv/config'

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}

export class PusherService {
  pusher: typeof Pusher.prototype;
  constructor() {
    this.pusher = new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY,
      secret: process.env.PUSHER_APP_SECRET,
      cluster: 'ap2',
      useTLS: true,
    });
  }

  async trigger(channel: string, event: string, data: any) {
    await this.pusher.trigger(channel, event, data);
  }
}
