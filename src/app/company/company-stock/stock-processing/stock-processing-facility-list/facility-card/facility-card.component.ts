import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiFacility } from '../../../../../../api/model/apiFacility';
import { ApiProcessingAction } from '../../../../../../api/model/apiProcessingAction';
import TypeEnum = ApiProcessingAction.TypeEnum;

@Component({
  selector: 'app-facility-card',
  templateUrl: './facility-card.component.html',
  styleUrls: ['./facility-card.component.scss']
})
export class FacilityCardComponent implements OnInit {

  private readonly FACILITY_COLOR_CLASSES: string[] = [
    'af-card-section-content af-card-section-content--red',
    'af-card-section-content af-card-section-content--orange',
    'af-card-section-content af-card-section-content--yellow',
    'af-card-section-content af-card-section-content--green',
    'af-card-section-content af-card-section-content--cyan'
  ];

  description = '';

  menuOptions: { id: any; name: string }[] = [];

  @Input()
  facility!: ApiFacility;

  @Input()
  indexInList!: number;

  @Input()
  companyId!: number;

  @Input()
  actions!: ApiProcessingAction[];

  constructor(
    private router: Router
  ) { }

  ngOnInit(): void {
    this.semiAndFinalProductsIncluded().then();
    this.setMenuOptions();
  }

  whereIsIt(facility: ApiFacility) {

    if (facility.facilityLocation && facility.facilityLocation.address && facility.facilityLocation.address.country) {

      if (facility.facilityLocation.address.country.code === 'RW') {
        return facility.facilityLocation.address.village;
      } else if (facility.facilityLocation.address.country.code === 'HN') {
        return facility.facilityLocation.address.hondurasVillage;
      }
      else {
        return facility.facilityLocation.address.city;
      }
    }
  }

  facilityType() {
    const order = this.getFacilityOrder();

    switch (order) {
      case 1:
        return 'af-card-icon-shape af-card-icon-shape--first';
      case 2:
        return 'af-card-icon-shape af-card-icon-shape--second';
      case 3:
        return 'af-card-icon-shape af-card-icon-shape--third';
      case 4:
        return 'af-card-icon-shape af-card-icon-shape--fourth';
      case 5:
        return 'af-card-icon-shape af-card-icon-shape--fifth';
      case 6:
        return 'af-card-icon-shape af-card-icon-shape--sixth';
      case 7:
        return 'af-card-icon-shape af-card-icon-shape--seventh';
      case 8:
        return 'af-card-icon-shape af-card-icon-shape--eighth';
      case 9:
        return 'af-card-icon-shape af-card-icon-shape--ninth';
      case 10:
        return 'af-card-icon-shape af-card-icon-shape--tenth';
      case 11:
        return 'af-card-icon-shape af-card-icon-shape--eleventh';
      case 12:
        return 'af-card-icon-shape af-card-icon-shape--twelfth';
      case 13:
        return 'af-card-icon-shape af-card-icon-shape--thirteenth';
      case 14:
        return 'af-card-icon-shape af-card-icon-shape--fourteenth';
      case 15:
        return 'af-card-icon-shape af-card-icon-shape--fifteenth';
      case 16:
        return 'af-card-icon-shape af-card-icon-shape--sixteenth';
      case 17:
        return 'af-card-icon-shape af-card-icon-shape--seventeenth';
      case 18:
        return 'af-card-icon-shape af-card-icon-shape--eighteenth';
      case 19:
        return 'af-card-icon-shape af-card-icon-shape--nineteenth';
      case 20:
        return 'af-card-icon-shape af-card-icon-shape--twentieth';
      default:
        return 'af-card-icon-shape af-card-icon-shape--default';
    }
  }

  private getFacilityOrder(): number {
    const order = this.facility?.level || 0;
    if (!order) {
      return 0;
    }
    return order;
  }

  facilityTypeColor() {
    return this.FACILITY_COLOR_CLASSES[(this.indexInList ?? 0) % this.FACILITY_COLOR_CLASSES.length];
  }

  private async semiAndFinalProductsIncluded() {

    const semiProducts = this.facility?.facilitySemiProductList ?? [];
    for (const item of semiProducts) {
      this.description += item.name + ', ';
    }

    const finalProducts = this.facility?.facilityFinalProducts ?? [];
    for (const item of finalProducts) {
      this.description += `${item.name} (${item.product?.name})` + ', ';
    }

    if (this.description.length > 0) {
      this.description = this.description.substring(0, this.description.length - 2);
    }
  }

  private setMenuOptions() {


    console.log('this.actions',this.actions)
    for (const action of this.actions) {

      // Filter-out processing actions of type 'SHIPMENT' (Quote orders)
      if (action.type === TypeEnum.SHIPMENT) {
        continue;
      }

      // If processing action has specified supported facilities check if this facility is specified (if not, skip the processing action)
      if (action.supportedFacilities && action.supportedFacilities.length > 0 && action.supportedFacilities.findIndex(sf => sf.id === this.facility.id) === -1) {
        continue;
      }

      const facilitySemiProd = this.facility?.facilitySemiProductList?.find(fsp => fsp.id === action.inputSemiProduct?.id);
      if (facilitySemiProd) {
        this.menuOptions.push({
          id: action.id,
          name: action.name || ''
        });
      }

      const facilityFinalProd = this.facility?.facilityFinalProducts?.find(ffp => ffp.id === action.inputFinalProduct?.id);
      if (facilityFinalProd) {
        this.menuOptions.push({
          id: action.id,
          name: action.name || ''
        });
      }
    }
  }

  goTo(actionId:any) {
    this.router.navigate(['my-stock', 'processing', actionId, 'facility', this.facility.id, 'new']).then();
  }

}
