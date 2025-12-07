export const fetchRedditThread = async (url: string) => {
    // Ensure it's a reddit URL
    if (!url.includes('reddit.com')) throw new Error('Not a valid Reddit URL');

    // Append .json
    const jsonUrl = url.split('?')[0].replace(/\/$/, '') + '.json';

    try {
        const response = await fetch(jsonUrl);
        if (!response.ok) throw new Error(`Failed to fetch Reddit: ${response.statusText}`);

        const data = await response.json();
        // Reddit JSON is [Listing (Post), Listing (Comments)]
        const post = data[0].data.children[0].data;
        const comments = data[1].data.children;

        const extractComments = (children: any[]): string[] => {
            let results: string[] = [];
            for (const child of children) {
                if (child.kind === 't1') {
                    const c = child.data;
                    results.push(`User: ${c.author}
Text: ${c.body}
Link: https://reddit.com${c.permalink}`);

                    if (c.replies && c.replies.data && c.replies.data.children) {
                        results.push(...extractComments(c.replies.data.children));
                    }
                }
            }
            return results;
        };

        const commentTexts = extractComments(comments);

        return {
            source: 'reddit',
            title: post.title,
            text: `OP: ${post.selftext || post.url}
        
Comments:
${commentTexts.join('\n\n')}`
        };

    } catch (e: any) {
        if (e.name === 'TypeError' && e.message === 'Failed to fetch') {
            throw new Error('CORS Error: Reddit blocks browser fetch. A proxy is needed, or install a CORS extension.');
        }
        throw e;
    }
};
