import { useState } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Users,
  Calculator,
  DollarSign,
  FileSpreadsheet,
  File,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { mockCalculations, mockUsers } from '@/data/mockAdminData';

interface ReportCard {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  records: number;
  formats: string[];
}

const reports: ReportCard[] = [
  {
    id: 'calculations',
    title: 'Tax Calculations',
    description: 'Export all tax calculation records including income, taxable amount, tax, and effective rate',
    icon: Calculator,
    records: mockCalculations.length,
    formats: ['CSV', 'Excel'],
  },
  {
    id: 'users',
    title: 'User Data',
    description: 'Export registered user information including roles, status, and activity metrics',
    icon: Users,
    records: mockUsers.length,
    formats: ['CSV', 'Excel'],
  },
  {
    id: 'income_summary',
    title: 'Income Summary',
    description: 'Aggregated income breakdown by source type, average income, and tax distribution',
    icon: DollarSign,
    records: mockCalculations.length,
    formats: ['CSV', 'Excel', 'PDF'],
  },
  {
    id: 'audit',
    title: 'Audit Trail',
    description: 'Complete audit log of all administrative actions and system changes',
    icon: FileText,
    records: 5,
    formats: ['CSV', 'PDF'],
  },
];

const formatIcon = (fmt: string) => {
  switch (fmt) {
    case 'Excel': return FileSpreadsheet;
    case 'PDF': return File;
    default: return FileText;
  }
};

const generateCSV = (id: string, from: string, to: string) => {
  let csv = '';
  if (id === 'calculations') {
    csv = 'Date,User,Total Income,Taxable Income,Total Tax,Effective Rate,Tax Version\n';
    mockCalculations
      .filter((c) => (!from || c.date >= from) && (!to || c.date <= to))
      .forEach((c) => {
        csv += `${c.date},${c.userName},${c.totalIncome},${c.taxableIncome},${c.totalTax},${c.effectiveRate}%,v${c.taxVersion}\n`;
      });
  } else if (id === 'users') {
    csv = 'Name,Email,Role,Status,Calculations,Last Active,Created\n';
    mockUsers.forEach((u) => {
      csv += `${u.name},${u.email},${u.role},${u.status},${u.totalCalculations},${u.lastActive},${u.createdAt}\n`;
    });
  } else if (id === 'income_summary') {
    csv = 'User,Total Income,Taxable Income,Total Tax,Effective Rate\n';
    mockCalculations
      .filter((c) => (!from || c.date >= from) && (!to || c.date <= to))
      .forEach((c) => {
        csv += `${c.userName},${c.totalIncome},${c.taxableIncome},${c.totalTax},${c.effectiveRate}%\n`;
      });
  }
  return csv;
};

const downloadFile = (content: string, filename: string, mime: string) => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export default function ReportsPage() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const handleExport = (reportId: string, format: string) => {
    if (format === 'CSV') {
      const csv = generateCSV(reportId, dateFrom, dateTo);
      if (!csv.split('\n').slice(1).filter(Boolean).length) {
        toast.error('No records found for the selected date range');
        return;
      }
      downloadFile(csv, `${reportId}_export.csv`, 'text/csv');
      toast.success(`${format} export downloaded`);
    } else {
      toast.info(`${format} export would be generated via the backend API`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight text-foreground">
          Reports & Export
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate and download reports for tax calculations, users, and income data
        </p>
      </div>

      {/* Date Range Filter */}
      <Card className="border-border/50">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">Date Range</span>
            </div>
            <div className="flex flex-1 flex-col sm:flex-row gap-3">
              <div className="space-y-1.5 flex-1">
                <Label className="text-xs text-muted-foreground">From</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-1.5 flex-1">
                <Label className="text-xs text-muted-foreground">To</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setDateFrom(''); setDateTo(''); }}
              className="shrink-0"
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {reports.map((report) => (
          <Card key={report.id} className="border-border/50 flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                  <report.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-base">{report.title}</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {report.records} records
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    {report.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 mt-auto">
              <Separator className="mb-4" />
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground mr-1">Export as:</span>
                {report.formats.map((fmt) => {
                  const Icon = formatIcon(fmt);
                  return (
                    <Button
                      key={fmt}
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs h-8"
                      onClick={() => handleExport(report.id, fmt)}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {fmt}
                      <Download className="w-3 h-3 ml-0.5 text-muted-foreground" />
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <Card className="border-border/50 border-dashed">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-secondary text-muted-foreground">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Export Notes</p>
              <ul className="text-xs text-muted-foreground mt-1 space-y-0.5 list-disc list-inside">
                <li>CSV exports download directly in the browser</li>
                <li>Excel and PDF exports require backend API integration</li>
                <li>Date range filter applies to calculation and income reports</li>
                <li>User exports include all users regardless of date range</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
