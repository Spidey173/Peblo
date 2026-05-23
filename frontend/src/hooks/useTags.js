import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tagsApi } from '@/services/api'
import toast from 'react-hot-toast'

export const TAGS_KEY = 'tags'

export function useTags() {
  return useQuery({
    queryKey: [TAGS_KEY],
    queryFn: tagsApi.list,
  })
}

export function useCreateTag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: tagsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TAGS_KEY] })
      toast.success('Tag created')
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Failed to create tag'),
  })
}

export function useDeleteTag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => tagsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TAGS_KEY] })
      toast.success('Tag deleted')
    },
  })
}
