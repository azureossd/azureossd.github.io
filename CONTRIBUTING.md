## Access 

You will need write access to create pull request. Email your TA to gain access to https://github.com/azureossd.

## Environment Setup
1. Download and install the Ruby development kit
2. Download and install Visual Studio Code 

## Git from VS Code
1. Fork the project from GitHub https://github.com/azureossd/azureossd.github.io
2. Clone the project using VS Code

```bash
git clone https://github.com/<username>/azureossd.github.io.git
```
NOTE:  Tutorial can be found at https://github.com/firstcontributions/first-contributions/blob/master/github-windows-vs-code-tutorial.md

## Jekyll

5. Install any missing Ruby gems:

```bash
bundle install
```

6. Run the local Jekyll server. From the project directory, run the following command:

```bash
bundle exec jekyll serve
```

   The blog will be running at http://127.0.0.1:4000/

   VSCODE: If you are using VSCode to author your blog post, please install Markdown Linting extension

## Authoring your post
1. Create a new branch for your article(s).
	- If you are not comfortable on the command line, download GitHub Desktop.
	- See https://github.com/firstcontributions/first-contributions/blob/master/github-windows-vs-code-tutorial.md#create-a-branch for steps using VS Code
2. Create a markdown file under the _posts directory with the following file name format: `YYYY-MM-DD-Your-Article-Title.md`.

NOTE:  A file called "`YYYY-MM-DD-Your-Article-Title.md`" is available in the `_post` directory for you to use.  Copy the file and name it accordingly.  DO NOT Edit the actual file

3. Add the following to the top of your posts or copy the `YYYY-MM-DD-Your-Article-Title.md`, rename the file, and make the necessary changes:

    ```yaml	
    ---
    title: "Title should be the same (or similar to) your filename"
    author_name: "Your Name"
    tags:
        - example
        - multiple words
        - no more than 3 tags
    categories:
        - <Service Type> # Azure App Service on Linux, Azure App Service on Windows, Azure Function App, Azure VM, Azure SDK
        - <Stack> # Python, Java, PHP, Nodejs, Ruby, .NET Core
        - <Framework> # Django, Spring Boot, CodeIgnitor, ExpressJS
        - <Database> # MySQL, MongoDB, 
        - <Blog Type> # How-To, Diagnostics, Configuration, Troubleshooting, Performance
    header:
        teaser: "/assets/images/imagename.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
    # If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
    toc: true
    toc_sticky: true
    date: YYYY-MM-DD 00:00:00
    ---
    ```
The tags section is optional.

4. Now you can author your markdown-formatted post. When you save the file, the local server will update the file in the browser (~30 second lag time).
	- For Markdown syntax, please see the [Markdown cheat-sheet](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet).
	- For Jekyll-related formatting, please see these [Jekyll Docs](https://jekyllrb.com/docs/posts/).
	- Our blog uses the popular [Minimal Mistakes](https://github.com/mmistakes) theme. If you would like to do advanced markup for your post, please see the theme [configuration guide](https://mmistakes.github.io/minimal-mistakes/docs/posts/).

## Digital Content
To add images, GIFs, or other digital content to your post...
1. Add the file under the `/media/YEAR/MONTH/` directory.
	- Where `YEAR` and `MONTH` are the year and month in your article's filename. If the directory for the year or month does not yet exist, please create them.
2. Once the file is added, you can link to the file in your markdown using the path `/media/YEAR/MONTH/your_file_name.jpg`. For example, to insert an image in Markdown you would use the following syntax

```text
![Required description of the image](/media/2019/04/portal-picture.jpg)
```
Publishing
	1. Proofread your post for spelling and grammar
		○ Pro-Tips: Copy/paste your content into Word to check spelling. Also, install the VSCode Markdown Linting extension.
	2. Submit a pull request
