import api from './client'

export const createCheckoutSession = (plan) =>
  api.post('/stripe/checkout', { plan }).then(r => r.data)

export const createPortalSession = () =>
  api.post('/stripe/portal').then(r => r.data)

export const getSubscription = () =>
  api.get('/stripe/subscription').then(r => r.data)