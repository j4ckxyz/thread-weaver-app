export const fetchBlueskyThread = async (url: string) => {
  // Extract URI components
  // URL: https://bsky.app/profile/{handle}/post/{rkey}
  // AT-URI: at://{did}/app.bsky.feed.post/{rkey}

  // Needs resolution of handle -> DID potentially if not provided. 
  // Easier: Search for the post? 
  // Actually, public.api.bsky.app/xrpc/app.bsky.feed.getPostThread?uri=...
  // The 'uri' param needs to be an AT-URI or potentially HTTP URL? The docs say AT-URI usually.

  // Let's try to resolve the Handle to DID first if needed.
  // Or, use a public gateway that takes the URL. 

  // Steps:
  // 1. Parse Handle and RKey from URL.
  // 2. Resolve Handle to DID.
  // 3. Construct AT-URI.
  // 4. Fetch thread.

  const match = url.match(/bsky\.app\/profile\/([^/]+)\/post\/([^/]+)/);
  if (!match) throw new Error('Invalid Bluesky URL');

  const [_, handle, rkey] = match;

  // Resolve Handle
  const didRes = await fetch(`https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=${handle}`);
  const didData = await didRes.json();
  const did = didData.did;

  if (!did) throw new Error('Could not resolve Bluesky handle');

  const atUri = `at://${did}/app.bsky.feed.post/${rkey}`;

  const threadRes = await fetch(`https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread?uri=${atUri}`);
  const threadData = await threadRes.json();

  if (!threadData.thread) throw new Error('Bluesky thread not found');

  // Flatten logic
  const comments: string[] = [];
  const traverse = (node: any) => {
    if (!node) return;
    const record = node.post.record;
    comments.push(`User: ${node.post.author.handle}
Text: ${record.text}
Link: https://bsky.app/profile/${node.post.author.handle}/post/${node.post.uri.split('/').pop()}`);

    if (node.replies) {
      node.replies.forEach((r: any) => traverse(r));
    }
  };

  // Start from replies, root is the main post
  if (threadData.thread.replies) {
    threadData.thread.replies.forEach((r: any) => traverse(r));
  }

  return {
    source: 'bluesky',
    title: threadData.thread.post.record.text.substring(0, 50) + '...', // No title in bsky usually
    text: `OP: ${threadData.thread.post.record.text}

${comments.join('\n\n')}`
  };
};
