export interface Article {
	id: string;
	title: string;
	link: string;
	source: string;
	description: string;
}

export const DEFAULT_FEEDS: Record<string, string> = {
	itsfoss: 'https://feed.itsfoss.com',
	bbc: 'https://feeds.bbci.co.uk/news/rss.xml',
	allafrica: 'https://allafrica.com/tools/headlines/rdf/africa/headlines.rdf',
	abc: 'https://abcnews.com/abcnews/internationalheadlines',
	nypost: 'https://nypost.com/feed/',
	hkfp: 'https://hongkongfp.com/feed/'
};

const CORS_PROXY = 'https://corsproxy.io/?';

export function isCustomFeed(cat: string): boolean {
	return !Object.prototype.hasOwnProperty.call(DEFAULT_FEEDS, cat);
}

export async function fetchNewsFeed(cat: string, feedUrl: string): Promise<Article[]> {
	const response = await fetch(CORS_PROXY + encodeURIComponent(feedUrl));
	const text = await response.text();
	const parser = new DOMParser();
	const xml = parser.parseFromString(text, 'application/xml');
	const items = xml.querySelectorAll('item');

	return Array.from(items).map((item, index) => {
		const titleNode = item.querySelector('title');
		const linkNode = item.querySelector('link');
		const sourceNode = item.querySelector('source');

		const link = linkNode?.textContent?.trim() || '#';
		const title = titleNode?.textContent?.trim() || 'Untitled Article';

		return {
			// Combine link + index to guarantee a unique key for Svelte {#each} loops
			id: `${link}-${index}`,
			title,
			link,
			source: sourceNode?.textContent?.trim() || cat.toUpperCase(),
			description: 'Click to stream object content metrics through native reader mode...'
		};
	});
}

export async function scrapeArticleContent(articleUrl: string): Promise<string> {
	const response = await fetch(CORS_PROXY + encodeURIComponent(articleUrl));
	const text = await response.text();
	const parser = new DOMParser();
	const doc = parser.parseFromString(text, 'text/html');

	const content =
		doc.querySelector('article') ||
		doc.querySelector('main') ||
		doc.querySelector('.article-body') ||
		doc.body;

	const junk = content.querySelectorAll('script, iframe, nav, footer, style, header, .ads');
	junk.forEach((el) => el.remove());

	return content.innerHTML;
}

export function exportFeedsJSON(feeds: Record<string, string>): void {
	const jsonString = JSON.stringify(feeds, null, 2);
	const blob = new Blob([jsonString], { type: 'application/json' });
	const url = URL.createObjectURL(blob);

	const link = document.createElement('a');
	link.href = url;
	link.download = 'avero-feeds.json';
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

export function parseImportedFeedsJSON(rawText: string): Record<string, string> {
	const parsed = JSON.parse(rawText);

	if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
		return parsed as Record<string, string>;
	}
	throw new Error('Invalid JSON structure: Expected a key-value feed map');
}
