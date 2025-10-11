import { TestBed } from '@angular/core/testing';
import {
    HttpClientTestingModule,
    HttpTestingController,
} from '@angular/common/http/testing';
import { FilesManagerService } from './files-manager.service';

describe('FilesManagerService', () => {
    let service: FilesManagerService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [FilesManagerService],
        });

        service = TestBed.inject(FilesManagerService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        // Vérifie qu'il n'y a pas de requêtes HTTP en attente
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('getTree', () => {
        it('should send GET request with correct URL and headers', () => {
            const token = 'test-token-123';
            const mockResponse = {
                dirs: { '1': { name: 'DirA' } },
                files: { '2': { name: 'FileRoot' } },
            };

            // Souscription à l'observable
            service.getTree(token).subscribe((response) => {
                // Vérifie que la réponse est une string JSON
                expect(response).toBe(JSON.stringify(mockResponse));

                // Vérifie le contenu parsé
                const parsed = JSON.parse(response);
                expect(parsed.dirs['1'].name).toBe('DirA');
                expect(parsed.files['2'].name).toBe('FileRoot');
            });

            // Intercepte la requête HTTP
            const req = httpMock.expectOne('/api/tree');

            // Vérifie la méthode HTTP
            expect(req.request.method).toBe('GET');

            // Vérifie les headers
            expect(req.request.headers.get('Authorization')).toBe(
                'Bearer test-token-123',
            );
            expect(req.request.headers.get('Accept')).toBe('application/json');

            // Simule la réponse du serveur
            req.flush(mockResponse);
        });

        it('should handle empty response', () => {
            const token = 'test-token';
            const mockResponse = { dirs: {}, files: {} };

            service.getTree(token).subscribe((response) => {
                const parsed = JSON.parse(response);
                expect(parsed.dirs).toEqual({});
                expect(parsed.files).toEqual({});
            });

            const req = httpMock.expectOne('/api/tree');
            req.flush(mockResponse);
        });

        it('should handle HTTP error', () => {
            const token = 'test-token';
            const errorMessage = 'Network error';

            service.getTree(token).subscribe({
                next: () => fail('should have failed with 500 error'),
                error: (error) => {
                    expect(error.status).toBe(500);
                    expect(error.statusText).toBe('Server Error');
                },
            });

            const req = httpMock.expectOne('/api/tree');
            req.flush(errorMessage, {
                status: 500,
                statusText: 'Server Error',
            });
        });

        it('should handle unauthorized error', () => {
            const token = 'invalid-token';

            service.getTree(token).subscribe({
                next: () => fail('should have failed with 401 error'),
                error: (error) => {
                    expect(error.status).toBe(401);
                },
            });

            const req = httpMock.expectOne('/api/tree');
            req.flush('Unauthorized', {
                status: 401,
                statusText: 'Unauthorized',
            });
        });
    });

    describe('getDirContent', () => {
        it('should send GET request with correct URL and headers', () => {
            const dirId = 5;
            const token = 'test-token-456';
            const mockResponse = {
                files: {
                    '10': { name: 'file1.txt' },
                    '11': { name: 'file2.txt' },
                },
            };

            service.getDirContent(dirId, token).subscribe((response) => {
                expect(response).toBe(JSON.stringify(mockResponse));

                const parsed = JSON.parse(response);
                expect(parsed.files['10'].name).toBe('file1.txt');
                expect(parsed.files['11'].name).toBe('file2.txt');
            });

            // Vérifie que l'URL contient bien l'ID du répertoire
            const req = httpMock.expectOne('/api/dir/5');

            expect(req.request.method).toBe('GET');
            expect(req.request.headers.get('Authorization')).toBe(
                'Bearer test-token-456',
            );
            expect(req.request.headers.get('Accept')).toBe('application/json');

            req.flush(mockResponse);
        });

        it('should handle directory with no files', () => {
            const dirId = 3;
            const token = 'test-token';
            const mockResponse = { files: {} };

            service.getDirContent(dirId, token).subscribe((response) => {
                const parsed = JSON.parse(response);
                expect(parsed.files).toEqual({});
            });

            const req = httpMock.expectOne('/api/dir/3');
            req.flush(mockResponse);
        });

        it('should construct correct URLs for different directory IDs', () => {
            const token = 'test-token';
            const testCases = [
                { id: 1, expectedUrl: '/api/dir/1' },
                { id: 42, expectedUrl: '/api/dir/42' },
                { id: 999, expectedUrl: '/api/dir/999' },
            ];

            testCases.forEach(({ id, expectedUrl }) => {
                service.getDirContent(id, token).subscribe((response) => {
                    expect(response).toBeDefined();
                });

                const req = httpMock.expectOne(expectedUrl);
                expect(req.request.method).toBe('GET');
                expect(req.request.headers.get('Authorization')).toBe(
                    'Bearer test-token',
                );

                req.flush({ files: {} });
            });
        });

        it('should handle HTTP error', () => {
            const dirId = 999;
            const token = 'test-token';

            service.getDirContent(dirId, token).subscribe({
                next: () => fail('should have failed with 404 error'),
                error: (error) => {
                    expect(error.status).toBe(404);
                    expect(error.statusText).toBe('Not Found');
                },
            });

            const req = httpMock.expectOne('/api/dir/999');
            expect(req.request.method).toBe('GET');
            expect(req.request.headers.get('Authorization')).toBe(
                'Bearer test-token',
            );

            req.flush('Directory not found', {
                status: 404,
                statusText: 'Not Found',
            });
        });
    });

    describe('Multiple requests', () => {
        it('should handle multiple getTree requests independently', () => {
            const token1 = 'token1';
            const token2 = 'token2';
            const response1 = { dirs: { '1': { name: 'Dir1' } }, files: {} };
            const response2 = { dirs: { '2': { name: 'Dir2' } }, files: {} };

            // Deux requêtes simultanées
            service.getTree(token1).subscribe((res) => {
                expect(JSON.parse(res).dirs['1'].name).toBe('Dir1');
            });

            service.getTree(token2).subscribe((res) => {
                expect(JSON.parse(res).dirs['2'].name).toBe('Dir2');
            });

            // Vérifie et répond aux deux requêtes
            const reqs = httpMock.match('/api/tree');
            expect(reqs.length).toBe(2);

            reqs[0].flush(response1);
            reqs[1].flush(response2);
        });
    });
});
