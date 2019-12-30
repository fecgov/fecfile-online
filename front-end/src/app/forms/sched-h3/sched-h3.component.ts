import { Component, OnInit, OnDestroy, OnChanges, Output, EventEmitter, Input, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { IndividualReceiptComponent } from '../form-3x/individual-receipt/individual-receipt.component';
import { FormBuilder, FormGroup, FormControl, NgForm, Validators } from '@angular/forms';
import { FormsService } from 'src/app/shared/services/FormsService/forms.service';
import { IndividualReceiptService } from '../form-3x/individual-receipt/individual-receipt.service';
import { ContactsService } from 'src/app/contacts/service/contacts.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbTooltipConfig } from '@ng-bootstrap/ng-bootstrap';
import { UtilService } from 'src/app/shared/utils/util.service';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ReportTypeService } from '../form-3x/report-type/report-type.service';
import { TypeaheadService } from 'src/app/shared/partials/typeahead/typeahead.service';
import { DialogService } from 'src/app/shared/services/DialogService/dialog.service';
import { F3xMessageService } from '../form-3x/service/f3x-message.service';
import { TransactionsMessageService } from '../transactions/service/transactions-message.service';
import { ContributionDateValidator } from 'src/app/shared/utils/forms/validation/contribution-date.validator';
import { TransactionsService } from '../transactions/service/transactions.service';
import { HttpClient } from '@angular/common/http';
import { MessageService } from 'src/app/shared/services/MessageService/message.service';
import { ScheduleActions } from '../form-3x/individual-receipt/schedule-actions.enum';
import { AbstractSchedule } from '../form-3x/individual-receipt/abstract-schedule';
import { ReportsService } from 'src/app/reports/service/report.service';
import { TransactionModel } from '../transactions/model/transaction.model';
import { Observable, Subscription } from 'rxjs';
import { SchedH3Service } from './sched-h3.service';
import { style, animate, transition, trigger } from '@angular/animations';
import { AbstractScheduleParentEnum } from '../form-3x/individual-receipt/abstract-schedule-parent.enum';
import { isNumeric } from 'rxjs/util/isNumeric';
import { SchedHMessageServiceService } from '../sched-h-service/sched-h-message-service.service';
import { SchedHServiceService } from '../sched-h-service/sched-h-service.service';

@Component({
  selector: 'app-sched-h3',
  templateUrl: './sched-h3.component.html',
  styleUrls: ['./sched-h3.component.scss'],
  providers: [NgbTooltipConfig, CurrencyPipe, DecimalPipe],
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate(500, style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate(0, style({ opacity: 0 }))
      ])
    ])
  ]
})
export class SchedH3Component extends AbstractSchedule implements OnInit, OnDestroy, OnChanges {
  @Input() transactionTypeText: string;
  @Input() transactionType: string;
  @Input() scheduleAction: ScheduleActions;
  @Input() scheduleType: string;
  @Output() status: EventEmitter<any>;

  public formType: string;
  public showPart2: boolean;
  public loaded = false;

  public schedH3: FormGroup;
  public categories: any;
  public identifiers: any;
  public totalName: any;
  public showIdentiferSelect = false;
  public showIdentifer = false;
  public h3Sum: any;
  public h3SumP: any;
  public h3Entries = [];
  public h3Ratios: any;
  public showAggregateAmount = false;

  public h3Subscription: Subscription;
  public saveHRes: any;

  public h3TableConfig: any;
  public h3EntryTableConfig: any;

  public receiptDateErr = false;

  public cvgStartDate: any;
  public cvgEndDate: any;

  public isSubmit = false;

  public transferredAmountErr = false;

  public transaction_id: string;
  public h3EntrieEdit: any;
  public back_ref_transaction_id: string;
  populateFormForEdit: Subscription;

  public transferred_amount_edit = 0;
  public total_amount_edit = 0;
  public aggregate_amount_edit = 0;
  public activity_event_name_edit: string;

  constructor(
    _http: HttpClient,
    _fb: FormBuilder,
    _formService: FormsService,
    _receiptService: IndividualReceiptService,
    _contactsService: ContactsService,
    _activatedRoute: ActivatedRoute,
    _config: NgbTooltipConfig,
    _router: Router,
    _utilService: UtilService,
    _messageService: MessageService,
    _currencyPipe: CurrencyPipe,
    _decimalPipe: DecimalPipe,
    _reportTypeService: ReportTypeService,
    _typeaheadService: TypeaheadService,
    _dialogService: DialogService,
    _f3xMessageService: F3xMessageService,
    _transactionsMessageService: TransactionsMessageService,
    _contributionDateValidator: ContributionDateValidator,
    _transactionsService: TransactionsService,
    _reportsService: ReportsService,
    private _schedHMessageServiceService: SchedHMessageServiceService,
    private _actRoute: ActivatedRoute,
    private _schedH3Service: SchedH3Service,
    private _individualReceiptService: IndividualReceiptService,
    private _uService: UtilService,    
    private _formBuilder: FormBuilder,
    private _decPipe: DecimalPipe,
    private _schedHService: SchedHServiceService
  ) {
    super(
      _http,
      _fb,
      _formService,
      _receiptService,
      _contactsService,
      _activatedRoute,
      _config,
      _router,
      _utilService,
      _messageService,
      _currencyPipe,
      _decimalPipe,
      _reportTypeService,
      _typeaheadService,
      _dialogService,
      _f3xMessageService,
      _transactionsMessageService,
      _contributionDateValidator,
      _transactionsService,
      _reportsService      
    );
    _schedH3Service;
    _individualReceiptService;
    _uService;
    _formBuilder;
    _decPipe;

    this.populateFormForEdit = this._schedHMessageServiceService.getpopulateHFormForEditMessage()
    .subscribe(p => {
      if(p.scheduleType === 'Schedule H3'){
        let res = this._schedHService.getSchedule(p.transactionDetail.transactionModel).subscribe(res => {
          if(res && res.length === 1){
            this.editH3(res[0]);
          }
        });
      }
    })
  }

  public ngOnInit() {
    this.abstractScheduleComponent = AbstractScheduleParentEnum.schedH3Component;
    this.formType = '3X';
    this.formFieldsPrePopulated = true;
    // this.formFields = this._staticFormFields;
    super.ngOnInit();
    this.showPart2 = false;
    //this.transactionType = 'OPEXP'; // 'INDV_REC';
    //this.transactionTypeText = 'Coordinated Party Expenditure Debt to Vendor';
    super.ngOnChanges(null);
    
    console.log();

    // temp code - waiting until dynamic forms completes and loads the formGroup
    // before rendering the static fields, otherwise validation error styling
    // is not working (input-error-field class).  If dynamic forms deliver,
    // the static fields, then remove this or set a flag when formGroup is ready
    setTimeout(() => {
      this.loaded = true;
    }, 2000);

    this.setH3();
    this.setCategory();
    //this.setActivityOrEventIdentifier();

    this.h3TableConfig = {
      itemsPerPage: 8,
      currentPage: 1,
      totalItems: 8
    };
    this.h3EntryTableConfig = {
      itemsPerPage: 3,
      currentPage: 1,
      totalItems: 3
    };
    

    //this.setH3Sum();
    //this.setH3SumP();

    this.formType = this._actRoute.snapshot.paramMap.get('form_id');

    this.h3Ratios = {};
    this.h3Ratios['child'] = [];

    this.schedH3.patchValue({ category: ''}, { onlySelf: true });
    
  }

  public ngOnChanges(changes: SimpleChanges) {
    // OnChanges() can be triggered before OnInit().  Ensure formType is set.
    this.formType = '3X';
    this.showPart2 = false;

    if(this.transactionType === 'ALLOC_H3_SUM') {
      this.setH3Sum();
    }

    if(this.transactionType === 'ALLOC_H3_SUM_P') {
      this.setH3SumP();
    }
  }

  ngDoCheck() {
    this.status.emit({
      otherSchedHTransactionType: this.transactionType
    });
  }

  public ngOnDestroy(): void {
    this.populateFormForEdit.unsubscribe();
    super.ngOnDestroy();
  }

  pageChanged(event){
    this.h3TableConfig.currentPage = event;
  }
  entryPageChanged(event){
    this.h3EntryTableConfig.currentPage = event;
  }

  /**
   * Returns true if the field is valid.
   * @param fieldName name of control to check for validity
   */
  private _checkFormFieldIsValid(fieldName: string): boolean {
    if (this.frmIndividualReceipt.contains(fieldName)) {
      return this.frmIndividualReceipt.get(fieldName).valid;
    }
  }
  
  public getReportId(): string {

    let report_id;
    let reportType: any = JSON.parse(localStorage.getItem(`form_${this.formType}_report_type`));
    if (reportType === null || typeof reportType === 'undefined') {
      reportType = JSON.parse(localStorage.getItem(`form_${this.formType}_report_type_backup`));
    }
    
    if(reportType) {
      if (reportType.hasOwnProperty('reportId')) {
        report_id = reportType.reportId;      
      } else if (reportType.hasOwnProperty('reportid')) {      
        report_id = reportType.reportid;
      }
    }
   
    return report_id ? report_id : '0';

  }

  public setH3() {

    this.schedH3 = new FormGroup({
      account_name: new FormControl('', [Validators.maxLength(40), Validators.required]),
      receipt_date: new FormControl('', Validators.required),
      total_amount_transferred: new FormControl(''),
      category: new FormControl(''),
      activity_event_name: new FormControl(''),
      transferred_amount: new FormControl('', Validators.required),
      aggregate_amount: new FormControl('')
    });
  }

  public setCategory() {

    this.categories = [
      {
        "id":"AD",
        "name":"Administrative"
      },
      {
        "id":"GV",
        "name":"Generic Voter Drive"
      },
      {
        "id":"EA",
        "name":"Exempt Activities"
      },
      {
        "id":"DF",
        "name":"Direct Fundraising"
      },
      {
        "id":"DC",
        "name":"Direct Candidate Support"
      },
      {
        "id":"PC",
        "name":"Public Communications Referring Only to Party(Made by PAC)"
      }
    ]

  }
  
  public setActivityOrEventIdentifier(category: string) {

    const reportId = this._individualReceiptService.getReportIdFromStorage(this.formType);

    this.identifiers = [];
    this.h3Subscription = 
      this._schedH3Service.getActivityOrEventIdentifiers(category, reportId)
      .subscribe(res =>
        {
          if(res) {            
            this.identifiers = res;
          }
        }
      ); 

  }

  public getTotalAmount() {

    //this.schedH3.patchValue({total_tmount_of_transfer: 0}, { onlySelf: true });
    const reportId = this._individualReceiptService.getReportIdFromStorage(this.formType);
    this.h3Subscription = 
      this._schedH3Service.getTotalAmount(this.schedH3.get('activity_event_name').value, reportId)
      .subscribe(res =>
        {
          if(res) {            
            //this.schedH3.patchValue({aggregate_amount: res.aggregate_amount}, { onlySelf: true });
            this.schedH3.patchValue({aggregate_amount: this._decPipe.transform(res.aggregate_amount, '.2-2')}, { onlySelf: true });
          }
        }
      ); 

    return;
  }

  public returnToSum(): void {

    if(this.h3Ratios.child.length > 0) {
      this.addEntries();
    }

    if( this.scheduleAction === ScheduleActions.edit) {
      this.scheduleAction = ScheduleActions.add;
    }

    this.isSubmit = false;
    this.schedH3.reset();
    this.setH3();
    //this.schedH3.patchValue({ transferred_amount: 0}, { onlySelf: true });

    this.schedH3 = this._formBuilder.group({
      category: ['']
    });

    this.h3Entries = [];
    
    /*
    this.schedH3.patchValue({account_name: ''}, { onlySelf: true });  
    this.schedH3.patchValue({receipt_date: ''}, { onlySelf: true });   
    this.schedH3.patchValue({total_amount_transferred: ''}, { onlySelf: true });
    this.h3Entries = [];
    this.schedH3.patchValue({ category: ''}, { onlySelf: true });
    this.schedH3.markAsUntouched()
    this.showIdentifer = false;
    
    this.schedH3.patchValue({ activity_event_name: ''}, { onlySelf: true });
    this.schedH3.patchValue({ transferred_amount: ''}, { onlySelf: true });
    this.schedH3.patchValue({ aggregate_amount: ''}, { onlySelf: true });
    */

    this.receiptDateErr = false;

    this.transactionType = 'ALLOC_H3_SUM';
    //this.setH3Sum();

    this.showIdentifer = false;
    this.showIdentiferSelect = false;
    this.showAggregateAmount = false;
  }

  public returnToAdd(): void {
    this.showIdentifer = false;
    
    this.schedH3.reset();
    this.setH3();

    this.transactionType = 'ALLOC_H3_RATIO';
    this.receiptDateErr = false;
  }

  //to test for privous
  public resetTransactionType() {
    this.transactionType = '';
  }

  public selectCategoryChange(e) {
    
    if(!this.schedH3.get('category').value) {
      this.showIdentifer = false;
    }else{
      this.showIdentifer = true;
    }
    
    if(this.schedH3.get('category').value === 'AD') {
      this.totalName = 'Administrative';
      this.showIdentiferSelect = false;
      this.showAggregateAmount = false;
    }else if(this.schedH3.get('category').value === 'GV') {
      this.totalName = 'Generic Voter Drive';
      this.showIdentiferSelect = false;
      this.showAggregateAmount = false;
    }else if(this.schedH3.get('category').value === 'EA') {
      this.totalName = 'Exempt Activities';
      this.showIdentiferSelect = false
      this.showAggregateAmount = false;
    }else if(this.schedH3.get('category').value === 'DF') {
      this.totalName = 'Activity or Event Identifier';
      this.setActivityOrEventIdentifier('fundraising');
      this.showIdentiferSelect = true;
      this.showAggregateAmount = true;

      this.schedH3.patchValue({activity_event_name: ''}, { onlySelf: true });
      this.schedH3.patchValue({aggregate_amount: ''}, { onlySelf: true });

    }else if(this.schedH3.get('category').value === 'DC') {
      this.totalName = 'Activity or Event Identifier';
      this.setActivityOrEventIdentifier('direct_cand_support');
      this.showIdentiferSelect = true;
      this.showAggregateAmount = true;
      
      this.schedH3.patchValue({activity_event_name: ''}, { onlySelf: true });
      this.schedH3.patchValue({aggregate_amount: ''}, { onlySelf: true });

    }else if(this.schedH3.get('category').value === 'PC') {
      this.totalName = 'Public Communications';
      this.showIdentiferSelect = false;
      this.showAggregateAmount = false;
    }

    this.schedH3.patchValue({transferred_amount: ''}, { onlySelf: true });

    this.changeTotalAndAggrAmount();

  }

  public selectActivityOrEventChange(e) {

    this.schedH3.patchValue({transferred_amount: ''}, { onlySelf: true });
    const reportId = this._individualReceiptService.getReportIdFromStorage(this.formType);
    //this._schedH3Service.getTotalAmount(this.schedH3.get('category').value, reportId);

    /*
    const activity_event_name = this.schedH3.get('activity_event_name').value;

    if(activity_event_name) {
      this.h3Subscription = this._schedH3Service.getTotalAmount(activity_event_name, reportId).subscribe(res =>
        {
          if(res) {
            //this.schedH3.patchValue({aggregate_amount: +(res.aggregate_amount)}, { onlySelf: true });

            if(res.aggregate_amount){
              this.schedH3.patchValue({aggregate_amount: this._decPipe.transform(res.aggregate_amount, '.2-2')}, { onlySelf: true });
            }else {
              this.schedH3.patchValue({aggregate_amount: this._decPipe.transform(0, '.2-2')}, { onlySelf: true });
            }
          }
        });
    }
    */
    if(this.scheduleAction === ScheduleActions.add) {
      this.getAggregateAmount();
    }else if(this.scheduleAction === ScheduleActions.edit) {

      this.changeTotalAndAggrAmount();

      const reportId = this._individualReceiptService.getReportIdFromStorage(this.formType);

      const activity_event_name = this.schedH3.get('activity_event_name').value;

      if(activity_event_name) {
        this.h3Subscription = this._schedH3Service.getH3AggregateAmount(activity_event_name, reportId, this.back_ref_transaction_id).subscribe(res =>
          {
            if(res) {
              if(res.aggregate_amount){
                this.schedH3.patchValue({aggregate_amount: this._decPipe.transform(res.aggregate_amount, '.2-2')}, { onlySelf: true });
              }else {
                this.schedH3.patchValue({aggregate_amount: this._decPipe.transform(0, '.2-2')}, { onlySelf: true });
              }
            }
          });
      }
    }
  }
  
  public setH3Sum() {

    const reportId = this._individualReceiptService.getReportIdFromStorage(this.formType);
    
    //this.h3Subscription = this._schedH3Service.getSummary(this.getReportId()).subscribe(res =>
    this.h3Subscription = this._schedH3Service.getSummary(reportId).subscribe(res =>
      {        
        if(res) {
          this.h3Sum = [];
          this.h3Sum =  res;         
          this.h3TableConfig.totalItems = res.length;
        }
      });   
    
  }

  public setH3SumP() {

    this.h3Subscription = this._schedH3Service.getBreakDown(this.getReportId()).subscribe(res =>
      {        
        if(res) {
          this.h3SumP = [];

          const amountAD = res.find(obj => obj.activity_event_type === 'AD') ?
            res.find(obj => obj.activity_event_type === 'AD').sum : 0;

          const amountGV = res.find(obj => obj.activity_event_type === 'GV') ?
            res.find(obj => obj.activity_event_type === 'GV').sum : 0;

          const amountEA = res.find(obj => obj.activity_event_type === 'EA') ?
            res.find(obj => obj.activity_event_type === 'EA').sum : 0;

          const amountDF = res.find(obj => obj.activity_event_type === 'DF') ?
            res.find(obj => obj.activity_event_type === 'DF').sum : 0;

          const amountDC = res.find(obj => obj.activity_event_type === 'DC') ?
            res.find(obj => obj.activity_event_type === 'DC').sum : 0;

          const amountPC = res.find(obj => obj.activity_event_type === 'PC') ?
            res.find(obj => obj.activity_event_type === 'PC').sum : 0;

          const amountTotal = res.find(obj => obj.activity_event_type === 'total') ?
            res.find(obj => obj.activity_event_type === 'total').sum : 0;

          this.h3SumP.push(
            {
              'category': 'Administrative',
              'amount': amountAD
            },{
              'category': 'Generic Voter Drive',
              'amount': amountGV
            },{
              'category': 'Exempt Activities',
              'amount': amountEA
            },{
              'category': 'Direct Fundraising',
              'amount': amountDF
            },{
              'category': 'Direct Candidate Support',
              'amount': amountDC
            },{
              'category': 'Public Communications Referring Only to Party (PAC)',
              'amount': amountPC
            },{
              'category': 'Total Amount Transferred',
              'amount': amountTotal
            }
          );

          //this.h3SumP =  res;
        }
      });     

  }

  public saveAndAddMore(): void {
    this.doValidate();    
  }

  public doValidate() {

    if(this.isNumber(this.convertFormattedAmountToDecimal(this.schedH3.get('transferred_amount').value))) {
      this.transferredAmountErr = false;
      this.schedH3.patchValue({transferred_amount: this.convertFormattedAmountToDecimal(this.schedH3.get('transferred_amount').value)}, { onlySelf: true });
      this.schedH3.controls['transferred_amount'].setErrors(null);
    }else {
      this.transferredAmountErr = true
      this.schedH3.controls['transferred_amount'].setErrors({'incorrect': true});
    }

    //this.schedH3.patchValue({transferred_amount: this.convertFormattedAmountToDecimal(this.schedH3.get('transferred_amount').value)}, { onlySelf: true });
    //this.h3Ratios = {};

    const reportId = this._individualReceiptService.getReportIdFromStorage(this.formType);
    
    this.h3Ratios['report_id'] = reportId;
    this.h3Ratios.transaction_type_identifier = 'TRAN_FROM_NON_FED_ACC';
    
    //this.h3Ratios.total_amount_transferred = this.schedH3.get('total_amount_transferred').value;

    const formObj = this.schedH3.getRawValue();

    const accountName = this.schedH3.get('account_name').value;
    const receipt_date = this.schedH3.get('receipt_date').value;
    
    //const total_amount_transferred = Number(this.schedH3.get('total_amount_transferred').value) 
    //  + Number(this.schedH3.get('transferred_amount').value);
    //const total_amount_transferred = +this.schedH3.get('total_amount_transferred').value 
    //  + (+this.schedH3.get('transferred_amount').value);
    const total_amount_transferred = this.convertFormattedAmountToDecimal(this.schedH3.get('total_amount_transferred').value) + 
      this.convertFormattedAmountToDecimal(this.schedH3.get('transferred_amount').value)
    this.h3Ratios.total_amount_transferred = total_amount_transferred;
 
    formObj['report_id'] = this.getReportId();
    formObj['transaction_type_identifier'] = 'TRAN_FROM_NON_FED_ACC';
    formObj['activity_event_type'] = this.schedH3.get('category').value;

    formObj['transaction_id'] = this.transaction_id;
    formObj['back_ref_transaction_id'] = this.back_ref_transaction_id;

    formObj['aggregate_amount'] = this.convertFormattedAmountToDecimal(formObj.aggregate_amount);

    delete formObj.total_amount_transferred;

    this.isSubmit = true;

    if(this.schedH3.status === 'VALID') {
      /*
      this.schedH3.patchValue({transferred_amount: this.convertFormattedAmountToDecimal(this.schedH3.get('transferred_amount').value)}, { onlySelf: true });

      if(this.showAggregateAmount) {
        //const aggregate_amount = Number(this.schedH3.get('aggregate_amount').value) + Number(this.schedH3.get('transferred_amount').value);
        const aggregate_amount = +this.schedH3.get('aggregate_amount').value + (+this.schedH3.get('transferred_amount').value);

        //const aggregate_amount = this.convertFormattedAmountToDecimal(this.schedH3.get('aggregate_amount').value) + this.convertFormattedAmountToDecimal(this.schedH3.get('transferred_amount').value);
        this.schedH3.patchValue({aggregate_amount: aggregate_amount}, { onlySelf: true });
      }else {
        this.schedH3.patchValue({aggregate_amount: 0.00}, { onlySelf: true });
      }
      */
      if(this.scheduleAction !== ScheduleActions.edit) {
        this.h3Entries.push(formObj);
        this.h3EntryTableConfig.totalItems = this.h3Entries.length;
        this.h3Ratios.child.push(formObj);

        this.h3Ratios.child.filter(obj => obj.activity_event_name === formObj.activity_event_name)
          .forEach(obj => obj.aggregate_amount = formObj.aggregate_amount);

      } else {
        this.h3EntrieEdit = formObj;
      }

      this.schedH3.reset();
      this.isSubmit = false;
      
      this.schedH3.patchValue({account_name: accountName}, { onlySelf: true });
      this.schedH3.patchValue({receipt_date: receipt_date}, { onlySelf: true });

      //this.schedH3.patchValue({total_amount_transferred: total_amount_transferred}, { onlySelf: true });
      this.schedH3.patchValue({total_amount_transferred:  this._decPipe.transform(total_amount_transferred, '.2-2')}, { onlySelf: true });
/*
      if(this.showAggregateAmount) {
        //const aggregate_amount = Number(this.schedH3.get('aggregate_amount').value) + Number(this.schedH3.get('transferred_amount').value);
        const aggregate_amount = +this.schedH3.get('aggregate_amount').value + (+this.schedH3.get('transferred_amount').value);

        //const aggregate_amount = this.convertFormattedAmountToDecimal(this.schedH3.get('aggregate_amount').value) + this.convertFormattedAmountToDecimal(this.schedH3.get('transferred_amount').value);
        this.schedH3.patchValue({aggregate_amount: aggregate_amount}, { onlySelf: true });
      }else {
        this.schedH3.patchValue({aggregate_amount: 0.00}, { onlySelf: true });
      }
*/      
      this.schedH3.patchValue({category: ''}, { onlySelf: true });
      this.showIdentifer = false;
    }
  }

  public saveH3Ratio(ratio: any, scheduleAction: any) {
    
    this._schedH3Service.saveH3Ratio(ratio, scheduleAction).subscribe(res => {
      if (res) {
        this.saveHRes = res;
        this.h3Entries = [];
      }
    });
  }

  public saveAndGetSummary(ratio: any, scheduleAction: any) {

    const reportId = this._individualReceiptService.getReportIdFromStorage(this.formType);

    this._schedH3Service.saveAndGetSummary(ratio, reportId, scheduleAction).subscribe(res => {
      if (res) {
        //this.saveHRes = res;
        this.h3Entries = [];
        this.h3Sum =  res;
        this.h3TableConfig.totalItems = res.length;
      }
    });
  }

  public addEntries() {
    //const serializedForm = JSON.stringify(this.h3Ratios);
    //this.saveH3Ratio(serializedForm);

    let serializedForm: any;
    if(this.scheduleAction === ScheduleActions.add) {
      serializedForm = JSON.stringify(this.h3Ratios);
    }else if(this.scheduleAction === ScheduleActions.edit) {
      serializedForm = JSON.stringify(this.h3EntrieEdit);
    }

    this.saveAndGetSummary(serializedForm, this.scheduleAction);
    this.h3Ratios = {};
    this.h3Ratios['child'] = [];
  }

  public handleAmountKeyup(e: any) {
    let val = 0;
    if(this.schedH3.get('transferred_amount').value){
      val = this.convertFormattedAmountToDecimal(this.schedH3.get('transferred_amount').value);
    }

    let aggregate_amount = 0;
    if(this.schedH3.get('aggregate_amount').value){
      aggregate_amount = this.convertFormattedAmountToDecimal(this.schedH3.get('aggregate_amount').value);
    }

    if(this.scheduleAction === ScheduleActions.add && this.showAggregateAmount) {
      this.schedH3.patchValue({aggregate_amount: this._decPipe.transform(aggregate_amount + val, '.2-2')}, { onlySelf: true });
    }

    this.changeTotalAndAggrAmount();
  }

  public receiptDateChanged(receiptDate: string) {

    const formInfo = JSON.parse(localStorage.getItem('form_3X_report_type'));
    this.cvgStartDate = formInfo.cvgStartDate;
    this.cvgEndDate = formInfo.cvgEndDate;

    let startDate =  new Date(this.cvgStartDate);
    startDate.setDate(startDate.getDate() - 1);

    if ((!this._uService.compareDatesAfter((new Date(receiptDate)), new Date(this.cvgEndDate)) ||
      this._uService.compareDatesAfter((new Date(receiptDate)), startDate))) {      
      this.receiptDateErr = true;
      this.schedH3.controls['receipt_date'].setErrors({'incorrect': true});
    } else {
      this.receiptDateErr = false;
    }

  }

  public handleOnBlurEvent($event: any, col: any) {
    const entry = $event.target.value.replace(/,/g, ``);
    if(this.isNumber(entry)) {
      this.transferredAmountErr = false;
      //this.schedH3.patchValue({transferred_amount: this._decPipe.transform(
      //    this.convertFormattedAmountToDecimal(entry), '.2-2')}, { onlySelf: true });
      this.schedH3.patchValue({transferred_amount: this._decPipe.transform(
        this.convertFormattedAmountToDecimal(
          this.schedH3.get('transferred_amount').value), '.2-2')}, { onlySelf: true });

      let val = 0;
      if(this.schedH3.get('transferred_amount').value){
        val = this.convertFormattedAmountToDecimal(this.schedH3.get('transferred_amount').value);
      }

      /*
      let aggregate_amount = 0;
      if(this.schedH3.get('aggregate_amount').value){
        aggregate_amount = this.convertFormattedAmountToDecimal(this.schedH3.get('aggregate_amount').value);
      }
      */

      const activity_event_name = this.schedH3.get('activity_event_name').value;
      const activity_event_type = this.schedH3.get('category').value;

      if(activity_event_name && (activity_event_type === 'DC' || activity_event_type === 'DF')) {

        let aggregate_amount = 0;
        this.h3Entries.filter(obj => obj.activity_event_name === activity_event_name)
        .forEach(obj => {
          aggregate_amount += this.convertFormattedAmountToDecimal(obj.transferred_amount);
        });

        if(this.scheduleAction === ScheduleActions.add && this.showAggregateAmount) {
          this.schedH3.patchValue({aggregate_amount: this._decPipe.transform(aggregate_amount + val, '.2-2')}, { onlySelf: true });
        }
      }else {
        this.schedH3.patchValue({aggregate_amount: 0}, { onlySelf: true });
      }

      this.changeTotalAndAggrAmount();

      this.schedH3.controls['transferred_amount'].setErrors(null);
    }else {
      this.transferredAmountErr = true;
      this.schedH3.controls['transferred_amount'].setErrors({'incorrect': true});
    }
  }

  private convertFormattedAmountToDecimal(formatedAmount: string): number {
    if(!formatedAmount) {
      formatedAmount = '0'
    }
    if (typeof formatedAmount === 'string') {
      // remove commas
      formatedAmount = formatedAmount.replace(/,/g, ``);
      return parseFloat(formatedAmount);
    } else {
      return formatedAmount;
    }
  }

  private isNumber(value: string | number): boolean {
   return ((value != null) && !isNaN(Number(value.toString())));
  }

  public clearFormValues() {
    this.setH3();
    this.h3Entries = [];
    this.h3Ratios = {};
    this.h3Ratios['child'] = [];
    this.transferredAmountErr = false;
    if(this.scheduleAction === ScheduleActions.edit) {
      this.scheduleAction = ScheduleActions.add
    }
    this.showIdentiferSelect = false;
    this.showAggregateAmount = false;
  }

  public editH3(item) {
    this.returnToAdd();
    this.scheduleAction = ScheduleActions.edit;

    this.showIdentifer = true;

    this.transaction_id = item.transaction_id;
    this.back_ref_transaction_id = item.back_ref_transaction_id;

    if(item.activity_event_type === 'DC' || item.activity_event_type === 'DF') {
      this.showIdentiferSelect = true;
      this.showAggregateAmount = true;
    }

    if(item.activity_event_type === 'AD') {
      this.totalName = 'Administrative';
    }else if(item.activity_event_type === 'GV') {
      this.totalName = 'Generic Voter Drive';
    }else if(item.activity_event_type === 'EA') {
      this.totalName = 'Exempt Activities';
    }else if(item.activity_event_type === 'DF') {
      this.totalName = 'Activity or Event Identifier';
      this.setActivityOrEventIdentifier('fundraising');
    }else if(item.activity_event_type === 'DC') {
      this.totalName = 'Activity or Event Identifier';
      this.setActivityOrEventIdentifier('direct_cand_support');
    }else if(item.activity_event_type === 'PC') {
      this.totalName = 'Public Communications';
    }

    this.schedH3.patchValue({ account_name: item.account_name}, { onlySelf: true });
    this.schedH3.patchValue({ receipt_date: item.receipt_date}, { onlySelf: true });
    this.schedH3.patchValue({ total_amount_transferred: this._decPipe.transform(item.total_amount_transferred, '.2-2')}, { onlySelf: true });
    this.schedH3.patchValue({ category: item.activity_event_type}, { onlySelf: true });
    this.schedH3.patchValue({ activity_event_name: item.activity_event_name}, { onlySelf: true });
    this.schedH3.patchValue({ transferred_amount: this._decPipe.transform(item.transferred_amount, '.2-2')}, { onlySelf: true });
    this.schedH3.patchValue({ aggregate_amount: this._decPipe.transform(item.aggregate_amount, '.2-2')}, { onlySelf: true });

    this.transferred_amount_edit = item.transferred_amount;
    this.total_amount_edit = item.total_amount_transferred;
    this.aggregate_amount_edit = item.aggregate_amount;
    this.activity_event_name_edit = item.activity_event_name;
  }

  public saveEdit() {
    if(this.schedH3.status === 'VALID') {
      this.saveAndAddMore();
      this.addEntries();
      this.returnToSum();
    }else {
      this.schedH3.markAsDirty();
      this.schedH3.markAsTouched();
      this.isSubmit = true;
    }
  }

  public editH3Sub(item: any) {

    this.showIdentifer = true;

    this.showIdentiferSelect = false;
    this.showAggregateAmount = false;

    if(item.activity_event_type === 'DC' || item.activity_event_type === 'DF') {
      this.showIdentiferSelect = true;
      this.showAggregateAmount = true;
    }

    if(item.activity_event_type === 'AD') {
      this.totalName = 'Administrative';
    }else if(item.activity_event_type === 'GV') {
      this.totalName = 'Generic Voter Drive';
    }else if(item.activity_event_type === 'EA') {
      this.totalName = 'Exempt Activities';
    }else if(item.activity_event_type === 'DF') {
      this.totalName = 'Activity or Event Identifier';
      this.setActivityOrEventIdentifier('fundraising');
    }else if(item.activity_event_type === 'DC') {
      this.totalName = 'Activity or Event Identifier';
      this.setActivityOrEventIdentifier('direct_cand_support');
    }else if(item.activity_event_type === 'PC') {
      this.totalName = 'Public Communications';
    }

    this.schedH3.patchValue({ account_name: item.account_name}, { onlySelf: true });
    this.schedH3.patchValue({ receipt_date: item.receipt_date}, { onlySelf: true });
    //this.schedH3.patchValue({ total_amount_transferred: this._decPipe.transform(item.total_amount_transferred, '.2-2')}, { onlySelf: true });
    this.schedH3.patchValue({ category: item.activity_event_type}, { onlySelf: true });
    this.schedH3.patchValue({ activity_event_name: item.activity_event_name}, { onlySelf: true });
    this.schedH3.patchValue({ transferred_amount: this._decPipe.transform(item.transferred_amount, '.2-2')}, { onlySelf: true });
    //this.schedH3.patchValue({ aggregate_amount: this._decPipe.transform(
    //  this.convertFormattedAmountToDecimal(item.aggregate_amount), '.2-2')}, { onlySelf: true });

    this.h3Entries = this.h3Entries.filter(obj => obj !== item);
    this.h3Ratios.child = this.h3Ratios.child.filter(obj => obj !== item);

    let sum = 0;
    this.h3Entries.forEach(obj => {
     sum += this.convertFormattedAmountToDecimal(obj.transferred_amount);
    })

    this.schedH3.patchValue({ total_amount_transferred:
      this._decPipe.transform(sum, '.2-2')}, { onlySelf: true });

    let aggregate_amount = 0;
    this.h3Entries.filter(obj => obj.activity_event_name === item.activity_event_name)
      .forEach(obj => {
        aggregate_amount += this.convertFormattedAmountToDecimal(obj.transferred_amount);
       });
    this.schedH3.patchValue({ aggregate_amount: this._decPipe.transform(aggregate_amount
      + item.transferred_amount, '.2-2')}, { onlySelf: true });
    this.h3Ratios.child.filter(obj => obj.activity_event_name === item.activity_event_name)
      .forEach(obj => obj.aggregate_amount = aggregate_amount);

  }

  public changeTotalAndAggrAmount() {

    let val = 0;
    if(this.schedH3.get('transferred_amount').value){
      val = this.convertFormattedAmountToDecimal(this.schedH3.get('transferred_amount').value);
    }

    if(this.scheduleAction === ScheduleActions.edit) {
      this.schedH3.patchValue({ total_amount_transferred: this._decPipe.transform(
        this.total_amount_edit - this.transferred_amount_edit + val, '.2-2')}, { onlySelf: true });

      const activity_event_name = this.schedH3.get('activity_event_name').value;
      const activity_event_type = this.schedH3.get('category').value;

      if(activity_event_name && (activity_event_type === 'DC' || activity_event_type === 'DF')) {
        let sum = 0;
        this.h3Entries.filter(obj => obj.activity_event_name === activity_event_name)
        .forEach(obj => {
          sum += this.convertFormattedAmountToDecimal(obj.transferred_amount);
        });

        if(this.showAggregateAmount && activity_event_name === this.activity_event_name_edit ) {
          this.schedH3.patchValue({ aggregate_amount: this._decPipe.transform(
            sum + val, '.2-2')}, { onlySelf: true });
        }else {
          this.schedH3.patchValue({ aggregate_amount: this._decPipe.transform(val, '.2-2')}, { onlySelf: true });
        }
      }
    }
  }

  public getAggregateAmount() {

    let sum = 0;
    const activity_event_name = this.schedH3.get('activity_event_name').value;
    const activity_event_type = this.schedH3.get('category').value;

    if(activity_event_name && activity_event_type === 'DC' || activity_event_type === 'DF') {
      this.h3Entries.filter(obj => obj.activity_event_name === activity_event_name)
      .forEach(obj => {
        sum += this.convertFormattedAmountToDecimal(obj.transferred_amount);
       });

      this.schedH3.patchValue({ aggregate_amount: this._decPipe.transform(sum, '.2-2')}, { onlySelf: true });
    }
  }

}
