const { By, until } = require('selenium-webdriver');

class LoginPage {
  constructor(driver) {
    this.driver = driver;
    this.emailInput = By.id('login-email');
    this.passwordInput = By.id('login-password');
    this.loginBtn = By.id('login-submit');
    this.rememberMeCheckbox = By.id('remember-me');
    this.forgotPasswordLink = By.id('forgot-password-link');
    this.registerLink = By.id('register-link');
    
    // Alert selectors
    this.errorAlert = By.css('.bg-red-50');
    this.successAlert = By.css('.bg-green-50');
  }

  async navigateTo(baseUrl) {
    await this.driver.get(baseUrl + '/login');
  }

  async login(email, password) {
    const emailEl = await this.driver.wait(until.elementLocated(this.emailInput), 10000);
    await emailEl.clear();
    await emailEl.sendKeys(email);
    
    const passwordEl = await this.driver.findElement(this.passwordInput);
    await passwordEl.clear();
    await passwordEl.sendKeys(password);
    
    const submitBtn = await this.driver.findElement(this.loginBtn);
    await submitBtn.click();
  }

  async getErrorMessage() {
    try {
      const errEl = await this.driver.wait(until.elementLocated(this.errorAlert), 3000);
      return await errEl.getText();
    } catch (e) {
      return null;
    }
  }

  async getSuccessMessage() {
    try {
      const successEl = await this.driver.wait(until.elementLocated(this.successAlert), 3000);
      return await successEl.getText();
    } catch (e) {
      return null;
    }
  }
}

module.exports = LoginPage;
