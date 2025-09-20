import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Deals from '../Deals';

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: mockDeals, error: null })),
      })),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      update: vi.fn(() => Promise.resolve({ data: null, error: null })),
      delete: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  })),
}));

vi.mock('../../services/offlineService', () => ({
  isOnline: vi.fn(() => true),
  addOfflineAction: vi.fn(),
  getOfflineData: vi.fn(() => []),
  saveOfflineData: vi.fn(),
}));

interface MockButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  [key: string]: unknown;
}

vi.mock('../../components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: MockButtonProps) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

interface MockInputProps {
  [key: string]: unknown;
}

vi.mock('../../components/ui/input', () => ({
  Input: (props: MockInputProps) => <input {...props} />,
}));

interface MockSelectProps {
  children: React.ReactNode;
  onValueChange?: (value: string) => void;
}

interface MockSelectChildProps {
  children: React.ReactNode;
}

interface MockSelectItemProps {
  children: React.ReactNode;
  value: string;
}

interface MockSelectValueProps {
  placeholder?: string;
}

vi.mock('../../components/ui/select', () => ({
  Select: ({ children, onValueChange }: MockSelectProps) => (
    <select onChange={(e) => onValueChange?.(e.target.value)}>
      {children}
    </select>
  ),
  SelectContent: ({ children }: MockSelectChildProps) => <div>{children}</div>,
  SelectItem: ({ children, value }: MockSelectItemProps) => (
    <option value={value}>{children}</option>
  ),
  SelectTrigger: ({ children }: MockSelectChildProps) => <div>{children}</div>,
  SelectValue: ({ placeholder }: MockSelectValueProps) => <span>{placeholder}</span>,
}));

interface MockDialogProps {
  children: React.ReactNode;
  open?: boolean;
}

interface MockDialogChildProps {
  children: React.ReactNode;
}

vi.mock('../../components/ui/dialog', () => ({
  Dialog: ({ children, open }: MockDialogProps) => open ? <div>{children}</div> : null,
  DialogContent: ({ children }: MockDialogChildProps) => <div>{children}</div>,
  DialogHeader: ({ children }: MockDialogChildProps) => <div>{children}</div>,
  DialogTitle: ({ children }: MockDialogChildProps) => <h2>{children}</h2>,
  DialogTrigger: ({ children }: MockDialogChildProps) => <div>{children}</div>,
}));

interface MockTableChildProps {
  children: React.ReactNode;
}

vi.mock('../../components/ui/table', () => ({
  Table: ({ children }: MockTableChildProps) => <table>{children}</table>,
  TableBody: ({ children }: MockTableChildProps) => <tbody>{children}</tbody>,
  TableCell: ({ children }: MockTableChildProps) => <td>{children}</td>,
  TableHead: ({ children }: MockTableChildProps) => <th>{children}</th>,
  TableHeader: ({ children }: MockTableChildProps) => <thead>{children}</thead>,
  TableRow: ({ children }: MockTableChildProps) => <tr>{children}</tr>,
}));

interface MockBadgeProps {
  children: React.ReactNode;
}

vi.mock('../../components/ui/badge', () => ({
  Badge: ({ children }: MockBadgeProps) => <span>{children}</span>,
}));

interface MockCardChildProps {
  children: React.ReactNode;
}

vi.mock('../../components/ui/card', () => ({
  Card: ({ children }: MockCardChildProps) => <div>{children}</div>,
  CardContent: ({ children }: MockCardChildProps) => <div>{children}</div>,
  CardHeader: ({ children }: MockCardChildProps) => <div>{children}</div>,
  CardTitle: ({ children }: MockCardChildProps) => <h3>{children}</h3>,
}));

interface MockTextareaProps {
  [key: string]: unknown;
}

vi.mock('../../components/ui/textarea', () => ({
  Textarea: (props: MockTextareaProps) => <textarea {...props} />,
}));

interface MockLabelProps {
  children: React.ReactNode;
}

vi.mock('../../components/ui/label', () => ({
  Label: ({ children }: MockLabelProps) => <label>{children}</label>,
}));



// Mock data
const mockDeals = [
  {
    id: 1,
    title: 'Test Deal 1',
    value: 5000,
    stage: 'prospecting',
    probability: 50,
    customer_id: 'customer-1',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    title: 'Test Deal 2',
    value: 10000,
    stage: 'closed_won',
    probability: 100,
    customer_id: 'customer-2',
    created_at: '2024-01-02T00:00:00Z',
  },
];

const mockCustomers = [
  { id: 'customer-1', name: 'Customer 1', email: 'customer1@example.com' },
  { id: 'customer-2', name: 'Customer 2', email: 'customer2@example.com' },
];

// Mock store
vi.mock('../../store/useStore', () => ({
  useStore: vi.fn(() => ({
    deals: mockDeals,
    customers: mockCustomers,
    setDeals: vi.fn(),
    setCustomers: vi.fn(),
    addDeal: vi.fn(),
    updateDeal: vi.fn(),
    removeDeal: vi.fn(),
    loading: false,
    setLoading: vi.fn(),
  })),
}));

// Mock auth hook
vi.mock('../../hooks/useAuthHook', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-1', email: 'test@example.com' },
    isAuthenticated: true,
  })),
}));

vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    // Override with simple mock components for testing
    Plus: () => <span>Plus</span>,
    Search: () => <span>Search</span>,
    Filter: () => <span>Filter</span>,
    Edit: () => <span>Edit</span>,
    Trash2: () => <span>Trash2</span>,
    Download: () => <span>Download</span>,
    Target: () => <span>Target</span>,
    Calendar: () => <span>Calendar</span>,
    DollarSign: () => <span>DollarSign</span>,
    TrendingUp: () => <span>TrendingUp</span>,
    Users: () => <span>Users</span>,
    FileText: () => <span>FileText</span>,
    BarChart3: () => <span>BarChart3</span>,
    PieChart: () => <span>PieChart</span>,
    Activity: () => <span>Activity</span>,
    Clock: () => <span>Clock</span>,
    CheckCircle: () => <span>CheckCircle</span>,
    AlertCircle: () => <span>AlertCircle</span>,
    XCircle: () => <span>XCircle</span>,
    ArrowUp: () => <span>ArrowUp</span>,
    ArrowDown: () => <span>ArrowDown</span>,
    MoreHorizontal: () => <span>MoreHorizontal</span>,
    Eye: () => <span>Eye</span>,
    EyeOff: () => <span>EyeOff</span>,
    Settings: () => <span>Settings</span>,
    Bell: () => <span>Bell</span>,
    Mail: () => <span>Mail</span>,
    Phone: () => <span>Phone</span>,
    MapPin: () => <span>MapPin</span>,
    Globe: () => <span>Globe</span>,
    Link: () => <span>Link</span>,
    Copy: () => <span>Copy</span>,
    Share: () => <span>Share</span>,
    Save: () => <span>Save</span>,
    Upload: () => <span>Upload</span>,
    RefreshCw: () => <span>RefreshCw</span>,
    Loader: () => <span>Loader</span>,
    Check: () => <span>Check</span>,
    X: () => <span>X</span>,
    ChevronLeft: () => <span>ChevronLeft</span>,
    ChevronRight: () => <span>ChevronRight</span>,
    ChevronUp: () => <span>ChevronUp</span>,
    ChevronDown: () => <span>ChevronDown</span>,
    Handshake: () => <span>Handshake</span>,
    TestTube: () => <span>TestTube</span>,
    GripVertical: () => <span>GripVertical</span>,
    ArrowLeft: () => <span>ArrowLeft</span>,
    ArrowRight: () => <span>ArrowRight</span>,
    ExternalLink: () => <span>ExternalLink</span>,
    Image: () => <span>Image</span>,
    Video: () => <span>Video</span>,
    Music: () => <span>Music</span>,
    Folder: () => <span>Folder</span>,
    File: () => <span>File</span>,
    Archive: () => <span>Archive</span>,
    Database: () => <span>Database</span>,
    Server: () => <span>Server</span>,
    Cloud: () => <span>Cloud</span>,
    Wifi: () => <span>Wifi</span>,
    Bluetooth: () => <span>Bluetooth</span>,
    Battery: () => <span>Battery</span>,
    Power: () => <span>Power</span>,
    Zap: () => <span>Zap</span>,
    Sun: () => <span>Sun</span>,
    Moon: () => <span>Moon</span>,
    Lock: () => <span>Lock</span>,
    Unlock: () => <span>Unlock</span>,
    Key: () => <span>Key</span>,
    Shield: () => <span>Shield</span>,
    User: () => <span>User</span>,
    UserPlus: () => <span>UserPlus</span>,
    UserMinus: () => <span>UserMinus</span>,
    UserCheck: () => <span>UserCheck</span>,
    UserX: () => <span>UserX</span>,
    Home: () => <span>Home</span>,
    Menu: () => <span>Menu</span>,
    Minus: () => <span>Minus</span>,
    Info: () => <span>Info</span>,
    HelpCircle: () => <span>HelpCircle</span>,
    RotateCcw: () => <span>RotateCcw</span>,
    RotateCw: () => <span>RotateCw</span>,
    Maximize: () => <span>Maximize</span>,
    Minimize: () => <span>Minimize</span>,
    Square: () => <span>Square</span>,
    Circle: () => <span>Circle</span>,
    Triangle: () => <span>Triangle</span>,
    Hexagon: () => <span>Hexagon</span>,
    Octagon: () => <span>Octagon</span>,
    Pentagon: () => <span>Pentagon</span>,
    Diamond: () => <span>Diamond</span>,
    Bookmark: () => <span>Bookmark</span>,
    Tag: () => <span>Tag</span>,
    Flag: () => <span>Flag</span>,
    BellOff: () => <span>BellOff</span>,
    Volume: () => <span>Volume</span>,
    Volume1: () => <span>Volume1</span>,
    Volume2: () => <span>Volume2</span>,
    VolumeX: () => <span>VolumeX</span>,
    Mic: () => <span>Mic</span>,
    MicOff: () => <span>MicOff</span>,
    Camera: () => <span>Camera</span>,
    CameraOff: () => <span>CameraOff</span>,
    Monitor: () => <span>Monitor</span>,
    Smartphone: () => <span>Smartphone</span>,
    Tablet: () => <span>Tablet</span>,
    Laptop: () => <span>Laptop</span>,
    Watch: () => <span>Watch</span>,
    Headphones: () => <span>Headphones</span>,
    Speaker: () => <span>Speaker</span>,
    Printer: () => <span>Printer</span>,
    Scanner: () => <span>Scanner</span>,
    Keyboard: () => <span>Keyboard</span>,
    Mouse: () => <span>Mouse</span>,
    Gamepad2: () => <span>Gamepad2</span>,
    Joystick: () => <span>Joystick</span>,
    Radio: () => <span>Radio</span>,
    Tv: () => <span>Tv</span>,
    Film: () => <span>Film</span>,
    Play: () => <span>Play</span>,
    Pause: () => <span>Pause</span>,
    Stop: () => <span>Stop</span>,
    SkipBack: () => <span>SkipBack</span>,
    SkipForward: () => <span>SkipForward</span>,
    Rewind: () => <span>Rewind</span>,
    FastForward: () => <span>FastForward</span>,
    Shuffle: () => <span>Shuffle</span>,
    Repeat: () => <span>Repeat</span>,
    Repeat1: () => <span>Repeat1</span>,
    Building: () => <span>Building</span>,
    Star: () => <span>Star</span>,
    Heart: () => <span>Heart</span>,
    ThumbsUp: () => <span>ThumbsUp</span>,
    MessageSquare: () => <span>MessageSquare</span>,
  };
});

// Mock utility functions
vi.mock('../../utils/test-runner', () => ({
  runComprehensiveTests: vi.fn(() => Promise.resolve()),
}));

vi.mock('../../utils/demo-data', () => ({
  addDemoData: vi.fn(),
  clearDemoData: vi.fn(),
}));

interface MockExportFieldsFormProps {
  onClose: () => void;
}

// Mock components
vi.mock('../components/ExportFieldsForm', () => ({
  ExportFieldsForm: ({ onClose }: MockExportFieldsFormProps) => (
    <div data-testid="export-form">
      <button onClick={onClose}>Close Export</button>
    </div>
  ),
}));

vi.mock('../components/deals/EnhancedPipeline', () => ({
  EnhancedPipeline: () => <div data-testid="enhanced-pipeline">Enhanced Pipeline</div>,
}));

describe('Deals Component', () => {
  const renderDeals = () => {
    return render(
      <BrowserRouter>
        <Deals />
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render without crashing', async () => {
      renderDeals();
      
      await waitFor(() => {
        expect(screen.getByText('Deals')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should render main content area', async () => {
      renderDeals();
      
      await waitFor(() => {
        const mainElement = document.querySelector('main') || document.querySelector('[role="main"]') || document.querySelector('.deals-container');
        expect(mainElement).toBeTruthy();
      }, { timeout: 3000 });
    });
  });

  describe('Basic Interactions', () => {
    it('should handle component mount', async () => {
      const { container } = renderDeals();
      
      await waitFor(() => {
        expect(container).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });
});