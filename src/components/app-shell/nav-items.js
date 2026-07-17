import { Home, Map, Users, User, AlertCircle, Network } from 'lucide-react';

export const NAV_ITEMS = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/journeys', label: 'Journeys', icon: Map },
  { to: '/concepts', label: 'Concepts', icon: Network },
  { to: '/mistakes', label: 'Mistakes', icon: AlertCircle },
  { to: '/library', label: 'Community', icon: Users },
  { to: '/profile', label: 'Profile', icon: User },
];
