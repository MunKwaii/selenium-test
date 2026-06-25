const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');
const config = require('../config');
const LoginPage = require('../pages/login.page');
const PostPage = require('../pages/post.page');

describe('CCNPMM UTE Connect - Phân Hệ Chung (GEN) Regression Tests', function () {
  this.timeout(50000);
  let driver;
  let loginPage;
  let postPage;

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
    postPage = new PostPage(driver);
  });

  after(async function () {
    if (driver) {
      // Dừng lại 3 giây cuối cùng trước khi tắt trình duyệt để thầy giáo/bạn kịp nhìn giao diện
      await driver.sleep(3000);
      await driver.quit();
    }
  });

  // Hàm tự động dừng giữa các bước
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

  describe('Đăng nhập (GEN_01)', function () {
    it('GEN_01: Đăng nhập thành công', async function () {
      await loginPage.navigateTo(config.baseUrl);
      await slowDelay();

      // Viền đỏ ô Email và điền giá trị
      const emailEl = await driver.wait(until.elementLocated(loginPage.emailInput), 10000);
      await highlight(emailEl, 'red');
      await emailEl.sendKeys(config.testUser.email);
      await slowDelay();
      
      // Viền đỏ ô Mật khẩu và điền giá trị
      const passwordEl = await driver.findElement(loginPage.passwordInput);
      await highlight(passwordEl, 'red');
      await passwordEl.sendKeys(config.testUser.password);
      await slowDelay();

      // Viền xanh nút Đăng nhập và click
      const submitBtn = await driver.findElement(loginPage.loginBtn);
      await highlight(submitBtn, 'green');
      await submitBtn.click();
      
      // Chờ chuyển hướng về trang chủ '/' sau khi đăng nhập thành công
      await driver.wait(until.urlIs(config.baseUrl + '/'), 15000);
      await slowDelay();

      // Xác minh sự xuất hiện của nút Đăng xuất trong Navbar
      const logoutBtn = await driver.wait(
        until.elementLocated(By.xpath("//button[contains(., 'Đăng xuất')]")), 
        10000
      );
      await highlight(logoutBtn, 'blue');
      const isDisplayed = await logoutBtn.isDisplayed();
      assert.ok(isDisplayed, 'Đăng nhập thành công nhưng không tìm thấy nút Đăng xuất');
    });
  });

  describe('Quản lý bài viết (GEN_14, GEN_13)', function () {
    it('GEN_14: Tạo bài viết mới', async function () {
      // Điều hướng đến Dashboard (Bảng tin)
      await postPage.navigateToFeed(config.baseUrl);
      await slowDelay();
      
      // Khoanh vùng khung soạn bài viết và điền dữ liệu
      const content = 'Bài viết của Tài';
      const textEl = await driver.wait(until.elementLocated(postPage.postTextarea), 10000);
      await highlight(textEl, 'red');
      await textEl.sendKeys(content);
      await slowDelay();

      // Khoanh vùng nút Đăng bài và click
      const submit = await driver.findElement(postPage.publishBtn);
      await highlight(submit, 'green');
      await submit.click();
      
      // Chờ điều hướng đến trang chi tiết bài viết (hoặc hiển thị thông báo thành công)
      await driver.wait(until.urlContains('/post/'), 10000);
      await slowDelay();

      // Quay lại Dashboard để verify dữ liệu động hiển thị trên Feed
      await postPage.navigateToFeed(config.baseUrl);
      await slowDelay();

      // Lấy phần tử bài viết đầu tiên trên bảng tin và khoanh vùng màu xanh lá cây để verify
      const firstPostTextEl = await driver.wait(
        until.elementLocated(By.xpath("//div[contains(@class, 'prose') or contains(@class, 'text-slate-800')]")),
        10000
      );
      await highlight(firstPostTextEl, 'green');
      const firstPostText = await firstPostTextEl.getText();

      // Kiểm tra nội dung bài viết mới có trùng khớp và nằm ở đầu bảng tin không
      assert.ok(
        firstPostText.includes(content), 
        `Bài viết mới không hiển thị ở đầu bảng tin. Kì vọng chứa: "${content}", Thực tế: "${firstPostText}"`
      );
    });

    it('GEN_13: Lỗi xóa bài không có hộp thoại xác nhận', async function () {
      // Đi tới Dashboard (Bảng tin)
      await postPage.navigateToFeed(config.baseUrl);
      await slowDelay();

      // Định vị nút xóa của bài viết đầu tiên và khoanh viền đỏ quanh nó trước khi bấm
      const deleteBtnEl = await driver.wait(until.elementLocated(postPage.deleteBtn), 10000);
      await highlight(deleteBtnEl, 'red');

      // Click nút xóa
      await deleteBtnEl.click();
      
      // Dừng lại 2 giây để người dùng quan sát: bài viết biến mất ngay tức khắc mà KHÔNG có popup nào hiện lên
      await slowDelay();

      // Kiểm tra xem có hộp thoại xác nhận (window alert/confirm) nào xuất hiện không
      let alertOpened = false;
      try {
        const alert = await driver.switchTo().alert();
        alertOpened = true;
        await alert.dismiss(); // Tắt alert nếu có
      } catch (e) {
        // Không tìm thấy alert nào được mở
        alertOpened = false;
      }

      // Khẳng định: Hệ thống bắt buộc phải hiển thị hộp thoại xác nhận trước khi thực hiện xóa.
      // Assert này sẽ FAIL do lỗi thực tế xóa bài ngay lập tức không có confirm.
      assert.strictEqual(
        alertOpened, 
        true, 
        'BUG GEN_13: Hệ thống xóa bài viết ngay lập tức mà không hiển thị hộp thoại xác nhận'
      );
    });
  });
});
