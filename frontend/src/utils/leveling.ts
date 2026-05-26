export const calculateLevel = (totalPoints: number) => {
  const base = 25;
  // level = floor(sqrt(points / base)) + 1
  // points = base * (level - 1)^2
  
  let level = Math.floor(Math.sqrt(Math.max(0, totalPoints) / base)) + 1;
  level = Math.min(100, level); // Cap at 100

  const currentLevelTotalXp = base * Math.pow(level - 1, 2);
  const nextLevelTotalXp = level >= 100 ? currentLevelTotalXp : base * Math.pow(level, 2);
  
  const xpIntoCurrentLevel = totalPoints - currentLevelTotalXp;
  const xpNeededForNext = nextLevelTotalXp - currentLevelTotalXp;
  
  const progressPercent = level >= 100 ? 100 : Math.min(100, Math.max(0, (xpIntoCurrentLevel / xpNeededForNext) * 100));

  let rankTitle = "Novice Finder";
  if (level >= 100) rankTitle = "Apex Champion";
  else if (level >= 90) rankTitle = "Legend";
  else if (level >= 80) rankTitle = "Hero of the Campus";
  else if (level >= 70) rankTitle = "Mythic Finder";
  else if (level >= 60) rankTitle = "Grandmaster of Lost Items";
  else if (level >= 50) rankTitle = "Elite Tracker";
  else if (level >= 40) rankTitle = "Master Detective";
  else if (level >= 30) rankTitle = "Senior Investigator";
  else if (level >= 20) rankTitle = "Campus Ranger";
  else if (level >= 10) rankTitle = "Junior Scout";

  return {
    level,
    rankTitle,
    currentLevelTotalXp,
    nextLevelTotalXp,
    xpIntoCurrentLevel,
    xpNeededForNext,
    progressPercent
  };
};
