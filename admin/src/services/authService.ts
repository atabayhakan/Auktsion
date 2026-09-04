// src/services/authService.ts
import apiClient from './api'
import type { User } from '@/types'

export interface AuthResponse {
  success: boolean
  token?: string
  user?: User
  data?: User
  message?: string
  error?: string
}

export const authService = {
  async register(data: {
    fullName: string
    email: string
    phone: string
    password?: string
    city?: string
    role?: string
  }): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/api/auth/register', data)
    return res.data
  },

  async login(credentials: {
    email: string
    password?: string
  }): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/api/auth/login', credentials)
    return res.data
  },

  async getMe(): Promise<AuthResponse> {
    const res = await apiClient.get<AuthResponse>('/api/auth/me')
    return res.data
  },

  async logout(): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await apiClient.post<{ success: boolean; message?: string }>('/api/auth/logout')
      return res.data
    } catch {
      return { success: true }
    }
  },
}

export default authService
