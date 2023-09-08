const { SearchIndexClient, AzureKeyCredential } = require("@azure/search-documents"),
  blogData = require('./blog-data.js');

require("dotenv").config();

const searchServiceName = process.env.AZ_SEARCH_SERVICE_NAME || "";
const adminApiKey = process.env.AZ_SEARCH_ADMIN_KEY || "";

async function main() {

    if (!searchServiceName || !adminApiKey) {
        console.warn('please configure required env vars');
        return;
    }
    const indexClient = new SearchIndexClient(searchServiceName, new AzureKeyCredential(adminApiKey));
    const searchClient = indexClient.getSearchClient(`blog-index`);

    console.log('Uploading documents...');
    const allPosts = blogData.getAll();
    let indexDocumentsResult = await searchClient.mergeOrUploadDocuments(allPosts);
    console.log(`Index operations succeeded: ${JSON.stringify(indexDocumentsResult.results[0].succeeded)}`);
}

main().catch((err) => {
    console.error("Error while re-building Azure Search Index:", err);
});