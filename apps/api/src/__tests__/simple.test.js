"use strict";
/**
 * 简单测试验证Jest配置
 */
describe('Jest Configuration Test', () => {
    it('应该能正常运行Jest测试', () => {
        expect(1 + 1).toBe(2);
    });
    it('应该能使用Jest模拟功能', () => {
        const mockFn = jest.fn();
        mockFn.mockReturnValue('test');
        expect(mockFn()).toBe('test');
        expect(mockFn).toHaveBeenCalled();
    });
    it('应该能使用async/await', async () => {
        const asyncFn = jest.fn().mockResolvedValue('async result');
        const result = await asyncFn();
        expect(result).toBe('async result');
    });
});
