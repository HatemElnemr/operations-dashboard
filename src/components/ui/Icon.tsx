import { Search, Bell, Plus, ChevronRight, Eye, Edit2, X, Clock, User, Check, RefreshCw } from 'lucide-react';

interface IconProps {
  name: string;
  className?: string;
}

export function Icon({ name, className = "size-5" }: IconProps) {
  switch (name) {
    case 'search': return <Search className={className} />;
    case 'bell': return <Bell className={className} />;
    case 'plus': return <Plus className={className} />;
    case 'chevron': return <ChevronRight className={className} />;
    case 'eye': return <Eye className={className} />;
    case 'edit': return <Edit2 className={className} />;
    case 'close': return <X className={className} />;
    case 'clock': return <Clock className={className} />;
    case 'user': return <User className={className} />;
    case 'check': return <Check className={className} />;
    case 'refresh': return <RefreshCw className={className} />;
    default: return null;
  }
}