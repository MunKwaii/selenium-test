const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');
const config = require('../config');
const LoginPage = require('../pages/login.page');

describe('CCNPMM UTE Connect - Phân Hệ Giao Diện & Bảo mật (GUI/SEC) Regression Tests', function () {
  this.timeout(40000);
  let driver;
  let loginPage;

  before(async function () {
    const options = new chrome.Options();
    if (process.env.HEADLESS === 'true') {
      options.addArguments('--headless=new');
    }
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--window-size=1280,800');
    options.excludeSwitches('enable-logging');
    options.addArguments('--log-level=3');
    options.addArguments('--silent');

    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
    loginPage = new LoginPage(driver);
  });

  after(async function () {
    if (driver) {
      // Dừng lại 3 giây cuối cùng trước khi tắt trình duyệt để thầy giáo/bạn kịp nhìn giao diện
      await driver.sleep(3000);
      await driver.quit();
    }
  });

  // Hàm tự động dừng giữa các bước để giáo viên/bạn dễ quan sát trên màn hình Chrome
  async function slowDelay() {
    if (config.slowMotion && config.slowMotion > 0) {
      await driver.sleep(config.slowMotion);
    }
  }

  // Hàm khoanh vùng viền đỏ/xanh quanh thẻ HTML đang thao tác để dễ quan sát trực quan
  async function highlight(element, color = 'red') {
    if (config.slowMotion && config.slowMotion > 0) {
      await driver.executeScript(
        `arguments[0].style.outline = '3px solid ${color}'; arguments[0].style.outlineOffset = '2px';`, 
        element
      );
      await driver.sleep(800);
    }
  }

  describe('Bảo mật form Đăng nhập (SEC_06)', function () {
    it('SEC_06: Lỗi lộ ký tự mật khẩu', async function () {
      await loginPage.navigateTo(config.baseUrl);
      await slowDelay();

      // Tìm trường input Mật khẩu
      const passwordInput = await driver.wait(
        until.elementLocated(loginPage.passwordInput), 
        10000
      );

      // Điền mật khẩu vào ô để thầy dễ quan sát trực tiếp lỗi lộ ký tự dạng text
      await highlight(passwordInput, 'red');
      await passwordInput.sendKeys('Password@123');
      await slowDelay();

      // Lấy thuộc tính type của trường mật khẩu
      const inputType = await passwordInput.getAttribute('type');

      // Khẳng định: Trường mật khẩu phải có thuộc tính type="password" để ẩn ký tự gõ.
      // Assert này sẽ FAIL do lỗi thực tế type="text" trong mã nguồn.
      assert.strictEqual(
        inputType, 
        'password', 
        `BUG SEC_06: Trường mật khẩu lộ ký tự do có thuộc tính type="${inputType}" thay vì type="password"`
      );
    });
  });
});
