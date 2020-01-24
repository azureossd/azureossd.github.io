---
title: "Magento Indexing and Root Category on Microsoft Azure"
tags:
  - azure
  - indexing
  - Magento
  - magento root category
  - Web Apps
categories:
  - PHP
  - Magento
date: 2015-04-16 08:48:28
author_name: Mangesh Sangapu
---

**Overview**

If you recently installed Magento through the Azure Portal and found that reindexing is not working properly, you will want to ensure that the Root Category is selected.

If the root category is not set, you will encounter this message when trying to reindex: **“There was a problem with reindexing process.”** which can often result in the exception shown below.

    2015-04-16T13:31:17+00:00 DEBUG (7): Exception message: SQLSTATE[42000]: Syntax error or access violation: 1103 Incorrect table name ” 
    Trace: #0 D:homesitewwwrootlibVarienDbStatementPdoMysql.php(110): Zend_Db_Statement_Pdo->_execute(Array) 
    #1 D:homesitewwwrootappcodecoreZendDbStatement.php(291): Varien_Db_Statement_Pdo_Mysql->_execute(Array) 
    #2 D:homesitewwwrootlibZendDbAdapterAbstract.php(480): Zend_Db_Statement->execute(Array) 
    #3 D:homesitewwwrootlibZendDbAdapterPdoAbstract.php(238): Zend_Db_Adapter_Abstract->query(‘DELETE FROM “’, Array) 
    #4 D:homesitewwwrootlibVarienDbAdapterPdoMysql.php(428): Zend_Db_Adapter_Pdo_Abstract->query(‘DELETE FROM “’, Array) 
    #5 D:homesitewwwrootlibZendDbAdapterAbstract.php(664): Varien_Db_Adapter_Pdo_Mysql->query(‘DELETE FROM “’) 
    #6 D:homesitewwwrootappcodecoreMageCatalogModelResourceCategoryIndexerProduct.php(941): Zend_Db_Adapter_Abstract->delete(NULL) 
    #7 D:homesitewwwrootappcodecoreMageIndexModelIndexerAbstract.php(143): Mage_Catalog_Model_Resource_Category_Indexer_Product->reindexAll() 
    #8 D:homesitewwwrootappcodecoreMageIndexModelProcess.php(210): Mage_Index_Model_Indexer_Abstract->reindexAll() 
    #9 D:homesitewwwrootappcodecoreMageIndexModelProcess.php(258): Mage_Index_Model_Process->reindexAll() 
    #10 D:homesitewwwrootappcodecoreMageIndexcontrollersAdminhtmlProcessController.php(127): Mage_Index_Model_Process->reindexEverything() 
    #11 D:homesitewwwrootappcodecoreMageCoreControllerVarienAction.php(418): Mage_Index_Adminhtml_ProcessController->reindexProcessAction() 
    #12 D:homesitewwwrootappcodecoreMageCoreControllerVarienRouterStandard.php(250): Mage_Core_Controller_Varien_Action->dispatch(‘reindexProcess’) 
    #13 D:homesitewwwrootappcodecoreMageCoreControllerVarienFront.php(172): Mage_Core_Controller_Varien_Router_Standard->match(Object(Mage_Core_Controller_Request_Http)) 
    #14 D:homesitewwwrootappcodecoreMageCoreModelApp.php(354): Mage_Core_Controller_Varien_Front->dispatch() 
    #15 D:homesitewwwrootappMage.php(684): Mage_Core_Model_App->run(Array) 
    #16 D:homesitewwwrootindex.php(87): Mage::run(”, ‘store’) 
    #17 {main}

**To solve this issue, make sure your Root Category is selected.**

* * *

To select your Root Category, follow these steps:

**Step 1. In the System Menu, select Configuration**

> ![](/media/2019/03/0676.step1.png)

**Step 2. Click on “Manage Stores”**

> You can find it at the top-left, under “Current Configuration Scope”.

> ![](/media/2019/03/2620.step2.png)

**Step 3. Select Main Website Store**

> ![](/media/2019/03/2068.step3.png)

**Step 4. Set the Root Category**

> Select the drop-down for “Root Category” and select “Default Category”

> ![](/media/2019/03/7230.step4.png)

**Step 5. Save the store**

> Click “Save Store” at the top-right corner

> ![](/media/2019/03/3527.step5.png)

**Step 6. Verify indexing works!**

> Select System –>Index Management

> ![](/media/2019/03/6457.step6.png)

**Step 7. Select Indexes**

> Select “Catalog URL Rewrites” and “Category Products”

> ![](/media/2019/03/3162.step7.png)

**Step 8. Reindex Data**

> ![](/media/2019/03/2402.step8.png)

At this point, your index management should be successful without errors.

> ![](/media/2019/03/5383.step9.png)

[**Here’s a feedback page**](http://feedback.azure.com/forums/169385-web-sites) **for Azure. Please let us know how we can improve Azure!**

Technorati Tags: [There was a problem with reindexing process](http://technorati.com/tags/There+was+a+problem+with+reindexing+process),[syntax error or access violation](http://technorati.com/tags/syntax+error+or+access+violation),[Incorrect table name](http://technorati.com/tags/Incorrect+table+name),[magento](http://technorati.com/tags/magento),[Azure](http://technorati.com/tags/Azure)