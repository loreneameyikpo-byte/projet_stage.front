import { useApi } from './useApi'

export function useRoles() {
  const { apiFetch } = useApi()

  return useAsyncData('roles-map', async () => {
    const data = await apiFetch<{ roles: { id_role: string; libelle: string }[] }>('/roles')
    const parLibelle: Record<string, string> = {}
    for (const r of data.roles) parLibelle[r.libelle] = r.id_role
    return parLibelle
  })
}