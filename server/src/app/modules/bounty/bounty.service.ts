import cron from "node-cron";
import prisma from "../../config/prisma";
import { pushService } from "../push/push.service";

const BOUNTY_TEMPLATES = [
  { title: "Lost & Found Hero", description: "Report 2 found items to the SAS office", targetCount: 2, actionType: "REPORT_FOUND_ITEM", xpReward: 300, icon: "🎒" },
  { title: "Sharp Eyes", description: "Report 5 found items to the SAS office", targetCount: 5, actionType: "REPORT_FOUND_ITEM", xpReward: 1000, icon: "🦅" },
  { title: "Detective Mode", description: "Use AI Search to look for an item 5 times", targetCount: 5, actionType: "USE_AI_SEARCH", xpReward: 150, icon: "🤖" },
  { title: "The Matchmaker", description: "Get a verified claim approved", targetCount: 1, actionType: "CLAIM_APPROVED", xpReward: 500, icon: "🤝" },
  { title: "Active Explorer", description: "View the indoor campus map 3 times", targetCount: 3, actionType: "VIEW_MAP", xpReward: 100, icon: "🗺️" },
  { title: "Helpful Hand", description: "Leave a comment on 2 lost item posts", targetCount: 2, actionType: "LEAVE_COMMENT", xpReward: 200, icon: "🗣️" }
];

export const generateWeeklyBounties = async () => {
  console.log("🔄 Running Weekly Bounty Generator...");
  
  // 1. Deactivate old bounties
  await prisma.bounty.updateMany({
    where: { isActive: true },
    data: { isActive: false }
  });

  // 2. Select 3 random templates
  const shuffled = [...BOUNTY_TEMPLATES].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 3);

  // 3. Set end date to next Sunday at 23:59:59
  const now = new Date();
  const nextSunday = new Date(now);
  nextSunday.setDate(now.getDate() + ((7 - now.getDay()) % 7 || 7));
  nextSunday.setHours(23, 59, 59, 999);

  // 4. Create new bounties
  for (const template of selected) {
    await prisma.bounty.create({
      data: {
        title: template.title,
        description: template.description,
        targetCount: template.targetCount,
        actionType: template.actionType,
        xpReward: template.xpReward,
        icon: template.icon,
        isActive: true,
        startDate: now,
        endDate: nextSunday
      }
    });
  }
  console.log("✅ Weekly Bounties Generated!");
};

// Increment Progress Function
export const incrementBountyProgress = async (userId: string, actionType: string) => {
  try {
    const activeBounties = await prisma.bounty.findMany({
      where: { isActive: true, actionType: actionType }
    });

    if (activeBounties.length === 0) return;

    for (const bounty of activeBounties) {
      let progress = await prisma.userBountyProgress.findUnique({
        where: { userId_bountyId: { userId, bountyId: bounty.id } }
      });

      if (!progress) {
        progress = await prisma.userBountyProgress.create({
          data: { userId, bountyId: bounty.id, currentCount: 0 }
        });
      }

      if (progress.isCompleted) continue;

      const newCount = progress.currentCount + 1;
      const isCompleted = newCount >= bounty.targetCount;

      await prisma.userBountyProgress.update({
        where: { id: progress.id },
        data: { 
          currentCount: newCount, 
          isCompleted,
          completedAt: isCompleted ? new Date() : null
        }
      });

      if (isCompleted) {
        // Award XP
        await prisma.user.update({
          where: { id: userId },
          data: { totalPoints: { increment: bounty.xpReward } }
        });
        console.log(`🏆 User ${userId} completed bounty: ${bounty.title} for ${bounty.xpReward} XP!`);
        
        // Send completion push notification
        try {
          await pushService.sendNotificationToUser(userId, {
            title: `🎯 Bounty Completed: ${bounty.title}!`,
            body: `You've earned ${bounty.xpReward} XP. Great job!`,
            data: {
              type: "BOUNTY_COMPLETED",
              bountyId: bounty.id
            }
          });
        } catch (err) {
          console.error("Failed to send bounty completion push:", err);
        }
      } else {
        const oldRatio = progress.currentCount / bounty.targetCount;
        const newRatio = newCount / bounty.targetCount;
        if (oldRatio < 0.8 && newRatio >= 0.8) {
          // Send near-complete push notification
          try {
            await pushService.sendNotificationToUser(userId, {
              title: `🔥 Bounty Almost Done: ${bounty.title}!`,
              body: `You're at ${newCount}/${bounty.targetCount} (${Math.round(newRatio * 100)}%). Just a little more to earn ${bounty.xpReward} XP!`,
              data: {
                type: "BOUNTY_NEAR_COMPLETE",
                bountyId: bounty.id
              }
            });
          } catch (err) {
            console.error("Failed to send bounty progress push:", err);
          }
        }
      }
    }
  } catch (error) {
    console.error("Failed to increment bounty progress:", error);
  }
};

export const startBountyCron = () => {
  // Run every Monday at 00:00
  cron.schedule("0 0 * * 1", async () => {
    await generateWeeklyBounties();
  });
};
