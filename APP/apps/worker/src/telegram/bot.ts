// Telegram bot using grammY in long-polling mode.
// Phases 6-8: overlap alerts, shopping, PDF delivery.

import { Bot, InputFile } from 'grammy';
import { prisma } from '@app/db';
import { parseShoppingMessage, parsePdfRequest, parseRepairMessage } from '@app/ai';
import {
  findIkeaProductByName,
  getIkeaSearchUrl,
  resolveIkeaProduct,
} from '@app/ai/ikea-catalog';
import { logger } from '../logger.js';

let bot: Bot | null = null;

function formatDate(d: Date): string {
  const date = new Date(d);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDateShort(d: Date): string {
  const date = new Date(d);
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

function firstDayOfCurrentMonthIso(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}-01`;
}

function getWebBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}

function isScheduleIntent(text: string): boolean {
  return /\b(schedule|calendar|reservations|bookings)\b/i.test(text);
}

function isPdfIntent(text: string): boolean {
  return /\b(pdf|check-?in|schedule|calendar|reservations|bookings)\b/i.test(text);
}

function isShoppingIntent(text: string): boolean {
  return /\b(buy|order|get|purchase|add)\b/i.test(text) && !isPdfIntent(text) && !isRepairIntent(text);
}

function isRepairIntent(text: string): boolean {
  return /\b(repair|fix|broken|leak|leaking|leaky|damage|damaged|replace|quote|estimate|budget)\b/i.test(text);
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function findPropertyInText<T extends { id: string; name: string }>(
  text: string,
  properties: T[],
): T | undefined {
  const normalized = normalizeText(text);
  return properties.find((property) => normalized.includes(normalizeText(property.name)));
}

function parseQuantityAndName(rawItem: string): { name: string; qty: number } | null {
  const cleaned = rawItem.trim().replace(/^\b(?:a|an|the)\b\s+/i, '');
  const wordNumbers: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
  };

  const numericMatch = cleaned.match(/^(\d+)\s*x?\s+(.+)$/i) ?? cleaned.match(/^(\d+)x\s*(.+)$/i);
  if (numericMatch) {
    return { qty: Number(numericMatch[1]), name: numericMatch[2]!.trim() };
  }

  const wordMatch = cleaned.match(/^([a-z]+)\s+(.+)$/i);
  if (wordMatch) {
    const qty = wordNumbers[wordMatch[1]!.toLowerCase()];
    if (qty) return { qty, name: wordMatch[2]!.trim() };
  }

  return cleaned ? { qty: 1, name: cleaned } : null;
}

function parseShoppingFallback(
  text: string,
  properties: Array<{ id: string; name: string }>,
): { propertyId: string | null; items: Array<{ name: string; qty: number; unitPrice?: number | null }> } {
  const byPrefix = text.match(/\b(?:buy|order|get|purchase|add)\b\s+for\s+(.+?):\s*(.+)$/i);
  const bySuffix = text.match(/\b(?:buy|order|get|purchase|add)\b\s+(.+?)\s+(?:for|to)\s+(.+)$/i);

  const propertyText = byPrefix?.[1] ?? bySuffix?.[2];
  const itemsText = byPrefix?.[2] ?? bySuffix?.[1];
  if (!propertyText || !itemsText) return { propertyId: null, items: [] };

  const property = findPropertyInText(propertyText, properties);
  if (!property) return { propertyId: null, items: [] };

  const items = itemsText
    .split(/,|\s+and\s+/i)
    .map(parseQuantityAndName)
    .filter((item): item is { name: string; qty: number } => Boolean(item))
    .map((item) => {
      const catalogProduct = findIkeaProductByName(item.name);
      return {
        name: catalogProduct?.name ?? item.name,
        qty: item.qty,
        unitPrice: catalogProduct?.unitPrice,
      };
    });

  return { propertyId: property.id, items };
}

function parseScheduleFallback(
  text: string,
  properties: Array<{ id: string; name: string }>,
) {
  if (!isScheduleIntent(text)) return null;
  const property = findPropertyInText(text, properties);
  return {
    type: 'SCHEDULE' as const,
    propertyId: property?.id ?? null,
    referenceDate: firstDayOfCurrentMonthIso(),
    windowDays: 30,
  };
}

function buildRepairLineItems(description: string) {
  const normalized = normalizeText(description);

  if (/\b(door|hinge|handle|lock)\b/.test(normalized)) {
    return [
      { name: 'Door hardware and materials', cost: 35, category: 'MATERIALS' as const },
      { name: 'Handyman labor 2h', cost: 70, category: 'LABOR' as const },
      { name: 'Transport and call-out fee', cost: 15, category: 'OTHER' as const },
    ];
  }

  if (/\b(leak|leaking|leaky|faucet|tap|pipe|plumb)\b/.test(normalized)) {
    return [
      { name: 'Plumbing parts and sealant', cost: 30, category: 'MATERIALS' as const },
      { name: 'Plumber labor 2h', cost: 90, category: 'LABOR' as const },
      { name: 'Call-out fee', cost: 20, category: 'OTHER' as const },
    ];
  }

  if (/\b(window|glass|blind|shutter)\b/.test(normalized)) {
    return [
      { name: 'Replacement parts/materials', cost: 55, category: 'MATERIALS' as const },
      { name: 'Technician labor 2h', cost: 80, category: 'LABOR' as const },
      { name: 'Transport and disposal', cost: 20, category: 'OTHER' as const },
    ];
  }

  return [
    { name: 'Materials allowance', cost: 40, category: 'MATERIALS' as const },
    { name: 'Handyman labor 2h', cost: 70, category: 'LABOR' as const },
    { name: 'Transport and contingency', cost: 20, category: 'OTHER' as const },
  ];
}

function parseRepairFallback(text: string, properties: Array<{ id: string; name: string }>) {
  const property = findPropertyInText(text, properties);
  if (!property) return { propertyId: null, description: '', lineItems: [] };

  const normalizedPropertyName = normalizeText(property.name);
  const descriptionWords = text
    .split(/\s+/)
    .filter((word) => {
      const normalizedWord = normalizeText(word);
      return (
        normalizedWord &&
        !/^(repair|fix|broken|leak|leaking|leaky|damage|damaged|replace|quote|estimate|budget|for|at|in|the|a|an|please)$/.test(
          normalizedWord,
        ) &&
        !normalizedPropertyName.split(' ').includes(normalizedWord)
      );
    });
  const description = descriptionWords.join(' ').trim() || 'General repair';

  return {
    propertyId: property.id,
    description,
    lineItems: buildRepairLineItems(description),
  };
}

async function generateTextSchedule(params: {
  referenceDate: string;
  propertyId?: string;
  windowDays?: number;
}): Promise<string | null> {
  try {
    const referenceDate = new Date(params.referenceDate);
    const windowDays = params.windowDays ?? 30;
    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    const cutoff = new Date(referenceDate.getTime() + windowDays * MS_PER_DAY);

    const reservations = await prisma.reservation.findMany({
      where: {
        endDate: { gte: referenceDate },
        startDate: { lte: cutoff },
        status: { not: 'SUPPRESSED' },
        ...(params.propertyId ? { propertyId: params.propertyId } : {}),
      },
      orderBy: { startDate: 'asc' },
      select: {
        id: true,
        summary: true,
        startDate: true,
        endDate: true,
        status: true,
        property: { select: { name: true } },
        source: { select: { label: true } },
      },
    });

    if (reservations.length === 0) {
      return '📅 No reservations found for this period.';
    }

    const lines: string[] = [];
    lines.push(`📅 Schedule — ${formatDateShort(referenceDate)} to ${formatDateShort(cutoff)}`);
    lines.push('');

    let currentProperty = '';
    for (const r of reservations) {
      if (r.property.name !== currentProperty) {
        currentProperty = r.property.name;
        lines.push(`🏠 *${currentProperty}*`);
      }
      const checkIn = formatDateShort(r.startDate);
      const checkOut = formatDateShort(r.endDate);
      const status = r.status === 'SUPPRESSED' ? ' ~~SUPPRESSED~~' : '';
      lines.push(`  • ${checkIn} → ${checkOut} — ${r.summary}${status}`);
    }

    lines.push('');
    lines.push(`Total: ${reservations.length} reservation(s)`);

    return lines.join('\n');
  } catch (err) {
    logger.error({ err }, '[telegram] text schedule generation failed');
    return null;
  }
}

export async function sendOverlapAlert(
  botInstance: Bot,
  decision: { id: string; propertyId: string; aiRationale: string | null },
  resA: { summary: string; startDate: Date; endDate: Date; source: { label: string } },
  resB: { summary: string; startDate: Date; endDate: Date; source: { label: string } },
) {
  const adminId = process.env.TELEGRAM_ADMIN_USER_ID;
  if (!adminId) {
    logger.warn('[telegram] TELEGRAM_ADMIN_USER_ID not set — skipping overlap alert');
    return;
  }

  try {
    const property = await prisma.property.findUnique({
      where: { id: decision.propertyId },
      select: { name: true },
    });
    const propertyName = property?.name ?? 'Unknown property';

    const text =
      `⚠️ Overlap at ${propertyName}\n\n` +
      `${resA.summary} (${resA.source.label})\n` +
      `${formatDate(resA.startDate)} → ${formatDate(resA.endDate)}\n\n` +
      `vs\n\n` +
      `${resB.summary} (${resB.source.label})\n` +
      `${formatDate(resB.startDate)} → ${formatDate(resB.endDate)}\n\n` +
      `🤖 AI says: ${decision.aiRationale ?? 'No rationale'}`;

    await botInstance.api.sendMessage(adminId, text, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '✅ Accept', callback_data: `accept:${decision.id}` }],
          [{ text: '↩️ Revert', callback_data: `revert:${decision.id}` }],
        ],
      },
    });
  } catch (err) {
    logger.error({ err }, '[telegram] failed to send overlap alert');
  }
}

export async function startTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    logger.warn('[telegram] TELEGRAM_BOT_TOKEN missing — bot disabled');
    return;
  }

  const adminId = process.env.TELEGRAM_ADMIN_USER_ID;
  if (!adminId) {
    logger.warn('[telegram] TELEGRAM_ADMIN_USER_ID missing — bot will respond to anyone');
  }

  bot = new Bot(token);

  // Admin-only gate. Anyone else gets silence.
  bot.use(async (ctx, next) => {
    if (adminId && String(ctx.from?.id) !== adminId) return;
    await next();
  });

  bot.command('start', (ctx) =>
    ctx.reply(
      'Concierge online.\n\n' +
        'You can ask me things like:\n' +
        '• "check-in form for May 11"\n' +
        '• "send me the schedule for this month"\n' +
        '• "Buy for Triplex: 2x MALM bed frame"\n\n' +
        'I also alert you about calendar overlaps with Accept/Revert buttons.',
    ),
  );

  bot.command('ping', (ctx) => ctx.reply('pong'));

  // Callback query handler
  bot.on('callback_query', async (ctx) => {
    const data = ctx.callbackQuery.data;
    if (!data) return;

    const acceptMatch = data.match(/^accept:(.+)$/);
    const revertMatch = data.match(/^revert:(.+)$/);

    if (acceptMatch) {
      const decisionId = acceptMatch[1]!;
      try {
        const decision = await prisma.overlapDecision.findUnique({
          where: { id: decisionId },
        });
        if (!decision) {
          await ctx.answerCallbackQuery({ text: 'Decision not found' });
          return;
        }

        if (decision.action === 'AI_PROPOSED' && decision.reservationIds.length >= 2) {
          await prisma.reservation.update({
            where: { id: decision.reservationIds[1] },
            data: { status: 'SUPPRESSED', suppressionReason: 'AI_RESOLVED' },
          });
        }

        await prisma.overlapDecision.update({
          where: { id: decisionId },
          data: { acceptedByUser: true },
        });

        const msg = ctx.callbackQuery.message;
        const currentText = msg && 'text' in msg ? msg.text : '';
        try {
          await ctx.editMessageText(`${currentText}\n\n✅ Accepted`);
        } catch (editErr) {
          logger.warn({ editErr }, '[telegram] failed to edit message on accept');
        }

        await ctx.answerCallbackQuery({ text: 'Accepted' });

        await prisma.chatMessage.create({
          data: {
            direction: 'OUTBOUND',
            telegramUserId: String(ctx.from?.id ?? ''),
            text: 'Overlap accepted',
            aiAction: 'OVERLAP_ACCEPTED',
            relatedEntityId: decision.id,
          },
        });
      } catch (err) {
        logger.error({ err, decisionId }, '[telegram] accept callback failed');
        await ctx.answerCallbackQuery({ text: 'Error processing accept' });
      }
      return;
    }

    if (revertMatch) {
      const decisionId = revertMatch[1]!;
      try {
        const decision = await prisma.overlapDecision.findUnique({
          where: { id: decisionId },
        });
        if (!decision) {
          await ctx.answerCallbackQuery({ text: 'Decision not found' });
          return;
        }

        await prisma.overlapDecision.update({
          where: { id: decisionId },
          data: { revertedAt: new Date() },
        });

        for (const reservationId of decision.reservationIds) {
          await prisma.reservation.update({
            where: { id: reservationId },
            data: { status: 'CONFIRMED', suppressionReason: null },
          });
        }

        const msg = ctx.callbackQuery.message;
        const currentText = msg && 'text' in msg ? msg.text : '';
        try {
          await ctx.editMessageText(`${currentText}\n\n↩️ Reverted`);
        } catch (editErr) {
          logger.warn({ editErr }, '[telegram] failed to edit message on revert');
        }

        await ctx.answerCallbackQuery({ text: 'Reverted' });

        await prisma.chatMessage.create({
          data: {
            direction: 'OUTBOUND',
            telegramUserId: String(ctx.from?.id ?? ''),
            text: 'Overlap reverted',
            aiAction: 'OVERLAP_REVERTED',
            relatedEntityId: decision.id,
          },
        });
      } catch (err) {
        logger.error({ err, decisionId }, '[telegram] revert callback failed');
        await ctx.answerCallbackQuery({ text: 'Error processing revert' });
      }
      return;
    }
  });

  // Natural-language message handler
  bot.on('message:text', async (ctx) => {
    const text = ctx.message.text;
    const telegramUserId = String(ctx.from?.id ?? '');

    // 1. Log inbound
    try {
      await prisma.chatMessage.create({
        data: {
          direction: 'INBOUND',
          telegramUserId,
          text,
        },
      });
    } catch (err) {
      logger.error({ err }, '[telegram] failed to log inbound message');
    }

    const properties = await prisma.property.findMany({
      select: { id: true, name: true },
    });

    // 2. Try repair
    if (isRepairIntent(text)) {
      try {
        logger.info({ text, propertyCount: properties.length }, '[telegram] trying repair parse');
        const aiRepairResult = await parseRepairMessage({ text, properties });
        const aiProperty = properties.find((p) => p.id === aiRepairResult.propertyId);
        const repairResult =
          aiRepairResult.lineItems.length > 0 && aiProperty
            ? aiRepairResult
            : parseRepairFallback(text, properties);
        logger.info({ repairResult }, '[telegram] repair parse result');

        if (repairResult.lineItems.length > 0) {
          const property = properties.find((p) => p.id === repairResult.propertyId);
          if (!property) {
            await ctx.reply("I couldn't find that property.");
            return;
          }

          const total = repairResult.lineItems.reduce((sum, li) => sum + li.cost, 0);

          await prisma.repairEstimate.create({
            data: {
              propertyId: property.id,
              description: repairResult.description,
              lineItems: repairResult.lineItems,
              source: 'CHAT',
              status: 'PROPOSED',
            },
          });

          await prisma.notification.create({
            data: {
              kind: 'ORDER_UPDATE',
              severity: 'INFO',
              propertyId: property.id,
              payload: { type: 'REPAIR_ESTIMATE', description: repairResult.description },
            },
          });

          const lineText = repairResult.lineItems
            .map((li) => `- ${li.name}: €${li.cost.toFixed(2)} (${li.category})`)
            .join('\n');

          await ctx.reply(
            `Repair estimate for ${property.name}:\n${repairResult.description}\n\n${lineText}\n\nTotal: €${total.toFixed(2)}`,
          );

          await prisma.chatMessage.create({
            data: {
              direction: 'OUTBOUND',
              telegramUserId,
              text: `Repair estimate created for ${property.name}`,
              aiAction: 'REPAIR_CREATED',
            },
          });
          return;
        }
      } catch (err) {
        logger.error({ err }, '[telegram] repair parsing failed');
      }
    }

    // 3. Try shopping
    if (isShoppingIntent(text)) {
      try {
        logger.info({ text, propertyCount: properties.length }, '[telegram] trying shopping parse');
        const aiShoppingResult = await parseShoppingMessage({ text, properties });
        const aiProperty = properties.find((p) => p.id === aiShoppingResult.propertyId);
        const shoppingResult =
          aiShoppingResult.items.length > 0 && aiProperty
            ? aiShoppingResult
            : parseShoppingFallback(text, properties);
        logger.info({ shoppingResult }, '[telegram] shopping parse result');

        if (shoppingResult.items.length > 0) {
          const property = properties.find((p) => p.id === shoppingResult.propertyId);
          if (!property) {
            await ctx.reply("I couldn't find that property.");
            return;
          }

          const savedItems: Array<{
            name: string;
            qty: number;
            unitPrice: number | null;
            ikeaUrl: string;
          }> = [];

          for (const item of shoppingResult.items) {
            const liveProduct = await resolveIkeaProduct(item.name);
            const catalogProduct = findIkeaProductByName(item.name);
            const productName = liveProduct?.name ?? catalogProduct?.name ?? item.name;
            const productPrice =
              liveProduct?.unitPrice ?? catalogProduct?.unitPrice ?? item.unitPrice ?? null;
            const finalUrl = liveProduct?.url ?? getIkeaSearchUrl(productName);

            await prisma.shoppingItem.create({
              data: {
                propertyId: property.id,
                name: productName,
                qty: item.qty,
                unitPrice: productPrice ?? null,
                ikeaUrl: finalUrl,
                source: 'CHAT',
                status: 'PROPOSED',
              },
            });

            savedItems.push({
              name: productName,
              qty: item.qty,
              unitPrice: productPrice,
              ikeaUrl: finalUrl,
            });
          }

          await prisma.notification.create({
            data: {
              kind: 'ORDER_UPDATE',
              severity: 'INFO',
              propertyId: property.id,
              payload: { type: 'SHOPPING_ITEMS', count: shoppingResult.items.length },
            },
          });

          const itemLines = savedItems
            .map((i) => {
              const price = i.unitPrice ? ` €${i.unitPrice.toFixed(2)}` : '';
              return `- ${i.qty}x ${i.name}${price}\n  ${i.ikeaUrl}`;
            })
            .join('\n');

          await ctx.reply(`Added ${shoppingResult.items.length} items for ${property.name}:\n${itemLines}`);

          await prisma.chatMessage.create({
            data: {
              direction: 'OUTBOUND',
              telegramUserId,
              text: `Added ${shoppingResult.items.length} shopping items`,
              aiAction: 'SHOPPING_ADDED',
            },
          });
          return;
        }
      } catch (err) {
        logger.error({ err }, '[telegram] shopping parsing failed');
      }
    }

    // 4. Try PDF request
    if (isPdfIntent(text)) {
      try {
        const now = new Date();
        const cutoff = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
        const reservations = await prisma.reservation.findMany({
          where: {
            startDate: { lte: cutoff },
            endDate: { gte: now },
          },
          select: {
            id: true,
            propertyId: true,
            startDate: true,
            endDate: true,
            summary: true,
          },
        });

        logger.info({ text, reservationCount: reservations.length }, '[telegram] trying PDF parse');
        const aiPdfResult = await parsePdfRequest({ text, properties, reservations });
        const pdfResult =
          aiPdfResult.type === 'UNKNOWN'
            ? parseScheduleFallback(text, properties) ?? aiPdfResult
            : aiPdfResult;
        logger.info({ pdfResult }, '[telegram] PDF parse result');

        if (pdfResult.type === 'CHECKIN') {
          let reservationId = pdfResult.reservationId;
          if (!reservationId && pdfResult.referenceDate && pdfResult.propertyId) {
            const refDateStr = formatDate(new Date(pdfResult.referenceDate));
            const match = reservations.find(
              (r) =>
                r.propertyId === pdfResult.propertyId &&
                (formatDate(r.startDate) === refDateStr || formatDate(r.endDate) === refDateStr),
            );
            if (match) reservationId = match.id;
          }

          if (reservationId) {
            const url = `${getWebBaseUrl()}/api/checkin/pdf?reservationId=${encodeURIComponent(reservationId)}`;
            logger.info({ url }, '[telegram] fetching check-in PDF');
            const response = await fetch(url);
            if (response.ok) {
              const buffer = await response.arrayBuffer();
              await ctx.replyWithDocument(new InputFile(Buffer.from(buffer), 'checkin.pdf'));
              await prisma.chatMessage.create({
                data: {
                  direction: 'OUTBOUND',
                  telegramUserId,
                  text: 'Check-in PDF delivered',
                  aiAction: 'PDF_DELIVERED',
                },
              });
              return;
            }
            logger.warn({ status: response.status }, '[telegram] check-in PDF fetch failed');
          }
        } else if (pdfResult.type === 'SCHEDULE') {
          const referenceDate = pdfResult.referenceDate ?? firstDayOfCurrentMonthIso();
          if (referenceDate) {
            const params = new URLSearchParams({ referenceDate });
            if (pdfResult.propertyId) {
              params.set('propertyId', pdfResult.propertyId);
            }
            if (pdfResult.windowDays) {
              params.set('windowDays', String(pdfResult.windowDays));
            }
            const url = `${getWebBaseUrl()}/api/schedule/pdf?${params.toString()}`;
            logger.info({ url }, '[telegram] fetching schedule PDF');
            try {
              const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
              if (response.ok) {
                const buffer = await response.arrayBuffer();
                await ctx.replyWithDocument(new InputFile(Buffer.from(buffer), 'schedule.pdf'));
                await prisma.chatMessage.create({
                  data: {
                    direction: 'OUTBOUND',
                    telegramUserId,
                    text: 'Schedule PDF delivered',
                    aiAction: 'PDF_DELIVERED',
                  },
                });
                return;
              }
              logger.warn(
                { status: response.status, statusText: response.statusText },
                '[telegram] schedule PDF fetch failed — falling back to text',
              );
            } catch (fetchErr) {
              logger.error({ fetchErr }, '[telegram] schedule PDF fetch threw — falling back to text');
            }

            const textSchedule = await generateTextSchedule({
              referenceDate,
              propertyId: pdfResult.propertyId ?? undefined,
              windowDays: pdfResult.windowDays ?? undefined,
            });
            if (textSchedule) {
              await ctx.reply(textSchedule);
              await prisma.chatMessage.create({
                data: {
                  direction: 'OUTBOUND',
                  telegramUserId,
                  text: 'Schedule text delivered (PDF fallback)',
                  aiAction: 'SCHEDULE_TEXT_DELIVERED',
                },
              });
              return;
            }
          }
        }
      } catch (err) {
        logger.error({ err }, '[telegram] PDF request failed');
      }
    }

    // 4. Fallback
    await ctx.reply("I didn't understand. Try /start for help.");
  });

  // Fire-and-forget long-polling. grammY handles backoff internally.
  bot.start({
    onStart: (me) => logger.info({ username: me.username }, '[telegram] long-polling started'),
  });
}

export function getBot(): Bot {
  if (!bot) throw new Error('[telegram] bot not started');
  return bot;
}
