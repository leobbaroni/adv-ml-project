// Telegram bot using grammY in long-polling mode.
// Phases 6-8: overlap alerts, shopping, PDF delivery.

import { Bot, InputFile } from 'grammy';
import { prisma } from '@app/db';
import { parseShoppingMessage, parsePdfRequest } from '@app/ai';
import { logger } from '../logger.js';

let bot: Bot | null = null;

function formatDate(d: Date): string {
  const date = new Date(d);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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

    // 2. Try shopping
    try {
      const properties = await prisma.property.findMany({
        select: { id: true, name: true },
      });

      const shoppingResult = await parseShoppingMessage({ text, properties });

      if (shoppingResult.items.length > 0) {
        const property = properties.find((p) => p.id === shoppingResult.propertyId);
        if (!property) {
          await ctx.reply("I couldn't find that property.");
          return;
        }

        for (const item of shoppingResult.items) {
          await prisma.shoppingItem.create({
            data: {
              propertyId: property.id,
              name: item.name,
              qty: item.qty,
              source: 'CHAT',
              status: 'PROPOSED',
            },
          });
        }

        const itemNames = shoppingResult.items.map((i) => i.name).join(', ');
        await ctx.reply(`Added ${shoppingResult.items.length} items for ${property.name}: ${itemNames}`);

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

    // 3. Try PDF request
    try {
      const properties = await prisma.property.findMany({
        select: { id: true, name: true },
      });

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

      const pdfResult = await parsePdfRequest({ text, properties, reservations });

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
          const response = await fetch(
            `http://localhost:3000/api/checkin/pdf?reservationId=${encodeURIComponent(reservationId)}`,
          );
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
        }
      } else if (pdfResult.type === 'SCHEDULE') {
        if (pdfResult.referenceDate) {
          const params = new URLSearchParams({
            referenceDate: pdfResult.referenceDate,
          });
          if (pdfResult.propertyId) {
            params.set('propertyId', pdfResult.propertyId);
          }
          if (pdfResult.windowDays) {
            params.set('windowDays', String(pdfResult.windowDays));
          }
          const response = await fetch(`http://localhost:3000/api/schedule/pdf?${params.toString()}`);
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
        }
      }
    } catch (err) {
      logger.error({ err }, '[telegram] PDF request failed');
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
