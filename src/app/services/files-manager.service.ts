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

    /**
     * Edits a file's name.
     * @param token The authentication token.
     * @param id The ID of the file to edit.
     * @param name The new name for the file.
     * @returns An Observable with the API response.
     */
    public editFile(token: string, id: number, name: string): Observable<any> {
        const url = `/api/file/${id}`;
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
        });

        const body = { name };
        return this.http.put<any>(url, body, { headers });
    }

    /**
     * Deletes a file.
     * @param token The authentication token.
     * @param id The ID of the file to delete.
     * @returns An Observable with the API response.
     */
    public delFile(token: string, id: number): Observable<any> {
        const url = `/api/file/${id}`;
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
        });

        return this.http.delete<any>(url, { headers });
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

    /**
     * Edits a directory's name and summary.
     * @param token The authentication token.
     * @param id The ID of the directory to edit.
     * @param name The new name for the directory.
     * @param context The new summary for the directory.
     * @returns An Observable with the API response.
     */
    public editDir(token: string, id: number, name: string, context: string): Observable<any> {
        const url = `/api/dir/${id}`;
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
        });

        const body = { name: name, summary: context };

        return this.http.put<any>(url, body, { headers });
    }

    /**
     * Deletes a directory.
     * @param token The authentication token.
     * @param id The ID of the directory to delete.
     * @returns An Observable with the API response.
     */
    public delDir(token: string, id: number): Observable<any> {
        const url = `/api/dir/${id}`;
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
        });

        return this.http.delete<any>(url, { headers });
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

    /**
     * Retrieves information for a specific file.
     * @param id The ID of the file.
     * @param token The authentication token.
     * @returns An Observable with the file information.
     */
    public getFileInfo(id: number, token: string): Observable<any> {
        const url = `/api/file/${id}`;
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
        });

        return this.http.get<any>(url, { headers });
    }

    /**
     * Retrieves the content of a specific file.
     * @param id The ID of the file to retrieve.
     * @param token The authentication token for the user.
     * @returns An Observable containing the raw content of the file.
     */
    public getFileContent(id: number, token: string): Observable<string> {
        const url = `/api/file/${id}/contents`;
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`,
            Accept: "text/plain", // Expecting plain text content
        });

        return this.http.get(url, { headers, responseType: 'text' });
    }

    /**
     * Updates the content of a specific file.
     * @param id The ID of the file to update.
     * @param token The authentication token for the user.
     * @param content The new content of the file.
     * @returns An Observable that completes when the file is saved.
     */
    public updateFileContent(id: number, token: string, content: string): Observable<any> {
        const url = `/api/file/${id}/contents`;
        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`,
            "Content-Type": "text/plain",
        });

        return this.http.post(url, content, { headers, responseType: "text" });
    }
}
