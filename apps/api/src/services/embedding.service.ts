/**
 * Embedding Service - 文本向量化服务
 * 使用 Google Gemini Embedding API
 */

import { logger } from '../utils/logger';

interface EmbeddingConfig {
  model: string;
  taskType?: 'SEMANTIC_SIMILARITY' | 'CLASSIFICATION' | 'CLUSTERING';
  outputDimensionality?: number;
}

interface EmbeddingResponse {
  embeddings: Array<{
    values: number[];
  }>;
}

export class EmbeddingService {
  private apiKey: string;
  private baseUrl: string = 'https://generativelanguage.googleapis.com/v1beta';
  private defaultModel: string = 'gemini-embedding-001';

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    if (!this.apiKey) {
      logger.warn('GEMINI_API_KEY 未配置，embedding服务将不可用');
    }
  }

  /**
   * 生成单个文本的向量
   */
  async generateEmbedding(
    text: string,
    config?: Partial<EmbeddingConfig>
  ): Promise<number[]> {
    const model = config?.model || this.defaultModel;
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
      const model = config?.model || this.defaultModel;
      const taskType = config?.taskType || 'SEMANTIC_SIMILARITY';
      const outputDimensionality = config?.outputDimensionality;

      // 批量使用 batchEmbedContents，单个使用 embedContent
      const endpoint = texts.length === 1 ? 'embedContent' : 'batchEmbedContents';
      const url = `${this.baseUrl}/models/${model}:${endpoint}`;

      // 构建请求体 - 单个文本用不同格式
      const requestBody: any = texts.length === 1 ? {
        model: `models/${model}`,
        content: {
          parts: [{ text: texts[0].substring(0, 10000) }]
        }
      } : {
        requests: texts.map(text => ({
          model: `models/${model}`,
          content: {
            parts: [{ text: text.substring(0, 10000) }]
          }
        }))
      };

      // 如果指定了输出维度
      if (outputDimensionality) {
        if (texts.length === 1) {
          requestBody.output_dimensionality = outputDimensionality;
        } else {
          requestBody.requests.forEach((req: any) => {
            req.output_dimensionality = outputDimensionality;
          });
        }
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error('Embedding API 请求失败', { 
          status: response.status, 
          error,
          url,
          requestBody 
        });
        throw new Error(`Embedding API 失败: ${response.status} - ${error}`);
      }

      const data = await response.json() as any;
      
      // 单个和批量返回格式不同
      let embeddings: number[][];
      if (texts.length === 1) {
        // 单个返回: { embedding: { values: [...] } }
        if (!data.embedding || !data.embedding.values) {
          throw new Error('Embedding API 返回空结果');
        }
        embeddings = [data.embedding.values];
      } else {
        // 批量返回: { embeddings: [{ values: [...] }, ...] }
        if (!data.embeddings || data.embeddings.length === 0) {
          throw new Error('Embedding API 返回空结果');
        }
        embeddings = data.embeddings.map((e: any) => e.values);
      }

      logger.debug('Embedding 生成成功', { 
        count: embeddings.length,
        dimension: embeddings[0].length
      });

      return embeddings;
    } catch (error) {
      logger.error('生成 embedding 失败', { error, textsCount: texts.length });
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
    
    // 返回 0-100 的百分比
    return (similarity + 1) / 2 * 100;
  }

  /**
   * 批量计算相似度矩阵
   */
  async calculateSimilarityMatrix(texts: string[]): Promise<number[][]> {
    const embeddings = await this.generateEmbeddings(texts);
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
      const embeddings = await this.generateEmbeddings([text1, text2]);
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

