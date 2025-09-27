// 科技新闻聚合平台 API - 健康检查脚本
// 用于 Docker 容器健康检查

const http = require('http');

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 3001,
  path: '/health',
  method: 'GET',
  timeout: 2000,
};

const request = http.request(options, (res) => {
  console.log(`健康检查状态: ${res.statusCode}`);
  
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

request.on('error', (err) => {
  console.error('健康检查失败:', err.message);
  process.exit(1);
});

request.on('timeout', () => {
  console.error('健康检查超时');
  request.destroy();
  process.exit(1);
});

request.end();
