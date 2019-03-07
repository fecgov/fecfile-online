import { Component, Input, OnInit, ViewEncapsulation, ViewChild, OnDestroy } from '@angular/core';
import { style, animate, transition, trigger } from '@angular/animations';
import { PaginationInstance } from 'ngx-pagination';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { TransactionModel } from '../model/transaction.model';
import { SortableColumnModel } from 'src/app/shared/services/TableService/sortable-column.model';
import { TransactionsService, GetTransactionsResponse } from '../service/transactions.service';
import { TableService } from 'src/app/shared/services/TableService/table.service';
import { UtilService } from 'src/app/shared/utils/util.service';
import { ActiveView } from '../transactions.component';
import { TransactionsMessageService } from '../service/transactions-message.service';
import { Subscription } from 'rxjs/Subscription';
import { ConfirmModalComponent, ModalHeaderClassEnum } from 'src/app/shared/partials/confirm-modal/confirm-modal.component';
import { DialogService } from 'src/app/shared/services/DialogService/dialog.service';



@Component({
  selector: 'app-transactions-table',
  templateUrl: './transactions-table.component.html',
  styleUrls: [
    './transactions-table.component.scss', 
    '../../../shared/partials/confirm-modal/confirm-modal.component.scss'
  ],
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
export class TransactionsTableComponent implements OnInit, OnDestroy {

  @ViewChild('columnOptionsModal')
  public columnOptionsModal: ModalDirective;

  @Input()
  public formType: string;

  @Input()
  public tableType: string;

  public transactionsModel: Array<TransactionModel>;
  public totalAmount: number;
  public transactionsView = ActiveView.transactions;
  public recycleBinView = ActiveView.recycleBin;
  public bulkActionDisabled = true;
  public bulkActionCounter = 0;

  // ngx-pagination config
  public maxItemsPerPage = 100;
  public directionLinks = false;
  public autoHide = true;
  public config: PaginationInstance;
  public numberOfPages = 0;

  private firstItemOnPage = 0;
  private lastItemOnPage = 0;
  private filters: any;

  // Local Storage Keys
  private readonly transactionSortableColumnsLSK =
    'transactions.trx.sortableColumn';
  private readonly recycleSortableColumnsLSK =
    'transactions.recycle.sortableColumn';
  private readonly transactionCurrentSortedColLSK =
    'transactions.trx.currentSortedColumn';
  private readonly recycleCurrentSortedColLSK =
    'transactions.recycle.currentSortedColumn';
  private readonly transactionPageLSK =
    'transactions.trx.page';
  private readonly recyclePageLSK =
    'transactions.recycle.page';

  /**.
	 * Array of columns to be made sortable.
	 */
  private sortableColumns: SortableColumnModel[] = [];

  /**
	 * A clone of the sortableColumns for reverting user
   * column options on a Cancel.
	 */
  private cloneSortableColumns: SortableColumnModel[] = [];

  /**
	 * Identifies the column currently sorted by name.
	 */
  private currentSortedColumnName: string;

  /**
   * Subscription for messags sent from the parent component to show the PIN Column
   * options.
   */
  private showPinColumnsSubscription: Subscription;

  /**
   * Subscription for applying filters to the transactions obtained from
   * the server.
   */
  private applyFiltersSubscription: Subscription;

  private columnOptionCount = 0;
  private readonly maxColumnOption = 5;
  private allTransactionsSelected: boolean;

  constructor(
    private _transactionsService: TransactionsService,
    private _transactionsMessageService: TransactionsMessageService,
    private _tableService: TableService,
    private _utilService: UtilService,
    private _dialogService: DialogService,
  ) {
    this.showPinColumnsSubscription = this._transactionsMessageService.getMessage().subscribe(
      message => {
        this.showPinColumns();
      }
    );
    this.applyFiltersSubscription = this._transactionsMessageService.getApplyFiltersMessage()
      .subscribe(
      filters => {
        this.filters = filters;
        this.getPage(this.config.currentPage);
      }
    );
  }


  /**
   * Initialize the component.
   */
  public ngOnInit(): void {

    const paginateConfig: PaginationInstance = {
      id: 'forms__trx-table-pagination',
      itemsPerPage: 5,
      currentPage: 1
    };
    this.config = paginateConfig;

    this.getCachedValues();
    this.cloneSortableColumns = this._utilService.deepClone(this.sortableColumns);

    for (const col of this.sortableColumns) {
      if (col.checked) {
        this.columnOptionCount++;
      }
    }
    this.getPage(this.config.currentPage);
  }


  /**
   * When component is destroyed, save off user column options to be applied upon return.
   */
  public ngOnDestroy(): void {
    this.setCachedValues();
    this.showPinColumnsSubscription.unsubscribe();
  }


  /**
	 * The Transactions for a given page.
	 *
	 * @param page the page containing the transactions to get
	 */
  public getPage(page: number): void {

    this.bulkActionCounter = 0;
    this.bulkActionDisabled = true;

    switch (this.tableType) {
      case this.transactionsView:
        this.getTransactionsPage(page);
        break;
      case this.recycleBinView:
        this.getRecyclingPage(page);
        break;
      default:
        break;
    }
  }


  /**
	 * The Transactions for a given page.
	 *
	 * @param page the page containing the transactions to get
	 */
  public getTransactionsPage(page: number): void {

    this.config.currentPage = page;

    const sortedCol: SortableColumnModel =
      this._tableService.getColumnByName(this.currentSortedColumnName, this.sortableColumns);

    this._transactionsService.getFormTransactions(this.formType, page, this.config.itemsPerPage,
      this.currentSortedColumnName, sortedCol.descending, this.filters)
      .subscribe((res: GetTransactionsResponse) => {
        this.transactionsModel = [];

        this._transactionsService.mockApplyRestoredTransaction(res);
        this._transactionsService.mockApplyFilters(res, this.filters);

        const transactionsModelL = this._transactionsService.mapFromServerFields(res.transactions);

        this.transactionsModel = this._transactionsService.sortTransactions(
            transactionsModelL, this.currentSortedColumnName, sortedCol.descending);

        this.totalAmount = res.totalAmount;
        this.config.totalItems = res.totalTransactionCount;
        this.allTransactionsSelected = false;
      });
  }


  /**
	 * The Transactions for the recycling bin.
	 *
	 * @param page the page containing the transactions to get
	 */
  public getRecyclingPage(page: number): void {

    this.calculateNumberOfPages();

    const sortedCol: SortableColumnModel =
      this._tableService.getColumnByName(this.currentSortedColumnName, this.sortableColumns);

    this._transactionsService.getUserDeletedTransactions(this.formType)
      .subscribe((res: GetTransactionsResponse) => {

        this._transactionsService.mockApplyFilters(res, this.filters);
        const transactionsModelL = this._transactionsService.mapFromServerFields(res.transactions);

        this.transactionsModel = this._transactionsService.sortTransactions(
          transactionsModelL, this.currentSortedColumnName, sortedCol.descending);

        this.config.totalItems = res.totalTransactionCount;

        // If a row was deleted, the current page may be greated than the last page
        // as result of the delete.
        this.config.currentPage = (page > this.numberOfPages && this.numberOfPages !== 0)
          ? this.numberOfPages : page;
      });
  }


  /**
	 * Wrapper method for the table service to set the class for sort column styling.
	 *
	 * @param colName the column to apply the class
	 * @returns string of classes for CSS styling sorted/unsorted classes
	 */
  public getSortClass(colName: string): string {
    return this._tableService.getSortClass(colName, this.currentSortedColumnName, this.sortableColumns);
  }


  /**
	 * Change the sort direction of the table column.
	 *
	 * @param colName the column name of the column to sort
	 */
  public changeSortDirection(colName: string): void {
    this.currentSortedColumnName = this._tableService.changeSortDirection(colName, this.sortableColumns);

    // TODO this could be done client side or server side.
    // call server for page data in new direction
    this.getPage(this.config.currentPage);
  }


  /**
   * Get the SortableColumnModel by name.
   *
   * @param colName the column name in the SortableColumnModel.
   * @returns the SortableColumnModel matching the colName.
   */
  public getSortableColumn(colName: string): SortableColumnModel {
    for (const col of this.sortableColumns) {
      if (col.colName === colName) {
        return col;
      }
    }
    return new SortableColumnModel('', false, false, false, false);
  }


  /**
   * Determine if the column is to be visible in the table.
   *
   * @param colName
   * @returns true if visible
   */
  public isColumnVisible(colName: string): boolean {
    const sortableCol = this.getSortableColumn(colName);
    if (sortableCol) {
      return sortableCol.visible;
    } else {
      return false;
    }
  }


  /**
   * Set the visibility of a column in the table.
   *
   * @param colName the name of the column to make shown
   * @param visible is true if the columns should be shown
   */
  public setColumnVisible(colName: string, visible: boolean) {
    const sortableCol = this.getSortableColumn(colName);
    if (sortableCol) {
      sortableCol.visible = visible;
    }
  }


  /**
   * Set the checked property of a column in the table.
   * The checked is true if the column option settings
   * is checked for the column.
   *
   * @param colName the name of the column to make shown
   * @param checked is true if the columns should be shown
   */
  private setColumnChecked(colName: string, checked: boolean) {
    const sortableCol = this.getSortableColumn(colName);
    if (sortableCol) {
      sortableCol.checked = checked;
    }
  }


  /**
   *
   * @param colName Determine if the checkbox column option should be disabled.
   */
  public disableOption(colName: string): boolean {
    const sortableCol = this.getSortableColumn(colName);
    if (sortableCol) {
      if (!sortableCol.checked && this.columnOptionCount >
        (this.maxColumnOption - 1)) {
        return true;
      }
    }
    return false;
  }


  /**
   * Toggle the visibility of a column in the table.
   *
   * @param colName the name of the column to toggle
   * @param e the click event
   */
  public toggleVisibility(colName: string, e: any) {

    if (!this.sortableColumns) {
      return;
    }

    // only permit 5 checked at a time
    if (e.target.checked === true) {
      this.columnOptionCount = 0;
      for (const col of this.sortableColumns) {
        if (col.checked) {
          this.columnOptionCount++;
        }
        if (this.columnOptionCount > 5) {
          this.setColumnChecked(colName, false);
          e.target.checked = false;
          this.columnOptionCount--;
          return;
        }
      }
    } else {
      this.columnOptionCount--;
    }

    this.applyDisabledColumnOptions();
  }


  /**
   * Disable the unchecked column options if the max is met.
   */
  private applyDisabledColumnOptions() {
    if (this.columnOptionCount > (this.maxColumnOption - 1)) {
      for (const col of this.sortableColumns) {
        col.disabled = !col.checked;
      }
    } else {
      for (const col of this.sortableColumns) {
        col.disabled = false;
      }
    }
  }


  /**
   * Save the columns to show selected by the user.
   */
  public saveColumnOptions() {

    for (const col of this.sortableColumns) {
      this.setColumnVisible(col.colName, col.checked);
    }
    this.cloneSortableColumns = this._utilService.deepClone(this.sortableColumns);
    this.columnOptionsModal.hide();
  }


  /**
   * Cancel the request to save columns options.
   */
  public cancelColumnOptions() {
    this.columnOptionsModal.hide();
    this.sortableColumns = this._utilService.deepClone(this.cloneSortableColumns);
  }


  /**
   * Toggle checking all types.
   *
   * @param e the click event
   */
  public toggleAllTypes(e: any) {
    const checked = (e.target.checked) ? true : false;
    for (const col of this.sortableColumns) {
      this.setColumnVisible(col.colName, checked);
    }
  }


  /**
	 * Determine if pagination should be shown.
	 */
  public showPagination(): boolean {
    if (this.config.totalItems > this.config.itemsPerPage) {
      return true;
    }
    // otherwise, no show.
    return false;
  }


  /**
   * View all transactions selected by the user.
   */
  public viewAllSelected(): void {
    alert('View all transactions is not yet supported');
  }


  /**
   * Print all transactions selected by the user.
   */
  public printAllSelected(): void {
    alert('Print all transactions is not yet supported');
  }


  /**
   * Export all transactions selected by the user.
   */
  public exportAllSelected(): void {
    alert('Export all transactions is not yet supported');
  }


  /**
   * Link all transactions selected by the user.
   */
  public linkAllSelected(): void {
    alert('Link multiple transaction requirements have not been finalized');
  }


  /**
   * Trash all transactions selected by the user.
   */
  public trashAllSelected(): void {
    alert('Trash all transactions is not yet supported');
  }


  /**
   * Clone the transaction selected by the user.
   *
   * @param trx the Transaction to clone
   */
  public cloneTransaction(): void {
    alert('Clone transaction is not yet supported');
  }


  /**
   * Link the transaction selected by the user.
   *
   * @param trx the Transaction to link
   */
  public linkTransaction(): void {
    alert('Link requirements have not been finalized');
  }


  /**
   * View the transaction selected by the user.
   *
   * @param trx the Transaction to view
   */
  public viewTransaction(): void {
    alert('View transaction is not yet supported');
  }


  /**
   * Edit the transaction selected by the user.
   *
   * @param trx the Transaction to edit
   */
  public editTransaction(): void {
    alert('Edit transaction is not yet supported');
  }


  /**
   * Trash the transaction selected by the user.
   *
   * @param trx the Transaction to trash
   */
  public trashTransaction(): void {
    alert('Trash transaction is not yet supported');
  }


  /**
   * Restore a trashed transaction from the recyle bin.
   *
   * @param trx the Transaction to restore
   */
  public restoreTransaction(trx: TransactionModel): void {

    this._dialogService
      .confirm('You are about to restore transaction ' + trx.transactionId + '.',
          ConfirmModalComponent,
          'Caution!')
      .then(res => {
        if (res === 'okay') {
          this._transactionsService.restoreTransaction(trx)
            .subscribe((res: GetTransactionsResponse) => {
              this.getRecyclingPage(this.config.currentPage);
              this._dialogService
              .confirm('Transaction ' + trx.transactionId + ' has been restored!',
                  ConfirmModalComponent, 'Success!', false, ModalHeaderClassEnum.successHeader);
            });
        } else if (res === 'cancel') {
        }
      });
  }


  /**
   * Determine the item range shown by the server-side pagination.
   */
  public determineItemRange(): string {

    let start = 0;
    let end = 0;
    this.numberOfPages = 0;
    this.config.currentPage = this._utilService.isNumber(this.config.currentPage) ?
      this.config.currentPage : 1;

    if (!this.transactionsModel) {
      return;
    }

    if (this.config.currentPage > 0 && this.config.itemsPerPage > 0
      && this.transactionsModel.length > 0) {
      this.calculateNumberOfPages();

      if (this.config.currentPage === this.numberOfPages) {
        end = this.transactionsModel.length;
        start = (this.config.currentPage - 1) * this.config.itemsPerPage + 1;
      } else {
        end = this.config.currentPage * this.config.itemsPerPage;
        start = (end - this.config.itemsPerPage) + 1;
      }
    }
    this.firstItemOnPage = start;
    this.lastItemOnPage = end;
    return start + ' - ' + end;
  }


  /**
   * Show the option to select/deselect columns in the table.
   */
  public showPinColumns() {
    this.applyDisabledColumnOptions();
    this.columnOptionsModal.show();
  }


  /**
   * Check/Uncheck all transactions in the table.
   */
  public changeAllTransactionsSelected() {

    // TODO Iterating over the trsnactionsModel and setting the slected prop
    // works when we have server-side pagination as the model will only contain
    // transactions for the current page.

    // Until the server is ready for pagination,
    // we are getting the entire set of tranactions (> 500)
    // and must only count and set the selected prop for the items
    // on the current page.

    this.bulkActionCounter = 0;
    // for (const t of this.transactionsModel) {
    //   t.selected = this.allTransactionsSelected;
    //   if (this.allTransactionsSelected) {
    //     this.bulkActionCounter++;
    //   }
    // }

    // TODO replace this with the commented code above when server paginatin is ready.
    for (let i = (this.firstItemOnPage - 1); i <= (this.lastItemOnPage - 1); i++) {
      this.transactionsModel[i].selected = this.allTransactionsSelected;
      if (this.allTransactionsSelected) {
        this.bulkActionCounter++;
      }
    }
    console.log('this.bulkActionCounter multi = ' + this.bulkActionCounter);
    this.bulkActionDisabled = !this.allTransactionsSelected;
  }


  /**
   * Check if the view to show is Transactions.
   */
  public isTransactionViewActive() {
    return this.tableType === this.transactionsView ? true : false;
  }


  /**
   * Check if the view to show is Recycle Bin.
   */
  public isRecycleBinViewActive() {
    return this.tableType === this.recycleBinView ? true : false;
  }


  /**
   * Check for multiple rows checked in the table
   * and disable/enable the bulk action button
   * accordingly.
   *
   * @param the event payload from the click
   */
  public checkForMultiChecked(e: any): void {

    if (e.target.checked) {
      this.bulkActionCounter++;
    } else {
      this.allTransactionsSelected = false;
      if (this.bulkActionCounter > 0) {
        this.bulkActionCounter--;
      }
    }
    console.log('this.bulkActionCounter = ' + this.bulkActionCounter);
    this.bulkActionDisabled = (this.bulkActionCounter > 1) ? false : true;
  }


  public applyFilters(filters: any) {
    console.log('filter search is ' + filters.search);
    this.filters = filters;
    this.getPage(this.config.currentPage);
  }

  /**
   * Get cached values from session.
   */
  private getCachedValues() {
    switch (this.tableType) {
      case this.transactionsView:
        this.applyColCache(this.transactionSortableColumnsLSK);
        this.applyCurrentSortedColCache(this.transactionCurrentSortedColLSK);
        this.applyCurrentPageCache(this.transactionPageLSK);
        break;
      case this.recycleBinView:
        this.applyColCache(this.recycleSortableColumnsLSK);
        this.applyColumnsSelected();
        this.applyCurrentSortedColCache(this.recycleCurrentSortedColLSK);
        this.applyCurrentPageCache(this.recyclePageLSK);
        break;
      default:
        break;
    }
  }


  /**
   * Columns selected in the PIN dialog from the transactions view
   * need to be applied to the Recycling Bin table.
   */
  private applyColumnsSelected() {
    const key = this.transactionSortableColumnsLSK;
    const sortableColumnsJson: string | null = localStorage.getItem(key);
    if (localStorage.getItem(key) != null) {
      const trxCols: SortableColumnModel[] = JSON.parse(sortableColumnsJson);
      for (const col of trxCols) {
        this._tableService.getColumnByName(col.colName,
          this.sortableColumns).visible = col.visible;
      }
    }
  }


  /**
   * Get the column and their settings from the cache and apply it to the component.
   * @param key the key to the value in the local storage cache
   */
  private applyColCache(key: string) {
    const sortableColumnsJson: string | null = localStorage.getItem(key);
    if (localStorage.getItem(key) != null) {
      this.sortableColumns = JSON.parse(sortableColumnsJson);
    } else {
      // Just in case cache has an unexpected issue, use default.
      this.setSortableColumns();
    }
  }


  /**
   * Get the current sorted column from the cache and apply it to the component.
   * @param key the key to the value in the local storage cache
   */
  private applyCurrentSortedColCache(key: string) {
    const currentSortedColumnJson: string | null =
      localStorage.getItem(key);
    let currentSortedColumnL: SortableColumnModel = null;
    if (currentSortedColumnJson) {
      currentSortedColumnL = JSON.parse(currentSortedColumnJson);

      // sort by the column direction previously set
      this.currentSortedColumnName = this._tableService.setSortDirection(currentSortedColumnL.colName,
        this.sortableColumns, currentSortedColumnL.descending);
    } else {
      this.setSortDefault();
    }
  }


  /**
   * Get the current page from the cache and apply it to the component.
   * @param key the key to the value in the local storage cache
   */
  private applyCurrentPageCache(key: string) {
    const currentPageCache: string =
      localStorage.getItem(key);
    if (this._utilService.isNumber(currentPageCache)) {
      this.config.currentPage = this._utilService.toInteger(currentPageCache);
    } else {
      this.config.currentPage = 1;
    }
  }


  /**
   * Retrieve the cahce values from local storage and set the
   * component's class variables.
   */
  private setCachedValues() {
    switch (this.tableType) {
      case this.transactionsView:
        this.setCacheValuesforView(this.transactionSortableColumnsLSK,
          this.transactionCurrentSortedColLSK, this.transactionPageLSK);
        break;
      case this.recycleBinView:
        this.setCacheValuesforView(this.recycleSortableColumnsLSK,
          this.recycleCurrentSortedColLSK, this.recyclePageLSK);
        break;
      default:
        break;
    }
  }


  /**
   * Set the currently sorted column and current page in the cache.
   *
   * @param columnsKey the column settings key for the cache
   * @param sortedColKey currently sorted column key for the cache
   * @param pageKey current page key from the cache
   */
  private setCacheValuesforView(columnsKey: string, sortedColKey: string,
      pageKey: string) {

    // shared between trx and recycle tables
    localStorage.setItem(columnsKey,
      JSON.stringify(this.sortableColumns));

    const currentSortedCol = this._tableService.getColumnByName(
      this.currentSortedColumnName, this.sortableColumns);
    localStorage.setItem(sortedColKey, JSON.stringify(this.sortableColumns));

    if (currentSortedCol) {
      localStorage.setItem(sortedColKey, JSON.stringify(currentSortedCol));
    }
    localStorage.setItem(pageKey, this.config.currentPage.toString());
  }


  /**
   * Set the Table Columns model.
   */
  private setSortableColumns(): void {
    // sort column names must match the domain model names
    const defaultSortColumns = ['type', 'transactionId', 'name', 'date', 'amount'];
    const otherSortColumns = ['street', 'city', 'state', 'zip', 'aggregate', 'purposeDescription',
      'contributorEmployer', 'contributorOccupation', 'memoCode', 'memoText'];

    this.sortableColumns = [];
    for (const field of defaultSortColumns) {
      this.sortableColumns.push(new SortableColumnModel(field, false, true, true, false));
    }
    for (const field of otherSortColumns) {
      this.sortableColumns.push(new SortableColumnModel(field, false, false, false, true));
    }
    this.sortableColumns.push(new SortableColumnModel('deletedDate', false, true, false, false));
  }


  /**
   * Set the UI to show the default column sorted in the default direction.
   */
  private setSortDefault(): void {
    this.currentSortedColumnName = this._tableService.setSortDirection('type',
      this.sortableColumns, false);
  }


  private calculateNumberOfPages(): void {
    if (this.config.currentPage > 0 && this.config.itemsPerPage > 0) {
      if (this.transactionsModel && this.transactionsModel.length > 0) {
        this.numberOfPages = this.transactionsModel.length / this.config.itemsPerPage;
        this.numberOfPages = Math.ceil(this.numberOfPages);
      }
    }
  }

}
