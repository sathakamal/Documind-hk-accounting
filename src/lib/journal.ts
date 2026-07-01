import { prisma } from "@/lib/prisma";
import { Decimal } from "decimal.js";

interface JournalLineInput {
  accountId: string;
  debit: number | Decimal;
  credit: number | Decimal;
}

export async function createJournalEntry(client: any, {
  description,
  reference,
  organizationId,
  date,
  lines,
}: {
  description: string;
  reference?: string;
  organizationId: string;
  date?: Date;
  lines: JournalLineInput[];
}) {
  let totalDebit = new Decimal(0);
  let totalCredit = new Decimal(0);
  for (const line of lines) {
    totalDebit = totalDebit.plus(new Decimal(line.debit));
    totalCredit = totalCredit.plus(new Decimal(line.credit));
  }

  if (!totalDebit.equals(totalCredit)) {
    throw new Error(`Balanced entry violation: Debits (${totalDebit}) must equal Credits (${totalCredit})`);
  }

  const result = await prisma.$transaction(async (tx) => {
    const entry = await tx.journalEntry.create({
      data: {
        description,
        reference,
        organizationId,
        date: date || new Date(),
      },
      select: { id: true }
    });

    await Promise.all(lines.map(l =>
      tx.journalLine.create({
        data: {
          accountId: l.accountId,
          debit: new Decimal(l.debit),
          credit: new Decimal(l.credit),
          journalEntryId: entry.id,
        },
        select: { id: true }
      })
    ));

    for (const line of lines) {
      const acc = await tx.account.findUnique({
        where: { id: line.accountId },
        select: { id: true, balance: true, type: true }
      });
      if (!acc) throw new Error(`Account not found: ${line.accountId}`);

      const debit = new Decimal(line.debit);
      const credit = new Decimal(line.credit);

      let newBalance = new Decimal(acc.balance);
      if (acc.type === "ASSET" || acc.type === "EXPENSE") {
        newBalance = newBalance.plus(debit).minus(credit);
      } else {
        newBalance = newBalance.plus(credit).minus(debit);
      }

      await tx.account.update({
        where: { id: acc.id },
        data: { balance: newBalance },
        select: { id: true }
      });
    }

    return entry;
  });

  return result;
}
