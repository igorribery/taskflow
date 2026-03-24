import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class ClienteRedis extends Redis {
  constructor() {
    super(process.env.URL_REDIS ?? 'redis://localhost:6379');
  }
}
