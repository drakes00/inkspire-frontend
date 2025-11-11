import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ModelService, Model } from './model.service';

describe('ModelService', () => {
  let service: ModelService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ModelService]
    });
    service = TestBed.inject(ModelService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Make sure that there are no outstanding requests.
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getModels', () => {
    it('should return an Observable<Model[]>', () => {
      const dummyModels: Model[] = [
        { id: 1, name: 'llama3.3:70b' },
        { id: 2, name: 'gemma3:7b' }
      ];
      const token = 'test-token';

      service.getModels(token).subscribe(models => {
        expect(models.length).toBe(2);
        expect(models).toEqual(dummyModels);
      });

      const req = httpMock.expectOne('/api/models');
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
      req.flush(dummyModels);
    });

    it('should handle unauthorized error', () => {
        const token = 'invalid-token';

        service.getModels(token).subscribe({
            next: () => fail('should have failed with 401 error'),
            error: (error) => {
                expect(error.status).toBe(401);
            },
        });

        const req = httpMock.expectOne('/api/models');
        req.flush('Unauthorized', {
            status: 401,
            statusText: 'Unauthorized',
        });
    });
  });
});
