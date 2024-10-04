---
title: "Container Apps - Using labels with KEDA and GitHub Action runners"
author_name: "Anthony Salemo"
tags:
    - Configuration
    - Linux
    - KEDA
    - Azure Container Apps
categories:
    - Azure Container Apps # Azure App Service on Linux, Azure App Service on Windows, Function App, Azure VM, Azure SDK
    - How-To # How-To, Diagnostics, Configuration, Troubleshooting, Performance
    - Configuration # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "assets/images/azure-containerapps-logo.png" # There are multiple logos that can be used in "/assets/images" if you choose to add one.
# If your Blog is long, you may want to consider adding a Table of Contents by adding the following two settings.
toc: true
toc_sticky: true
date: 2024-10-04 12:00:00
---

This post will briefly cover using "labels" and "runs-on" when using Azure Container App Jobs with KEDA and GitHub Action runners.

# Overview
This post extends the [Tutorial: Deploy self-hosted CI/CD runners and agents with Azure Container Apps jobs](https://learn.microsoft.com/en-us/azure/container-apps/tutorial-ci-cd-runners-jobs?tabs=bash&pivots=container-apps-jobs-self-hosted-ci-cd-github-actions) in which you can use Container App Jobs, KEDA and GitHub Action runners to run your own GitHub Actions workflow.

More specifically, this is about the usage of "labels". You can use labels that are not only `self-hosted`, which is described more in detail here - [GitHub - Choosing the runner for a job](https://docs.github.com/en/actions/writing-workflows/choosing-where-your-workflow-runs/choosing-the-runner-for-a-job).

More information that's good to read regarding self-hosted runners and label information can be found here - [GitHub - Choosing self-hosted runners](https://docs.github.com/en/actions/writing-workflows/choosing-where-your-workflow-runs/choosing-the-runner-for-a-job#choosing-self-hosted-runners)

# KEDA, labels, and using 'runs-on'
The [KEDA GitHub Runner scaler](https://keda.sh/docs/2.15/scalers/github-runner/) offers the `labels` property under `metadata` - which is defined as _"Optional: The list of runner labels to scale on, separated by comma"_
- **Note**: By default, the label of `self-hosted` will be added for a runner when `runs-on` is also set to `self-hosted`. This is also the default behavior when following the tutorial above.

You can scale your jobs based off these label names, inconjunction with other required `metadata` (and environment variables, depending on your runner image). To do this, do the following:

1. Update your workflow `.yml` to include the label(s) you want to scale off of. As an example, we'll use the following label name:

    ```yaml
    jobs:
    build-and-deploy:
        runs-on: dev-test
    ```

2. Update your KEDA `metadata` to include `labels`, set to the value of the name defined in `runs-on` within your actions `.yml` file.

    ![KEDA label metadata](/media/2024/10/gh-runner-keda-label-1.png)

3. Depending on the way you did steps 1 and 2, this would have triggered a commit, and by that point KEDA would start to scale based off of this. If no commit was pushed yet - do so. You should see a job execution trigger, which means KEDA is also scaling based off the `label` property we added:

    > **NOTE**: KEDA scaler polling time defaults to 30 seconds, unless otherwise changed.

    ![Job execution running](/media/2024/10/gh-runner-keda-label-2.png)

4. At this point, if you see a job execution running - this means that KEDA is working. However, there is an important remark here - although a job would have been created by KEDA at this point, if your runner also doesn't have matching labels, then the runner logic (through our container in the job pod) won't be invoked, and the job creating by KEDA will remain in a "running" state until it hits the value for `replica-timeout`.

    You can manually add labels to a runner or programmatically assign them. This example will [programmatically assign labels](https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners/using-labels-with-self-hosted-runners#programmatically-assign-labels)

    We'll add `labels` via the `entrypoint.sh` script of our GitHub runner image with the following:

    ```sh
    ./config.sh --url $REPO_URL --token $REGISTRATION_TOKEN --unattended --ephemeral --no-default-labels --labels dev-test && ./run.sh
    ```

    Given that our runner labels also match `runs-on` and what we have for KEDA's `metadata`, you can see the runner be registered in GitHub Actions by going to the repository you're pushing to -> **Settings -> Actions -> Runners**

    ![GitHub runner registration](/media/2024/10/gh-runner-keda-label-3.png)

    This matches the job that was executing in the **Execution History** blade

    ![GitHub runner registration](/media/2024/10/gh-runner-keda-label-4.png)

# Note on scaling behavior
As of when this blog was written, this GitHub issue exists - [github-runner-scaler always scales with default labels · Issue #6127 · kedacore/keda](https://github.com/kedacore/keda/issues/6127)

You may see KEDA create a job based on labels that don't match the label name you have in `metadata`. This is because KEDA's GitHub runner scaler currently will also scale based off the default labels ("self-hosted", "linux", "x64").

You can try to opt-out of this behavior via the `--no-default-labels` flag passed to your runner script.