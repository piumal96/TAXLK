import { motion } from 'framer-motion';
import { Trash2, ChevronDown, ChevronUp, History } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppContext } from '@/context/AppContext';
import { getHistoryBalancePayable } from '@/types/income';
import { formatCurrency, formatPercent } from '@/lib/taxCalculator';
import { useState } from 'react';

export default function HistoryPage() {
  const { state, dispatch } = useAppContext();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [historyPendingDeleteId, setHistoryPendingDeleteId] = useState<string | null>(null);

  const historyPendingDelete = historyPendingDeleteId
    ? state.history.find((h) => h.id === historyPendingDeleteId)
    : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Tax History</h1>
        <p className="text-muted-foreground text-sm mt-1">View your past tax calculations.</p>
      </div>

      {state.history.length === 0 ? (
        <Card className="border-dashed border-2 shadow-none">
          <CardContent className="py-16 text-center">
            <History className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">No calculations yet. Go to the Calculator to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {state.history.map((record, i) => {
            const expanded = expandedId === record.id;
            return (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="shadow-card border-0 hover:shadow-elevated transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                          <History className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{formatCurrency(record.totalIncome)}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(record.date).toLocaleDateString('en-LK', {
                              year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
                            })}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2 sm:hidden">
                            Balance payable{' '}
                            <span className="font-semibold text-foreground">
                              {formatCurrency(getHistoryBalancePayable(record))}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right mr-4 hidden sm:block">
                          <p className="text-xs text-muted-foreground">Balance payable</p>
                          <p className="text-sm font-semibold text-foreground">
                            {formatCurrency(getHistoryBalancePayable(record))}
                          </p>
                          <p className="text-xs text-muted-foreground">{record.effectiveRate.toFixed(1)}% eff.</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setExpandedId(expanded ? null : record.id)}>
                          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setHistoryPendingDeleteId(record.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {expanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 pt-4 border-t"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                          <div className="p-3 bg-secondary rounded-lg">
                            <p className="text-xs text-muted-foreground">Total Income</p>
                            <p className="font-semibold text-foreground">{formatCurrency(record.totalIncome)}</p>
                          </div>
                          <div className="p-3 bg-secondary rounded-lg">
                            <p className="text-xs text-muted-foreground">Taxable</p>
                            <p className="font-semibold text-foreground">{formatCurrency(record.taxableIncome)}</p>
                          </div>
                          <div className="p-3 bg-secondary rounded-lg">
                            <p className="text-xs text-muted-foreground">Total tax liability</p>
                            <p className="font-semibold text-foreground">{formatCurrency(record.totalTax)}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                          <div className="p-3 bg-secondary rounded-lg">
                            <p className="text-xs text-muted-foreground">(−) APIT (T.10)</p>
                            <p className="font-semibold text-foreground">
                              ({formatCurrency(record.apitDeductedAnnual ?? 0)})
                            </p>
                          </div>
                          <div className="p-3 bg-secondary rounded-lg">
                            <p className="text-xs text-muted-foreground">(−) WHT on interest</p>
                            <p className="font-semibold text-foreground">
                              ({formatCurrency(record.whtOnInterestAnnual ?? 0)})
                            </p>
                          </div>
                          <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                            <p className="text-xs text-muted-foreground font-medium">Balance payable</p>
                            <p className="font-semibold text-foreground">
                              {formatCurrency(getHistoryBalancePayable(record))}
                            </p>
                          </div>
                        </div>
                        <div className="rounded-xl overflow-hidden border">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-secondary">
                                <TableHead>Segment</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-right">Rate</TableHead>
                                <TableHead className="text-right">Tax</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {record.breakdown.map((item, j) => (
                                <TableRow key={j}>
                                  <TableCell>{item.label}</TableCell>
                                  <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                                  <TableCell className="text-right">{formatPercent(item.rate)}</TableCell>
                                  <TableCell className="text-right font-semibold">{formatCurrency(item.tax)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <AlertDialog
        open={historyPendingDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setHistoryPendingDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this calculation?</AlertDialogTitle>
            <AlertDialogDescription>
              {historyPendingDelete
                ? `Remove the snapshot from ${new Date(historyPendingDelete.date).toLocaleDateString('en-LK', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} (${formatCurrency(historyPendingDelete.totalIncome)} income). This cannot be undone.`
                : 'This history entry will be removed. This cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (historyPendingDeleteId) {
                  dispatch({ type: 'REMOVE_HISTORY', payload: historyPendingDeleteId });
                  setHistoryPendingDeleteId(null);
                  if (expandedId === historyPendingDeleteId) setExpandedId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
