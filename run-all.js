const { spawnSync } = require('child_process');
const path = require('path');

// Curated colors for terminal wow factor
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m'
};

console.log(`${colors.bright}${colors.cyan}====================================================`);
console.log(`        CCNPMM UTE CONNECT AUTOMATION RUNNER        `);
console.log(`====================================================${colors.reset}\n`);

const testSuites = [
  { name: 'Phân hệ Chung (GEN)', file: 'specs/GEN_regression.test.js' },
  { name: 'Phân hệ Giao diện (GUI)', file: 'specs/GUI_regression.test.js' },
  { name: 'Phân hệ Quản trị (ADM)', file: 'specs/ADM_regression.test.js' }
];

const results = [];

testSuites.forEach((suite, index) => {
  console.log(`${colors.bright}${colors.yellow}[${index + 1}/${testSuites.length}] Đang chạy suite: ${suite.name}...${colors.reset}`);
  console.log(`${colors.cyan}File: ${suite.file}${colors.reset}\n`);

  // Run mocha for the test suite file
  const run = spawnSync('npx', ['mocha', suite.file], {
    stdio: 'inherit',
    shell: true,
    cwd: __dirname
  });

  if (run.status === 0) {
    console.log(`\n${colors.bright}${colors.green}✓ ${suite.name} HOÀN THÀNH THÀNH CÔNG!${colors.reset}\n`);
    results.push({ name: suite.name, status: 'PASSED', color: colors.green });
  } else {
    console.log(`\n${colors.bright}${colors.red}✗ ${suite.name} THẤT BẠI! (Mã lỗi: ${run.status})${colors.reset}\n`);
    results.push({ name: suite.name, status: 'FAILED', color: colors.red });
  }
  console.log(`${colors.magenta}----------------------------------------------------${colors.reset}`);
});

console.log(`\n${colors.bright}${colors.cyan}====================================================`);
console.log(`                  BẢNG TỔNG HỢP KẾT QUẢ             `);
console.log(`====================================================${colors.reset}`);

results.forEach(res => {
  const statusStr = `${res.color}${colors.bright}[ ${res.status} ]${colors.reset}`;
  console.log(`- ${res.name.padEnd(30)} : ${statusStr}`);
});

console.log(`\n${colors.bright}${colors.cyan}====================================================${colors.reset}`);

const anyFailed = results.some(r => r.status === 'FAILED');
if (anyFailed) {
  console.log(`${colors.bright}${colors.red}Kết quả: Có bài test bị thất bại. Vui lòng kiểm tra lại log chi tiết ở trên!${colors.reset}`);
  process.exit(1);
} else {
  console.log(`${colors.bright}${colors.green}Kết quả: TẤT CẢ các test case đã chạy thành công!${colors.reset}`);
  process.exit(0);
}
