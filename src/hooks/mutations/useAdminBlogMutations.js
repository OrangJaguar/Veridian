import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  adminCreatePost,
  adminUpdatePost,
  adminPublishPost,
  adminArchivePost,
  adminRestorePost,
  adminDeletePost,
  adminDuplicatePost,
} from '@/api/adapters/blogAdapter';
import { runStaticBlogMigration } from '@/utils/blog/migrateStaticPosts';
import { invokeBackendFunction } from '@/api/adapters/functionAdapter';

function invalidateBlog(queryClient) {
  queryClient.invalidateQueries({ queryKey: ['blog'] });
}

export function useAdminBlogMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (payload) => adminCreatePost(payload),
    onSuccess: () => {
      invalidateBlog(queryClient);
      toast.success('Draft created');
    },
    onError: (err) => toast.error(err.message || 'Action failed'),
  });

  const update = useMutation({
    mutationFn: ({ postId, patch }) => adminUpdatePost(postId, patch),
    onSuccess: () => {
      invalidateBlog(queryClient);
      toast.success('Saved');
    },
    onError: (err) => toast.error(err.message || 'Action failed'),
  });

  const publish = useMutation({
    mutationFn: (postId) => adminPublishPost(postId),
    onSuccess: () => {
      invalidateBlog(queryClient);
      toast.success('Published');
    },
    onError: (err) => toast.error(err.message || 'Publish failed'),
  });

  const archive = useMutation({
    mutationFn: (postId) => adminArchivePost(postId),
    onSuccess: () => {
      invalidateBlog(queryClient);
      toast.success('Archived');
    },
    onError: (err) => toast.error(err.message || 'Action failed'),
  });

  const restore = useMutation({
    mutationFn: (postId) => adminRestorePost(postId),
    onSuccess: () => {
      invalidateBlog(queryClient);
      toast.success('Restored to draft');
    },
    onError: (err) => toast.error(err.message || 'Action failed'),
  });

  const remove = useMutation({
    mutationFn: (postId) => adminDeletePost(postId),
    onSuccess: () => {
      invalidateBlog(queryClient);
      toast.success('Deleted');
    },
    onError: (err) => toast.error(err.message || 'Action failed'),
  });

  const duplicate = useMutation({
    mutationFn: (postId) => adminDuplicatePost(postId),
    onSuccess: () => {
      invalidateBlog(queryClient);
      toast.success('Duplicated');
    },
    onError: (err) => toast.error(err.message || 'Action failed'),
  });

  const migrate = useMutation({
    mutationFn: ({ dryRun } = {}) => runStaticBlogMigration({ dryRun }),
    onSuccess: (result) => {
      invalidateBlog(queryClient);
      if (result?.ok) toast.success(result.dryRun ? 'Parity OK (dry run)' : 'Migration complete');
      else toast.error('Migration parity issues found');
    },
    onError: (err) => toast.error(err.message || 'Migration failed'),
  });

  const backup = useMutation({
    mutationFn: () => invokeBackendFunction('createPlatformBackup', {}),
    onSuccess: (data) => {
      toast.success('Backup created');
      try {
        const blob = new Blob([JSON.stringify(data.payload ?? data, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${data.backupId || 'veridian-backup'}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } catch {
        /* download optional */
      }
    },
    onError: (err) => toast.error(err.message || 'Backup failed'),
  });

  return {
    create,
    update,
    publish,
    archive,
    restore,
    remove,
    duplicate,
    migrate,
    backup,
  };
}
