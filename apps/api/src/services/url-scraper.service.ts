/**
 * URL Scraper Service
 * 从URL抓取和解析网页内容
 * Story 3.3: Manual Content Management
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

interface ScrapedContent {
  title: string;
  description?: string;
  content: string;
  author?: string;
  publishedAt?: Date;
  images?: string[];
  metadata: {
    domain: string;
    siteName?: string;
    favicon?: string;
    language?: string;
  };
}

interface ScrapeOptions {
  timeout?: number;
  extractFullContent?: boolean;
  includeImages?: boolean;
}

class URLScraperService {
  /**
   * 从URL抓取内容
   */
  async scrapeURL(url: string, options: ScrapeOptions = {}): Promise<ScrapedContent> {
    const {
      timeout = 10000,
      extractFullContent = true,
      includeImages = true,
    } = options;

    try {
      // 验证URL
      const parsedUrl = new URL(url);
      
      // 发送HTTP请求
      const response = await axios.get(url, {
        timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        },
        maxRedirects: 5,
      });

      const html = response.data;
      
      // 使用 Cheerio 解析基本元数据
      const $ = cheerio.load(html);
      
      // 提取元数据
      const metadata = this.extractMetadata($, parsedUrl.hostname);
      
      // 提取标题
      const title = this.extractTitle($);
      
      // 提取描述
      const description = this.extractDescription($);
      
      // 提取作者
      const author = this.extractAuthor($);
      
      // 提取发布时间
      const publishedAt = this.extractPublishedDate($);
      
      // 提取正文内容
      let content = '';
      if (extractFullContent) {
        content = await this.extractMainContent(html, url);
      } else {
        content = description || '';
      }
      
      // 提取图片
      let images: string[] = [];
      if (includeImages) {
        images = this.extractImages($, parsedUrl.origin);
      }

      return {
        title,
        description,
        content,
        author,
        publishedAt,
        images,
        metadata,
      };
    } catch (error: any) {
      console.error('[URL Scraper] Error scraping URL:', error);
      
      if (error.code === 'ECONNREFUSED') {
        throw new Error('无法连接到目标服务器');
      } else if (error.code === 'ETIMEDOUT') {
        throw new Error('请求超时');
      } else if (error.response?.status === 404) {
        throw new Error('页面不存在');
      } else if (error.response?.status === 403) {
        throw new Error('访问被拒绝');
      } else {
        throw new Error(`抓取失败: ${error.message}`);
      }
    }
  }

  /**
   * 提取标题
   */
  private extractTitle($: cheerio.CheerioAPI): string {
    // 尝试多种来源
    const sources = [
      $('meta[property="og:title"]').attr('content'),
      $('meta[name="twitter:title"]').attr('content'),
      $('title').text(),
      $('h1').first().text(),
    ];

    for (const source of sources) {
      if (source && source.trim()) {
        return source.trim();
      }
    }

    return '无标题';
  }

  /**
   * 提取描述
   */
  private extractDescription($: cheerio.CheerioAPI): string | undefined {
    const sources = [
      $('meta[property="og:description"]').attr('content'),
      $('meta[name="twitter:description"]').attr('content'),
      $('meta[name="description"]').attr('content'),
    ];

    for (const source of sources) {
      if (source && source.trim()) {
        return source.trim();
      }
    }

    return undefined;
  }

  /**
   * 提取作者
   */
  private extractAuthor($: cheerio.CheerioAPI): string | undefined {
    const sources = [
      $('meta[name="author"]').attr('content'),
      $('meta[property="article:author"]').attr('content'),
      $('meta[name="twitter:creator"]').attr('content'),
      $('.author').first().text(),
      $('[rel="author"]').first().text(),
    ];

    for (const source of sources) {
      if (source && source.trim()) {
        return source.trim();
      }
    }

    return undefined;
  }

  /**
   * 提取发布日期
   */
  private extractPublishedDate($: cheerio.CheerioAPI): Date | undefined {
    const sources = [
      $('meta[property="article:published_time"]').attr('content'),
      $('meta[name="publication_date"]').attr('content'),
      $('meta[name="date"]').attr('content'),
      $('time[datetime]').attr('datetime'),
      $('time[pubdate]').attr('pubdate'),
    ];

    for (const source of sources) {
      if (source) {
        const date = new Date(source);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }

    return undefined;
  }

  /**
   * 提取元数据
   */
  private extractMetadata($: cheerio.CheerioAPI, domain: string) {
    return {
      domain,
      siteName: $('meta[property="og:site_name"]').attr('content'),
      favicon: $('link[rel="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href'),
      language: $('html').attr('lang') || $('meta[http-equiv="content-language"]').attr('content'),
    };
  }

  /**
   * 提取主要内容（使用 Readability）
   */
  private async extractMainContent(html: string, url: string): Promise<string> {
    try {
      const dom = new JSDOM(html, { url });
      const reader = new Readability(dom.window.document);
      const article = reader.parse();

      if (article && article.content) {
        // 清理HTML，只保留基本格式
        const $ = cheerio.load(article.content);
        
        // 移除脚本和样式
        $('script, style').remove();
        
        // 转换为纯文本或保留基本HTML
        return $.html();
      }

      return '';
    } catch (error) {
      console.error('[URL Scraper] Error extracting main content:', error);
      return '';
    }
  }

  /**
   * 提取图片URLs
   */
  private extractImages($: cheerio.CheerioAPI, baseUrl: string): string[] {
    const images: string[] = [];

    // Open Graph 图片
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage) {
      images.push(this.resolveUrl(ogImage, baseUrl));
    }

    // Twitter 图片
    const twitterImage = $('meta[name="twitter:image"]').attr('content');
    if (twitterImage && twitterImage !== ogImage) {
      images.push(this.resolveUrl(twitterImage, baseUrl));
    }

    // 正文中的图片（限制数量）
    $('img').slice(0, 5).each((_, elem) => {
      const src = $(elem).attr('src');
      if (src) {
        images.push(this.resolveUrl(src, baseUrl));
      }
    });

    // 去重并返回
    return [...new Set(images)].filter(url => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    });
  }

  /**
   * 解析相对URL为绝对URL
   */
  private resolveUrl(url: string, baseUrl: string): string {
    try {
      return new URL(url, baseUrl).href;
    } catch {
      return url;
    }
  }

  /**
   * 批量抓取URLs
   */
  async scrapeMultipleURLs(
    urls: string[],
    options: ScrapeOptions = {}
  ): Promise<Array<{ url: string; success: boolean; data?: ScrapedContent; error?: string }>> {
    const results = await Promise.allSettled(
      urls.map(url => this.scrapeURL(url, options))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return {
          url: urls[index],
          success: true,
          data: result.value,
        };
      } else {
        return {
          url: urls[index],
          success: false,
          error: result.reason?.message || '未知错误',
        };
      }
    });
  }
}

export default new URLScraperService();

