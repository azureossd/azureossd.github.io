# Azure OSS Blog Post Archives

View the GitHub Pages site at [azureossd.github.io](https://azureossd.github.io/).

## Prerequisites
1. Install Ruby. For more information, see "[Installing Ruby](https://www.ruby-lang.org/en/documentation/installation/)" in the Ruby documentation.
2. Install Bundler. For more information, see "[Bundler](https://bundler.io/)."
3. Install Jekyll. For more information see "[Guides](https://jekyllrb.com/docs/installation/)"

## Running Locally
1. Fork & Clone Locally
2. Run bundle install.
``
bundle install
``

3. Run your Jekyll site locally.
``
bundle exec jekyll serve
``
```bash
#Sample Output
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
4. Preview the blog in your web browser from `http://localhost:4000`

### Notes:
- [/media](/media): All images and digital content from MSDN OSS blog.
- [/resource](/resource): All the CSS and JS content from MSDN OSS blog.
- [/wp-content-old](/wp-content-old): All the original WP content from the MSDN blog.
