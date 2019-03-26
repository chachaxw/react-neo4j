import { AxiosResponse } from 'axios';

import AxiosInstance from './AxiosInstance';
import { ApiUrl } from './ApiConfig';

export class ApiService {

  public static fetchNodes(params?: any): Promise<AxiosResponse> {
    return AxiosInstance.get(ApiUrl.nodes, params);
  }

  public static fetchLinks(params?: any): Promise<AxiosResponse> {
    return AxiosInstance.get(ApiUrl.links, params);
  }

}