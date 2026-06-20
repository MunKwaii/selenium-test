const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');
const config = require('../config');
const LoginPage = require('../pages/login.page');
const PostPage = require('../pages/post.page');

describe('CCNPMM UTE Connect - Phân Hệ Giao Diện (GUI) Regression Tests', function() {
  this.timeout(40000);
  let driver;
  let loginPage;
  let postPage;

  before(async function() {
    const options = new chrome.Options();
    options.addArguments('--headless=new');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--window-size=1280,800');
    
    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
    loginPage = new LoginPage(driver);
    postPage = new PostPage(driver);
  });

  after(async function() {
    if (driver) {
      await driver.quit();
    }
  });

  describe('Giao diện Quên Mật Khẩu (GUI_19)', function() {
    it('GUI_19: Kiểm tra hình ảnh minh họa trang Quên mật khẩu bị hỏng link', async function() {
      await driver.get(config.baseUrl + '/auth/forgot-password');
      
      const imgEl = await driver.wait(until.elementLocated(By.css('img')), 10000);
      const srcAttr = await imgEl.getAttribute('src');
      
      // BUG GUI_19: Lỗi hình ảnh minh họa trang Quên mật khẩu bị hỏng link (chứa /assets/broken-link-avatar-xyz.png)
      assert.ok(srcAttr.includes('/assets/broken-link-avatar-xyz.png'), 'BUG GUI_19: Ảnh minh họa Quên mật khẩu chứa link hỏng broken-link-avatar-xyz.png');
    });
  });

  describe('Giao diện Bảng Tin & Bài Viết (GUI_12)', function() {
    before(async function() {
      // Đăng nhập
      await loginPage.navigateTo(config.baseUrl);
      await loginPage.login(config.testUser.email, config.testUser.password);
      await driver.wait(until.urlContains('/dashboard'), 10000);
    });

    it('GUI_12: Kiểm tra hiển thị định dạng ngày tháng thô của Database (Raw ISO) tại Post Item', async function() {
      await postPage.navigateToFeed(config.baseUrl);
      await driver.sleep(1500);
      
      // Lấy text ngày đăng bài viết
      const dateText = await postPage.getPostDateText();
      
      // Kiểm tra định dạng ngày thô ISO (ví dụ: chứa ký tự 'T' và kết thúc bằng 'Z' hoặc khớp với định dạng ISO)
      // Mẫu: 2026-06-20T16:15:22.000Z
      const isoRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
      
      // BUG GUI_12: Hiển thị định dạng ngày tháng thô của Database (Raw ISO)
      assert.ok(isoRegex.test(dateText), `BUG GUI_12: Ngày tháng hiển thị dạng thô (${dateText}) thay vì định dạng tiếng Việt thân thiện`);
    });
  });
});
