export const fetchHackerNewsThread = async (idOrUrl: string) => {
    // Extract ID
    let id = idOrUrl;
    if (idOrUrl.includes('ycombinator.com')) {
        const url = new URL(idOrUrl);
        id = url.searchParams.get('id') || id;
    }

    const BASE_URL = 'https://hacker-news.firebaseio.com/v0';

    const fetchItem = async (itemId: string | number) => {
        const r = await fetch(`${BASE_URL}/item/${itemId}.json`);
        return r.json();
    };

    const root = await fetchItem(id);
    if (!root) throw new Error('HN Item not found');

    // Fetch comments (BFS or recursive, limit depth/count to avoid huge payload)
    const comments: any[] = [];
    const queue = [...(root.kids || [])];

    // Limit to first 50 top comments + some children for demo performance
    // Real app would need pagination or smarter fetching
    let count = 0;
    const MAX_COMMENTS = 100;

    while (queue.length > 0 && count < MAX_COMMENTS) {
        const currentId = queue.shift();
        const item = await fetchItem(currentId);
        if (item && !item.deleted && !item.dead) {
            comments.push(item);
            count++;
            if (item.kids) {
                queue.push(...item.kids);
            }
        }
    }

    // Format as text for LLM
    return {
        source: 'hacker-news',
        title: root.title,
        text: comments.map(c => `User: ${c.by || 'anon'}
Text: ${c.text}
Link: https://news.ycombinator.com/item?id=${c.id}`).join('\n\n')
    };
};
