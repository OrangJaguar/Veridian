import { useQuery } from '@tanstack/react-query';
import {
  listPublishedPosts,
  getPublishedPost,
  adminListPosts,
  adminGetPost,
} from '@/api/adapters/blogAdapter';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/queries/useIsAdmin';

export const blogQueryKeys = {
  published: ['blog', 'published'],
  publishedDetail: (slug) => ['blog', 'published', slug],
  adminList: (params) => ['blog', 'admin', 'list', params],
  adminDetail: (postId) => ['blog', 'admin', postId],
};

export function usePublishedBlogPosts(params = {}) {
  return useQuery({
    queryKey: [...blogQueryKeys.published, params],
    queryFn: () => listPublishedPosts(params),
    staleTime: 60_000,
  });
}

export function usePublishedBlogPost(slug) {
  return useQuery({
    queryKey: blogQueryKeys.publishedDetail(slug),
    queryFn: () => getPublishedPost(slug),
    enabled: !!slug,
    staleTime: 60_000,
    retry: false,
  });
}

export function useAdminBlogPosts(params = {}) {
  const { isAuthenticated } = useAuth();
  const { isAdmin } = useIsAdmin();
  return useQuery({
    queryKey: blogQueryKeys.adminList(params),
    queryFn: () => adminListPosts(params),
    enabled: isAuthenticated && isAdmin,
    staleTime: 15_000,
  });
}

export function useAdminBlogPost(postId) {
  const { isAuthenticated } = useAuth();
  const { isAdmin } = useIsAdmin();
  return useQuery({
    queryKey: blogQueryKeys.adminDetail(postId),
    queryFn: () => adminGetPost(postId),
    enabled: isAuthenticated && isAdmin && !!postId,
  });
}
