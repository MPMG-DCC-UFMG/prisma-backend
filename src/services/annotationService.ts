import axios from "axios";

export class AnnotationService {

    readonly URL = process.env.ANNOTATION_SERVICE;

    async getStrategies(): Promise<string[]> {
        const response = await axios.get<StrategiesResponse>(`${this.URL}strategies`);
        return response.data.strategies;
    }

    async getModels(): Promise<string[]> {
        const response = await axios.get<ModelsResponse>(`${this.URL}models`);
        return response.data.models;
    }

    async createModel(id: string, jsonFileName: string, model: string, strategy: string): Promise<string> {
        const response = await axios.post<any>(`${this.URL}createModel`, {
            features: {
                id,
                jsonFileName,
                model,
                strategy,
                n_initial: 5,
                batch_size: 1,
                topics: []
            }
        }, {
            headers: {
                "Content-Type": "application/json"
            }
        });
        return response.data.return;
    }

    async query(id: string): Promise<any> {
        const url = `${this.URL}query?id=${id}`;
        try {
            const response = await axios.get(url);
            return response.data;
        } catch (e) {
            console.log(e);
            return null;
        }
    }

    async teach(id: string, ref_id: string, topic: string, error: boolean = false): Promise<string> {
        const data = {
            results: [{
                id: ref_id,
                topic,
                error
            }]
        };
        console.log(data);
        const response = await axios.post<any>(`${this.URL}teach?id=${id}`, data, {
            headers: {
                "Content-Type": "application/json"
            }
        });
        return response.data.return;
    }

    async scores(id: string): Promise<number[]> {
        try {
            const url = `${this.URL}scores?id=${id}`;
            const response = await axios.get<ScoresResponse>(url);
            return response.data.scores;
        } catch (e) {
            console.log(e);
            return [];
        }
    }

}

export interface StrategiesResponse {
    strategies: string[];
}
export interface ModelsResponse {
    models: string[];
}
export interface ScoresResponse {
    scores: number[];
}
export interface Return {
    return: string;
}