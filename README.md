# Azure OSS Blog Post Archives

View the GitHub Pages site at [azureossd.github.io](https://azureossd.github.io/).

## 🔐 Security

This project follows Azure and GitHub security best practices:

- ✅ **Dependency Management**: Automated security updates via Dependabot
- ✅ **Secret Management**: All secrets stored in GitHub Secrets
- ✅ **Secure Authentication**: Uses managed identity patterns for Azure services
- ✅ **Vulnerability Scanning**: Regular npm audit checks in CI/CD
<!-- - ✅ **Security Policy**: See [SECURITY.md](SECURITY.md) for reporting vulnerabilities -->

## Prerequisites

### System Requirements
- **Ruby**: Use RubyInstaller with DevKit v2.7+ [Download here](https://rubyinstaller.org/downloads/)
- **Node.js**: Latest LTS version for Azure Cognitive Search scripts
- **Git**: For version control and contributions

### Installation Steps
1. Install Ruby. For more information, see "[Installing Ruby](https://www.ruby-lang.org/en/documentation/installation/)" in the Ruby documentation.
2. Install Bundler. For more information, see "[Bundler](https://bundler.io/)."
3. Install Jekyll. For more information see "[Guides](https://jekyllrb.com/docs/installation/)"

## 🚀 Running Locally

### Quick Start
1. **Fork & Clone**: Fork this repository and clone it locally
   ```bash
   git clone https://github.com/<your-username>/azureossd.github.io.git
   cd azureossd.github.io
   ```

2. **Install Dependencies**: Install Ruby gems and Node.js packages
   ```bash
   # Install Jekyll dependencies
   bundle install
   
   # Install Azure Cognitive Search dependencies (optional)
   cd azcogsearch-scripts
   npm install
   cd ..
   ```

3. **Start Development Server**: Run Jekyll locally
   ```bash
   bundle exec jekyll serve
   ```

4. **Preview**: Open your browser to `http://localhost:4000`

### Sample Output
```bash
Configuration file: C:/_Code/blog/azureossd.github.io/_config.yml
            Source: C:/_Code/blog/azureossd.github.io
       Destination: C:/_Code/blog/azureossd.github.io/_site
 Incremental build: disabled. Enable with --incremental
      Generating... 
       Jekyll Feed: Generating feed for posts
                    done in 44.171 seconds.
 Auto-regeneration: enabled for 'C:/_Code/blog/azureossd.github.io'
    Server address: http://127.0.0.1:4000/
  Server running... press ctrl-c to stop.
```

## 🔍 Azure Cognitive Search Integration

This repository includes Azure Cognitive Search integration for enhanced blog search capabilities.

### Configuration
1. Copy the environment template:
   ```bash
   cd azcogsearch-scripts
   cp .env.example .env
   ```

2. Update `.env` with your Azure Search service details:
   ```env
   AZ_SEARCH_SERVICE_NAME=your-search-service-name
   AZ_SEARCH_ADMIN_KEY=your-admin-key-here
   AZ_SEARCH_INDEX_NAME=blog-index
   NODE_ENV=development
   ```

### Running Indexing
```bash
cd azcogsearch-scripts
npm run index
```

### Security Notes
- Never commit `.env` files containing secrets
- Use GitHub Secrets for CI/CD environments
- Prefer managed identity over admin keys in production

## 📁 Project Structure
- **[/media](/media)**: All images and digital content from MSDN OSS blog.
- **[/resource](/resource)**: All the CSS and JS content from MSDN OSS blog.
- **[/wp-content-old](/wp-content-old)**: All the original WP content from the MSDN blog.
- **[/azcogsearch-scripts](/azcogsearch-scripts)**: Azure Cognitive Search indexing automation.
- **[/_posts](/_posts)**: Blog post content in Markdown format.
- **[/_pages](/_pages)**: Static pages and category listings.

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

### Quick Contributing Guide
1. **Security First**: Review our [Security Policy](SECURITY.md)
2. **Fork & Branch**: Create a feature branch from `master`
3. **Follow Standards**: Use the provided blog post templates
4. **Test Locally**: Ensure your changes work locally
5. **Submit PR**: Create a pull request with clear description

<!--
## 🛡️ Security Policy

For security vulnerabilities, please see our [Security Policy](SECURITY.md). Do not create public issues for security concerns.
-->

## 📄 License

This project follows Microsoft's open source guidelines. See individual files for specific licensing information.

## 🔗 Related Resources

- [Azure App Service Documentation](https://docs.microsoft.com/en-us/azure/app-service/)
- [Jekyll Documentation](https://jekyllrb.com/docs/)
- [Minimal Mistakes Theme](https://mmistakes.github.io/minimal-mistakes/)
- [Azure Cognitive Search](https://docs.microsoft.com/en-us/azure/search/)
