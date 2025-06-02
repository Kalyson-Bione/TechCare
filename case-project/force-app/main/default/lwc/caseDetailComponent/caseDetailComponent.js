import { LightningElement, api } from 'lwc';
import getCaseDetails from '@salesforce/apex/CaseDetailController.getCaseDetails';
import reopenCase from '@salesforce/apex/CaseDetailController.reopenCase';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class CaseDetailComponent extends LightningElement {
  @api recordId;
  slaDeadline;
  formattedDeadline;
  countdown;
  intervalId;

  connectedCallback() {
    console.log('recordId recebido:', this.recordId);
    this.loadCaseData();
  }

  disconnectedCallback() {
    clearInterval(this.intervalId);
  }

  loadCaseData() {
    getCaseDetails({ caseId: this.recordId })
      .then(result => {
        this.slaDeadline = result.SLA_Deadline__c;
        this.formatDeadline();
        this.startCountdown();
      })
      .catch(error => {
        console.error(error);
      });
  }

  formatDeadline() {
    const deadline = new Date(this.slaDeadline);
    this.formattedDeadline = deadline.toLocaleString();
  }

  startCountdown() {
    this.intervalId = setInterval(() => {
      const now = new Date();
      const end = new Date(this.slaDeadline);
      const diff = end - now;

      if (diff <= 0) {
        this.countdown = 'Prazo expirado!';
        clearInterval(this.intervalId);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      this.countdown = `${hours}h ${minutes}m ${seconds}s`;
    }, 1000);
  }

  handleReopen() {
    reopenCase({ caseId: this.recordId })
      .then(() => {
        this.dispatchEvent(
          new ShowToastEvent({
            title: 'Sucesso',
            message: 'Caso reaberto com sucesso.',
            variant: 'success',
          })
        );
        this.loadCaseData();
      })
      .catch(error => {
        this.dispatchEvent(
          new ShowToastEvent({
            title: 'Erro',
            message: error.body.message,
            variant: 'error',
          })
        );
      });
  }
}