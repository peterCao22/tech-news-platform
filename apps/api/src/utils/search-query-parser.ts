/**
 * Story 4.2: 搜索查询解析器
 * 
 * 功能: 解析用户输入的搜索查询，支持布尔语法（AND, OR, NOT, 括号, 短语, 通配符）
 * 并转换为PostgreSQL tsquery语法
 * 
 * 支持的语法:
 * 1. 基础词项: "AI" => TERM(AI)
 * 2. AND操作: "AI AND 芯片" => AND(TERM(AI), TERM(芯片))
 * 3. OR操作: "OpenAI OR ChatGPT" => OR(TERM(OpenAI), TERM(ChatGPT))
 * 4. NOT操作: "AI NOT 加密货币" => AND(TERM(AI), NOT(TERM(加密货币)))
 * 5. 括号分组: "(AI OR 人工智能) AND 芯片"
 * 6. 通配符: "tech*" => PREFIX(tech)
 * 7. 短语搜索: "\"人工智能\"" => PHRASE(人工智能)
 */

export enum TokenType {
  TERM = 'TERM',       // 普通词项
  PHRASE = 'PHRASE',   // 短语（引号包围）
  PREFIX = 'PREFIX',   // 前缀（通配符）
  AND = 'AND',         // AND操作符
  OR = 'OR',           // OR操作符
  NOT = 'NOT',         // NOT操作符
  LPAREN = 'LPAREN',   // 左括号
  RPAREN = 'RPAREN',   // 右括号
  EOF = 'EOF'          // 结束标记
}

export interface Token {
  type: TokenType;
  value: string;
  position: number;
}

export interface ParsedQuery {
  type: 'AND' | 'OR' | 'NOT' | 'TERM' | 'PHRASE' | 'PREFIX';
  value?: string;
  children?: ParsedQuery[];
}

export interface ParseResult {
  success: boolean;
  parsed?: ParsedQuery;
  tsquery?: string;
  error?: string;
  position?: number;
}

/**
 * 词法分析器 (Tokenizer)
 */
class Tokenizer {
  private input: string;
  private position: number;
  private tokens: Token[];

  constructor(input: string) {
    this.input = input.trim();
    this.position = 0;
    this.tokens = [];
  }

  /**
   * 扫描并生成Token列表
   */
  tokenize(): Token[] {
    while (this.position < this.input.length) {
      this.skipWhitespace();
      
      if (this.position >= this.input.length) break;
      
      const char = this.input[this.position];
      
      // 左括号
      if (char === '(') {
        this.tokens.push({
          type: TokenType.LPAREN,
          value: '(',
          position: this.position
        });
        this.position++;
        continue;
      }
      
      // 右括号
      if (char === ')') {
        this.tokens.push({
          type: TokenType.RPAREN,
          value: ')',
          position: this.position
        });
        this.position++;
        continue;
      }
      
      // 短语搜索（引号）
      if (char === '"' || char === '"' || char === '"') {
        const phrase = this.readPhrase();
        if (phrase) {
          this.tokens.push({
            type: TokenType.PHRASE,
            value: phrase,
            position: this.position
          });
        }
        continue;
      }
      
      // 读取词项或操作符
      const word = this.readWord();
      if (word) {
        const upperWord = word.toUpperCase();
        
        // 检查是否是操作符
        if (upperWord === 'AND') {
          this.tokens.push({
            type: TokenType.AND,
            value: 'AND',
            position: this.position - word.length
          });
        } else if (upperWord === 'OR') {
          this.tokens.push({
            type: TokenType.OR,
            value: 'OR',
            position: this.position - word.length
          });
        } else if (upperWord === 'NOT') {
          this.tokens.push({
            type: TokenType.NOT,
            value: 'NOT',
            position: this.position - word.length
          });
        } else if (word.endsWith('*')) {
          // 通配符
          this.tokens.push({
            type: TokenType.PREFIX,
            value: word.slice(0, -1),
            position: this.position - word.length
          });
        } else {
          // 普通词项
          this.tokens.push({
            type: TokenType.TERM,
            value: word,
            position: this.position - word.length
          });
        }
      }
    }
    
    // 添加EOF标记
    this.tokens.push({
      type: TokenType.EOF,
      value: '',
      position: this.position
    });
    
    return this.tokens;
  }

  private skipWhitespace(): void {
    while (
      this.position < this.input.length &&
      /\s/.test(this.input[this.position])
    ) {
      this.position++;
    }
  }

  private readWord(): string {
    let word = '';
    while (
      this.position < this.input.length &&
      !/[\s()]/.test(this.input[this.position]) &&
      this.input[this.position] !== '"'
    ) {
      word += this.input[this.position];
      this.position++;
    }
    return word;
  }

  private readPhrase(): string | null {
    const startQuote = this.input[this.position];
    this.position++; // 跳过开始引号
    
    let phrase = '';
    let endQuoteFound = false;
    
    while (this.position < this.input.length) {
      const char = this.input[this.position];
      
      // 检查是否是结束引号
      if (
        char === '"' || 
        char === '"' || 
        char === '"' ||
        (startQuote === '"' && char === '"')
      ) {
        endQuoteFound = true;
        this.position++; // 跳过结束引号
        break;
      }
      
      phrase += char;
      this.position++;
    }
    
    return endQuoteFound ? phrase : null;
  }
}

/**
 * 语法分析器 (Parser)
 */
class Parser {
  private tokens: Token[];
  private position: number;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
    this.position = 0;
  }

  /**
   * 解析查询
   */
  parse(): ParsedQuery {
    return this.parseExpression();
  }

  private parseExpression(): ParsedQuery {
    return this.parseOrExpression();
  }

  private parseOrExpression(): ParsedQuery {
    let left = this.parseAndExpression();
    
    while (this.current().type === TokenType.OR) {
      this.advance(); // 消费OR
      const right = this.parseAndExpression();
      left = {
        type: 'OR',
        children: [left, right]
      };
    }
    
    return left;
  }

  private parseAndExpression(): ParsedQuery {
    let left = this.parseNotExpression();
    
    while (this.current().type === TokenType.AND || this.isImplicitAnd()) {
      if (this.current().type === TokenType.AND) {
        this.advance(); // 消费AND
      }
      const right = this.parseNotExpression();
      left = {
        type: 'AND',
        children: [left, right]
      };
    }
    
    return left;
  }

  private parseNotExpression(): ParsedQuery {
    if (this.current().type === TokenType.NOT) {
      this.advance(); // 消费NOT
      const expr = this.parsePrimary();
      return {
        type: 'NOT',
        children: [expr]
      };
    }
    
    return this.parsePrimary();
  }

  private parsePrimary(): ParsedQuery {
    const token = this.current();
    
    // 括号表达式
    if (token.type === TokenType.LPAREN) {
      this.advance(); // 消费左括号
      const expr = this.parseExpression();
      
      if (this.current().type !== TokenType.RPAREN) {
        throw new Error(`期望右括号，但得到 ${this.current().type} at position ${this.current().position}`);
      }
      
      this.advance(); // 消费右括号
      return expr;
    }
    
    // 短语
    if (token.type === TokenType.PHRASE) {
      this.advance();
      return {
        type: 'PHRASE',
        value: token.value
      };
    }
    
    // 前缀（通配符）
    if (token.type === TokenType.PREFIX) {
      this.advance();
      return {
        type: 'PREFIX',
        value: token.value
      };
    }
    
    // 普通词项
    if (token.type === TokenType.TERM) {
      this.advance();
      return {
        type: 'TERM',
        value: token.value
      };
    }
    
    throw new Error(`意外的token: ${token.type} at position ${token.position}`);
  }

  private current(): Token {
    return this.tokens[this.position];
  }

  private advance(): void {
    this.position++;
  }

  /**
   * 检查是否是隐式AND（两个词项之间没有操作符）
   */
  private isImplicitAnd(): boolean {
    const current = this.current();
    return (
      current.type === TokenType.TERM ||
      current.type === TokenType.PHRASE ||
      current.type === TokenType.PREFIX ||
      current.type === TokenType.LPAREN ||
      current.type === TokenType.NOT
    );
  }
}

/**
 * PostgreSQL tsquery转换器
 */
class TsQueryConverter {
  /**
   * 将解析后的查询转换为PostgreSQL tsquery语法
   */
  convert(parsed: ParsedQuery): string {
    switch (parsed.type) {
      case 'TERM':
        return this.escapeTerm(parsed.value!);
      
      case 'PHRASE':
        // 短语搜索使用<->操作符连接词
        return parsed.value!
          .split(/\s+/)
          .map(word => this.escapeTerm(word))
          .join(' <-> ');
      
      case 'PREFIX':
        return `${this.escapeTerm(parsed.value!)}:*`;
      
      case 'AND':
        return `(${parsed.children!.map(child => this.convert(child)).join(' & ')})`;
      
      case 'OR':
        return `(${parsed.children!.map(child => this.convert(child)).join(' | ')})`;
      
      case 'NOT':
        return `!(${this.convert(parsed.children![0])})`;
      
      default:
        throw new Error(`未知的查询类型: ${parsed.type}`);
    }
  }

  /**
   * 转义特殊字符
   */
  private escapeTerm(term: string): string {
    // 移除特殊字符，保留字母、数字、中文、下划线
    return term.replace(/[^\w\u4e00-\u9fa5]/g, ' ').trim();
  }
}

/**
 * 搜索查询解析器主类
 */
export class SearchQueryParser {
  /**
   * 解析搜索查询字符串
   * 
   * @param query - 用户输入的搜索查询
   * @returns 解析结果，包含解析后的AST和tsquery字符串
   * 
   * @example
   * const result = parser.parse('AI AND (芯片 OR 半导体)');
   * console.log(result.tsquery); // => "(AI) & ((芯片) | (半导体))"
   */
  parse(query: string): ParseResult {
    try {
      // 空查询
      if (!query || query.trim() === '') {
        return {
          success: false,
          error: '搜索查询不能为空'
        };
      }
      
      // 1. 词法分析
      const tokenizer = new Tokenizer(query);
      const tokens = tokenizer.tokenize();
      
      // 检查是否有有效的token
      const validTokens = tokens.filter(t => t.type !== TokenType.EOF);
      if (validTokens.length === 0) {
        return {
          success: false,
          error: '搜索查询无效'
        };
      }
      
      // 2. 语法分析
      const parser = new Parser(tokens);
      const parsed = parser.parse();
      
      // 3. 转换为tsquery
      const converter = new TsQueryConverter();
      const tsquery = converter.convert(parsed);
      
      return {
        success: true,
        parsed,
        tsquery
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '解析错误',
        position: 0
      };
    }
  }

  /**
   * 验证查询语法
   */
  validate(query: string): { valid: boolean; error?: string } {
    const result = this.parse(query);
    return {
      valid: result.success,
      error: result.error
    };
  }

  /**
   * 简化查询（用于显示）
   */
  simplify(query: string): string {
    const result = this.parse(query);
    if (!result.success || !result.parsed) {
      return query;
    }
    return this.stringifyParsed(result.parsed);
  }

  private stringifyParsed(parsed: ParsedQuery): string {
    switch (parsed.type) {
      case 'TERM':
      case 'PHRASE':
      case 'PREFIX':
        return parsed.value!;
      
      case 'AND':
        return parsed.children!.map(c => this.stringifyParsed(c)).join(' AND ');
      
      case 'OR':
        return parsed.children!.map(c => this.stringifyParsed(c)).join(' OR ');
      
      case 'NOT':
        return `NOT ${this.stringifyParsed(parsed.children![0])}`;
      
      default:
        return '';
    }
  }
}

// 导出单例实例
export const searchQueryParser = new SearchQueryParser();

/**
 * 示例用法:
 * 
 * ```typescript
 * import { searchQueryParser } from './search-query-parser';
 * 
 * // 基础搜索
 * const result1 = searchQueryParser.parse('AI');
 * // => { success: true, tsquery: 'AI' }
 * 
 * // AND操作
 * const result2 = searchQueryParser.parse('AI AND 芯片');
 * // => { success: true, tsquery: '(AI) & (芯片)' }
 * 
 * // 复杂查询
 * const result3 = searchQueryParser.parse('(AI OR 人工智能) AND (芯片 OR 半导体) NOT 加密货币');
 * // => { success: true, tsquery: '((AI) | (人工智能)) & ((芯片) | (半导体)) & !(加密货币)' }
 * 
 * // 短语搜索
 * const result4 = searchQueryParser.parse('"artificial intelligence"');
 * // => { success: true, tsquery: 'artificial <-> intelligence' }
 * 
 * // 通配符
 * const result5 = searchQueryParser.parse('tech*');
 * // => { success: true, tsquery: 'tech:*' }
 * ```
 */

