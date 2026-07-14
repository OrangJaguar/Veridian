import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invokeAdminFunction } from '@/api/admin/invokeAdminFunction';

export const errorDashboardKeys = {
  all: ['errorDashboard'],
  groups: (filters) => [...errorDashboardKeys.all, 'groups', filters],
  group: (groupId) => [...errorDashboardKeys.all, 'group', groupId],
};

async function invokeDashboard(payload) {
  return invokeAdminFunction('getErrorDashboard', payload);
}

export function useErrorGroups(filters = {}) {
  return useQuery({
    queryKey: errorDashboardKeys.groups(filters),
    queryFn: () => invokeDashboard({ action: 'listGroups', ...filters }),
    staleTime: 30_000,
  });
}

export function useErrorGroupDetail(groupId) {
  return useQuery({
    queryKey: errorDashboardKeys.group(groupId),
    queryFn: () => invokeDashboard({ action: 'getGroup', groupId }),
    enabled: Boolean(groupId),
    staleTime: 15_000,
  });
}

export function useUpdateErrorGroupStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, status }) => invokeDashboard({
      action: 'updateGroupStatus',
      groupId,
      status,
    }),
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: errorDashboardKeys.all });
      queryClient.invalidateQueries({ queryKey: errorDashboardKeys.group(groupId) });
    },
  });
}
