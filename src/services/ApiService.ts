import { AxiosResponse } from 'axios';

import AxiosInstance from './AxiosInstance';
import { ApiUrl } from './ApiConfig';

export class ApiService {

  public static fetchNodes(params?: any): Promise<AxiosResponse> {
    return AxiosInstance.get(ApiUrl.nodes, params);
  }

  public static postNode(params: any): Promise<AxiosResponse> {
    return AxiosInstance.post(ApiUrl.nodes, params);
  }

  public static patchNode(id: number | string, params: any): Promise<AxiosResponse> {
    return AxiosInstance.patch(`${ApiUrl.nodes}/${id}`, params);
  }

  public static deleteNode(id: number | string): Promise<AxiosResponse> {
    return AxiosInstance.delete(`${ApiUrl.nodes}/${id}`);
  }

  public static fetchLinks(params?: any): Promise<AxiosResponse> {
    return AxiosInstance.get(ApiUrl.links, params);
  }

  public static postLink(params: any): Promise<AxiosResponse> {
    return AxiosInstance.post(ApiUrl.links, params);
  }

  public static patchLink(id: number | string, params: any): Promise<AxiosResponse> {
    return AxiosInstance.patch(`${ApiUrl.links}/${id}`, params);
  }

  public static deleteLink(id: number | string): Promise<AxiosResponse> {
    return AxiosInstance.delete(`${ApiUrl.links}/${id}`);
  }
}
