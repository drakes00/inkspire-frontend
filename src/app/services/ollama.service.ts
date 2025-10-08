import {Injectable} from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class OllamaService {

    constructor() {
    }

    public async addButtonOllama(id: number, token: string, userQuery: string, context: string, text: string | null): Promise<string> {
        // console.log("addbutton")
        // let url = "http://127.0.0.1:8000/api/v1/ollama/addRequest"
        // let contentType = "application/json"
        // let body = JSON.stringify({id: id, token: token, userQuery: userQuery, context: context, text: text})
        // console.log(body)

        // let response = await fetch(url, {
        //     method: "POST",
        //     body: body,
        //     headers: {
        //         Accept: contentType,
        //         'Content-Type': contentType,
        //     }
        // });
        // const rawData = await response.json();
        // return JSON.stringify(rawData);
        return Promise.resolve(JSON.stringify({}));
    }

    public async rephraseButtonOllama(id: number, token: string, context: string, text: string | null): Promise<string> {
        // console.log("rephraseButton")
        // let url = "http://127.0.0.1:8000/api/v1/ollama/rephraseRequest"
        // let contentType = "application/json"
        // let body = JSON.stringify({id: id, token: token, context: context, text: text})
        // console.log(body)

        // let response = await fetch(url, {
        //     method: "POST",
        //     body: body,
        //     headers: {
        //         Accept: contentType,
        //         'Content-Type': contentType,
        //     }
        // });
        // const rawData = await response.json();
        // return JSON.stringify(rawData);
        return Promise.resolve(JSON.stringify({}));
    }

    
    public async translateButtonOllama(id: number, token: string, userQuery: string, context: string, text: string | null): Promise<string> {
        // console.log("translateButton")
        // let url = "http://127.0.0.1:8000/api/v1/ollama/translateRequest"
        // let contentType = "application/json"
        // let body = JSON.stringify({id: id, token: token, userQuery: userQuery, context: context, text: text})
        // console.log(body)
        // let response = await fetch(url, {
        //     method: "POST",
        //     body: body,
        //     headers: {
        //         Accept: contentType,
        //         'Content-Type': contentType,
        //     }
        // });
        // console.log("response")
        // console.log(response)
        // const rawData = await response.json();
        // return JSON.stringify(rawData);
        return Promise.resolve(JSON.stringify({}));
    }

}
