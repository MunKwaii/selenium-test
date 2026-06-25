const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');
const config = require('../config');
const LoginPage = require('../pages/login.page');
const AdminPage = require('../pages/admin.page');

describe('CCNPMM UTE Connect - Phân Hệ Quản Trị (ADM) Regression Tests', function () {
  this.timeout(50000);
  let driver;
  let loginPage;
  let adminPage;

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
    adminPage = new AdminPage(driver);

    // Đăng nhập Admin một lần trước khi chạy các ca kiểm thử
    await loginPage.navigateTo(config.baseUrl);
    await driver.sleep(1000);
    await loginPage.login(config.adminUser.email, config.adminUser.password);
    await driver.wait(until.urlIs(config.baseUrl + '/'), 15000);
    await driver.sleep(1000);
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

  // Hàm click an toàn
  async function safeClick(element, color = 'green') {
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", element);
    await slowDelay();
    await highlight(element, color);
    await driver.executeScript("arguments[0].click();", element);
  }

  describe('Quản lý người dùng (ADM_02, ADM_13)', function () {
    it('ADM_02: Kiểm tra hiển thị danh sách tài khoản người dùng', async function () {
      // Bước 1: Vào trang Quản trị
      await adminPage.navigateTo(config.baseUrl);
      await slowDelay();
      const currentUrl = await driver.getCurrentUrl();
      assert.ok(currentUrl.includes('/admin'), `Không thể truy cập trang Quản trị. URL hiện tại: ${currentUrl}`);

      // Bước 2: Chọn thẻ Người dùng
      await adminPage.switchTab('users');
      await slowDelay();

      // Chờ bảng dữ liệu tải xong
      const rows = await driver.wait(until.elementsLocated(adminPage.tableRows), 15000);
      assert.ok(rows.length > 0, 'Bảng dữ liệu người dùng trống rỗng hoặc không tải được');

      // Bước 3: Kiểm tra bảng danh sách hiển thị đầy đủ các cột thông tin (không phân biệt hoa thường)
      const headerText = await adminPage.getTableHeaderText();
      const headerTextLower = headerText.toLowerCase();
      
      assert.ok(
        headerTextLower.includes('người dùng'), 
        `Tiêu đề bảng không chứa cột 'Người dùng'. Thực tế: "${headerText}"`
      );
      
      const hasRoleColumn = headerTextLower.includes('vai trò') || headerTextLower.includes('mật khẩu');
      assert.ok(
        hasRoleColumn, 
        `Tiêu đề bảng không chứa cột Vai trò/Mật khẩu đại diện cho vai trò. Thực tế: "${headerText}"`
      );

      assert.ok(
        headerTextLower.includes('ngày tham gia'), 
        `Tiêu đề bảng không chứa cột 'Ngày tham gia'. Thực tế: "${headerText}"`
      );

      assert.ok(
        headerTextLower.includes('hành động'), 
        `Tiêu đề bảng không chứa cột 'Hành động'. Thực tế: "${headerText}"`
      );

      // Đọc dòng đầu tiên
      const firstRowText = await rows[0].getText();
      assert.ok(firstRowText.length > 0, 'Dòng đầu tiên trong bảng không có dữ liệu');
      
      await highlight(rows[0], 'green');
      await slowDelay();
    });

    it('ADM_13: Kiểm tra chức năng tìm kiếm người dùng trên trang Quản trị', async function () {
      // Đảm bảo ở trang Quản trị và tab Người dùng
      await adminPage.navigateTo(config.baseUrl);
      await slowDelay();
      await adminPage.switchTab('users');
      await slowDelay();

      const searchInputEl = await driver.wait(until.elementLocated(adminPage.searchInput), 10000);
      
      // Bước 1: Bấm vào ô Tìm kiếm user
      await safeClick(searchInputEl, 'red');
      await slowDelay();

      // Gán reload flag
      await driver.executeScript("window.test_reload_flag = true;");

      // Bước 2: Gõ ký tự "a"
      await searchInputEl.sendKeys('a');
      await slowDelay();

      // Kiểm tra reload flag
      const reloadFlag = await driver.executeScript("return window.test_reload_flag;");

      // Khẳng định: Gõ phím tìm kiếm không làm reload trang web.
      assert.strictEqual(
        reloadFlag, 
        true, 
        'BUG ADM_13: Trang web bị tải lại hoàn toàn (reload) ngay khi gõ phím đầu tiên vào ô tìm kiếm người dùng'
      );

      // Bước 3: Xác minh danh sách người dùng tự động lọc
      const filteredRows = await driver.findElements(adminPage.tableRows);
      for (const row of filteredRows) {
        await highlight(row, 'blue');
        const rowText = await row.getText();
        assert.ok(
          rowText.toLowerCase().includes('a'),
          `Lọc sai kết quả: Dòng người dùng không chứa ký tự "a". Nội dung: "${rowText}"`
        );
      }
      await slowDelay();
    });
  });
});
