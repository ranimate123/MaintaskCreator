import { LightningElement, track } from 'lwc';
import searchAccount from '@salesforce/apex/PersonAccountEventController.searchAccount';
import createEvent from '@salesforce/apex/PersonAccountEventController.createEvent';
import getDeskManagerOptions from '@salesforce/apex/PersonAccountEventController.getDeskManagerOptions';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class EventAccountSearch extends LightningElement {

    firstName = '';
    lastName = '';
    phone = '';
    email = '';
    userId = '';
    deskManagerDeveloperName = '';

    @track account = null;
    @track deskManagerOptions = [];

    // Reactive property to control Search button visibility
    get isSearchButtonVisible() {
        return (
            this.firstName && this.firstName.trim() !== '' &&
            this.lastName && this.lastName.trim() !== '' &&
            this.phone && this.phone.trim() !== '' &&
            this.userId && 
            this.deskManagerDeveloperName
        );
    }

    connectedCallback() {
        this.loadDeskManagers();
    }

    loadDeskManagers() {
        getDeskManagerOptions()
            .then(result => {
                this.deskManagerOptions = result || [];
            })
            .catch(error => {
                console.error('Error loading Desk Managers', error);
                this.deskManagerOptions = [];
            });
    }

    showToast(title, message, variant = 'info') {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
            mode: 'dismissable'
        });
        this.dispatchEvent(event);
    }

    handleChange(event) {
        const field = event.target.dataset.field;
        if (field) {
            this[field] = event.target.value;
        }
    }

    handleDeskManagerChange(event) {
        this.deskManagerDeveloperName = event.detail.value;
    }

    handleUserSelect(event) {
        this.userId = event.detail.recordId;
    }

    searchAccount() {
        if (!this.isSearchButtonVisible) {
            this.showToast('Validation Error', 'Please fill all required fields.', 'error');
            return;
        }

        const phoneForApex = this.phone;

        searchAccount({ 
            phone: phoneForApex,
            email: this.email 
        })
        .then(result => {
            if (result) {
                this.account = result;
                this.showToast('Success', 'Person Account found: ' + result.Name, 'success');
            } else {
                this.account = null;
                this.showToast('Not Found', 'No Person Account found with the given details.', 'warning');
            }
        })
        .catch(error => {
            console.error('Error searching account:', error);
            this.showToast('Error', 'Error searching account. Check console for details.', 'error');
        });
    }

    createEvent() {
        if (!this.account) {
            this.showToast('Validation Error', 'No account selected.', 'error');
            return;
        }
        if (!this.deskManagerDeveloperName) {
            this.showToast('Validation Error', 'Please select a Desk Manager.', 'error');
            return;
        }
        if (!this.userId) {
            this.showToast('Validation Error', 'Please select an Owner (User) for the Event.', 'error');
            return;
        }

        createEvent({
            accountId: this.account.Id,
            deskManagerDeveloperName: this.deskManagerDeveloperName,
            ownerId: this.userId,
            subject: 'Physical Meeting'
        })
        .then(result => {
            this.showToast('Success', 'Physical Meeting Task created successfully! Task Id: ' + result, 'success');
        })
        .catch(error => {
            console.error('Error creating event:', error);
            const errorMsg = error.body?.message || error.message || 'Unknown error occurred';
            this.showToast('Error', errorMsg, 'error');
        });
    }
}
