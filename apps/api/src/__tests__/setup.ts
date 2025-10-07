// Jest测试环境设置
// 全局测试配置和模拟设置

import { jest, beforeAll, afterAll, afterEach } from '@jest/globals';

// 设置测试超时
jest.setTimeout(10000);

// 模拟console方法以减少测试输出噪音
const originalConsole = console;

beforeAll(() => {
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsole.log;
  console.info = originalConsole.info;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
});

// 清理每个测试后的模拟
afterEach(() => {
  jest.clearAllMocks();
});

// 模拟全局变量
global.process.env.NODE_ENV = 'test';
global.process.env.JWT_SECRET = 'test-jwt-secret-key';
global.process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5433/technews';

