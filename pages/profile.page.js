const { By, until, Key } = require('selenium-webdriver');

class ProfilePage {
  constructor(driver) {
    this.driver = driver;
    
    // Selectors for Edit Profile
    this.nameInput = By.name('name');
    this.statusSelect = By.name('status');
    this.facultySelect = By.name('faculty');
    this.classCodeInput = By.name('classCode');
    this.companyInput = By.name('company');
    this.locationInput = By.name('location');
    this.skillsInput = By.name('skills');
    this.githubInput = By.name('githubusername');
    this.bioInput = By.name('bio');
    this.saveBtn = By.xpath("//button[@type='submit' and contains(., 'Lưu Hồ Sơ')]");
    
    // Selectors for Profile Display
    this.avatarImg = By.xpath("//img[contains(@alt, 'Avatar') or contains(@class, 'rounded-full')]");
    this.profileName = By.css('h1');
    this.profileBio = By.xpath("//p[contains(@class, 'text-slate-600') or contains(@class, 'bio')]");
  }

  async navigateToEdit(baseUrl) {
    await this.driver.get(baseUrl + '/edit-profile');
  }

  async navigateToProfile(baseUrl, userId = '') {
    if (userId) {
      await this.driver.get(baseUrl + '/profile/' + userId);
    } else {
      await this.driver.get(baseUrl + '/profile');
    }
  }

  async clearAndType(element, text) {
    await element.click();
    // Select all text and delete it to trigger React's onChange correctly
    await element.sendKeys(Key.chord(Key.CONTROL, 'a'), Key.BACK_SPACE);
    await element.sendKeys(text);
  }

  async updateProfile({ name, status, faculty, classCode, company, location, skills, github, bio }) {
    if (name !== undefined) {
      const el = await this.driver.wait(until.elementLocated(this.nameInput), 10000);
      await this.clearAndType(el, name);
    }
    if (status !== undefined) {
      const selectEl = await this.driver.wait(until.elementLocated(this.statusSelect), 10000);
      await selectEl.click();
      await selectEl.findElement(By.xpath(`//option[@value='${status}']`)).click();
    }
    if (faculty !== undefined) {
      const selectEl = await this.driver.wait(until.elementLocated(this.facultySelect), 10000);
      await selectEl.click();
      await selectEl.findElement(By.xpath(`//option[@value='${faculty}']`)).click();
    }
    if (classCode !== undefined) {
      const el = await this.driver.findElement(this.classCodeInput);
      await this.clearAndType(el, classCode);
    }
    if (company !== undefined) {
      const el = await this.driver.findElement(this.companyInput);
      await this.clearAndType(el, company);
    }
    if (location !== undefined) {
      const el = await this.driver.findElement(this.locationInput);
      await this.clearAndType(el, location);
    }
    if (skills !== undefined) {
      const el = await this.driver.findElement(this.skillsInput);
      await this.clearAndType(el, skills);
    }
    if (github !== undefined) {
      const el = await this.driver.findElement(this.githubInput);
      await this.clearAndType(el, github);
    }
    if (bio !== undefined) {
      const el = await this.driver.findElement(this.bioInput);
      await this.clearAndType(el, bio);
    }
    
    const save = await this.driver.findElement(this.saveBtn);
    await save.click();
  }

  async getAvatarSrc() {
    const avatar = await this.driver.wait(until.elementLocated(this.avatarImg), 10000);
    return await avatar.getAttribute('src');
  }

  async getProfileName() {
    const nameEl = await this.driver.wait(until.elementLocated(this.profileName), 10000);
    return await nameEl.getText();
  }
}

module.exports = ProfilePage;
