/**
 * Embedding Service - 文本向量化服务
 * 使用 Google Gemini Embedding API (官方 SDK)
 */

import { GoogleGenAI } from '@google/genai';
import { logger } from '../utils/logger';

interface EmbeddingConfig {
  taskType?: 'SEMANTIC_SIMILARITY' | 'CLASSIFICATION' | 'CLUSTERING';
  outputDimensionality?: number;
}

export class EmbeddingService {
  private client: GoogleGenAI;
  private defaultModel: string = 'gemini-embedding-001';
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    
    if (!this.apiKey) {
      logger.warn('GEMINI_API_KEY 未配置，embedding服务将不可用');
      // 创建一个空客户端以避免 null 检查
      this.client = new GoogleGenAI({ apiKey: '' });
    } else {
      this.client = new GoogleGenAI({ apiKey: this.apiKey });
    }
  }

  /**
   * 生成单个文本的向量
   */
  async generateEmbedding(
    text: string,
    config?: Partial<EmbeddingConfig>
  ): Promise<number[]> {
    const embeddings = await this.generateEmbeddings([text], config);
    return embeddings[0];
  }

  /**
   * 批量生成文本向量
   */
  async generateEmbeddings(
    texts: string[],
    config?: Partial<EmbeddingConfig>
  ): Promise<number[][]> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY 未配置');
    }

    if (texts.length === 0) {
      return [];
    }

    try {
      const taskType = config?.taskType || 'SEMANTIC_SIMILARITY';
      const outputDimensionality = config?.outputDimensionality;

      logger.debug('开始生成向量', {
        count: texts.length,
        taskType,
        outputDimensionality
      });

      // 截取文本长度（Gemini 限制）
      const truncatedTexts = texts.map(text => text.substring(0, 10000));

      // 使用官方 SDK 生成 embeddings
      const requestConfig: any = {
        model: this.defaultModel,
        contents: truncatedTexts,
        taskType
      };

      if (outputDimensionality) {
        requestConfig.outputDimensionality = outputDimensionality;
      }

      const response = await this.client.models.embedContent(requestConfig);

      if (!response.embeddings || response.embeddings.length === 0) {
        throw new Error('Embedding API 返回空结果');
      }

      // 提取向量值
      const embeddings = response.embeddings.map((e: any) => e.values);

      logger.debug('向量生成成功', {
        count: embeddings.length,
        dimension: embeddings[0].length
      });

      return embeddings;
    } catch (error: any) {
      logger.error('生成 embedding 失败', {
        error: error.message,
        textsCount: texts.length
      });
      throw error;
    }
  }

  /**
   * 计算余弦相似度
   */
  cosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
      throw new Error('向量维度不匹配');
    }

    if (vectorA.length === 0) {
      return 0;
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      magnitudeA += vectorA[i] * vectorA[i];
      magnitudeB += vectorB[i] * vectorB[i];
    }

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    const similarity = dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
    
    // Cosine similarity 范围是 -1 到 1
    // 转换为 0-100 的百分比: (similarity + 1) / 2 * 100
    return (similarity + 1) / 2 * 100;
  }

  /**
   * 批量计算相似度矩阵
   */
  async calculateSimilarityMatrix(texts: string[]): Promise<number[][]> {
    const embeddings = await this.generateEmbeddings(texts, {
      taskType: 'SEMANTIC_SIMILARITY'
    });
    
    const n = embeddings.length;
    const matrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = i; j < n; j++) {
        if (i === j) {
          matrix[i][j] = 100; // 自己和自己100%相似
        } else {
          const similarity = this.cosineSimilarity(embeddings[i], embeddings[j]);
          matrix[i][j] = similarity;
          matrix[j][i] = similarity; // 对称矩阵
        }
      }
    }

    return matrix;
  }

  /**
   * 计算两个文本的语义相似度
   */
  async calculateTextSimilarity(text1: string, text2: string): Promise<number> {
    try {
      const embeddings = await this.generateEmbeddings([text1, text2], {
        taskType: 'SEMANTIC_SIMILARITY'
      });
      return this.cosineSimilarity(embeddings[0], embeddings[1]);
    } catch (error) {
      logger.error('计算文本相似度失败', { error });
      throw error;
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    try {
      await this.generateEmbedding('test', { outputDimensionality: 256 });
      return true;
    } catch (error) {
      logger.error('Embedding 服务健康检查失败', { error });
      return false;
    }
  }
}

// 导出单例
export const embeddingService = new EmbeddingService();
