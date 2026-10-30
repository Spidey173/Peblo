import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { aiApi } from '@/services/api'
import toast from 'react-hot-toast'

export const AI_KEY = 'ai'

export function useGenerateAI() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: aiApi.generate,
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: ['notes', variables.note_id] })
      qc.invalidateQueries({ queryKey: ['notes'] })
      if (data.cached) {
        toast('Using cached AI insights', { icon: '⚡' })
      } else {
        toast.success('AI generation complete!')
      }
    },
    onError: (err) => {
      const msg = err.response?.data?.detail || 'AI generation failed'
      toast.error(msg)
    },
  })
}

export function useAskVault() {
  return useMutation({
    mutationFn: aiApi.askVault,
    onError: (err) => {
      const msg = err.response?.data?.detail || 'Vault retrieval failed'
      toast.error(msg)
    },
  })
}

export function useVaultStatus() {
  return useQuery({
    queryKey: [AI_KEY, 'vault-status'],
    queryFn: aiApi.vaultStatus,
    staleTime: 1000 * 30, // 30s cache
  })
}
