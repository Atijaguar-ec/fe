import { Component, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-accordion',
  templateUrl: './accordion.component.html',
  styleUrls: ['./accordion.component.scss'],
  standalone: false,
})
export class AccordionComponent implements OnInit {
  constructor() {}

  open$ = new BehaviorSubject<number>(null);

  ngOnInit() {}
}
