import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { BehaviorSubject, combineLatest, Subscription } from 'rxjs';
import { debounceTime, map, shareReplay, startWith, switchMap, tap, take } from 'rxjs/operators';
import { ProductControllerService } from 'src/api/api/productController.service';
import { ApiPaginatedResponseApiProductListResponse } from 'src/api/model/apiPaginatedResponseApiProductListResponse';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { EnumSifrant } from 'src/app/shared-services/enum-sifrant';
import { AuthService } from 'src/app/core/auth.service';
import { GlobalEventManagerService } from 'src/app/core/global-event-manager.service';
import { NgbModalImproved } from 'src/app/core/ngb-modal-improved/ngb-modal-improved.service';
import {
  CompanyAndValueChainSelectModalComponent
} from '../../company/company-list/company-and-value-chain-select-modal/company-and-value-chain-select-modal.component';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit, OnDestroy {

  faTimes = faTimes;

  searchName = new FormControl(null);
  searchStatus = new FormControl('');
  searchRole = new FormControl('');
  myProducts = new FormControl(true);
  reloadPing$ = new BehaviorSubject<boolean>(false);
  pagingParams$ = new BehaviorSubject({});
  sortingParams$ = new BehaviorSubject({ sortBy: 'name', sort: 'ASC' });
  paging$ = new BehaviorSubject<number>(1);

  page = 0;
  pageSize = 10;

  allProducts = 0;
  showedProducts = 0;

  routerSub: Subscription;

  codebookStatus = EnumSifrant.fromObject(this.statusList);

  searchParams$ = combineLatest(
    this.searchName.valueChanges.pipe(
      startWith(null),
      debounceTime(200)
    ),
    this.searchStatus.valueChanges.pipe(
      startWith(null)
    ),
    this.myProducts.valueChanges.pipe(
      startWith(true),
    ),
    (name: string, status: string, myProducts: boolean) => {
      return { name, status, myProducts };
    }
  );

  products$ = combineLatest(this.reloadPing$, this.paging$, this.searchParams$, this.sortingParams$,
    (ping: boolean, page: number, search: any, sorting: any) => {
      return {
        ...search,
        ...sorting,
        offset: (page - 1) * this.pageSize,
        limit: this.pageSize
      };
    }).pipe(
    tap(() => this.globalEventsManager.showLoading(true)),
    switchMap(params => {
      const myProducts = params.myProducts;
      const newParams = {...params};
      delete newParams['myProducts'];
      if (myProducts) {
        return this.productController.listProductsUsingGETByMap(params);
      } else {
        return this.productController.listProductsAdminUsingGETByMap(params);
      }
    }),
    map((resp: ApiPaginatedResponseApiProductListResponse) => {
      if (resp) {
        if (resp.data && resp.data.count && (this.pageSize - resp.data.count > 0)) { this.showedProducts = resp.data.count; }
        else {
          const temp = resp.data.count - (this.pageSize * (this.page - 1));
          this.showedProducts = temp >= this.pageSize ? this.pageSize : temp;
        }

        return resp.data;
      }
    }),
    tap(() => this.globalEventsManager.showLoading(false)),
    shareReplay(1)
  );

  constructor(
    private productController: ProductControllerService,
    protected globalEventsManager: GlobalEventManagerService,
    private modalService: NgbModalImproved,
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {

    this.routerSub = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd && event.url === '/product-labels') {
        this.reloadPage();
      }
    });
    this.setAllProducts().then();
  }

  ngOnDestroy() {
    if (this.routerSub) { this.routerSub.unsubscribe(); }
  }

  async setAllProducts() {
    if (this.isAdmin) {
      const res = await this.productController.listProductsAdminUsingGET('COUNT').pipe(take(1)).toPromise();
      if (res && res.status === 'OK' && res.data && res.data.count >= 0) {
        this.allProducts = res.data.count;
      }
    } else {
      const res = await this.productController.listProductsUsingGET('COUNT').pipe(take(1)).toPromise();
      if (res && res.status === 'OK' && res.data && res.data.count >= 0) {
        this.allProducts = res.data.count;
      }
    }
  }

  get isAdmin() {
    return this.authService.currentUserProfile && this.authService.currentUserProfile.role === 'ADMIN';
  }

  get statusList() {
    const obj = {};
    obj[''] = $localize`:@@productList.statusList.all:All`;
    obj['ACTIVE'] = $localize`:@@productList.statusList.active:Active`;
    obj['DISABLED'] = $localize`:@@productList.statusList.disabled:Disabled`;
    return obj;
  }

  reloadPage() {
    this.reloadPing$.next(true);
  }

  onPageChange(event) {
    this.paging$.next(event);
  }

  async createProductForCompany() {
    const modalRef = this.modalService.open(CompanyAndValueChainSelectModalComponent, { centered: true });
    Object.assign(modalRef.componentInstance, {
      title: $localize`:@@productList.createProductForCompanyAndValueChain.title:Product Company and Value Chain`,
      companyInstructionsHtml: $localize`:@@productList.createProductForCompanyAndValueChain.companyInstructionsHtml:Select a company for your product:`,
      valueChainInstructionsHtml: $localize`:@@productList.createProductForCompanyAndValueChain.valueChainInstructionsHtml:Select a value chain for your product:`
    });
    const modalResult = await modalRef.result;
    const company = modalResult.company;
    const valueChain =  modalResult.valueChain;

    if (company) {
      this.router.navigate(['product-labels', 'new', company.id, valueChain.id]).then();
    }
  }

  showStatus(status: string) {
    this.searchStatus.setValue(status);
  }

  myProductsOnly(my: boolean) {
    this.myProducts.setValue(my);
  }

  clearValue(form: FormControl, myProducts: boolean = false) {
    if (myProducts) { form.setValue(false); }
    else { form.setValue(''); }
  }

  showPagination() {
    return ((this.showedProducts - this.pageSize) === 0 && this.allProducts >= this.pageSize) || this.page > 1;
  }

}
