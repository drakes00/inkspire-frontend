import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

@Injectable({
    providedIn: "root",
})
export class FilesManagerService {
    constructor(private http: HttpClient) {}

    /**
     * Creates a new file.
     * @param token The authentication token.
     * @param name The name of the new file.
     * @param dirId The ID of the parent directory. If null, the file is created at the root.
     * @returns An Observable with the API response.
     */
    public addFile(token: string, name: string, dirId: number | null): Observable<any> {
        const url = "/api/file";
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
        });

        const body: { name: string; dir?: number } = { name: name };
        if (dirId !== null) {
            body.dir = dirId;
        }

        return this.http.post<any>(url, body, { headers });
    }

    public async delFile(token: string, id: number): Promise<string> {
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

    /**
     * Creates a new directory.
     * @param token The authentication token.
     * @param name The name of the new directory.
     * @param dirId The ID of the parent directory. If null, the directory is created at the root.
     * @returns An Observable with the API response.
     */
    public addDir(token: string, name: string, context: string, dirId: number | null): Observable<any> {
        const url = "/api/dir";
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
        });

        const body = { name: name, summary: context };

        return this.http.post<any>(url, body, { headers });
    }

    public async delDir(token: string, id: number): Promise<string> {
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

    /**
     * Retrieves the root of the file system tree for the authenticated user.
     * This includes all root-level files and directories.
     * @param token The authentication token for the user.
     * @returns An Observable containing the JSON string of the file system tree.
     */
    public getTree(token: string): Observable<string> {
        const url = "/api/tree";
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
        });

        return this.http.get<any>(url, { headers }).pipe(map((rawData) => JSON.stringify(rawData)));
    }

    /**
     * Retrieves the content of a specific directory.
     * This includes all files within that directory.
     * @param id The ID of the directory to retrieve.
     * @param token The authentication token for the user.
     * @returns An Observable containing the JSON string of the directory's content.
     */
    public getDirContent(id: number, token: string): Observable<string> {
        const url = `/api/dir/${id}`;
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
        });

        return this.http.get<any>(url, { headers }).pipe(map((rawData) => JSON.stringify(rawData)));
    }

    public async getFileContent(id: number, token: string) {
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

    public async saveFile(id: number, token: string, name: string, content: string) {
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

    public async getDirContext(id: number, token: string) {
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

    public async renameFile(id: number, token: string, name: string) {
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

    public async renameDir(id: number, token: string, name: string) {
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

    public async updateDirContext(id: number, token: string, context: string) {
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
