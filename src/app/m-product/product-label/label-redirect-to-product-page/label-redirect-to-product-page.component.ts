import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-label-redirect-to-product-page',
  templateUrl: './label-redirect-to-product-page.component.html',
  styleUrls: ['./label-redirect-to-product-page.component.scss']
})
export class LabelRedirectToProductPageComponent implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    const labelId = +this.route.snapshot.paramMap.get('labelId');
    const productId = this.route.snapshot.paramMap.get('id');
    this.router.navigate(['/product-labels', productId], { state: { labelId } });
  }

}
