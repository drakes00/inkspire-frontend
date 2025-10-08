import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
	providedIn: 'root'
})
export class FilesManagerService {

	constructor(private http: HttpClient) { }

	public async addFile(token: string, name : string, belong_to : number | null): Promise<string>
	{
		// let url = "http://localhost:8000/api/v1/file/create"
		// let contentType = "application/json"
		// let body= JSON.stringify({token: token, name : name, belong_to : belong_to})
		// console.log(body)

		// let response = await fetch(url, {
		// 	method: "POST",
		// 	body: body,
		// 	headers: {
		// 		Accept: contentType,
		// 		'Content-Type': contentType,
		// 	}
		// });

		// const rawData = await response.json();
		// return JSON.stringify(rawData);
		return Promise.resolve(JSON.stringify({}));
	}


	public async delFile(token: string, id : number): Promise<string>
	{
		// let url = "http://localhost:8000/api/v1/file/delete"
		// let contentType = "application/json"
		// let body= JSON.stringify({token: token, id : id})

		// let response = await fetch(url, {
		// 	method: "POST",
		// 	body: body,
		// 	headers: {
		// 		Accept: contentType,
		// 		'Content-Type': contentType,
		// 	}
		// });

		// const rawData = await response.json();
		// console.log(rawData);
		// return JSON.stringify(rawData);
		return Promise.resolve(JSON.stringify({}));
	}


	public async addDir(token: string, name : string, context : string, belong_to : number | null): Promise<string>
	{
		// let url = "http://localhost:8000/api/v1/dir/create"
		// let contentType = "application/json"
		// let body= JSON.stringify({name : name, token: token, belong_to : belong_to, context : context})

		// let response = await fetch(url, {
		// 	method: "POST",
		// 	body: body,
		// 	headers: {
		// 		Accept: contentType,
		// 		'Content-Type': contentType,
		// 	}
		// });

		// const rawData = await response.json();
		// return JSON.stringify(rawData);
		return Promise.resolve(JSON.stringify({}));
	}


	public async delDir(token: string, id : number): Promise<string>
	{
		// let url = "http://localhost:8000/api/v1/dir/delete"
		// let contentType = "application/json"
		// let body= JSON.stringify({token: token, id : id})

		// let response = await fetch(url, {
		// 	method: "POST",
		// 	body: body,
		// 	headers: {
		// 		Accept: contentType,
		// 		'Content-Type': contentType,
		// 	}
		// });

		// const rawData = await response.json();
		// console.log(rawData);
		// return JSON.stringify(rawData);
		return Promise.resolve(JSON.stringify({}));
	}


	public getTree(token : string): Observable<string>
	{
		const url = "/api/tree";
		const headers = new HttpHeaders({
			'Authorization': `Bearer ${token}`,
			'Accept': 'application/json',
		});

		return this.http.get<any>(url, { headers }).pipe(
			map(rawData => JSON.stringify(rawData))
		);
	}

	public getDirContent(id: number, token: string): Observable<string> {
		const url = `/api/dir/${id}`;
		const headers = new HttpHeaders({
			'Authorization': `Bearer ${token}`,
			'Accept': 'application/json',
		});

		return this.http.get<any>(url, { headers }).pipe(
			map(rawData => JSON.stringify(rawData))
		);
	}


	public async getFileContent(id:number, token:string)
	{
		// let url = "http://localhost:8000/api/v1/file/get"
		// let contentType = "application/json"
		// let body = JSON.stringify({id:id, token: token})

		// let response = await fetch(url, {
		// 	method: "POST",
		// 	body: body,
		// 	headers: {
		// 		Accept: contentType,
		// 		'Content-Type': contentType,
		// 	}
		// });

		// const rawData = await response.json();
		// return JSON.stringify(rawData);
		return Promise.resolve(JSON.stringify({}));
	}

	public async saveFile(id : number, token : string, name : string, content : string)
	{
		// let url = "http://localhost:8000/api/v1/file/save"
		// let contentType = "application/json"
		// let body = JSON.stringify({id : id, token : token, name : name, content : content})

		// let response = await fetch(url, {
		// 	method: "POST",
		// 	body: body,
		// 	headers: {
		// 		Accept: contentType,
		// 		'Content-Type': contentType,
		// 	}
		// });

		// const rawData = await response.json();
		// return JSON.stringify(rawData);
		return Promise.resolve(JSON.stringify({}));
	}

	public async getDirContext(id:number, token:string)
	{
		// let url = "http://localhost:8000/api/v1/file/get_context"
		// let contentType = "application/json"
		// let body = JSON.stringify({id:id, token: token})

		// let response = await fetch(url, {
		// 	method: "POST",
		// 	body: body,
		// 	headers: {
		// 		Accept: contentType,
		// 		'Content-Type': contentType,
		// 	}
		// });

		// const rawData = await response.json();
		// return JSON.stringify(rawData);
		return Promise.resolve(JSON.stringify({}));
	}

	public async renameFile(id: number, token: string, name: string)
	{
		// let url = "http://localhost:8000/api/v1/file/rename"
		// let contentType = "application/json"
		// let body = JSON.stringify({id: id, token: token, name: name})

		// let response = await fetch(url, {
		// 	method: "POST",
		// 	body: body,
		// 	headers: {
		// 		Accept: contentType,
		// 		'Content-Type': contentType,
		// 	}
		// });

		// const rawData = await response.json();
		// return JSON.stringify(rawData);
		return Promise.resolve(JSON.stringify({}));
	}

	public async renameDir(id: number, token: string, name: string)
	{
		// let url = "http://localhost:8000/api/v1/dir/rename"
		// let contentType = "application/json"
		// let body = JSON.stringify({id: id, token: token, name: name})

		// let response = await fetch(url, {
		// 	method: "POST",
		// 	body: body,
		// 	headers: {
		// 		Accept: contentType,
		// 		'Content-Type': contentType,
		// 	}
		// });

		// const rawData = await response.json();
		// return JSON.stringify(rawData);
		return Promise.resolve(JSON.stringify({}));
	}

	public async updateDirContext(id: number, token: string, context: string){
		// let url = "http://localhost:8000/api/v1/dir/context/rename"
		// let contentType = "application/json"
		// let body = JSON.stringify({id: id, token: token, context: context})

		// let response = await fetch(url, {
		// 	method: "POST",
		// 	body: body,
		// 	headers: {
		// 		Accept: contentType,
		// 		'Content-Type': contentType,
		// 	}
		// });

		// const rawData = await response.json();
		// return JSON.stringify(rawData);
		return Promise.resolve(JSON.stringify({}));
	}


	public async getContextDirById(id: number, token: string) {
		// let url = "http://localhost:8000/api/v1/dir/context/get";
		// let contentType = "application/json"
		// let body = JSON.stringify({id:id, token: token})

		// let response = await fetch(url, {
		// 	method: "POST",
		// 	body: body,
		// 	headers: {
		// 		Accept: contentType,
		// 		'Content-Type': contentType,
		// 	}
		// });

		// const rawData = await response.json();
		// return JSON.stringify(rawData);
		return Promise.resolve(JSON.stringify({}));
	}

}