const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');
const config = require('../config');
const LoginPage = require('../pages/login.page');
const ProfilePage = require('../pages/profile.page');
const PostPage = require('../pages/post.page');

describe('CCNPMM UTE Connect - Phân Hệ Chung (GEN) Regression Tests', function () {
  this.timeout(40000);
  let driver;
  let loginPage;
  let profilePage;
  let postPage;

  before(async function () {
    const options = new chrome.Options();
    if (process.env.HEADLESS !== 'false') {
      options.addArguments('--headless=new');
    }
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--window-size=1280,800');

    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
    loginPage = new LoginPage(driver);
    profilePage = new ProfilePage(driver);
    postPage = new PostPage(driver);
  });

  after(async function () {
    if (driver) {
      await driver.quit();
    }
  });

  // helper to perform a standard login
  async function performLogin() {
    await loginPage.navigateTo(config.baseUrl);
    await loginPage.login(config.testUser.email, config.testUser.password);
    // wait until redirected to home (LoginForm redirects to '/')
    await driver.wait(until.urlIs(config.baseUrl + '/'), 10000);
  }

  describe('Đăng ký & Đăng nhập (GEN_01, GEN_02, GEN_03, GEN_17)', function () {
    it('GEN_01: Kiểm tra việc thiếu ký hiệu bắt buộc (*) trên Form Đăng Ký', async function () {
      await driver.get(config.baseUrl + '/register');
      await driver.wait(until.elementLocated(By.name('email')), 10000);

      const labels = await driver.findElements(By.css('label'));
      let hasRequiredStar = false;
      for (const label of labels) {
        const text = await label.getText();
        if (text.includes('*')) {
          hasRequiredStar = true;
          break;
        }
      }
      // BUG GEN_01: Bỏ ký hiệu trường bắt buộc (*)
      assert.strictEqual(hasRequiredStar, false, 'BUG GEN_01: Nhãn các trường bắt buộc không được có ký hiệu *');
    });

    it('GEN_03: Kiểm tra sai màu sắc CSS của thông báo lỗi trên Form Đăng Ký', async function () {
      await driver.get(config.baseUrl + '/register');
      const submitBtn = await driver.wait(until.elementLocated(By.xpath("//button[@type='submit' and contains(., 'Đăng ký')]")), 10000);
      await submitBtn.click(); // Gửi form trống

      // Tìm các thông báo lỗi validation
      const errorTextEl = await driver.wait(until.elementLocated(By.xpath("//p[contains(text(), 'Vui lòng nhập email.')]")), 5000);
      const errorClass = await errorTextEl.getAttribute('className');

      // BUG GEN_03: Sai màu sắc CSS đồng bộ của thông báo lỗi (sử dụng text-gray-500 thay vì text-red-600)
      assert.ok(errorClass.includes('text-gray-500'), 'BUG GEN_03: Thông báo lỗi phải chứa class text-gray-500');
      assert.ok(!errorClass.includes('text-red-600'), 'BUG GEN_03: Thông báo lỗi không được chứa class text-red-600');
    });

    it('GEN_02: Kiểm tra vị trí hiển thị thông báo lỗi Validation tại Form Đăng Nhập', async function () {
      await loginPage.navigateTo(config.baseUrl);
      // Gửi đăng nhập với thông tin trống
      const submitBtn = await driver.findElement(loginPage.loginBtn);
      await submitBtn.click();

      // Đợi alert lỗi xuất hiện
      const errorAlert = await driver.wait(until.elementLocated(loginPage.errorAlert), 5000);

      // BUG GEN_02: Hiển thị sai vị trí thông báo lỗi Validation (nằm ở đầu form thay vì dưới từng trường)
      const errorText = await errorAlert.getText();
      assert.ok(errorText.includes('email') || errorText.includes('mật khẩu'), 'BUG GEN_02: Alert thông báo lỗi hiển thị gộp ở đầu form');
    });
  });



  describe('Bài Viết & Bình Luận (GEN_07, GEN_26)', function () {
    before(async function () {
      // Đảm bảo login thành công và ở dashboard
      await performLogin();
      await postPage.navigateToFeed(config.baseUrl);
      await driver.sleep(1500);
      // Tạo bài viết mẫu của user này để phục vụ test xóa bài (GEN_07)
      await postPage.createPost('Bai viet test tu dong');
      await driver.sleep(2000);
      // Tải lại feed để bài viết chắc chắn được hiển thị ở đầu
      await postPage.navigateToFeed(config.baseUrl);
      await driver.sleep(2000);
    });

    it('GEN_26: Cho phép đăng Bình luận rỗng (toàn khoảng trắng)', async function () {
      // Đi tới chi tiết bài viết đầu tiên
      await postPage.clickFirstPostDetail();
      await driver.sleep(1000);

      // Đăng bình luận rỗng
      await postPage.addComment('   ');
      await driver.sleep(2000);

      // Kiểm tra xem có lỗi hiển thị không
      const errorDisplayed = await driver.findElements(postPage.commentErrorText);

      // BUG GEN_26: Cho phép đăng Bình luận rỗng (Toàn khoảng trắng)
      assert.strictEqual(errorDisplayed.length, 0, 'BUG GEN_26: Không được có thông báo lỗi khi đăng bình luận rỗng');
    });

    it('GEN_07: Thiếu hộp thoại xác nhận khi thực hiện chức năng Xóa bài viết', async function () {
      await postPage.navigateToFeed(config.baseUrl);
      await driver.sleep(1500);

      // Xóa bài viết
      await postPage.deleteFirstPost();

      // Kiểm tra xem có dialog/alert xuất hiện không
      let alertOpened = false;
      try {
        const alert = await driver.switchTo().alert();
        alertOpened = true;
        await alert.accept();
      } catch (e) {
        // Không có alert nào được mở
        alertOpened = false;
      }

      // BUG GEN_07: Thiếu hộp thoại xác nhận khi thực hiện chức năng Xóa bài viết (Bỏ qua confirm)
      assert.strictEqual(alertOpened, false, 'BUG GEN_07: Bài viết bị xóa ngay lập tức mà không hiện popup xác nhận');
    });
  });
});
