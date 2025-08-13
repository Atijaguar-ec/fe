import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TagListComponent } from './tag-list.component';

import { Component } from '@angular/core';

import { Input } from '@angular/core';
@Component({selector: 'fa-icon', template: ''})
class FaIconStubComponent { @Input() icon: any; }

describe('TagListComponent', () => {
  let component: TagListComponent;
  let fixture: ComponentFixture<TagListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TagListComponent, FaIconStubComponent ],
      imports: [BrowserAnimationsModule]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TagListComponent);
    component = fixture.componentInstance;
    // Mock codebookService and formatter before detectChanges
    (component as any).codebookService = {
      formatter: () => ((x: any) => x ? x.toString() : ''),
      hasAutocomplete: () => false,
      canAddNew: () => false
    };
    component.formatter = (x: any) => x ? x.toString() : '';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
