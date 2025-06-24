import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConnectionService {

  constructor() { }

  public async connectUser(username: string, password: string): Promise<boolean>
  {
    const url = 'http://localhost:8000/auth';
    const contentType = 'application/json';
    const body = JSON.stringify({ username: username, password: password });

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: body,
        headers: {
          Accept: contentType,
          'Content-Type': contentType,
        },
      });

        console.log("ok")
      if (response.ok) {
        const data = await response.json();
        if (data.token) {
          localStorage.setItem('token', data.token);
          return true;
        }
      }
      return false;
    } catch (e) {
      console.error('Connection error', e);
      return false;
    }
  }

  public async disconnectUser(): Promise<void>
  {
    const token = localStorage.getItem('token');
    localStorage.removeItem('token');

    if (token) {
      const url = 'http://localhost:8000/logout';
      try {
        await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          }
        });
      } catch (e) {
        console.error('Error during logout API call', e);
      }
    }
  }



}
