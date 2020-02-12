---

title: "Deploy Azure Java Function App (Windows) via GitHub Actions"
author_name: "Gaurav Kumar"
categories:
    - Azure Function App # Azure App Service on Linux, Azure App Service on Windows, Azure Function App, Azure VM, Azure SDK
    - Java # Python, Java, PHP, Nodejs, Ruby, .NET Core
    - How-To # How-To, Diagnostics, Configuration, Troubleshooting, Performance
header:
    teaser: "/assets/images/javafunction.png" # There are multiple logos that can be used in 
date: 2020-01-20 00:00:00

---

# Steps:  
  
1. Create a Java Function App. (You can create it from the Azure Portal)

2. Create a RBAC rule using the following command. We will use this later to authorize GitHub to deploy to Function App. Copy the JSON output from this command:  
```cli
az ad sp create-for-rbac --name "myApp" --role contributor --scopes /subscriptions/{subscription-id}/resourceGroups/{resource-group}/providers/Microsoft.Web/sites/{app-name} --sdk-auth
```

3. Go to your __Github Repository -> Settings -> Secrets__  
Create a new secret "__AZURE_CREDENTIALS__" and paste the JSON copied above as the value.

4. Go to GitHub Actions and create a New Workflow.
You can use the following YAML sample:  
[https://github.com/Azure/actions-workflow-samples/blob/master/FunctionApp/windows-java-functionapp-on-azure.yml](https://github.com/Azure/actions-workflow-samples/blob/master/FunctionApp/windows-java-functionapp-on-azure.yml)  
__Example:__

```yaml

# Action Requires
# 1. Setup the AZURE_CREDENTIALS secrets in your GitHub Repository
# 2. Replace PLEASE_REPLACE_THIS_WITH_YOUR_FUNCTION_APP_NAME with your Azure function app name
# 3. Replace POM_ARTIFACT_ID with the value in project <artifactId> in pom.xml
# 4. Replace POM_FUNCTION_APP_NAME with the value in properties <functionAppName> in pom.xml
# 5. Add this yaml file to your project's .github/workflows/
# 6. Push your local project to your GitHub Repository

name: Windows_Java_Workflow

on:
  push:
    branches:
    - master

jobs:
  build-and-deploy:
    runs-on: windows-latest
    steps:
    - name: 'Checkout GitHub Action'
      uses: actions/checkout@master

    # If you want to use publish profile credentials instead of Azure Service Principal
    # Please comment this 'Login via Azure CLI' block
    - name: 'Login via Azure CLI'
      uses: azure/login@v1
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}

    - name: Setup Java 1.8.x
      uses: actions/setup-java@v1
      with:
        # If your pom.xml <maven.compiler.source> version is not in 1.8.x
        # Please change the Java version to match the version in pom.xml <maven.compiler.source>
        java-version: '1.8.x'

    - name: 'Run mvn'
      shell: pwsh
      run: |
        # If your function app project is not located in your repository's root
        # Please change your directory for maven build in pushd
        pushd ./
        mvn clean package
        mvn azure-functions:package
        popd

    - name: 'Run Azure Functions Action'
      uses: Azure/functions-action@v1
      id: fa
      with:
        app-name: gaukJavaFunctionApp
        # If your function app project is not located in your repository's root
        # Please consider prefixing the project path in this package parameter
        package: ./target/azure-functions/gaukJavaFunctionApp
        # If you want to use publish profile credentials instead of Azure Service Principal
        # Please uncomment the following line
        # publish-profile: ${{ secrets.SCM_CREDENTIALS }}

    #- name: 'use the published functionapp url in upcoming steps'
    #  run: |
    #    echo "${{ steps.fa.outputs.app-url }}"

# For more information on GitHub Actions:
#   https://help.github.com/en/categories/automating-your-workflow-with-github-actions
```
Ensure that the required values have been updated in the YAML file:

- Setup the AZURE_CREDENTIALS secrets in your GitHub Repository
- Replace PLEASE_REPLACE_THIS_WITH_YOUR_FUNCTION_APP_NAME with your Azure function app name
- Replace POM_ARTIFACT_ID with the value in project <artifactId> in pom.xml
- Replace POM_FUNCTION_APP_NAME with the value in properties <functionAppName> in pom.xml

Commit the changes and it should trigger the build and deploy automatically. That's it!

  
__Useful Links:__
- [https://github.com/Azure/functions-action#using-azure-service-principle-for-rbac-as-deployment-credential](https://github.com/Azure/functions-action#using-azure-service-principle-for-rbac-as-deployment-credential)

- [https://docs.microsoft.com/en-us/azure/azure-functions/functions-create-first-function-vs-code](https://docs.microsoft.com/en-us/azure/azure-functions/functions-create-first-function-vs-code)
