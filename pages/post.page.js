const { By, until, Key } = require('selenium-webdriver');

class PostPage {
  constructor(driver) {
    this.driver = driver;
    
    // Selectors to Create Post
    this.postTextarea = By.xpath("//textarea[contains(@placeholder, 'Bạn đang nghĩ gì') or contains(@placeholder, 'Bạn đang gặp vấn đề gì')]");
    this.publishBtn = By.xpath("//button[@type='submit' and (contains(., 'Đăng bài') or contains(., 'Đăng câu hỏi'))]");
    this.questionToggle = By.xpath("//div[contains(@class, 'block w-10 h-6')]");
    
    // Alert selectors
    this.errorAlert = By.css('.bg-red-50');
    this.successAlert = By.css('.bg-green-50');

    // Selectors on Feed
    this.firstPostLink = By.xpath("//a[contains(@href, '/post/') and contains(., 'Xem thêm')]");
    this.likeBtn = By.xpath("//button[contains(., 'Thích') or contains(., 'Đã thích')]");
    this.deleteBtn = By.xpath("//button[@title='Xóa bài viết']");
    this.postItems = By.css('.bg-white.rounded-2xl.shadow-sm'); // standard selector for PostItem
    this.postDate = By.xpath("//div[contains(@class, 'flex-1')]//div[contains(@class, 'text-gray-400')]/span");

    // Comment elements
    this.commentTextarea = By.id('comment');
    this.commentSubmitBtn = By.xpath("//button[@type='submit' and contains(., 'Gửi')]");
    this.commentErrorText = By.css('p.text-red-500');
  }

  async navigateToFeed(baseUrl) {
    await this.driver.get(baseUrl + '/dashboard');
  }

  async navigateToPostDetail(baseUrl, postId) {
    await this.driver.get(baseUrl + '/post/' + postId);
  }

  async createPost(content, isQuestion = false) {
    const textEl = await this.driver.wait(until.elementLocated(this.postTextarea), 10000);
    await textEl.sendKeys(content);
    
    if (isQuestion) {
      const toggle = await this.driver.findElement(this.questionToggle);
      await toggle.click();
    }
    
    const submit = await this.driver.findElement(this.publishBtn);
    await submit.click();
  }

  async likeFirstPost() {
    const btn = await this.driver.wait(until.elementLocated(this.likeBtn), 10000);
    await btn.click();
  }

  async deleteFirstPost() {
    const btn = await this.driver.wait(until.elementLocated(this.deleteBtn), 10000);
    await btn.click();
  }

  async clickFirstPostDetail() {
    const link = await this.driver.wait(until.elementLocated(this.firstPostLink), 10000);
    await link.click();
  }

  async addComment(commentText) {
    const area = await this.driver.wait(until.elementLocated(this.commentTextarea), 10000);
    await area.sendKeys(commentText);
    const btn = await this.driver.findElement(this.commentSubmitBtn);
    await btn.click();
  }

  async getPostDateText() {
    const dateEl = await this.driver.wait(until.elementLocated(this.postDate), 10000);
    return await dateEl.getText();
  }
}

module.exports = PostPage;
