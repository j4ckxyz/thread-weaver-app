import { fetchHackerNewsThread } from './hackerNews';
import { fetchRedditThread } from './reddit';
import { fetchBlueskyThread } from './bluesky';
import type { SourceType } from '../../types';

export const detectSource = (input: string): SourceType => {
    if (input.includes('news.ycombinator.com') || /^\d+$/.test(input.trim())) return 'hacker-news';
    if (input.includes('reddit.com')) return 'reddit';
    if (input.includes('bsky.app')) return 'bluesky';
    return 'unknown';
};

export const fetchThreadContent = async (input: string) => {
    const type = detectSource(input);
    switch (type) {
        case 'hacker-news': return fetchHackerNewsThread(input);
        case 'reddit': return fetchRedditThread(input);
        case 'bluesky': return fetchBlueskyThread(input);
        default: throw new Error('Unsupported source URL');
    }
};
