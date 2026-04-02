# Bank PDF Parser Reference

## Parser Strategy

```
PDF binary
  → pdf-parse → raw text
    → detectBank() → bank name
      → specific parser → ParsedTransaction[]
        → confidence score
          if < 0.80 → ai-fallback.ts (Claude API)
        → deduplicator.ts → { toInsert[], duplicates[] }
          → supabase insert
```

## Confidence Scoring

A parsed transaction earns 1 point each for: valid date, valid amount > 0, non-empty description, recognized category hint.
Max score = 4. Confidence = matched_fields / total_expected_fields.
If average confidence across all transactions < 0.80 → trigger AI fallback for the entire batch.

## BBVA Format
- Date: `DD/MM/YYYY` or `DD/MM/YY`
- Columns: DATE | DESCRIPTION | WITHDRAWAL | DEPOSIT | BALANCE
- Regex: `/(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([\d,]+\.\d{2})?\s+([\d,]+\.\d{2})?\s+([\d,]+\.\d{2})/`
- Encoding: UTF-8
- Type detection: column 3 (withdrawal) → gasto, column 4 (deposit) → ingreso

## Nu Format
- Date: `YYYY-MM-DD`
- Closest to CSV embedded in PDF
- Regex: `/(\d{4}-\d{2}-\d{2})\s+(.+?)\s+(-?[\d,]+\.\d{2})/`
- Negative amounts → gasto, positive → ingreso

## Santander Format
- Date: `DD-MM-YYYY`
- Table with variable spacing
- Often needs AI fallback due to merged columns
- Regex: `/(\d{2}-\d{2}-\d{4})\s+(.+?)\s+([\d.]+,\d{2})/`
- Decimal separator: comma (European format)

## HSBC Format
- Date: `DD/MM/YY` (2-digit year)
- Legacy fixed-width columns
- Parse by character position: date[0:8], desc[10:45], amount[46:58]

## Klar Format
- Date: `YYYY-MM-DD`
- Cleanest format, closest to JSON
- Amounts always positive; "CARGO" → gasto, "ABONO" → ingreso

## Openbank Format
- Date: `DD/MM/YYYY`
- Semicolon-separated (similar to CSV)
- Split on `;` then map columns

## AI Fallback (Claude API)

Only called when confidence < 0.80.
Send extracted text (max 4000 chars) with this prompt:

```
Extract all financial transactions from this Mexican bank statement text.
Return ONLY valid JSON array, no markdown, no explanation:
[{"date":"YYYY-MM-DD","amount":number,"type":"gasto|ingreso","description":"string"}]
Rules: amounts are always positive numbers, type indicates direction.
```

Parse response as JSON. If invalid JSON → return empty array, log error.
```
