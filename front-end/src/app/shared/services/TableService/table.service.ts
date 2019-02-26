import { Injectable } from '@angular/core';
import { SortableColumnModel } from './sortable-column.model';



@Injectable({
  providedIn: 'root'
})
export class TableService {

  constructor() { }

  
	/**
	 * Determine if a given column is currently sorted and style the UI accordingly.
	 * 
	 * @param colName the column to check if sorted
	 * @param currentSortedColumn the column currently sorted
	 * @param sortableColumns all possible columns to sort
	 * @returns a string of classes for CSS styling the column "colName" as sorted or not. Class "fec_sortable_col"
	 * 			is given to all columns that may be sorted.  Class "sort-true" will style the sort as descending.
	 * 			Class "sort-false" will style as ascending and false will show no sort. 
	 */
  public getSortClass(colName: string, currentSortedColumn: string, sortableColumns: SortableColumnModel[]): string {

    let col:SortableColumnModel = this.findCurrentSortedColumn(currentSortedColumn, sortableColumns);
    let sortCol: string = "";
    
    if (col) {
      // if the colName is the currently sorted column, determing the sort direction and return either sort-true or sort-false
      // for ascending and descending respectively.  Otherwise return false for no sort direction as the column is not sorted.
      sortCol = (colName == col.colName) ? 'sort-' + col.descending  : 'false';			
    }
    return 'table__sortable_col ' + sortCol;
  }


	/**
	 * Change the sort direction on a given column.  
	 * 
	 * Typical usage of this
	 * method is in the template on the <th> cell of the column.  When clicked,
	 * this method will change the direction of the column in the sortableColumns.
	 * 
	 * @param colName the column name of the column to sort
	 * @param sortableColumns all possible columns to sort
	 * @returns a string of the column name sorted or an empty string 
	 * 			if colName is not found in sortableColumns.
	 */
	public changeSortDirection(colName: string, sortableColumns: SortableColumnModel[]) : string {

		for (let col of sortableColumns) {
			if (col.colName == colName) {
				col.descending = !col.descending;
				return colName;
			}
		}
		// not found
		return "";
	}  


 	/**
	 * Given a column name of the currently sorted column, find it's SortableColumnModel object in the array of sortable columns.
	 * 
	 * @param currentSortedColumn the column name of the column currently sorted
	 * @param sortableColumns all possible columns to sort
	 * @returns the SortableColumnModel of the currently sorted column
	 */
	private findCurrentSortedColumn(currentSortedColumn: string, sortableColumns: SortableColumnModel[]) : SortableColumnModel {
		for (let col of sortableColumns) {
			if (col.colName == currentSortedColumn) {
				return col;
			}
		}
	} 

}