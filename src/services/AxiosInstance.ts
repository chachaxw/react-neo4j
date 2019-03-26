import axios, { AxiosRequestConfig } from 'axios';
import qs from 'qs';

interface CustomizeConfig extends AxiosRequestConfig {
  retry: number;
  retryDelay: number;
}

// axios config options
const options: CustomizeConfig = {
  baseURL: 'http://localhost:3031',
  timeout: 10000,
  retry: 1,
  retryDelay: 1000,
  // 查询对象序列化函数
  paramsSerializer: (params: any) => qs.stringify(params),
};

const AxiosInstance = axios.create(options);

// 设置请求重试机制
AxiosInstance.interceptors.response.use(undefined, (err) => {
  const config = err.config;

  if (!config || !config.retry) {
    return Promise.reject(err);
  }

  config.__retryCount = config.__retryCount || 0;
  if (config.__retryCount >= config.retry) {
    return Promise.reject(err);
  }

  config.__retryCount += 1;
  return new Promise((resolve) => {
    setTimeout(() => resolve(), config.retryDelay);
  }).then(() => axios(config));
});

export default AxiosInstance;
