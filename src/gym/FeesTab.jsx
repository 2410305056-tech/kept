import React, { useState } from "react";
import { useStore } from "../hooks/useStore.js";
import { useNow } from "../hooks/useNow.js";
import { formatCurrency, formatDisplayDate } from "../lib/format.js";
import { Card } from "../components/ui/Card.jsx";
import { Button } from "../components/ui/Button.jsx";
import { Input } from "../components/ui/Input.jsx";
import { Stepper } from "../components/ui/Stepper.jsx";

export function FeesTab() {
  const [state, setState] = useStore();
  const { today } = useNow();

  const [amount, setAmount] = useState(1500);
  const [paidThrough, setPaidThrough] = useState(today);

  const fees = state.fees || [];

  const handleAddFee = () => {
    if (!amount || !paidThrough) return;
    const newEntry = {
      id: crypto.randomUUID(),
      datePaid: today,
      amount: Number(amount),
      paidThrough,
    };
    setState((prev) => ({
      ...prev,
      fees: [newEntry, ...(prev.fees || [])],
    }));
  };

  const handleDeleteFee = (id) => {
    setState((prev) => ({
      ...prev,
      fees: (prev.fees || []).filter((f) => f.id !== id),
    }));
  };

  const thisYear = new Date().getFullYear();
  const totalThisYear = fees
    .filter((f) => f.datePaid.startsWith(String(thisYear)))
    .reduce((acc, f) => acc + (f.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-[0.08em] text-[var(--text-3)]">
            Gym Dues {thisYear}
          </span>
          <div className="text-3xl font-medium font-mono text-[var(--text-1)] mt-1">
            {formatCurrency(totalThisYear)}
          </div>
        </div>

        <div className="text-xs font-mono text-[var(--text-2)] bg-[var(--surface-2)] p-3 rounded-[8px] border border-[var(--line)]">
          {fees.length > 0 ? (
            <span>Valid through: {formatDisplayDate(fees[0].paidThrough)}</span>
          ) : (
            <span>No active gym payments</span>
          )}
        </div>
      </Card>

      {/* Add Payment Form */}
      <Card className="space-y-4">
        <h3 className="text-sm font-medium text-[var(--text-1)]">Record Gym Payment</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-mono uppercase text-[var(--text-3)] block mb-1">
              Amount (₹)
            </label>
            <Stepper
              step={100}
              min={100}
              max={50000}
              value={amount}
              onChange={(v) => setAmount(v || 0)}
              unit="₹"
            />
          </div>

          <div>
            <label className="text-[11px] font-mono uppercase text-[var(--text-3)] block mb-1">
              Valid Through (YYYY-MM-DD)
            </label>
            <Input
              type="date"
              value={paidThrough}
              onChange={(e) => setPaidThrough(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="primary" size="md" onClick={handleAddFee}>
            Record Payment
          </Button>
        </div>
      </Card>

      {/* Payment History Ledger */}
      <Card className="space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-[0.08em] text-[var(--text-3)]">
          Payment History
        </h3>

        {fees.length === 0 ? (
          <p className="text-xs text-[var(--text-3)] font-mono py-4 text-center">
            No payments recorded yet
          </p>
        ) : (
          <div className="space-y-2">
            {fees.map((fee) => (
              <div
                key={fee.id}
                className="flex items-center justify-between p-3 bg-[var(--surface-2)] rounded-[8px] border border-[var(--line)] text-xs font-mono"
              >
                <div>
                  <span className="text-[var(--text-1)] font-medium">
                    {formatCurrency(fee.amount)}
                  </span>
                  <span className="text-[var(--text-3)] ml-3">
                    Paid: {formatDisplayDate(fee.datePaid)}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-[var(--text-2)]">
                    Through: {formatDisplayDate(fee.paidThrough)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteFee(fee.id)}
                    className="text-[var(--danger)] hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
