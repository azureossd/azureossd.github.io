# Azure Cognitive Search Scripts

This directory contains automation scripts for indexing blog posts into Azure Cognitive Search, enabling enhanced search capabilities for the Azure OSS Developer Support blog.

## 🎯 Overview

The Azure Cognitive Search integration provides powerful search functionality by automatically indexing blog post content, metadata, and tags. The indexing process extracts structured data from Jekyll markdown files and uploads it to a configured Azure Search service.

### Key Features

- **Automated Indexing**: Process all blog posts from the `_posts` directory
- **Content Processing**: Extract and clean markdown content for optimal search
- **Metadata Extraction**: Index titles, tags, categories, and publication dates
- **Error Handling**: Comprehensive error reporting and validation
- **Security**: Environment variable-based configuration with no hardcoded secrets

## 📋 Prerequisites

Before using these scripts, ensure you have:

- **Node.js**: Version 14.0.0 or higher
- **Azure Cognitive Search Service**: An active Azure Search service instance
- **Admin API Key**: Azure Search admin key for write operations
- **Network Access**: Ability to connect to your Azure Search service

## 🚀 Quick Start

1. **Navigate to the scripts directory**:
   ```bash
   cd azcogsearch-scripts
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your Azure Search service details
   ```

4. **Run the indexing script**:
   ```bash
   npm run index
   ```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in this directory with the following variables:

```env
# Azure Search Service Configuration
AZ_SEARCH_SERVICE_NAME=your-search-service-name
AZ_SEARCH_ADMIN_KEY=your-admin-key-here
AZ_SEARCH_INDEX_NAME=blog-index

# Environment Configuration
NODE_ENV=development
```

### Configuration Details

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `AZ_SEARCH_SERVICE_NAME` | ✅ | Name of your Azure Search service | `myblog-search` |
| `AZ_SEARCH_ADMIN_KEY` | ✅ | Admin API key for write operations | `1234567890ABCDEF...` |
| `AZ_SEARCH_INDEX_NAME` | ❌ | Target index name (defaults to `blog-index`) | `blog-posts-prod` |
| `NODE_ENV` | ❌ | Environment for logging verbosity | `development` or `production` |

## 📂 File Structure

```
azcogsearch-scripts/
├── README.md           # This documentation
├── package.json        # Node.js project configuration
├── package-lock.json   # Dependency lock file
├── .env.example        # Environment variable template
├── .gitignore         # Git ignore rules
├── feed-index.js      # Main indexing script
└── blog-data.js       # Blog post processing utilities
```

## 🔧 Usage

### Basic Indexing

Index all blog posts to Azure Cognitive Search:

```bash
npm run index
```

### Development Mode

Run with enhanced logging for troubleshooting:

```bash
NODE_ENV=development npm run index
```

### Production Mode

Run with minimal logging for CI/CD environments:

```bash
NODE_ENV=production npm run index
```

## 📊 Index Schema

The script creates documents in Azure Search with the following structure:

```json
{
  "@search.action": "mergeOrUpload",
  "id": "2023-01-01-example-post",
  "title": "Example Blog Post Title",
  "tags": ["azure", "nodejs", "tutorial"],
  "categories": ["development", "cloud"],
  "description": "Brief description of the post (120 characters max)",
  "content": "Full post content with markdown removed",
  "url": "/2023/01/01/example-post/index.html",
  "pubDate": "2023-01-01T00:00:00.000Z"
}
```

### Field Descriptions

- **id**: Unique identifier derived from the filename
- **title**: Post title from front matter
- **tags**: Array of tags for categorization
- **categories**: Array of categories for organization
- **description**: Truncated content preview (120 chars)
- **content**: Full post content with HTML/markdown stripped
- **url**: Generated permalink for the post
- **pubDate**: Publication date parsed from filename

## 🛠 Troubleshooting

### Common Issues

#### Missing Configuration Error
```
❌ Missing required configuration: searchServiceName, adminApiKey
```
**Solution**: Ensure your `.env` file exists and contains all required variables.

#### Authentication Errors
```
❌ Error during Azure Search indexing:
   Message: Access denied
   Code: 403
```
**Solution**: Verify your admin API key is correct and has write permissions.

#### Network Connectivity Issues
```
❌ Error during Azure Search indexing:
   Message: getaddrinfo ENOTFOUND your-service.search.windows.net
```
**Solution**: Check your search service name and network connectivity.

#### No Posts Found Warning
```
⚠️ No posts found to index
```
**Solution**: Ensure blog posts exist in the `_posts` directory and follow naming conventions.

### Debug Mode

Enable detailed error logging by setting:
```bash
NODE_ENV=development npm run index
```

This will provide:
- Stack traces for errors
- Detailed configuration information  
- Step-by-step processing logs

## 🔒 Security Considerations

### Best Practices

1. **Environment Variables**: Never commit `.env` files to version control
2. **Admin Keys**: Rotate admin keys regularly and use least-privilege access
3. **Managed Identity**: Consider using managed identity in production environments
4. **Network Security**: Restrict Azure Search service access to trusted IPs when possible

### CI/CD Integration

For automated deployments, store credentials as encrypted secrets:

**GitHub Actions Example**:
```yaml
env:
  AZ_SEARCH_SERVICE_NAME: ${{ secrets.SEARCH_SERVICE_NAME }}
  AZ_SEARCH_ADMIN_KEY: ${{ secrets.SEARCH_ADMIN_KEY }}
```

**Azure DevOps Example**:
```yaml
variables:
  - group: azure-search-secrets
```

## 🧰 Development

### Code Structure

- **feed-index.js**: Main script with indexing logic and error handling
- **blog-data.js**: Utility functions for processing Jekyll markdown files

### Key Dependencies

- `@azure/search-documents`: Official Azure SDK for search operations
- `dotenv`: Environment variable management
- `gray-matter`: Front matter parsing for Jekyll posts
- `remove-markdown`: Content cleaning and processing

### Testing Changes

1. Use development environment variables
2. Create a test index to avoid affecting production
3. Run with sample posts to verify functionality

## 📈 Performance Notes

- The script processes all posts in the `_posts` directory sequentially
- Large numbers of posts may take several minutes to index
- Azure Search has rate limits; the script handles standard throttling
- Consider running indexing during off-peak hours for production environments

## 🤝 Contributing

When modifying these scripts:

1. Follow existing error handling patterns
2. Maintain environment variable validation
3. Update this README for any configuration changes
4. Test thoroughly with both development and production configurations

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run index` | Run the main indexing script |
| `npm run audit` | Check for security vulnerabilities |
| `npm run audit-fix` | Automatically fix security issues |

## 🔗 Related Resources

- [Azure Cognitive Search Documentation](https://docs.microsoft.com/en-us/azure/search/)
- [Azure SDK for JavaScript](https://docs.microsoft.com/en-us/javascript/api/overview/azure/search-documents-readme)
- [Jekyll Documentation](https://jekyllrb.com/docs/)
- [Main Repository README](../README.md)

---

**Need Help?** Check the troubleshooting section above or review the Azure Search service logs for detailed error information.