// 测试环境变量设置
// 在测试运行前设置必要的环境变量

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5433/technews';
process.env.SMTP_HOST = 'smtp.test.com';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'test@example.com';
process.env.SMTP_PASS = 'test-password';
process.env.CORS_ORIGIN = 'http://localhost:3000';
process.env.PORT = '3001';
