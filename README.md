# Projeto TechCare
Aluno: Kalyson Bione Leite da Costa de Albuquerque
Perfil Escolhido: Dev

## Objetivo geral
Implementar uma solução Salesforce completa para o gerenciamento de solicitações de suporte (objeto customizado Case_Request__c) da empresa TechCare, aplicando automações, segurança, código customizado e boas práticas de desenvolvimento.

## Funcionalidades implementadas

### Objeto customizado: `Case_Request__c`
- Campos criados:
  - `Subject__c` (Text)
  - `Description__c` (Long Text)
  - `Priority__c` (Picklist: Low, Medium, High)
  - `Status__c` (Picklist: New, In Progress, Escalated, Closed)
  - `SLA_Deadline__c` (DateTime)
  - `Resolution_Notes__c` (Long Text)

## Controle de acesso

### Record types:
- Standard
- Premium

### Perfis  / permissões:
- Support Standard
- Support Premium

Usuário criado: `richard.gregorio@sysmap.com.br` com perfil Support Premium.

## Validação e automação

### Validação da rule:
- Impede `Status = Closed` se `Resolution_Notes__c` estiver vazio.

### Flow (Record-Triggered Flow):
- Ao criar um `Case_Request__c`:
  - Para Premium → SLA = NOW() + 8h
  - Para Standard → SLA = NOW() + 24h

## Relatórios e dashboards

### Relatório:
- Casos abertos por prioridade e status (relatório tabular).

### Dashboard:
- Gráfico de Casos abertos vs fechados nos últimos 7 dias.
- Tempo médio de resolução por tipo (Premium × Standard).

## Desenvolvimento - Apex e LWC

### Apex Trigger: `CaseRequestTrigger`
- Ao mudar `Status` para "Closed":
  - Verifica se o SLA foi cumprido.
  - Cria um `Case_History__c` com:
    - `Case__c` (lookup)
    - `Time_Closed__c` (datetime)
    - `SLA_Met__c` (checkbox)

### Classe de testes
- Cobertura = 100%
- Cenários: SLA cumprido / não cumprido

### LWC: `caseDetailComponent`
- Embutido em `Case_Request__c`
- Exibe `SLA_Deadline__c` com contagem regressiva
- Botão “Reabrir Caso” (muda Status via Apex para "In Progress")

## Instruções de instalação / Deploy

1. Clone o repositório.
2. Faça deploy do componente ‘caseDetailComponent’ via VS Code.
3. Atribua os perfis aos usuários conforme o tipo.
4. Acesse `Case_Request__c` e verifique:
   - Layouts distintos por tipo de registro
   - LWC funcional que foi criado no VS Code
   - Apex Trigger + Handler em funcionamento criado via Developer Console na plataforma da SalesForce.
Código: 
CaseTriggerHandler.apxc

public class CaseTriggerHandler {
    public static void handleAfterUpdate(List<Case_Request__c> newList, Map<Id, Case_Request__c> oldMap) {
        List<Case_History__c> histories = new List<Case_History__c>();

        for (Case_Request__c newCase : newList) {
            Case_Request__c oldCase = oldMap.get(newCase.Id);

            // Verifica se o status foi alterado para "Closed"
            if (newCase.Status__c == 'Closed' && oldCase.Status__c != 'Closed') {
                Boolean slaMet = false;
                
                if (newCase.Closed_Date__c != null && newCase.SLA_Deadline__c != null) {
                    slaMet = newCase.Closed_Date__c <= newCase.SLA_Deadline__c;
                }

                histories.add(new Case_History__c(
                    Case__c = newCase.Id,
                    Time_Closed__c = newCase.Closed_Date__c,
                    SLA_Met__c = slaMet
                ));
            }
        }

        if (!histories.isEmpty()) {
            insert histories;
        }
    }
}


CaseTriggerHandlerTest.apxc

@isTest
public class CaseTriggerHandlerTest {

    @isTest
    static void testSlaMet() {
        // Cria um case com SLA para o futuro
        Case_Request__c case1 = new Case_Request__c(
            Name = 'Teste SLA Cumprido',
            Status__c = 'In Progress',
            SLA_Deadline__c = Date.today().addDays(2)
        );
        insert case1;

        // Fecha o caso hoje
        case1.Status__c = 'Closed';
        case1.Closed_Date__c = Date.today();
        case1.Resolution_Notes__c = 'Resolvido com sucesso';
        update case1;

        // Verificando se o historico foi criado com sucesso!
        List<Case_History__c> history = [
            SELECT Id, SLA_Met__c FROM Case_History__c WHERE Case__c = :case1.Id
        ];
        System.assertEquals(1, history.size());
        System.assertEquals(true, history[0].SLA_Met__c);
    }

    @isTest
    static void testSlaNotMet() {
        // Criando um Case com SLA para ontem
        Case_Request__c case2 = new Case_Request__c(
            Name = 'Teste SLA NÃƒO Cumprido',
            Status__c = 'In Progress',
            SLA_Deadline__c = Date.today().addDays(-1)
        );
        insert case2;

        // Fecha o caso hoje (depois do SLA)
        case2.Status__c = 'Closed';
        case2.Closed_Date__c = Date.today();
        case2.Resolution_Notes__c = 'Resolvido com atraso';
        update case2;

        // Verifica se o historico foi criado corretamente
        List<Case_History__c> history = [
            SELECT Id, SLA_Met__c FROM Case_History__c WHERE Case__c = :case2.Id
        ];
        System.assertEquals(1, history.size());
        System.assertEquals(false, history[0].SLA_Met__c);
    }
}

CaseTrigger.apxt

trigger CaseTrigger on Case_Request__c (after update) {
    if (Trigger.isAfter && Trigger.isUpdate) {
        CaseTriggerHandler.handleAfterUpdate(Trigger.new, Trigger.oldMap);
    }
}

## Como testar

- Crie registros como Standard e Premium → verifique SLA.
- Tente fechar sem preencher `Resolution_Notes__c` → deve bloquear.
- Feche o caso → veja o registro criado em `Case_History__c`.
- Clique no botão “Reabrir Caso” → status deve voltar para “In Progress”.
