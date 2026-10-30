import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notesApi } from '@/services/api'
import toast from 'react-hot-toast'

export const NOTES_KEY = 'notes'

export function useNotes(params = {}) {
  return useQuery({
    queryKey: [NOTES_KEY, params],
    queryFn: () => notesApi.list(params),
  })
}

export function useNote(id) {
  return useQuery({
    queryKey: [NOTES_KEY, id],
    queryFn: () => notesApi.get(id),
    enabled: !!id,
  })
}

export function useCreateNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: notesApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [NOTES_KEY] })
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'Failed to create note')
    },
  })
}

export function useUpdateNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => notesApi.update(id, data),
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: [NOTES_KEY, id] })
      const prev = qc.getQueryData([NOTES_KEY, id])
      qc.setQueryData([NOTES_KEY, id], (old) => (old ? { ...old, ...data } : old))
      return { prev }
    },
    onSuccess: (updatedNote) => {
      qc.setQueryData([NOTES_KEY, updatedNote.id], updatedNote)
      qc.setQueriesData({ queryKey: [NOTES_KEY] }, (old) => {
        if (Array.isArray(old)) {
          return old.map((n) => (n.id === updatedNote.id ? { ...n, ...updatedNote } : n))
        }
        return old
      })
    },
    onError: (err, vars, ctx) => {
      if (ctx?.prev) qc.setQueryData([NOTES_KEY, vars.id], ctx.prev)
      if (err.response?.status !== 409) {
        toast.error('Failed to save note')
      }
    },
  })
}

export function useDeleteNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: notesApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [NOTES_KEY] })
      toast.success('Note deleted')
    },
    onError: () => toast.error('Failed to delete note'),
  })
}

export function useToggleShare() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: notesApi.toggleShare,
    onSuccess: (data) => {
      qc.setQueryData([NOTES_KEY, data.id], data)
      qc.invalidateQueries({ queryKey: [NOTES_KEY] })
      toast.success(data.is_public ? 'Note is now public' : 'Note is now private')
    },
  })
}
