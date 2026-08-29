// Shared lookup for components that receive an icon as a *string name* (e.g. `icon="CheckCircle"`)
// rather than a direct component reference. `<component :is="'CheckCircle'">` cannot resolve a
// plain string on its own — Vue only resolves globally-registered or locally-imported components.
import type { Component } from 'vue'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  ChevronRight,
  Clock,
  CreditCard,
  DollarSign,
  ExternalLink,
  Eye,
  Gauge,
  Gavel,
  Home,
  Mail,
  MessageSquare,
  Percent,
  Plus,
  RefreshCw,
  Share,
  ShieldCheck,
  Store,
  Truck,
  Users,
  Wallet,
  XCircle,
} from 'lucide-vue-next'

export const iconMap: Record<string, Component> = {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  ChevronRight,
  Clock,
  CreditCard,
  DollarSign,
  ExternalLink,
  Eye,
  Gauge,
  Gavel,
  Home,
  Mail,
  MessageSquare,
  Percent,
  Plus,
  RefreshCw,
  Share,
  ShieldCheck,
  Store,
  Truck,
  Users,
  Wallet,
  XCircle,
}

export function resolveIcon(name?: string | null): Component | undefined {
  if (!name) return undefined
  return iconMap[name]
}
