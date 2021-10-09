import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { CompanyDetailTabManagerComponent } from '../company-detail-tab-manager/company-detail-tab-manager.component';
import { ActivatedRoute, Router } from '@angular/router';
import { FacilityControllerService } from '../../../../api/api/facilityController.service';
import { shareReplay, switchMap, tap } from 'rxjs/operators';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { ApiFacilityLocation } from '../../../../api/model/apiFacilityLocation';
import { GoogleMap, MapInfoWindow, MapMarker } from '@angular/google-maps';
import { GlobalEventManagerService } from '../../../core/global-event-manager.service';
import { ApiPaginatedResponseApiFacility } from '../../../../api/model/apiPaginatedResponseApiFacility';
import { ApiPaginatedListApiFacility } from '../../../../api/model/apiPaginatedListApiFacility';
import { AuthService } from '../../../core/auth.service';

@Component({
  selector: 'app-company-detail-facilities',
  templateUrl: './company-detail-facilities.component.html',
  styleUrls: ['./company-detail-facilities.component.scss']
})
export class CompanyDetailFacilitiesComponent extends CompanyDetailTabManagerComponent implements OnInit, OnDestroy {

  @Input()
  reloadPingList$ = new BehaviorSubject<boolean>(false);

  rootTab = 2;

  title = $localize`:@@companyDetailFacilities.title.edit:Company facilities`;

  allFacilities = 0;
  displayedFacilities = 0;
  pageSize = 10;
  page = 0;

  gMap = null;
  isGoogleMapsLoaded = false;
  markers: any = [];
  defaultCenter = {
    lat: 5.274054,
    lng: 21.514503
  };
  defaultZoom = 3;
  zoomForOnePin = 10;
  bounds: any;
  initialBounds: any = [];
  gInfoWindowText = '';

  public companyId;
  public facilities$: Observable<ApiPaginatedResponseApiFacility>;

  sortingParams$ = new BehaviorSubject({ sortBy: 'name', sort: 'ASC' });
  paging$ = new BehaviorSubject<number>(1);

  @Output()
  showing = new EventEmitter<number>();

  @Output()
  countAll = new EventEmitter<number>();

  @ViewChild(GoogleMap) set map(map: GoogleMap) {
    if (map) { this.gMap = map; this.fitBounds(); }
  }

  @ViewChild(MapInfoWindow, { static: false }) gInfoWindow: MapInfoWindow;

  sortOptions = [
    {
      key: 'name',
      name: $localize`:@@productLabelFacilities.sortOptions.name.name:Name`,
      defaultSortOrder: 'ASC'
    },
    {
      key: 'type',
      name: $localize`:@@productLabelFacilities.sortOptions.type.name:Facility type`,
      inactive: true
    },
    {
      key: 'sellabaleSemiProducts',
      name: $localize`:@@productLabelFacilities.sortOptions.sellabaleSemiProducts.name:Sellable semi-products`,
      inactive: true
    },
    {
      key: 'location',
      name: $localize`:@@productLabelFacilities.sortOptions.location.name:Location`,
      inactive: true
    },
    {
      key: 'actions',
      name: $localize`:@@productLabelFacilities.sortOptions.actions.name:Actions`,
      inactive: true
    }
  ];

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected facilityControllerService: FacilityControllerService,
    protected globalEventsManager: GlobalEventManagerService,
    protected authService: AuthService
  ) {
    super(router, route, authService);
  }

  ngOnInit(): void {
    super.ngOnInit();
    this.companyId = this.route.snapshot.params.id;
    this.initializeFacilitiesObservable();

    this.globalEventsManager.areGoogleMapsLoadedEmmiter.subscribe(loaded => {
      if (loaded) {
        this.isGoogleMapsLoaded = true;
      }
    });
  }

  ngOnDestroy() {
    super.ngOnDestroy();
  }

  loadEntityList(params: any) {
    return this.facilityControllerService.listFacilitiesByCompanyUsingGETByMap({ id: this.companyId });
  }

  canDeactivate(): boolean {
    return true;
  }

  newFacility() {
    this.router.navigate(['companies', this.cId, 'facilities', 'add']);
  }

  changeSort(event) {
    this.sortingParams$.next({ sortBy: event.key, sort: event.sortOrder });
  }
  
  publicSort(p: boolean) {
    return p ? '✓' : null;
  }

  locationName(location: ApiFacilityLocation) {
    if (location.address.cell != null && location.address.country) { return location.address.cell + ', ' + location.address.country.name; }
    if (location.address.city != null && location.address.country) { return location.address.city + ', ' + location.address.country.name; }
    if (location.address.country != null) { location.address.country.name; }
    return '';
  }

  showPagination() {
    return ((this.displayedFacilities - this.pageSize) === 0 && this.allFacilities >= this.pageSize) || this.page > 1;
  }

  onPageChange(event) {
    this.paging$.next(event);
  }

  openInfoWindow(gMarker: MapMarker, marker) {
    this.gInfoWindowText = marker.infoText;
    this.gInfoWindow.open(gMarker);
  }

  fitBounds() {
    if (!this.gMap || this.gMap == null) { return; }
    this.bounds = new google.maps.LatLngBounds();
    for (let bound of this.initialBounds) {
      this.bounds.extend(bound);
    }
    if (this.bounds.isEmpty()) {
      this.gMap.googleMap.setCenter(this.defaultCenter);
      this.gMap.googleMap.setZoom(this.defaultZoom);
      return;
    }
    let center = this.bounds.getCenter();
    let offset = 0.02;
    let northEast = new google.maps.LatLng(
        center.lat() + offset,
        center.lng() + offset
    );
    let southWest = new google.maps.LatLng(
        center.lat() - offset,
        center.lng() - offset
    );
    let minBounds = new google.maps.LatLngBounds(southWest, northEast);
    this.gMap.fitBounds(this.bounds.union(minBounds));
  }

  initializeFacilitiesObservable() {
    this.facilities$ = combineLatest(this.reloadPingList$, this.paging$, this.sortingParams$,
        (ping: boolean, page: number, sorting: any) => {
          return {
            ...sorting,
            offset: (page - 1) * this.pageSize,
            limit: this.pageSize
          };
        }).pipe(
        tap(val => this.globalEventsManager.showLoading(true)),
        switchMap(params => {
          return this.loadEntityList(params);
        }),
        tap((resp: ApiPaginatedResponseApiFacility) => {
          if (resp) {
            this.intializeMarkers(resp.data);
            this.displayedFacilities = 0;
            if (resp.data && resp.data.count && (this.pageSize - resp.data.count > 0)) { this.displayedFacilities = resp.data.count; }
            else if (resp.data && resp.data.count && (this.pageSize - resp.data.count <= 0)) {
              let temp = resp.data.count - (this.pageSize * (this.page - 1));
              this.displayedFacilities = temp >= this.pageSize ? this.pageSize : temp;
            }
            this.showing.emit(this.displayedFacilities);
            return resp.data.items;
          } else {
            return null;
          }
        }),
        tap(val => {
          if (val) {
            this.allFacilities = val.data.count;
            this.countAll.emit(this.allFacilities);
          } else {
            this.allFacilities = 0;
            this.countAll.emit(0);
          }
        }),
        tap(val => this.globalEventsManager.showLoading(false)),
        shareReplay(1)
    );
  }

  intializeMarkers(data: ApiPaginatedListApiFacility) {
    if (!data) return;
    this.markers = [];
    this.initialBounds = [];
    for (const item of data.items) {
      if (item.facilityLocation && item.facilityLocation.publiclyVisible && item.facilityLocation.latitude && item.facilityLocation.longitude) {
        let tmp = {
          position: {
            lat: item.facilityLocation.latitude,
            lng: item.facilityLocation.longitude
          },
          infoText: item.name
        }
        this.markers.push(tmp);
        this.initialBounds.push(tmp.position);
      }
    }
    this.fitBounds();
  }

}
