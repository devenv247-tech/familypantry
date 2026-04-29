import api from './client'

export const getAppConfig = () =>
  api.get('/app/config').then(r => r.data)