/**
 * Story 4.2: 搜索API路由
 * 
 * 提供搜索和筛选相关的API端点
 */

import express, { Request, Response, Router } from 'express';
import { searchService, SearchQuery } from '../services/search.service';
import { authenticateToken } from '../middleware/auth.middleware';

const router: Router = Router();

// 应用认证中间件到所有搜索路由
router.use(authenticateToken);

/**
 * POST /api/search/query
 * 
 * 执行搜索查询
 * 
 * @body {SearchQuery} - 搜索查询参数
 * @returns {SearchResponse} - 搜索结果
 */
router.post('/query', async (req: Request, res: Response) => {
  try {
    const searchQuery: SearchQuery = req.body;
    
    // 验证必填字段
    if (!searchQuery.query || typeof searchQuery.query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'BadRequest',
        message: '搜索查询不能为空',
      });
    }
    
    // 验证查询长度
    if (searchQuery.query.length > 500) {
      return res.status(400).json({
        success: false,
        error: 'BadRequest',
        message: '搜索查询过长（最多500字符）',
      });
    }
    
    // 设置默认分页参数
    if (!searchQuery.pagination) {
      searchQuery.pagination = { page: 1, limit: 20 };
    } else {
      searchQuery.pagination.page = Math.max(1, searchQuery.pagination.page || 1);
      searchQuery.pagination.limit = Math.min(100, Math.max(1, searchQuery.pagination.limit || 20));
    }
    
    // 设置默认排序
    if (!searchQuery.sort) {
      searchQuery.sort = { by: 'relevance', order: 'desc' };
    }
    
    // 执行搜索
    const result = await searchService.searchContent(searchQuery);
    
    return res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[SearchRoutes] 搜索失败:', error);
    
    // 处理查询解析错误
    if (error.message && error.message.includes('解析')) {
      return res.status(400).json({
        success: false,
        error: 'InvalidQuery',
        message: error.message,
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: '搜索失败，请稍后重试',
    });
  }
});

/**
 * GET /api/search/filters/options
 * 
 * 获取筛选器的可选项
 * 
 * @returns {FilterOptions} - 筛选选项列表
 */
router.get('/filters/options', async (req: Request, res: Response) => {
  try {
    const options = await searchService.getFilterOptions();
    
    return res.json({
      success: true,
      data: options,
    });
  } catch (error) {
    console.error('[SearchRoutes] 获取筛选选项失败:', error);
    
    return res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: '获取筛选选项失败',
    });
  }
});

/**
 * GET /api/search/validate
 * 
 * 验证搜索查询语法
 * 
 * @query {string} query - 要验证的搜索查询
 * @returns {object} - 验证结果
 */
router.get('/validate', async (req: Request, res: Response) => {
  try {
    const query = req.query.query as string;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'BadRequest',
        message: '查询参数不能为空',
      });
    }
    
    const { searchQueryParser } = await import('../utils/search-query-parser');
    const validation = searchQueryParser.validate(query);
    
    return res.json({
      success: true,
      data: {
        isValid: validation.valid,
        error: validation.error,
        query,
      },
    });
  } catch (error) {
    console.error('[SearchRoutes] 验证查询失败:', error);
    
    return res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: '验证查询失败',
    });
  }
});

export default router;

