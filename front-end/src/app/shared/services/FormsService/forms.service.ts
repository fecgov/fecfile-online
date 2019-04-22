import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, identity } from 'rxjs';
import { map } from 'rxjs/operators';
import { CookieService } from 'ngx-cookie-service';
import { form99, form3XReport, form99PrintPreviewResponse, reportModel} from '../../interfaces/FormsService/FormsService';
import { environment } from '../../../../environments/environment';
import { OrderByPipe } from 'src/app/shared/pipes/order-by/order-by.pipe';
export interface GetReportsResponse {
  reports: reportModel[];
}

@Injectable({
  providedIn: 'root'
})

export class FormsService {

  private _orderByPipe: OrderByPipe;
  
  constructor(
    private _http: HttpClient,
    private _cookieService: CookieService
  ) { 
    this._orderByPipe = new OrderByPipe();
  }

  /**
   * TODO:  This file is going to be removed soon
   * in favor of individual services for each form.
   * Please stop adding things for forms to this file now.
   */



 /**
   * Gets the form.
   *
   * @param      {String}   committee_id  The committee identifier.
   * @param      {boolean}  is_submitted  Indicates if submitted.
   * @param      {String}   form_type     The form type.
   *
   * @return     {Observable} The form being retreived.
   */
  public getForm(committee_id: string, is_submitted: boolean, form_type: string): Observable<any> {
    let token: string = JSON.parse(this._cookieService.get('user'));
    let httpOptions =  new HttpHeaders();
    let params = new HttpParams();
    let url: string = '';

    if(form_type === '99') {
      url = '/f99/fetch_f99_info';
    }

    httpOptions = httpOptions.append('Content-Type', 'application/json');
    httpOptions = httpOptions.append('Authorization', 'JWT ' + token);

    params = params.append('committeeid', committee_id);
    params = params.append('is_submitted', is_submitted.toString());

    return this._http
     .get(
        `${environment.apiUrl}${url}`,
        {
          headers: httpOptions,
          params
        }
      );
  }

  /**
   * Validates a form
   *
   * @param      {Object}  formObj    The form object.
   * @param      {String}  form_type  The form type.
   *
   * @return     {Observable}  The validation results of the form.
   */
  public validateForm(formObj: any, form_type: string): Observable<any> {
    let token: string = JSON.parse(this._cookieService.get('user'));
    let httpOptions =  new HttpHeaders();
    let url: string = '';
    let data: any = {};




    if(form_type === '99') {
      let form99_details: form99 = JSON.parse(localStorage.getItem('form_99_details'));

      url = '/f99/validate_f99';

      data = form99_details;

      data.text = data.text.replace(/<[^>]*>/g, '');

      data.text = data.text.replace(/(&nbsp;)/g, ' ');
    }

    httpOptions = httpOptions.append('Content-Type', 'application/json');
    httpOptions = httpOptions.append('Authorization', 'JWT ' + token);


    return this._http
      .post<form99>(
        `${environment.apiUrl}${url}`,
        data,
        {
          headers: httpOptions
        }
      )
      .pipe(map(res => {
          if (res) {
            return true;
          }
          return false;
      }));

  }


  public saveForm(formObj: any, file: any, form_type: string): Observable<any> {
    let form_99_details_res: any ={};
    let form_99_details_res_tmp: form99;

    let token: string = JSON.parse(this._cookieService.get('user'));
    let data: any = {};
    let formData: FormData = new FormData();
    let httpOptions =  new HttpHeaders();
    let url: string = '/f99/create_f99_info';
    let id:string;
    let org_filename="";
    let org_fileurl="";
    let fileuploaded:boolean=false;

    httpOptions = httpOptions.append('enctype', 'multipart/form-data');
    httpOptions = httpOptions.append('Authorization', 'JWT ' + token);

    if(form_type === '99') {

      let form99_details: form99 = JSON.parse(localStorage.getItem(`form_${form_type}_details`));

      if(file && file.name) {
        fileuploaded=true;
        localStorage.setItem('form_99_details.file', file);
        formData.append('file', file, file.name);
        formData.append('committeeid', form99_details.committeeid);
        formData.append('committeename', form99_details.committeename);
        formData.append('street1', form99_details.street1);
        formData.append('street2', form99_details.street2);
        formData.append('city', form99_details.city);
        formData.append('state', form99_details.state);
        formData.append('zipcode', form99_details.zipcode);
        formData.append('treasurerprefix', form99_details.treasurerprefix);
        formData.append('treasurerfirstname', form99_details.treasurerfirstname);
        formData.append('treasurermiddlename', form99_details.treasurermiddlename);
        formData.append('treasurerlastname', form99_details.treasurerlastname);
        formData.append('treasurersuffix', form99_details.treasurersuffix);
        formData.append('reason', form99_details.reason);
        formData.append('text', form99_details.text);
        formData.append('signee', form99_details.signee);
        formData.append('email_on_file', form99_details.email_on_file);
        formData.append('email_on_file_1', form99_details.email_on_file_1);
        formData.append('additional_email_1', form99_details.additional_email_1);
        formData.append('additional_email_2', form99_details.additional_email_2);
        formData.append('created_at', form99_details.created_at);
        formData.append('is_submitted', "False");
        formData.append('filename', form99_details.filename);
        formData.append('form_type', "F99");
        if (form99_details.id ==='' || form99_details.id ==="" || form99_details.id===null){
          /*data['id']="0";*/
          formData.append('id', "0");
        }
        else
        {
          formData.append('id', form99_details.id.toString());
        }
      }
      else
      {

        fileuploaded=false;
        /*form99_details.is_submitted=false;
        formData.append('file', form99_details.file);  */

        if (form99_details.filename!= null || form99_details.filename!= '' || form99_details.filename != "" || form99_details.filename != undefined){
          formData.append('filename', form99_details.filename);
        }

        formData.append('committeeid', form99_details.committeeid);
        formData.append('committeename', form99_details.committeename);
        formData.append('street1', form99_details.street1);
        formData.append('street2', form99_details.street2);
        formData.append('city', form99_details.city);
        formData.append('state', form99_details.state);
        formData.append('zipcode', form99_details.zipcode);
        formData.append('treasurerprefix', form99_details.treasurerprefix);
        formData.append('treasurerfirstname', form99_details.treasurerfirstname);
        formData.append('treasurermiddlename', form99_details.treasurermiddlename);
        formData.append('treasurerlastname', form99_details.treasurerlastname);
        formData.append('treasurersuffix', form99_details.treasurersuffix);
        formData.append('reason', form99_details.reason);
        formData.append('text', form99_details.text);
        formData.append('signee', form99_details.signee);
        formData.append('email_on_file', form99_details.email_on_file);
        formData.append('email_on_file_1', form99_details.email_on_file_1);
        formData.append('additional_email_1', form99_details.additional_email_1);
        formData.append('additional_email_2', form99_details.additional_email_2);
        formData.append('created_at', form99_details.created_at);
        formData.append('is_submitted', "False");
        /*formData.append('filename', form99_details.filename);*/
        formData.append('form_type', "F99");
        if (form99_details.id ==='' || form99_details.id ==="" || form99_details.id===null){

          /*data['id']="0";*/
          formData.append('id', "0");
        } else
        {
          formData.append('id', form99_details.id.toString());
        }

      }

      data=formData;
    }

   new Response(data).text().then(console.log)

    return this._http
      .post(
        `${environment.apiUrl}${url}`,
        data,
        {
          headers: httpOptions
        }
      )

      .pipe(map(res => {
          if (res) {
            localStorage.setItem('form_99_details_res', JSON.stringify(res));
            let form99_details_res: form99 = JSON.parse(localStorage.getItem(`form_99_details_res`));
            id=form99_details_res.id.toString();

            org_filename=form99_details_res.filename;
            org_fileurl=form99_details_res.file;
            /*form_99_details_res_tmp.id=form_99_details_res.id; //just to get form 99 id
            localStorage.setItem('id', form_99_details_res_tmp.id);*/

            localStorage.setItem('form_99_details.id', id);
            localStorage.setItem('form_99_details.org_filename', org_filename);
            localStorage.setItem('form_99_details.org_fileurl', org_fileurl);
            console.log ('org_filename',org_filename);
            console.log ('org_fileurl',org_fileurl);

            if (fileuploaded)
            {
              org_filename=form99_details_res.filename;
              org_fileurl=form99_details_res.file;
              /*form_99_details_res_tmp.id=form_99_details_res.id; //just to get form 99 id
              localStorage.setItem('id', form_99_details_res_tmp.id);*/
              localStorage.setItem('orm_99_details.org_filename', org_filename);
              localStorage.setItem('orm_99_details.org_fileurl', org_fileurl);
              console.log ('org_filename on Reason screen',org_filename);
              console.log ('org_fileurl on Reason screen',org_fileurl);
            }

            return res;
          }
          return false;
      }));
}


  /**
   * Submits a form.
   *
   * @param      {Object}  formObj    The form object.
   * @param      {String}  form_type  The form type.
   *
   * @return     {Observable}  The result of submitting a form.
   */
  public submitForm(formObj: any, form_type): Observable<any> {
    let token: string = JSON.parse(this._cookieService.get('user'));
    let data: any = {};
    let httpOptions =  new HttpHeaders();
    let url: string = '';

    httpOptions = httpOptions.append('Content-Type', 'application/json');
    httpOptions = httpOptions.append('Authorization', 'JWT ' + token);

    if(form_type === '99') {
      let form99_details: form99 = JSON.parse(localStorage.getItem('form_99_details'));

      url = '/f99/submit_comm_info';
      data = form99_details;

       data['form_type'] = 'F99';
    }
    return this._http
      .post(
        `${environment.apiUrl}${url}`,
        data,
        {
          headers: httpOptions
        }
      )
      .pipe(map(res => {
          if (res) {
            localStorage.removeItem('form_99_details');
            localStorage.removeItem('form_99_details_res');
            return true;
          }
          return false;
      }));
  }

  public Signee_SaveForm(formObj: any, form_type): Observable<any> {
    let token: string = JSON.parse(this._cookieService.get('user'));
    let data: any = {};
    let httpOptions =  new HttpHeaders();
    let url: string = '';

    httpOptions = httpOptions.append('Content-Type', 'application/json');
    httpOptions = httpOptions.append('Authorization', 'JWT ' + token);

    if(form_type === '99') {
      let form99_details: form99 = JSON.parse(localStorage.getItem('form_99_details'));

      url = '/f99/update_f99_info';
      data = form99_details;

       data['form_type'] = 'F99';

       console.log('Signee_SaveForm form99_details',form99_details);
       console.log('Signee_SaveForm Data',data);
    }
    return this._http
      .post(
        `${environment.apiUrl}${url}`,
        data,
        {
          headers: httpOptions
        }
      )
      .pipe(map(res => {
          if (res) {
            return true;
          }
          return false;
      }));
  }

  public PreviewForm_ReasonScreen(formObj: any, file: any, form_type: string): Observable<any> {
    let form_99_details_res: any ={};
    let form_99_details_res_tmp: form99;

    let token: string = JSON.parse(this._cookieService.get('user'));
    let data: any = {};
    let formData: FormData = new FormData();
    let httpOptions =  new HttpHeaders();
    let url: string = '/f99/save_print_f99';
    let id:string;
    let org_filename="";
    let org_fileurl="";
    let fileuploaded:boolean=false;
    let printpriview_filename = "";
    let printpriview_fileurl = "";

    console.log("PreviewForm_ReasonScreen start...")

    httpOptions = httpOptions.append('enctype', 'multipart/form-data');
    httpOptions = httpOptions.append('Authorization', 'JWT ' + token);

    console.log("httpOptions", httpOptions);

    if(form_type === '99') {

      let form99_details: form99 = JSON.parse(localStorage.getItem(`form_${form_type}_details`));

      if(file && file.name) {
        fileuploaded=true;
        localStorage.setItem('form_99_details.file', file);
        formData.append('file', file, file.name);
        formData.append('committeeid', form99_details.committeeid);
        formData.append('committeename', form99_details.committeename);
        formData.append('street1', form99_details.street1);
        formData.append('street2', form99_details.street2);
        formData.append('city', form99_details.city);
        formData.append('state', form99_details.state);
        formData.append('zipcode', form99_details.zipcode);
        formData.append('treasurerprefix', form99_details.treasurerprefix);
        formData.append('treasurerfirstname', form99_details.treasurerfirstname);
        formData.append('treasurermiddlename', form99_details.treasurermiddlename);
        formData.append('treasurerlastname', form99_details.treasurerlastname);
        formData.append('treasurersuffix', form99_details.treasurersuffix);
        formData.append('reason', form99_details.reason);
        formData.append('text', form99_details.text);
        formData.append('signee', form99_details.signee);
        formData.append('email_on_file', form99_details.email_on_file);
        formData.append('email_on_file_1', form99_details.email_on_file_1);
        formData.append('additional_email_1', form99_details.additional_email_1);
        formData.append('additional_email_2', form99_details.additional_email_2);
        formData.append('created_at', form99_details.created_at);
        formData.append('is_submitted', "False");
        formData.append('filename', form99_details.filename);
        formData.append('form_type', "F99");
        if (form99_details.id ==='' || form99_details.id ==="" || form99_details.id===null){
          /*data['id']="0";*/
          formData.append('id', "0");
        }
        else
        {
          formData.append('id', form99_details.id.toString());
        }
      }
      else
      {

        fileuploaded=false;
        /*form99_details.is_submitted=false;
        formData.append('file', form99_details.file);  */

        if (form99_details.filename!= null || form99_details.filename!= '' || form99_details.filename != "" || form99_details.filename != undefined){
          formData.append('filename', form99_details.filename);
        }

        formData.append('committeeid', form99_details.committeeid);
        formData.append('committeename', form99_details.committeename);
        formData.append('street1', form99_details.street1);
        formData.append('street2', form99_details.street2);
        formData.append('city', form99_details.city);
        formData.append('state', form99_details.state);
        formData.append('zipcode', form99_details.zipcode);
        formData.append('treasurerprefix', form99_details.treasurerprefix);
        formData.append('treasurerfirstname', form99_details.treasurerfirstname);
        formData.append('treasurermiddlename', form99_details.treasurermiddlename);
        formData.append('treasurerlastname', form99_details.treasurerlastname);
        formData.append('treasurersuffix', form99_details.treasurersuffix);
        formData.append('reason', form99_details.reason);
        formData.append('text', form99_details.text);
        formData.append('signee', form99_details.signee);
        formData.append('email_on_file', form99_details.email_on_file);
        formData.append('email_on_file_1', form99_details.email_on_file_1);
        formData.append('additional_email_1', form99_details.additional_email_1);
        formData.append('additional_email_2', form99_details.additional_email_2);
        formData.append('created_at', form99_details.created_at);
        formData.append('is_submitted', "False");
        /*formData.append('filename', form99_details.filename);*/
        formData.append('form_type', "F99");
        if (form99_details.id ==='' || form99_details.id ==="" || form99_details.id===null){

          /*data['id']="0";*/
          formData.append('id', "0");
        }
        else
        {
          formData.append('id', form99_details.id.toString());
        }

      }

      data=formData;


    }

    console.log ('PreviewForm_ReasonScreen Data: ',data);
    console.log ("${environment.apiUrl}${url}=", `${environment.apiUrl}${url}`)
    //new Response(data).text().then(console.log)

    return this._http
      .post(
        `${environment.apiUrl}${url}`,
        data,
        {
          headers: httpOptions
        }
      )
      .pipe(map(res => {
          if (res) {
            localStorage.setItem('form99PrintPreviewResponse', JSON.stringify(res));
            let form99PrintPreviewResponse: form99PrintPreviewResponse = JSON.parse(localStorage.getItem(`form99PrintPreviewResponse`));
            printpriview_fileurl = form99PrintPreviewResponse.results.pdf_url;

            localStorage.setItem('form_99_details.printpriview_fileurl', printpriview_fileurl);

            console.log ('PreviewForm_ReasonScreen api Repsonse',res);
            console.log ('PreviewForm_ReasonScreen printpriview_fileurl',printpriview_fileurl);

            return res;
          }
          return false;
      }));
  }
  public PreviewForm_Preview_sign_Screen(formObj: any, form_type): Observable<any> {
    let token: string = JSON.parse(this._cookieService.get('user'));
    let data: any = {};
    let httpOptions =  new HttpHeaders();
    let url: string = '';
    let id:string;
    let printpriview_filename = "";
    let printpriview_fileurl = "";
    let org_filename="";
    let org_fileurl="";

    httpOptions = httpOptions.append('Content-Type', 'application/json');
    httpOptions = httpOptions.append('Authorization', 'JWT ' + token);

    if(form_type === '99') {
      let form99_details: form99 = JSON.parse(localStorage.getItem('form_99_details'));

      url = '/f99/update_print_f99';
      data = form99_details;

       data['form_type'] = 'F99';

       console.log('PreviewForm_Preview_Screen form99_details',form99_details);
       console.log('PreviewForm_Preview_Screen Data',data);
    }
    return this._http
      .post(
        `${environment.apiUrl}${url}`,
        data,
        {
          headers: httpOptions
        }
      )
      .pipe(map(res => {
          if (res) {

            localStorage.setItem('form99PrintPreviewResponse', JSON.stringify(res));
            let form99PrintPreviewResponse: form99PrintPreviewResponse = JSON.parse(localStorage.getItem(`form99PrintPreviewResponse`));
            printpriview_fileurl = form99PrintPreviewResponse.results.pdf_url;

            localStorage.setItem('form_99_details.printpriview_fileurl', printpriview_fileurl);

            console.log ('PreviewForm_ReasonScreen api Repsonse',res);
            console.log ('PreviewForm_ReasonScreen printpriview_fileurl',printpriview_fileurl);

            return res;
          }
          return false;
      }));
  }

  public get_filed_form_types(): Observable<any> {
    let token: string = JSON.parse(this._cookieService.get('user'));
    let httpOptions =  new HttpHeaders();
    let url: string = '';

    url = '/core/get_filed_form_types';

    httpOptions = httpOptions.append('Content-Type', 'application/json');
    httpOptions = httpOptions.append('Authorization', 'JWT ' + token);

    return this._http
     .get(
        `${environment.apiUrl}${url}`,
        {
          headers: httpOptions
        }
      );
  }

 public formHasUnsavedData(formType: string): boolean {
    let formSaved: any = JSON.parse(localStorage.getItem(`form_${formType}_saved`));

    if(formSaved !== null) {
      let formStatus: boolean = formSaved.saved;

      if(!formStatus) {
        return true;
      }
    }

    return false;
 }

  public saveReport(form_type: string, access_type: string): Observable<any> {
  let token: string = JSON.parse(this._cookieService.get('user'));
  let httpOptions =  new HttpHeaders();
  let url: string = '/core/reports';

  let params = new HttpParams();
  let formData: FormData = new FormData();

  //httpOptions = httpOptions.append('Content-Type', 'application/json');
  httpOptions = httpOptions.append('Authorization', 'JWT ' + token);
  console.log("${environment.apiUrl}${url}", `${environment.apiUrl}${url}`);

  let formF3X_ReportInfo: form3XReport = JSON.parse(localStorage.getItem(`form_${form_type}_ReportInfo`));
  
  console.log(" saveReport formF3X_ReportInfo ",formF3X_ReportInfo );


  formData.append('report_id', formF3X_ReportInfo.reportId);
  formData.append('form_type', `F${formF3X_ReportInfo.formType}`);
  if (formF3X_ReportInfo.amend_Indicator===null || formF3X_ReportInfo.amend_Indicator===''){
    formData.append('amend_ind', 'N');
  }
  else
  {
    formData.append('amend_ind', formF3X_ReportInfo.amend_Indicator);
  }
  
  formData.append('report_type', formF3X_ReportInfo.reportType);
  formData.append('election_code', formF3X_ReportInfo.electionCode);
  formData.append('date_of_election', formF3X_ReportInfo.electionDate);
  formData.append('state_of_election', formF3X_ReportInfo.stateOfElection);
  formData.append('cvg_start_dt', formF3X_ReportInfo.cvgStartDate);
  formData.append('cvg_end_dt', formF3X_ReportInfo.cvgEndDate);
  formData.append('coh_bop', formF3X_ReportInfo.coh_bop);

  if (access_type==='Saved'){
    formData.append('status', 'Saved');
  }
  else if (access_type==='Submitted'){
    formData.append('status', 'Submitted');
  }

  console.log("form 3X saveReport formData",formData);

  return this._http
      .post(
        `${environment.apiUrl}${url}`,
        formData,
        {
          headers: httpOptions
        }
      )
      .pipe(map(res => {
          if (res) {
            localStorage.setItem('`form_${form_type}_ReportInfo_Res', JSON.stringify(res));
            let form3XReportInfoRes: form3XReport = JSON.parse(localStorage.getItem(`form_${form_type}_ReportInfo_Res`));
            return res;
          }
          return false;
      }));
 }


 public removeFormDashBoard(formType: string): void {
   if (formType === "3X") {
      console.log ("FormsService removeFormDashBoard")
      localStorage.removeItem('form3XReportInfo.showDashBoard');
      localStorage.removeItem('form3XReportInfo.DashBoardLine1');
      localStorage.removeItem('form3XReportInfo.DashBoardLine2');
   }
 }

  
  public getReports(view: string, page: number, itemsPerPage: number,
    sortColumnName: string, descending: boolean, reportId: number): Observable<any> {
  const token: string = JSON.parse(this._cookieService.get('user'));
  let httpOptions =  new HttpHeaders();
  let params = new HttpParams();
  
  const url ='/f99/get_form99list';   

  httpOptions = httpOptions.append('Content-Type', 'application/json');
  httpOptions = httpOptions.append('Authorization', 'JWT ' + token);
  
  params = params.append('view', view);
  params = params.append('reportId', reportId.toString());
  console.log("reportId =", reportId.toString());

  console.log("${environment.apiUrl}${url}", `${environment.apiUrl}${url}`);
  console.log("httpOptions",httpOptions)
  console.log("params",params);
  
  return this._http
  .get(
      `${environment.apiUrl}${url}`,
      {
        headers: httpOptions,
        params 
      }
    );
  
  
    }
  
  /**
   * Map server fields from the response to the model.
   */
  public mapFromServerFields(serverData: any, modelArray: reportModel[]) {

    if (!serverData || !Array.isArray(serverData)) {
      console.log(" no server data mapFromServerFields  modelArray", modelArray);
      return;
    }
    if (!modelArray) {
      modelArray = [];
    }

    for (const row of serverData) {
      const model = new reportModel({});
      model.form_type = row.form_type;
      model.status = row.status;
      model.fec_id = row.fec_id;
      model.amend_ind = row.amend_ind;
      model.cvg_start_date = row.cvg_start_date;
      model.cvg_end_date = row.cvg_end_date;
      model.last_update_date = row.last_update_date;
      model.report_type_desc = row.report_type_desc;
      model.filed_date = row.filed_date;
      modelArray.push(model);
    }
    console.log(" mapFromServerFields  modelArray", modelArray);
    return modelArray;
  }

  /**
   *
   * @param array
   * @param sortColumnName
   * @param descending
   */
  public sortReports(array: any, sortColumnName: string, descending: boolean) {

    console.log("sortTransactions array =", array);
    console.log("sortTransactions sortColumnName =", sortColumnName);
    console.log("sortTransactions descending =", descending);
    const direction = descending ? -1 : 1;
    this._orderByPipe.transform(array, {property: sortColumnName, direction: direction});
    console.log("sortTransactions array= ", array);
    return array;
      
  }

public getTransactionCategories( form_type: string): Observable<any> {
    let token: string = JSON.parse(this._cookieService.get('user'));
    let httpOptions =  new HttpHeaders();
    let url: string = '';
    let params = new HttpParams();


    //url = '/f3x/get_transaction_categories?form_type=F3X';
    url = '/core/get_transaction_categories?form_type=F3X';

    httpOptions = httpOptions.append('Content-Type', 'application/json');
    httpOptions = httpOptions.append('Authorization', 'JWT ' + token);
    console.log("${environment.apiUrl}${url}", `${environment.apiUrl}${url}`);

    params = params.append('form_type', "F3X");

    return this._http
       .get(
          `${environment.apiUrl}${url}`,
          {
           /* headers: httpOptions,
            params*/
            headers: httpOptions/*  */
          }
       );
  }
}