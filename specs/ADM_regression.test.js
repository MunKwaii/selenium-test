const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');
const config = require('../config');
const LoginPage = require('../pages/login.page');
const AdminPage = require('../pages/admin.page');

describe('CCNPMM UTE Connect - Phân Hệ Quản Trị (ADM) Regression Tests', function() {
  this.timeout(40000);
  let driver;
  let loginPage;
  let adminPage;

  before(async function() {
    const options = new chrome.Options();
    if (process.env.HEADLESS !== 'false') {
      options.addArguments('--headless=new');
    }
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--window-size=1280,800');
    
    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
    loginPage = new LoginPage(driver);
    adminPage = new AdminPage(driver);

    // Đăng nhập tài khoản Admin
    await loginPage.navigateTo(config.baseUrl);
    await loginPage.login(config.adminUser.email, config.adminUser.password);
    await driver.wait(until.urlContains('/dashboard'), 10000);
    
    // Vào Admin Panel
    await adminPage.navigateTo(config.baseUrl);
    await driver.wait(until.urlContains('/admin'), 10000);
  });

  after(async function() {
    if (driver) {
      await driver.quit();
    }
  });

  describe('Tab Tổng Quan (ADM Overview)', function() {
    it('Bug 3: Kiểm tra hiển thị nhầm dữ liệu Tổng Bài Viết thành Tổng Tin Nhắn', async function() {
      await adminPage.switchTab('overview');
      await driver.sleep(1500);

      const totalUsers = await adminPage.getTotalUsersCount();
      const totalPosts = await adminPage.getTotalPostsCount();
      
      // Theo dõi AdminDashboard.jsx: Tổng Bài Viết sử dụng stats.totalMessages thay vì stats.totalPosts
      // Cả hai thẻ "Tổng Bài Viết" và "Tổng Tin Nhắn" đều sẽ hiển thị cùng giá trị stats.totalMessages.
      // Chúng ta sẽ kiểm tra xem số lượng hiển thị có đúng bằng nhau không (do bug bind nhầm data)
      const totalMessagesVal = await driver.findElement(By.xpath("//h3[contains(text(), 'Tổng Tin Nhắn')]/../div/span")).getText();
      
      assert.strictEqual(totalPosts, totalMessagesVal, 'Bug 3: Số lượng bài viết bị gán nhầm thành số lượng tin nhắn');
    });
  });

  describe('Tab Người Dùng (ADM Users)', function() {
    before(async function() {
      await adminPage.switchTab('users');
      await driver.sleep(1500);
    });

    it('Bug 4: Kiểm tra tiêu đề cột Vai trò bị đặt tên sai thành Mật khẩu', async function() {
      const headerText = await adminPage.getTableHeaderText();
      
      // Bug 4: Đổi tên cột Vai Trò thành "Mật khẩu" để gây nhầm lẫn
      assert.ok(headerText.includes('MẬT KHẨU') || headerText.includes('Mật khẩu'), 'Bug 4: Cột Vai trò bị hiển thị tiêu đề thành Mật khẩu');
    });

    it('Bug 6: Kiểm tra cột Ngày tham gia bị căn giữa (text-center) trong khi Header căn trái', async function() {
      const dateHeaderCell = await driver.findElement(By.xpath("//th[contains(., 'Ngày tham gia')]"));
      const dateHeaderAlign = await dateHeaderCell.getAttribute('className');

      const dateBodyCell = await driver.findElement(By.xpath("//tbody/tr[1]/td[3]"));
      const dateBodyAlign = await dateBodyCell.getAttribute('className');

      // Bug 6: Header cột không căn giữa nhưng body cell chứa class text-center (căn giữa)
      assert.ok(!dateHeaderAlign.includes('text-center'), 'Bug 6: Header Ngày tham gia phải được căn trái (không có class text-center)');
      assert.ok(dateBodyAlign.includes('text-center'), 'Bug 6: Dữ liệu Ngày tham gia lại có class text-center');
    });

    it('Bug 7: Kiểm tra thanh tìm kiếm gõ vào gây reload trang (Reload Trap)', async function() {
      // Trước khi gõ, lấy URL hiện tại hoặc đánh dấu biến window để kiểm tra reload
      await driver.executeScript('window.testReloadFlag = "not_reloaded";');
      
      await adminPage.searchUser('a');
      await driver.sleep(1000);

      // Kiểm tra flag trên window
      const flag = await driver.executeScript('return window.testReloadFlag;');
      
      // Bug 7: Thanh tìm kiếm "bẫy", gõ vào là reload trang gây mất data (flag biến mất)
      assert.strictEqual(flag, null, 'Bug 7: Gõ tìm kiếm đã reload trang nên flag trên window bị xóa');
    });

    it('Bug 5: Giả vờ xóa Admin thành công thay vì báo lỗi/disable', async function() {
      // Khôi phục lại trang sau khi bị reload từ test case trước
      await driver.sleep(1000);
      
      // Tìm dòng chứa tài khoản Admin UTE Connect
      const adminRowDeleteBtn = await driver.findElement(By.xpath("//tr[contains(., 'Admin UTE Connect')]//button[@title='Xóa người dùng']"));
      await adminRowDeleteBtn.click();
      await driver.sleep(1000);

      // Lấy toast thông báo
      const toastEl = await driver.wait(until.elementLocated(By.className('Toastify__toast-body')), 5000);
      const toastText = await toastEl.getText();

      // Bug 5: Giả vờ xóa Admin thành công
      assert.ok(toastText.includes('Đã xóa tài khoản Admin thành công'), 'Bug 5: Click xóa Admin hiển thị toast thông báo thành công ảo');
    });

    it('Bug 1 & Bug 2: Xóa người dùng thường không confirm và hiện thông báo lỗi (toast.error) màu đỏ', async function() {
      // Tìm tài khoản người dùng thường (Quoc Khanh Dev) và click xóa
      const userRowDeleteBtn = await driver.findElement(By.xpath("//tr[contains(., 'Quoc Khanh Dev')]//button[@title='Xóa người dùng']"));
      await userRowDeleteBtn.click();
      
      // Kiểm tra không có confirm dialog
      let alertOpened = false;
      try {
        const alert = await driver.switchTo().alert();
        alertOpened = true;
        await alert.dismiss();
      } catch (e) {
        alertOpened = false;
      }
      
      // Bug 1: Không có confirm dialog
      assert.strictEqual(alertOpened, false, 'Bug 1: Xóa người dùng diễn ra ngay lập tức không có hộp thoại confirm');

      // Đợi toast thông báo xuất hiện
      const toastEl = await driver.wait(until.elementLocated(By.css('.Toastify__toast--error')), 5000);
      const toastText = await toastEl.getText();

      // Bug 2: Xóa thành công nhưng lại dùng toast.error (màu đỏ)
      assert.ok(toastText.includes('Đã xóa người dùng'), 'Bug 2: Click xóa user thường trả về thông báo Đã xóa người dùng');
    });
  });
});
