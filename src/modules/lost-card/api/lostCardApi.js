import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export async function createLostCardReport(payload, idempotencyKey) {
  const { data } = await api.post('/lost-card-reports', payload, {
    headers: { 'Idempotency-Key': idempotencyKey },
  });
  return data;
}

export async function getLostCardReport(id) {
  const { data } = await api.get(`/lost-card-reports/${id}`);
  return data;
}

export async function cancelLostCardReport(id) {
  const { data } = await api.post(`/lost-card-reports/${id}/cancel`);
  return data;
}
