public with sharing class CaseDetailController {
    
    @AuraEnabled(cacheable=true)
    public static Case_Request__c getCaseDetails(Id caseId) {
        return [
            SELECT Id, Status__c, SLA_Deadline__c 
            FROM Case_Request__c 
            WHERE Id = :caseId
            LIMIT 1
        ];
    }

    @AuraEnabled
    public static void reopenCase(Id caseId) {
        Case_Request__c cr = [SELECT Id, Status__c FROM Case_Request__c WHERE Id = :caseId];
        cr.Status__c = 'In Progress';
        update cr;
    }
}