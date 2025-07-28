/**
 * Azure Cognitive Search Blog Indexing Script
 * 
 * This script indexes blog posts to Azure Cognitive Search for enhanced search capabilities.
 * 
 * Security Features:
 * - Uses environment variables for credentials (no hardcoded secrets)
 * - Validates required configuration before execution
 * - Implements proper error handling and logging
 * 
 * Best Practices Applied:
 * - Structured error handling with detailed logging
 * - Input validation for environment variables
 * - Graceful failure handling
 */

const { SearchIndexClient, AzureKeyCredential } = require("@azure/search-documents");
const blogData = require('./blog-data.js');

// Load environment variables
require("dotenv").config();

// Configuration validation
const CONFIG = {
    searchServiceName: process.env.AZ_SEARCH_SERVICE_NAME,
    adminApiKey: process.env.AZ_SEARCH_ADMIN_KEY,
    indexName: process.env.AZ_SEARCH_INDEX_NAME || 'blog-index',
    environment: process.env.NODE_ENV || 'development'
};

/**
 * Validates that all required configuration is present
 * @returns {boolean} True if configuration is valid
 */
function validateConfiguration() {
    const requiredFields = ['searchServiceName', 'adminApiKey'];
    const missingFields = requiredFields.filter(field => !CONFIG[field]);
    
    if (missingFields.length > 0) {
        console.error(`❌ Missing required configuration: ${missingFields.join(', ')}`);
        console.error('Please ensure the following environment variables are set:');
        console.error('- AZ_SEARCH_SERVICE_NAME: Your Azure Search service name');
        console.error('- AZ_SEARCH_ADMIN_KEY: Your Azure Search admin key');
        return false;
    }
    
    return true;
}

/**
 * Main indexing function with comprehensive error handling
 */
async function main() {
    try {
        console.log('🚀 Starting Azure Cognitive Search indexing...');
        
        // Validate configuration
        if (!validateConfiguration()) {
            process.exit(1);
        }
        
        console.log(`📊 Environment: ${CONFIG.environment}`);
        console.log(`🔍 Search Service: ${CONFIG.searchServiceName}`);
        console.log(`📖 Index Name: ${CONFIG.indexName}`);
        
        // Initialize Azure Search client
        const indexClient = new SearchIndexClient(
            `https://${CONFIG.searchServiceName}.search.windows.net`,
            new AzureKeyCredential(CONFIG.adminApiKey)
        );
        
        const searchClient = indexClient.getSearchClient(CONFIG.indexName);
        
        // Get all blog posts
        console.log('📚 Retrieving blog posts...');
        const allPosts = blogData.getAll();
        console.log(`📄 Found ${allPosts.length} posts to index`);
        
        if (allPosts.length === 0) {
            console.warn('⚠️  No posts found to index');
            return;
        }
        
        // Upload documents to search index
        console.log('📤 Uploading documents to search index...');
        const indexDocumentsResult = await searchClient.mergeOrUploadDocuments(allPosts);
        
        // Validate results
        if (!indexDocumentsResult.results || indexDocumentsResult.results.length === 0) {
            throw new Error('No results returned from index operation');
        }
        
        const successCount = indexDocumentsResult.results.filter(result => result.succeeded).length;
        const failureCount = indexDocumentsResult.results.length - successCount;
        
        console.log(`✅ Indexing completed successfully:`);
        console.log(`   - Successful operations: ${successCount}`);
        console.log(`   - Failed operations: ${failureCount}`);
        
        if (failureCount > 0) {
            console.warn('⚠️  Some documents failed to index. Check Azure Search service logs for details.');
            const failures = indexDocumentsResult.results.filter(result => !result.succeeded);
            failures.forEach(failure => {
                console.error(`   - Failed: ${failure.key} - ${failure.errorMessage}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error during Azure Search indexing:');
        console.error(`   Message: ${error.message}`);
        
        if (error.code) {
            console.error(`   Code: ${error.code}`);
        }
        
        if (error.details) {
            console.error(`   Details: ${JSON.stringify(error.details, null, 2)}`);
        }
        
        // Log stack trace in development
        if (CONFIG.environment === 'development') {
            console.error(`   Stack: ${error.stack}`);
        }
        
        process.exit(1);
    }
}

// Execute main function
main();