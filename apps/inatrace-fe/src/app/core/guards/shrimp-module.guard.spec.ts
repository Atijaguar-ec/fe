import { TestBed } from '@angular/core/testing';
import { ShrimpModuleGuard } from './shrimp-module.guard';
import { environment } from '../../../environments/environment';

describe('ShrimpModuleGuard', () => {
  let guard: ShrimpModuleGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ShrimpModuleGuard],
    });
    guard = TestBed.inject(ShrimpModuleGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow access when environment.enableShrimpModule is true', () => {
    environment.enableShrimpModule = true;
    expect(guard.canMatch()).toBe(true);
  });

  it('should deny access when environment.enableShrimpModule is false', () => {
    environment.enableShrimpModule = false;
    expect(guard.canMatch()).toBe(false);
  });
});
