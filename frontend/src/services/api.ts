import axios from 'axios';

const api = axios.create({
  baseURL: '/backend',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const userService = {
  getAllUsers: () => api.get('/users'),
  getUserById: (id: number) => api.get(`/users/${id}`),
  createUser: (user: any) => api.post('/users', user),
  deleteUser: (id: number) => api.delete(`/users/${id}`),
};

export const productService = {
  getAllProducts: () => api.get('/products'),
  getProductById: (id: number) => api.get(`/products/${id}`),
  createProduct: (product: any) => api.post('/products', product),
  deleteProduct: (id: number) => api.delete(`/products/${id}`),
};

export const fileTransferService = {
  initiateTransfer: (data: any) => api.post('/api/transfers/initiate', data),
  uploadChunk: (fileId: string, chunkNumber: number, totalChunks: number, file: File) => {
    const formData = new FormData();
    formData.append('fileId', fileId);
    formData.append('chunkNumber', chunkNumber.toString());
    formData.append('totalChunks', totalChunks.toString());
    formData.append('file', file);
    return api.post('/api/transfers/upload-chunk', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  downloadFile: (fileId: string) => api.get(`/api/transfers/download/${fileId}`, { responseType: 'blob' }),
  acceptTransfer: (fileId: string) => api.post(`/api/transfers/${fileId}/accept`),
  rejectTransfer: (fileId: string) => api.post(`/api/transfers/${fileId}/reject`),
  getTransfersBySender: (peerId: string) => api.get(`/api/transfers/sender/${peerId}`),
  getTransfersByReceiver: (peerId: string) => api.get(`/api/transfers/receiver/${peerId}`),
  getTransferStatus: (fileId: string) => api.get(`/api/transfers/status/${fileId}`),
};
