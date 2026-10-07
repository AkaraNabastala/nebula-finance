import React from 'react';
import {
  ShoppingBag,
  Briefcase,
  BadgePercent,
  TrendingUp,
  PlusCircle,
  Store,
  Users,
  Building,
  Zap,
  Truck,
  Coffee,
  Megaphone,
  Paperclip,
  MinusCircle,
  Wallet,
  DollarSign,
  Tag,
  CreditCard,
  Layers,
  Utensils,
  Car,
  Home,
  ShieldCheck,
  Gift,
  HelpCircle
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  ShoppingBag,
  Briefcase,
  BadgePercent,
  TrendingUp,
  PlusCircle,
  Store,
  Users,
  Building,
  Zap,
  Truck,
  Coffee,
  Megaphone,
  Paperclip,
  MinusCircle,
  Wallet,
  DollarSign,
  Tag,
  CreditCard,
  Layers,
  Utensils,
  Car,
  Home,
  ShieldCheck,
  Gift,
  HelpCircle,
};

export const AVAILABLE_ICONS = Object.keys(ICON_MAP);

interface CategoryIconProps {
  name?: string;
  className?: string;
  color?: string;
}

export function CategoryIcon({ name, className = 'w-4 h-4', color }: CategoryIconProps) {
  const IconComponent = (name && ICON_MAP[name]) ? ICON_MAP[name] : Tag;
  return <IconComponent className={className} style={color ? { color } : undefined} />;
}
