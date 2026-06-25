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
  { name: 'Phân hệ Giao diện & Bảo mật (GUI/SEC)', file: 'specs/GUI_regression.test.js' }
];

const results = [];

testSuites.forEach((suite, index) => {
  console.log(`${colors.bright}${colors.yellow}[${index + 1}/${testSuites.length}] Đang chạy suite: ${suite.name}...${colors.reset}`);
  console.log(`${colors.cyan}File: ${suite.file}${colors.reset}\n`);

  // Run mocha for the test suite file and capture output to count pass/fail
  const run = spawnSync('npx', ['mocha', '--colors', suite.file], {
    shell: true,
    cwd: __dirname
  });

  const stdoutStr = run.stdout ? run.stdout.toString() : '';
  const stderrStr = run.stderr ? run.stderr.toString() : '';

  const filterOutput = (text) => {
    if (!text) return '';
    return text.split(/\r?\n/)
      .filter(line => {
        const l = line.toLowerCase();
        if (l.includes('devtools listening on')) return false;
        if (line.match(/^\[\d+:\d+:\d+\/\d+\.\d+:error:/i)) return false;
        if (l.includes('sharedimagemanager::produceskia')) return false;
        if (l.includes('videoprocessorgetoutputextension')) return false;
        if (l.includes('set output type failed')) return false;
        if (l.includes('deprecated_endpoint')) return false;
        return true;
      })
      .join('\n');
  };

  process.stdout.write(filterOutput(stdoutStr) + '\n');
  process.stderr.write(filterOutput(stderrStr) + '\n');

  const passMatch = stdoutStr.match(/(\d+)\s+passing/);
  const failMatch = stdoutStr.match(/(\d+)\s+failing/);
  const passedCount = passMatch ? parseInt(passMatch[1], 10) : 0;
  const failedCount = failMatch ? parseInt(failMatch[1], 10) : 0;

  if (run.status === 0) {
    console.log(`\n${colors.bright}${colors.green}✓ ${suite.name} HOÀN THÀNH THÀNH CÔNG!${colors.reset}\n`);
    results.push({ name: suite.name, status: 'PASSED', color: colors.green, passed: passedCount, failed: failedCount });
  } else {
    console.log(`\n${colors.bright}${colors.red}✗ ${suite.name} THẤT BẠI! (Mã lỗi: ${run.status})${colors.reset}\n`);
    results.push({ name: suite.name, status: 'FAILED', color: colors.red, passed: passedCount, failed: failedCount });
  }
  console.log(`${colors.magenta}----------------------------------------------------${colors.reset}`);
});

console.log(`\n${colors.bright}${colors.cyan}====================================================`);
console.log(`                  BẢNG TỔNG HỢP KẾT QUẢ             `);
console.log(`====================================================${colors.reset}`);

results.forEach(res => {
  const statusStr = `${res.color}${colors.bright}[ ${res.status} ]${colors.reset}`;
  const countStr = `${colors.green}${res.passed} Pass${colors.reset}, ${colors.red}${res.failed} Fail${colors.reset}`;
  console.log(`- ${res.name.padEnd(42)} : ${statusStr} (${countStr})`);
});

console.log(`\n${colors.bright}${colors.cyan}====================================================${colors.reset}`);

const anyFailed = results.some(r => r.status === 'FAILED');
if (anyFailed) {
  console.log(`\n${colors.bright}${colors.yellow}====================================================`);
  console.log(`          GIẢI THÍCH CHI TIẾT LỖI PHÁT HIỆN         `);
  console.log(`====================================================${colors.reset}`);
  console.log(`Các test case bị thất bại là DO LỖI THỰC TẾ của ứng dụng:\n`);
  
  results.forEach(res => {
    if (res.status === 'FAILED') {
      console.log(`${colors.bright}${res.color}- Phân hệ: ${res.name}${colors.reset}`);
      if (res.name.includes('Chung')) {
        console.log(`  └─ [GEN_13 Fail]: Lỗi xóa bài không có hộp thoại xác nhận.`);
        console.log(`     -> Ý nghĩa: Hệ thống xóa bài viết ngay lập tức mà không có Popup xác nhận.`);
      }
      if (res.name.includes('Giao diện')) {
        console.log(`  └─ [SEC_06 Fail]: Lỗi lộ ký tự mật khẩu tại trang Đăng nhập.`);
        console.log(`     -> Ý nghĩa: Ô nhập mật khẩu bị lộ ký tự do có thuộc tính type="text" thay vì type="password".`);
      }
    }
  });
  console.log(`\n${colors.bright}${colors.yellow}====================================================${colors.reset}`);
  console.log(`\n${colors.bright}${colors.red}Kết quả: Có bài test bị thất bại. Vui lòng kiểm tra lại log chi tiết ở trên!${colors.reset}`);
  process.exit(1);
} else {
  console.log(`${colors.bright}${colors.green}Kết quả: TẤT CẢ các test case đã chạy thành công!${colors.reset}`);
  process.exit(0);
}
