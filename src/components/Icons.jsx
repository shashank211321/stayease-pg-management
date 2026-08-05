import React from 'react';
import { 
  LayoutDashboard,
  Home,
  Bed,
  Users,
  CreditCard,
  Settings as LucideSettings,
  Plus,
  Trash2,
  Edit,
  X,
  Check,
  Info,
  Upload,
  Eye,
  QrCode,
  ArrowRight,
  Smartphone,
  Copy,
  Sun,
  Moon,
  Mail,
  Phone,
  ShieldCheck,
  LogOut,
  Building
} from 'lucide-react';

export const IconDashboard = ({ className = 'w-6 h-6', ...props }) => (
  <LayoutDashboard className={className} {...props} />
);

export const IconRoom = ({ className = 'w-6 h-6', ...props }) => (
  <Home className={className} {...props} />
);

export const IconBed = ({ className = 'w-6 h-6', ...props }) => (
  <Bed className={className} {...props} />
);

export const IconGuest = ({ className = 'w-6 h-6', ...props }) => (
  <Users className={className} {...props} />
);

export const IconPayment = ({ className = 'w-6 h-6', ...props }) => (
  <CreditCard className={className} {...props} />
);

export const IconSettings = ({ className = 'w-6 h-6', ...props }) => (
  <LucideSettings className={className} {...props} />
);

export const IconPlus = ({ className = 'w-6 h-6', ...props }) => (
  <Plus className={className} {...props} />
);

export const IconTrash = ({ className = 'w-6 h-6', ...props }) => (
  <Trash2 className={className} {...props} />
);

export const IconEdit = ({ className = 'w-6 h-6', ...props }) => (
  <Edit className={className} {...props} />
);

export const IconClose = ({ className = 'w-6 h-6', ...props }) => (
  <X className={className} {...props} />
);

export const IconCheck = ({ className = 'w-6 h-6', ...props }) => (
  <Check className={className} {...props} />
);

export const IconInfo = ({ className = 'w-6 h-6', ...props }) => (
  <Info className={className} {...props} />
);

export const IconUpload = ({ className = 'w-6 h-6', ...props }) => (
  <Upload className={className} {...props} />
);

export const IconEye = ({ className = 'w-6 h-6', ...props }) => (
  <Eye className={className} {...props} />
);

// Polished layout additions
export const IconQrCode = ({ className = 'w-6 h-6', ...props }) => (
  <QrCode className={className} {...props} />
);

export const IconArrowRight = ({ className = 'w-6 h-6', ...props }) => (
  <ArrowRight className={className} {...props} />
);

export const IconSmartphone = ({ className = 'w-6 h-6', ...props }) => (
  <Smartphone className={className} {...props} />
);

export const IconCopy = ({ className = 'w-6 h-6', ...props }) => (
  <Copy className={className} {...props} />
);

export const IconSun = ({ className = 'w-6 h-6', ...props }) => (
  <Sun className={className} {...props} />
);

export const IconMoon = ({ className = 'w-6 h-6', ...props }) => (
  <Moon className={className} {...props} />
);

export const IconMail = ({ className = 'w-6 h-6', ...props }) => (
  <Mail className={className} {...props} />
);

export const IconPhone = ({ className = 'w-6 h-6', ...props }) => (
  <Phone className={className} {...props} />
);

export const IconShieldCheck = ({ className = 'w-6 h-6', ...props }) => (
  <ShieldCheck className={className} {...props} />
);

export const IconLogOut = ({ className = 'w-6 h-6', ...props }) => (
  <LogOut className={className} {...props} />
);

export const IconBuilding = ({ className = 'w-6 h-6', ...props }) => (
  <Building className={className} {...props} />
);
