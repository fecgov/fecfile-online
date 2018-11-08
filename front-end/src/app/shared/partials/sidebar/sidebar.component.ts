import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {

  @Output() status: EventEmitter<any> = new EventEmitter<any>();

  public iconClass: string = 'bars-icon';

  constructor(
    private _router: Router,
    private _activatedRoute: ActivatedRoute 
  ) { }

  ngOnInit(): void {    
    this._router
      .events
      .subscribe(val => {
        if(val) {
          if(val instanceof NavigationEnd) {
            if(val.url.indexOf('/forms/form/') === 0) {
              this.iconClass = 'bars-icon';
              
              this.status.emit({
                showSidebar: false
              });             
            } 

            if (val.url.indexOf('/dashboard') === 0) {
              this.iconClass = 'close-icon';

              this.status.emit({
                showSidebar: true
              });               
            }
          }
        }
      });  
  }

  /**
   * Toggles the sidebar.
   *
   */
  public toggleSideNav(): void {
    if(this.iconClass === 'close-icon') {
      this.iconClass = 'bars-icon';

      this.status.emit({
        showSidebar: false
      });       
    } else {
      this.iconClass = 'close-icon';

      this.status.emit({
        showSidebar: true
      });       
    } 	
  }
}
