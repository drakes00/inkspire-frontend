import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Model {
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class ModelService {

  constructor(private http: HttpClient) { }

  /**
   * Retrieves the list of available models from the server.
   * @param token The authentication token for the user.
   * @returns An Observable containing the array of models.
   */
  getModels(token: string): Observable<Model[]> {
    const url = '/api/models';
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    });

    return this.http.get<Model[]>(url, { headers });
  }
}
