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
      if (data.cached) {
        toast('Using cached AI insights', { icon: '⚡' })
      } else {
        toast.success('AI insights generated!')
      }
    },
    onError: (err) => {
      const msg = err.response?.data?.detail || 'AI generation failed'
      toast.error(msg)
    },
  })
}
