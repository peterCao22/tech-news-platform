export declare const defaultRSSSources: {
    name: string;
    type: "RSS";
    url: string;
    status: "ACTIVE";
    config: {
        description: string;
        category: string;
        language: string;
        updateFrequency: string;
    };
}[];
/**
 * 种子RSS源到数据库
 */
export declare function seedRSSSources(): Promise<void>;
/**
 * 清理所有RSS源数据（仅用于开发/测试）
 */
export declare function clearRSSSources(): Promise<void>;
