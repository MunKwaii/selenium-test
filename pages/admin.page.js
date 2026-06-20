const { By, until } = require('selenium-webdriver');

class AdminPage {
  constructor(driver) {
    this.driver = driver;
    
    // Tab Selectors
    this.overviewTab = By.xpath("//button[contains(., 'Tổng quan')]");
    this.usersTab = By.xpath("//button[contains(., 'Người dùng')]");
    this.postsTab = By.xpath("//button[contains(., 'Bài viết')]");
    
    // Overview statistics values
    this.totalUsersVal = By.xpath("//h3[contains(text(), 'Tổng Người Dùng')]/../div/span");
    this.totalPostsVal = By.xpath("//h3[contains(text(), 'Tổng Bài Viết')]/../div/span");
    
    // Users tab
    this.searchInput = By.xpath("//input[@placeholder='Tìm kiếm user...']");
    this.deleteUserBtn = By.xpath("//button[@title='Xóa người dùng']");
    this.tableHeader = By.css('table thead tr');
    this.tableRows = By.css('table tbody tr');
    
    // Posts tab
    this.deletePostBtn = By.xpath("//button[@title='Xóa bài viết']");
  }

  async navigateTo(baseUrl) {
    await this.driver.get(baseUrl + '/admin');
  }

  async switchTab(tabName) {
    let locator;
    if (tabName === 'overview') locator = this.overviewTab;
    else if (tabName === 'users') locator = this.usersTab;
    else if (tabName === 'posts') locator = this.postsTab;
    
    const tabEl = await this.driver.wait(until.elementLocated(locator), 10000);
    await tabEl.click();
  }

  async getTotalUsersCount() {
    const el = await this.driver.wait(until.elementLocated(this.totalUsersVal), 10000);
    return await el.getText();
  }

  async getTotalPostsCount() {
    const el = await this.driver.wait(until.elementLocated(this.totalPostsVal), 10000);
    return await el.getText();
  }

  async searchUser(query) {
    const input = await this.driver.wait(until.elementLocated(this.searchInput), 10000);
    await input.sendKeys(query);
  }

  async clickDeleteFirstUser() {
    const btn = await this.driver.wait(until.elementLocated(this.deleteUserBtn), 10000);
    await btn.click();
  }

  async clickDeleteFirstPost() {
    const btn = await this.driver.wait(until.elementLocated(this.deletePostBtn), 10000);
    await btn.click();
  }

  async getTableHeaderText() {
    const header = await this.driver.wait(until.elementLocated(this.tableHeader), 10000);
    return await header.getText();
  }
}

module.exports = AdminPage;
