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
                n_initial: 10,
                batch_size: 1,
                topics: []
            }
        }, {
            headers: {
                "Content-Type": "application/json"
            }
        });
        return response.data;
    }

}

export interface StrategiesResponse {
    strategies: string[];
}
export interface ModelsResponse {
    models: string[];
}


export interface Return {
    return: string;
}