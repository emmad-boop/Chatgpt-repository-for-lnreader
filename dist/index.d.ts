/** FanFiction.net source. The exported object follows LNReader's source contract. */
export type NovelItem = {
    name: string;
    url: string;
    cover?: string;
    author?: string;
    description?: string;
    metadata?: string;
};
export type Chapter = {
    name: string;
    url: string;
    number: number;
    date?: string;
};
export type Novel = Omit<NovelItem, 'metadata'> & {
    genres: string[];
    status: 'ongoing' | 'completed' | 'unknown';
    chapters: Chapter[];
    metadata: Record<string, string>;
};
export type Page<T> = {
    items: T[];
    hasNextPage: boolean;
};
export declare class FanFictionNetSource {
    readonly id = "fanfictionnet";
    readonly name = "FanFiction.net";
    readonly baseUrl = "https://www.fanfiction.net";
    readonly lang = "en";
    private fetchHtml;
    private parseCards;
    searchNovels(query: string, page?: number): Promise<Page<NovelItem>>;
    getPopularNovels(page?: number): Promise<Page<NovelItem>>;
    getLatestNovels(page?: number): Promise<Page<NovelItem>>;
    getNovel(input: string): Promise<Novel>;
    getChapterContent(input: string): Promise<string>;
}
declare const source: FanFictionNetSource;
export default source;
