const path = require('path'),
    fs = require('fs'),
    matter = require('gray-matter'),
    removeMd = require('remove-markdown');

module.exports = {
    getAll: () => {
        const postDir = path.join(__dirname, '..', '_posts');

        const posts = [];
        const allFiles = fs.readdirSync(postDir);
        allFiles.forEach(f => {
            if ((!f.endsWith('.markdown') && !f.endsWith('.md')) || f.includes('YYYY-MM-DD-Your-Article-Title')) {
                return;
            }
            let postDate = new Date(f.substr(0, 10));
            const singlePost = fs.readFileSync(path.resolve(postDir, f), 'utf-8');
            let doc = matter(singlePost);
            let permalink = `${f.substr(0, 4)}/${f.substr(5, 2)}/${f.substr(8, 2)}/${f.trim().replace(/\s+/g, '-').replace(/\.[^/.]+$/, '').slice(11)}/index.html`;
            posts.push({
                '@search.action': 'mergeOrUpload',
                id: f.trim().replace(/\s+/g, '-').replace(/\.[^/.]+$/, "").replace(/[^\w ]/g, ''),
                title: doc.data.title.trim(),
                tags: doc.data.tags || [],
                categories: doc.data.categories || [],
                description: removeMd(doc.content.replace(/<[^>]+>/g, ' ')).substring(0,120),
                content: removeMd(doc.content.replace(/<[^>]+>/g, ' ')),
                url: `/${permalink}`,
                pubDate: postDate
            });
        });

        return posts;
    }
}