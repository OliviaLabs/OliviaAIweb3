import axios from 'axios';
import { API_GATEWAY_JWT, API_GATEWAY_URL } from './endpoints';

const axiosInstanceAPIGateway = axios.create({
  baseURL: API_GATEWAY_URL,
  headers: {
    "Content-Type": "application/json",
    ...(API_GATEWAY_JWT && { "Authorization": `Bearer ${API_GATEWAY_JWT}` })
  },
});

export const logError = (error) => {
  console.error(error);
};


export default axiosInstanceAPIGateway;
